export interface FindContentInput {
  contentPattern: string;
  description: string;
}

export interface FindContentResult {
  success: boolean;
  summary: string;
  matches: Array<{
    elementId: string;
    elementClass: string;
    content: string;
    context: string;
  }>;
}

export interface ReplaceContentInput {
  elementId: string;
  newContent: string;
  nextStep?: string;
}

export interface ReplaceContentResult {
  success: boolean;
  summary: string;
  oldContent: string;
  newContent: string;
  nextStep?: string;
  newHtml: string;
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
    name: "findContent",
    description: "Find specific content in the resume based on user's description",
    input_schema: {
      type: "object",
      properties: {
        contentPattern: {
          type: "string",
          description: "The text pattern to search for in the resume"
        },
        description: {
          type: "string",
          description: "User's description of what they're looking for"
        }
      },
      required: ["contentPattern", "description"]
    }
  },
  {
    name: "replaceContent",
    description: "Replace content in a specific resume element",
    input_schema: {
      type: "object",
      properties: {
        elementId: {
          type: "string",
          description: "The ID of the element to replace (obtained from findContent)"
        },
        newContent: {
          type: "string",
          description: "The new HTML content to replace the existing content with"
        },
        nextStep: {
          type: "string",
          description: "Description of the next step in the chain of thought"
        }
      },
      required: ["elementId", "newContent"]
    }
  }
];