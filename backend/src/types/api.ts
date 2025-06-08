export interface Conversation {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  uploadedAt: string;
}

export interface JobAnalysisResult {
  required_skills: string[];
  preferred_qualifications: string[];
  experience_level: string;
  key_responsibilities: string[];
  company_info: {
    description: string;
    industry: string;
  };
  keywords: string[];
  resume_emphasis: {
    summary: string;
    key_points: string[];
  };
}

export interface RevisionPrompt {
  title: string;
  prompt: string;
}

export interface RevisionResponse {
  revised_text: string;
  explanation: string;
}

export interface ChatContext {
  content?: {
    resume?: string;
    jobDescription?: string;
    analysis?: JobAnalysisResult;
  };
  resumeVersion?: {
    id: string;
    version: string;
  };
  jobDescriptionVersion?: {
    id: string;
    version: string;
  };
  analysisVersion?: {
    id: string;
    version: string;
  };
}

export interface FileUploadPayload {
  name: string;
  type: string;
  size: number;
  content: string;
  isPdf?: boolean;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | ClaudeContentBlock[];
}

export interface ClaudeResponse {
  content?: ClaudeContentBlock[];
  stop_reason?: string;
}

export interface ClaudeContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, any>;
  tool_use_id?: string;
  content?: string;
  source?: {
    type: string;
    media_type: string;
    data: string;
  };
} 