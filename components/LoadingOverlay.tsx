
import React from 'react';

interface LoadingOverlayProps {
  step: 'scanning' | 'translating' | 'speaking' | 'idle' | 'completed';
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ step }) => {
  if (step === 'idle' || step === 'completed') return null;

  const messages = {
    scanning: "Analyzing image and extracting text...",
    translating: "Translating to natural Telugu...",
    speaking: "Generating high-quality Telugu audio...",
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Please wait</h3>
        <p className="text-gray-600 text-center animate-pulse">{messages[step as keyof typeof messages]}</p>
        
        <div className="mt-8 flex gap-2 w-full">
          <div className={`h-1.5 flex-1 rounded-full ${['scanning', 'translating', 'speaking'].includes(step) ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
          <div className={`h-1.5 flex-1 rounded-full ${['translating', 'speaking'].includes(step) ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
          <div className={`h-1.5 flex-1 rounded-full ${['speaking'].includes(step) ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
