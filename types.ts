
// Defined as a simple object to avoid TypeScript enum transpilation issues
export const AnalysisType = {
  URL: 'URL',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  TEXT: 'TEXT'
};

// Re-exporting the value as a type for convenience in files that support it
export type AnalysisTypeValue = typeof AnalysisType[keyof typeof AnalysisType];
