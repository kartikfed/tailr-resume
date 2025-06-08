export interface ResumeEditRequest {
  instruction: string;
  currentHtml: string;
  context?: {
    jobDescription?: string;
    targetRole?: string;
    writingStyle?: 'concise' | 'detailed' | 'professional' | 'casual';
  };
}

export interface ResumeEditResponse {
  success: boolean;
  newHtml: string;
  explanation: string;
  changes?: {
    type: 'update' | 'add' | 'remove' | 'reorder';
    location: string;
    content: string;
  }[];
} 