
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { AiCinematicSuggestion, Base64File, BoundingBox } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY is not set. Please ensure the API_KEY environment variable is configured.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY_IN_SERVICE" }); 

// Define a cycle of temperatures to use for different attempts
const temperatures = [0.65, 0.75, 0.80, 0.60, 0.70];

export const fileToParts = (file: File): Promise<Base64File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const mimeType = result.substring(result.indexOf(':') + 1, result.indexOf(';'));
      const base64Data = result.substring(result.indexOf(',') + 1);
      if (!mimeType || !base64Data) {
        reject(new Error("Could not parse file data. Ensure it's a valid image."));
        return;
      }
      resolve({ base64Data, mimeType });
    };
    reader.onerror = (error) => reject(error);
  });
};

export const analyzeAndSuggestCinematicFrame = async (
  base64ImageData: string, 
  mimeType: string,
  attemptCount: number = 1 // Default to 1 for the first attempt
): Promise<AiCinematicSuggestion> => {
  if (!API_KEY) throw new Error("API Key not configured for Gemini Service.");
  
  const model = 'gemini-2.5-flash-preview-04-17';
  const imagePart = {
    inlineData: {
      mimeType: mimeType,
      data: base64ImageData,
    },
  };

  const textPrompt = `
You are an expert cinematographer and photo editor. Analyze the provided image.
Your goal is to help the user achieve a more cinematic result.

When performing your analysis and making suggestions, consider the following established photographic and cinematographic composition rules. If any of these rules are particularly relevant to your analysis or could significantly enhance the cinematic quality of the image, please mention them in your "analysisText". Explain how applying a rule (or how a rule is already present) contributes to the cinematic feel. Only apply or suggest rules if they genuinely improve the shot; do not force them.

Composition Rules to Consider:
- Rule of Thirds
- Leading Lines
- Symmetry
- Centered Composition
- Framing Within a Frame
- Depth & Layers
- Negative Space
- Diagonals and Triangles
- Golden Ratio / Fibonacci Spiral
- Eye-Level vs. Low/High Angle
- Fill the Frame
- Rule of Odds
- Rule of Space (e.g., for moving subjects or gaze direction)
- Juxtaposition
- Color Composition (e.g., complementary colors, analogous colors, color harmony, color contrast for mood)
- Texture & Pattern (how they contribute to visual interest and mood)
- Light as Subject (e.g., chiaroscuro, silhouettes, lens flares, god rays)
- Negative vs. Positive Space Balance
- Implied Lines
- Visual Weight & Balance

1.  **Textual Analysis (Mandatory):** Provide detailed textual analysis (2-4 paragraphs) explaining how to find/create a cinematic shot.
    - If a direct crop of the *uploaded image* can achieve this, describe the specific elements to focus on, any relevant composition rules (from the list above or others) that justify your crop, mood, storytelling, and the reframing/cropping.
    - If a direct crop is NOT ideal or sufficient for a truly cinematic feel (e.g., the image is too busy, lacks a clear subject for a simple crop, or a more conceptual change is needed), explain why. Then, describe a *vision* for a cinematic shot inspired by the scene, potentially using the composition rules to define this vision. This vision will be used to generate a new image.

2.  **Cinematic Output (Choose ONE):**
    *   **Option A: Suggested Bounding Box (for cropping)**
        If a direct crop of the uploaded image is the best approach, provide a 'suggestedBoundingBox' object. This box defines the ideal cinematic frame *within the original image*.
        - It must have keys "x", "y", "width", "height" (percentages 0.0-1.0).
        - Values must be valid: width/height > 0, x/y >= 0, x+width <= 1.0, y+height <= 1.0.
        - If you choose this option, 'cinematicConceptPrompt' MUST be null.
    *   **Option B: Cinematic Concept Prompt (for image generation)**
        If a crop is not ideal and you are describing a conceptual vision, provide a 'cinematicConceptPrompt' string. This string will be used as a prompt for an AI image generation model (like Imagen).
        - It should be highly descriptive, detailing the scene, style, lighting, camera angle, mood, key elements, and potentially referencing composition principles for a cinematic image.
        - Example: "Epic cinematic wide shot of a lone figure on a cliff overlooking a stormy sea at sunset, applying the Rule of Thirds to place the figure. Dramatic lighting, volumetric clouds, anamorphic lens flare, style of a blockbuster film."
        - If you choose this option, 'suggestedBoundingBox' MUST be null.

Structure your response STRICTLY as a JSON object with three keys:
- "analysisText": (string) Your textual analysis.
- "suggestedBoundingBox": (object or null) The bounding box object if Option A is chosen, otherwise null.
- "cinematicConceptPrompt": (string or null) The image generation prompt if Option B is chosen, otherwise null.

Ensure that 'analysisText' is always provided. Either 'suggestedBoundingBox' OR 'cinematicConceptPrompt' should be non-null, but NOT BOTH. If neither specific output type is applicable (very rare), both can be null.

Example 1 (Crop):
{
  "analysisText": "To capture a more cinematic frame from your photo of the Golden Gate Bridge, focus tightly on the iconic red tower. By applying the Rule of Thirds and placing the tower off-center, and using the bridge's structure as leading lines, we draw the viewer's eye. This creates a dramatic, mysterious, and focused composition.",
  "suggestedBoundingBox": { "x": 0.25, "y": 0.10, "width": 0.50, "height": 0.80 },
  "cinematicConceptPrompt": null
}

Example 2 (Concept Prompt):
{
  "analysisText": "While your current wide shot of the beach is pleasant, to make it truly cinematic, let's envision a more focused and dramatic scene using Depth & Layers. A simple crop won't capture this effectively. Instead, imagine a foreground element like a weathered piece of driftwood, the main subject (a lone figure) in the midground, and the ocean stretching to the horizon in the background. This layering adds significant depth...",
  "suggestedBoundingBox": null,
  "cinematicConceptPrompt": "Golden hour shot, cinematic depth of field. Foreground: weathered driftwood. Midground: lone figure walking along pristine sandy beach, footprints leading towards the ocean. Background: calm sea and distant sunset. Soft, warm lighting. Peaceful, serene, and slightly melancholic cinematic mood. Fujifilm film emulation. Consider Rule of Space for the walking figure."
}
`;

  const contents = {
    parts: [imagePart, { text: textPrompt }],
  };

  // Select temperature based on attempt count to encourage varied responses
  const currentTemperature = temperatures[(attemptCount - 1) % temperatures.length];
  console.log(`Using temperature: ${currentTemperature} for attempt ${attemptCount}`);


  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        responseMimeType: "application/json",
        temperature: currentTemperature, 
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr) as AiCinematicSuggestion;

    if (!parsedData.analysisText) {
        throw new Error("AI response is missing required field: analysisText.");
    }

    if (parsedData.suggestedBoundingBox && parsedData.cinematicConceptPrompt) {
        console.warn("AI returned both boundingBox and conceptPrompt. Prioritizing boundingBox and nullifying conceptPrompt.");
        parsedData.cinematicConceptPrompt = null;
    }
    
    if (parsedData.suggestedBoundingBox) {
        const box = parsedData.suggestedBoundingBox;
        if (typeof box.x !== 'number' || typeof box.y !== 'number' || 
            typeof box.width !== 'number' || typeof box.height !== 'number' ||
            box.width <= 0 || box.height <= 0 || 
            box.x < 0 || box.x > 1 || box.y < 0 || box.y > 1 ||
            box.width > 1 || box.height > 1 || 
            (box.x + box.width) > 1.001 || 
            (box.y + box.height) > 1.001 ) { 
            console.warn("AI returned invalid boundingBox, treating as null:", box);
            parsedData.suggestedBoundingBox = null;
        }
    }

    if (!parsedData.suggestedBoundingBox && !parsedData.cinematicConceptPrompt) {
        console.warn("AI provided analysisText but neither a suggestedBoundingBox nor a cinematicConceptPrompt.");
    }
    
    return parsedData;

  } catch (error) {
    console.error("Error in analyzeAndSuggestCinematicFrame:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
         throw new Error("Invalid API Key. Please check your configuration.");
    }
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        if (error.message.includes("SAFETY")) {
            throw new Error("The image or request was blocked due to safety settings. Please try a different image or adjust your query.");
        }
        if (error.message.includes("RESOURCE_EXHAUSTED") || error.message.includes("Rate limit")) {
            throw new Error("The AI service is currently busy or rate limits exceeded. Please try again later.");
        }
    }
    throw new Error(`Failed to get cinematic suggestion from AI: ${error instanceof Error ? error.message : String(error)}`);
  }
};


export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  if (!API_KEY) throw new Error("API Key not configured for Gemini Service (Imagen).");
  if (!prompt || prompt.trim() === "") throw new Error("Image generation prompt cannot be empty.");

  const model = 'imagen-3.0-generate-002';
  
  try {
    const response = await ai.models.generateImages({
      model: model,
      prompt: prompt,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      throw new Error("AI did not return a valid image. No image data found.");
    }
  } catch (error) {
    console.error("Error generating image with Imagen:", error);
     if (error instanceof Error && error.message.includes("API key not valid")) {
         throw new Error("Invalid API Key for image generation. Please check your configuration.");
    }
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      if (error.message.includes("SAFETY")) {
          throw new Error("The image generation prompt was blocked due to safety settings. Please try a different prompt.");
      }
      if (error.message.includes("Rate limit exceeded")) {
          throw new Error("Image generation rate limit exceeded. Please try again later.");
      }
       if (error.message.includes("Invalid prompt")) {
          throw new Error("The provided prompt for image generation was considered invalid by the AI. Try rephrasing.");
      }
    }
    throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : String(error)}`);
  }
};
