export interface BoundingBox {
  x: number; // Percentage from left (0.0 to 1.0)
  y: number; // Percentage from top (0.0 to 1.0)
  width: number; // Percentage width (0.0 to 1.0)
  height: number; // Percentage height (0.0 to 1.0)
}

export interface AiCinematicSuggestion {
  analysisText: string;
  suggestedBoundingBox: BoundingBox | null;
  cinematicConceptPrompt: string | null; // New: Prompt for generating an image if cropping isn't ideal
}

export interface Base64File {
  base64Data: string; // Just the data part, without "data:mime/type;base64,"
  mimeType: string;
}

// For Gemini API response structure if needed, but typically handled internally by the SDK
// For example, GroundingChunk from Google Search:
export interface WebGrounding {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: WebGrounding;
  // other types of grounding chunks if applicable
}