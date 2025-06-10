export interface UpdateResumeContentInput {
  userInstruction: string;
  context?: {
    jobDescription?: string;
    targetRole?: string;
    writingStyle?: 'concise' | 'detailed' | 'professional' | 'casual';
  };
}

export interface UpdateResumeContentResult {
  success: boolean;
  summary: string;
  changes: Array<{
    type: 'update' | 'add' | 'remove' | 'reorder';
    location: string;
    content: string;
    elementSelector?: string;
  }>;
  newHtml: string;
}

export interface ToolResponse {
  success: boolean;
  newHtml?: string;
  explanation?: string;
  changes?: Array<{
    type: 'update' | 'add' | 'remove' | 'reorder';
    location: string;
    content: string;
    elementSelector?: string;
  }>;
}

export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, {
      type: string;
      description: string;
    }>;
    required: string[];
  };
}

export const tools: Tool[] = [
  {
    name: "updateResumeContent",
    description: "Update resume content based on natural language instructions",
    input_schema: {
      type: "object",
      properties: {
        userInstruction: {
          type: "string",
          description: "Natural language instruction describing what content to update and how"
        },
        context: {
          type: "object",
          description: "Optional context for the update (job description, target role, writing style)",
          properties: {
            jobDescription: {
              type: "string",
              description: "The job description to optimize for"
            },
            targetRole: {
              type: "string",
              description: "The target role being applied for"
            },
            writingStyle: {
              type: "string",
              description: "The desired writing style (concise, detailed, professional, casual)",
              enum: ["concise", "detailed", "professional", "casual"]
            }
          }
        }
      },
      required: ["userInstruction"]
    }
  }
]; 