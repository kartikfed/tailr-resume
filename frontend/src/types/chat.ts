/**
 * Types for chat functionality
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

export interface ChatProps {
  conversationId: string;
  onUpdateMessages?: (callback: (prevMessages: ChatMessage[]) => ChatMessage[]) => void;
  onToolResponse?: (response: ToolResponse) => void;
}

export interface ToolResponse {
  success: boolean;
  newHtml?: string;
  explanation?: string;
  changes?: Array<{
    type: string;
    location: string;
    content: string;
  }>;
  error?: string;
  matches?: Array<{
    elementId: string;
    elementClass: string;
    content: string;
    context: string;
  }>;
}

export interface ChatResponse {
  response: string;
  toolResponse?: ToolResponse;
  data?: any;
  error?: string;
}

export interface Conversation {
  conversationId: string;
  messages: ChatMessage[];
}

// New interfaces for versioned context management
export interface VersionedContent {
  id: string;
  content: string;
  version: number;
  timestamp: Date;
}

export interface ConversationContext {
  conversationId: string;
  resumeVersion: {
    id: string;
    version: number;
  };
  jobDescriptionVersion: {
    id: string;
    version: number;
  };
  analysisVersion: {
    id: string;
    version: number;
  };
  lastUpdated: Date;
}

export interface VersionedMessage extends ChatMessage {
  contextVersion: number;
}

export interface ContextUpdate {
  type: 'resume' | 'jobDescription' | 'analysis';
  content: string;
  version: number;
}

/**
 * Represents a message in the chat conversation
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolResponse?: ToolResponse;
}

/**
 * Represents a versioned entity
 */
export interface VersionedEntity {
  id: string;
  version: number;
}

/**
 * Represents the context for a chat conversation
 */
export interface ChatContext {
  resumeVersion?: VersionedEntity;
  jobDescriptionVersion?: VersionedEntity;
  analysisVersion?: VersionedEntity;
  content?: {
    resume?: string;
    jobDescription?: string;
    analysis?: string;
  };
  conversationId?: string;
  lastUpdated?: Date;
}

/**
 * Represents a tool call in the chat response
 */
export interface ToolCall {
  name: string;
  input: {
    elementId: string;
    newContent: string;
    nextStep?: string;
  };
}

/**
 * Represents a tool result from executing a tool call
 */
export interface ToolResult {
  success: boolean;
  summary: string;
  elementId: string;
  oldContent: string;
  nextStep?: string;
  matches?: Array<{
    elementId: string;
    elementClass: string;
    content: string;
    context: string;
  }>;
} 