
export interface TranslationResult {
  englishText: string;
  teluguText: string;
}

export interface AppState {
  isProcessing: boolean;
  error: string | null;
  step: 'idle' | 'scanning' | 'translating' | 'speaking' | 'completed';
  result: TranslationResult | null;
  audioBlob: Blob | null;
  imagePreview: string | null;
}
