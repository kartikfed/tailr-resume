import { ToolResult } from '../types/chat';

/**
 * Handles tool usage based on the tool name and input
 * @param {string} toolName - The name of the tool to use
 * @param {any} input - The input for the tool
 * @returns {Promise<ToolResult>} The result of the tool execution
 */
export async function handleToolUse(toolName: string, input: any): Promise<ToolResult> {
  switch (toolName) {
    case 'findContent':
      return {
        success: true,
        summary: 'Content search completed',
        elementId: '',
        oldContent: '',
        matches: input.matches
      };
    case 'replaceContent':
      return await executeReplaceContent(input);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Executes the replaceContent tool
 * @param {any} input - The input containing elementId and newContent
 * @returns {Promise<ToolResult>} The result of the content replacement
 */
async function executeReplaceContent(input: { elementId: string; newContent: string; nextStep?: string }): Promise<ToolResult> {
  try {
    const element = document.getElementById(input.elementId);
    if (!element) {
      throw new Error(`Element with ID ${input.elementId} not found`);
    }

    const oldContent = element.innerHTML;
    element.innerHTML = input.newContent;

    return {
      success: true,
      summary: `Successfully replaced content in element ${input.elementId}`,
      elementId: input.elementId,
      oldContent,
      nextStep: input.nextStep
    };
  } catch (error) {
    console.error('Error executing replaceContent:', error);
    return {
      success: false,
      summary: `Failed to replace content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      elementId: input.elementId,
      oldContent: ''
    };
  }
} 