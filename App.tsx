
import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ImageViewer } from './components/ImageViewer';
import { CroppedImageViewer } from './components/CroppedImageViewer';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorDisplay } from './components/ErrorDisplay';
import { Button } from './components/Button';
import { SectionCard } from './components/SectionCard';
import { Header } from './components/Header';
import { analyzeAndSuggestCinematicFrame, fileToParts, generateImageFromPrompt } from './services/geminiService';
import type { AiCinematicSuggestion, Base64File } from './types';

const App: React.FC = () => {
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [originalImagePreviewUrl, setOriginalImagePreviewUrl] = useState<string | null>(null);
  const [originalImageParts, setOriginalImageParts] = useState<Base64File | null>(null);

  const [aiAnalysis, setAiAnalysis] = useState<AiCinematicSuggestion | null>(null);
  const [generatedCinematicImageUrl, setGeneratedCinematicImageUrl] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisAttemptCount, setAnalysisAttemptCount] = useState<number>(0);

  const resetState = () => {
    setOriginalImageFile(null);
    if (originalImagePreviewUrl) {
      URL.revokeObjectURL(originalImagePreviewUrl);
    }
    setOriginalImagePreviewUrl(null);
    setOriginalImageParts(null);
    setAiAnalysis(null);
    setGeneratedCinematicImageUrl(null);
    setIsAnalyzing(false);
    setIsGeneratingImage(false);
    setError(null);
    setAnalysisAttemptCount(0); // Reset attempt count
  };

  const handleImageUpload = useCallback(async (file: File) => {
    resetState(); // Reset everything for a new image
    setOriginalImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setOriginalImagePreviewUrl(previewUrl);
    try {
      const parts = await fileToParts(file);
      setOriginalImageParts(parts);
    } catch (e) {
      console.error("Error processing file:", e);
      setError("Could not process the uploaded image. Please try another file.");
      setOriginalImageFile(null);
      URL.revokeObjectURL(previewUrl); 
      setOriginalImagePreviewUrl(null);
    }
  }, []);

  const triggerAnalysis = useCallback(async () => {
    if (!originalImageParts) {
      setError("Please upload an image first.");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setAiAnalysis(null); // Clear previous analysis
    setGeneratedCinematicImageUrl(null); // Clear previous generated image

    const currentAttempt = analysisAttemptCount + 1;
    setAnalysisAttemptCount(currentAttempt);

    try {
      const suggestion = await analyzeAndSuggestCinematicFrame(originalImageParts.base64Data, originalImageParts.mimeType, currentAttempt);
      setAiAnalysis(suggestion);
    } catch (e) {
      console.error("Error analyzing image:", e);
      setError(e instanceof Error ? e.message : "Failed to get cinematic analysis. Ensure your API key is correctly configured and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [originalImageParts, analysisAttemptCount]);

  const handleVisualizeConcept = useCallback(async () => {
    if (!aiAnalysis?.cinematicConceptPrompt) {
      setError("No cinematic concept prompt available to visualize.");
      return;
    }
    setIsGeneratingImage(true);
    setError(null);
    setGeneratedCinematicImageUrl(null);

    try {
      const imageUrl = await generateImageFromPrompt(aiAnalysis.cinematicConceptPrompt);
      setGeneratedCinematicImageUrl(imageUrl);
    } catch (e) {
      console.error("Error generating visual concept:", e);
      setError(e instanceof Error ? e.message : "Failed to generate cinematic visualization. The AI might be busy or the prompt could not be processed.");
    } finally {
      setIsGeneratingImage(false);
    }
  }, [aiAnalysis]);


  const isLoading = isAnalyzing || isGeneratingImage;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-4 sm:p-8 selection:bg-white selection:text-black">
      <Header />
      <main className="container mx-auto w-full max-w-6xl space-y-8">
        {error && <ErrorDisplay message={error} onClose={() => setError(null)} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SectionCard title="1. Your Shot (What You See)">
            <ImageUploader onImageUpload={handleImageUpload} disabled={isLoading} />
            {originalImagePreviewUrl && (
              <div className="mt-6">
                <ImageViewer src={originalImagePreviewUrl} alt="Uploaded original image" />
              </div>
            )}
            {originalImageFile && !aiAnalysis && !isAnalyzing && (
              <Button onClick={triggerAnalysis} className="mt-6 w-full" disabled={isAnalyzing}>
                Analyze for Cinematic Frame
              </Button>
            )}
            {isAnalyzing && <LoadingSpinner text="Crafting cinematic advice..." className="mt-6" />}
          </SectionCard>

          <div className="space-y-8">
            {aiAnalysis && (
              <SectionCard title="2. AI Cinematographer's Notes">
                <div className="prose prose-invert max-w-none prose-p:my-2 prose-headings:my-3 text-gray-300">
                  <p className="text-sm italic text-gray-400">Here's how to elevate your shot (Attempt {analysisAttemptCount}):</p>
                  <div dangerouslySetInnerHTML={{ __html: aiAnalysis.analysisText.replace(/\n/g, '<br />') }} />
                </div>
              </SectionCard>
            )}
            
            {aiAnalysis && (aiAnalysis.suggestedBoundingBox || aiAnalysis.cinematicConceptPrompt || generatedCinematicImageUrl) && (
              <SectionCard title="3. AI's Cinematic Suggestion">
                {aiAnalysis.suggestedBoundingBox && originalImagePreviewUrl && (
                  <>
                    <h3 className="text-xl font-semibold text-white mb-3">Suggested Crop:</h3>
                    <CroppedImageViewer 
                      src={originalImagePreviewUrl} 
                      boundingBox={aiAnalysis.suggestedBoundingBox}
                      alt="AI suggested cinematic crop" 
                    />
                    <p className="text-sm mt-2 text-gray-400 italic">AI's suggestion for a more cinematic framing of your original image.</p>
                  </>
                )}

                {aiAnalysis.cinematicConceptPrompt && !aiAnalysis.suggestedBoundingBox && (
                  <div className="mt-4">
                     <h3 className="text-xl font-semibold text-white mb-3">Cinematic Concept Visualization:</h3>
                    {!generatedCinematicImageUrl && !isGeneratingImage && (
                      <>
                        <p className="text-gray-300 mb-4">The AI suggests a conceptual reimagining for a more cinematic feel. Click below to visualize it.</p>
                        <Button onClick={handleVisualizeConcept} className="w-full" disabled={isGeneratingImage}>
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          Visualize AI's Concept
                        </Button>
                      </>
                    )}
                    {isGeneratingImage && <LoadingSpinner text="Generating cinematic visualization..." className="mt-4" />}
                    {generatedCinematicImageUrl && (
                      <>
                        <ImageViewer src={generatedCinematicImageUrl} alt="AI generated cinematic concept" />
                        <p className="text-sm mt-2 text-gray-400 italic">AI's visualized cinematic concept. Use this as inspiration!</p>
                      </>
                    )}
                  </div>
                )}
                
                {!aiAnalysis.suggestedBoundingBox && !aiAnalysis.cinematicConceptPrompt && (
                     <p className="text-gray-300">The AI provided textual advice. Try focusing on that or use a different image for a visual suggestion.</p>
                )}
              </SectionCard>
            )}
          </div>
        </div>

        {(originalImageFile || aiAnalysis || error) && (
          <div className="mt-12 text-center flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            {aiAnalysis && !isLoading && (
              <Button onClick={triggerAnalysis} variant="secondary">
                Rethink Cinematic Frame
              </Button>
            )}
            <Button 
              onClick={resetState} 
              variant="secondary" 
              className={(aiAnalysis && !isLoading) ? "" : "mx-auto"} // Center if it's the only button
            >
              Start Over with a New Image
            </Button>
          </div>
        )}
      </main>
       <footer className="text-center py-8 text-gray-400 text-sm">
        Powered by Gemini AI. Craft your perfect shot.
      </footer>
    </div>
  );
};

export default App;
