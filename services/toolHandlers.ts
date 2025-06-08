import { ReplaceContentInput, ReplaceContentResult } from '../types/tools';

export const handleToolUse = async (toolUse: { 
  id: string; 
  name: string; 
  input: any; 
}): Promise<{ 
  type: "tool_result"; 
  tool_use_id: string; 
  content: string; 
}> => {
  if (toolUse.name === "replaceContent") {
    const result = await executeReplaceContent(toolUse.input);
    return {
      type: "tool_result",
      tool_use_id: toolUse.id,
      content: JSON.stringify(result)
    };
  }
  
  throw new Error(`Unknown tool: ${toolUse.name}`);
};

const executeReplaceContent = async (input: ReplaceContentInput): Promise<ReplaceContentResult> => {
  try {
    const element = document.getElementById(input.elementId);
    if (!element) {
      throw new Error(`Element with ID ${input.elementId} not found`);
    }

    const oldContent = element.innerHTML;
    element.innerHTML = input.newContent;

    return {
      success: true,
      summary: `Successfully updated content for element ${input.elementId}`,
      elementId: input.elementId,
      oldContent,
      nextStep: input.nextStep
    };
  } catch (error) {
    return {
      success: false,
      summary: `Failed to update content: ${error.message}`,
      elementId: input.elementId
    };
  }
}; 