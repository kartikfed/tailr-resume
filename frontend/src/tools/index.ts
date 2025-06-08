import { ResumeUpdateTool } from './ResumeUpdateTool';

export interface ToolResponse {
  success: boolean;
  data: any;
  error?: string;
}

export interface ToolContext {
  resumeContent: string;
  jobDescription?: string;
  targetRole?: string;
  writingStyle?: 'concise' | 'detailed' | 'professional' | 'casual';
}

export const tools = {
  resumeUpdate: new ResumeUpdateTool(),
};

export type ToolName = keyof typeof tools; 