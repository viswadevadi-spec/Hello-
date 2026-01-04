
import React, { useState, useRef, useCallback } from 'react';
import { analyzeAndTranslate, generateTeluguAudio } from './services/geminiService';
import { AppState, TranslationResult } from './types';
import { pcmToWav } from './utils/audioUtils';
import LoadingOverlay from './components/LoadingOverlay';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isProcessing: false,
    error: null,
    step: 'idle',
    result: null,
    audioBlob: null,
    imagePreview: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setState({
      isProcessing: true,
      error: null,
      step: 'scanning',
      result: null,
      audioBlob: null,
      imagePreview: URL.createObjectURL(file),
    });

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      // Step 1 & 2: OCR and Translation
      setState(prev => ({ ...prev, step: 'translating' }));
      const result = await analyzeAndTranslate(base64);

      // Step 3: TTS
      setState(prev => ({ ...prev, step: 'speaking', result }));
      const pcmData = await generateTeluguAudio(result.teluguText);
      const audioBlob = pcmToWav(pcmData, 24000);

      setState(prev => ({
        ...prev,
        isProcessing: false,
        step: 'completed',
        audioBlob,
      }));

      // Auto-play audio if possible
      setTimeout(() => {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.play().catch(e => console.log("Auto-play prevented", e));
        }
      }, 500);

    } catch (err: any) {
      console.error(err);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: err.message || "An unexpected error occurred.",
        step: 'idle',
      }));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setState({
      isProcessing: false,
      error: null,
      step: 'idle',
      result: null,
      audioBlob: null,
      imagePreview: null,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 pb-20">
      <LoadingOverlay step={state.step} />

      {/* Header */}
      <header className="w-full bg-white shadow-sm py-4 px-6 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-lg">
            <i className="fas fa-language text-white text-xl"></i>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Telugu Voice Vision
          </h1>
        </div>
        <button 
          onClick={reset}
          className="text-gray-500 hover:text-orange-500 transition-colors p-2"
          title="Reset"
        >
          <i className="fas fa-rotate-right"></i>
        </button>
      </header>

      <main className="max-w-4xl w-full px-4 mt-8 flex-1">
        {/* Upload Area */}
        {state.step === 'idle' && (
          <div 
            onClick={triggerFileInput}
            className="group cursor-pointer border-2 border-dashed border-gray-300 bg-white rounded-3xl p-12 flex flex-col items-center justify-center transition-all hover:border-orange-400 hover:shadow-xl hover:shadow-orange-100"
          >
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <i className="fas fa-cloud-upload-alt text-orange-500 text-3xl"></i>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Upload or Capture Image</h2>
            <p className="text-gray-500 text-center max-w-md">
              Extract English text from any image and hear it instantly in natural, fluent Telugu.
            </p>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageChange}
            />
            <button className="mt-8 px-8 py-3 bg-orange-500 text-white rounded-full font-semibold shadow-lg shadow-orange-200 hover:bg-orange-600 transform active:scale-95 transition-all">
              Choose File
            </button>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg flex items-start gap-3">
            <i className="fas fa-exclamation-circle text-red-500 mt-1"></i>
            <div>
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-700 text-sm">{state.error}</p>
            </div>
          </div>
        )}

        {/* Results Area */}
        {(state.result || state.imagePreview) && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Image Preview */}
            <div className="bg-white rounded-3xl p-4 shadow-lg overflow-hidden border border-gray-100">
              <div className="relative aspect-video bg-gray-100 rounded-2xl overflow-hidden">
                <img 
                  src={state.imagePreview!} 
                  alt="Source" 
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-medium border border-white/20">
                  Input Image
                </div>
              </div>
            </div>

            {state.result && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* English Text Card */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold tracking-wider">ENGLISH</span>
                  </div>
                  <div className="flex-1 text-gray-800 leading-relaxed font-medium">
                    {state.result.englishText}
                  </div>
                </div>

                {/* Telugu Text Card */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-orange-100 flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-10 opacity-50"></div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold tracking-wider">TELUGU</span>
                  </div>
                  <div className="flex-1 text-gray-900 leading-loose text-lg font-semibold">
                    {state.result.teluguText}
                  </div>
                  
                  {state.audioBlob && (
                    <div className="mt-6 pt-6 border-t border-orange-50">
                      <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-3">Audio Playback</p>
                      <audio 
                        ref={audioPlayerRef}
                        controls 
                        src={URL.createObjectURL(state.audioBlob)}
                        className="w-full accent-orange-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button for New Upload */}
      {state.step === 'completed' && (
        <button 
          onClick={triggerFileInput}
          className="fixed bottom-8 right-8 bg-orange-500 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-orange-600 hover:scale-110 active:scale-95 transition-all z-40"
        >
          <i className="fas fa-plus text-xl"></i>
        </button>
      )}

      {/* Footer Branding */}
      <footer className="mt-auto py-8 text-center text-gray-400 text-sm">
        
      </footer>
    </div>
  );
};

export default App;
