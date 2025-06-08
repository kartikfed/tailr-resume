import { ToolContext, ToolResponse } from './index';

/**
 * Base interface for all resume editing tools
 */
export interface BaseTool {
  /**
   * Name of the tool
   */
  readonly name: string;

  /**
   * Description of what the tool does
   */
  readonly description: string;

  /**
   * Execute the tool with the given context and parameters
   * @param context The current context including resume content and job description
   * @param params Additional parameters specific to the tool
   * @returns Promise resolving to a ToolResponse
   */
  execute(context: ToolContext, params: Record<string, any>): Promise<ToolResponse>;

  /**
   * Validate the parameters for the tool
   * @param params Parameters to validate
   * @returns true if parameters are valid, false otherwise
   */
 