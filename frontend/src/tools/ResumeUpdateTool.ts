import { ToolContext, ToolResponse } from './index';
import { UpdateResumeContentInput, UpdateResumeContentResult } from '../types/tools';
import { generateChangeId } from '../utils/animationUtils';

interface LLMAnalysis {
  targetElement: string;
  newContent: string;
  explanation: string;
  elementSelector: string;
}

/**
 * Tool for updating resume content based on natural language instructions
 */
export class ResumeUpdateTool {
  readonly name = 'updateResumeContent';
  readonly description = 'Update resume content based on natural language instructions';

  /**
   * Analyzes the HTML and user instruction using LLM to identify target content
   */
  private async analyzeContent(
    html: string,
    userInstruction: string,
    context?: ToolContext
  ): Promise<LLMAnalysis> {
    const analysisPrompt = `
Given this resume HTML: ${html}

The user wants to: "${userInstruction}"

Additional context:
${context ? JSON.stringify(context, null, 2) : 'No additional context provided'}

1. Identify what content they're referring to
2. Extract the current text of that content
3. Generate the revised version
4. Return the exact HTML element to replace and the new content

Return JSON: {
  "targetElement": "exact HTML of element to replace",
  "newContent": "revised content",
  "explanation": "what you identified",
  "elementSelector": "CSS selector to identify the element (e.g., #summary, .experience-item:nth-child(2))"
}`;

    // Call LLM API here to get analysis
    // This is where you'd integrate with your LLM service
    const response = await this.callLLM(analysisPrompt);
    return JSON.parse(response);
  }

  /**
   * Updates the resume content based on LLM analysis
   */
  private updateContent(html: string, analysis: LLMAnalysis): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find the target element
    const targetElement = this.findElementByContent(doc, analysis.targetElement);
    if (!targetElement) {
      throw new Error('Target element not found in resume');
    }

    // Generate a unique change ID
    const changeId = generateChangeId();
    targetElement.setAttribute('data-change-id', changeId);

    // Create temporary container for new content
    const tempContainer = doc.createElement('div');
    tempContainer.innerHTML = analysis.newContent;

    // Replace content while preserving structure
    while (targetElement.firstChild) {
      targetElement.removeChild(targetElement.firstChild);
    }
    while (tempContainer.firstChild) {
      targetElement.appendChild(tempContainer.firstChild);
    }

    return doc.documentElement.outerHTML;
  }

  /**
   * Finds an element by matching its content
   */
  private findElementByContent(doc: Document, content: string): Element | null {
    const walker = document.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_ELEMENT,
      null
    );

    let node: Element | null = null;
    while ((node = walker.nextNode() as Element)) {
      if (node.innerHTML.trim() === content.trim()) {
        return node;
      }
    }
    return null;
  }

  /**
   * Executes the tool with the given context and parameters
   */
  async execute(
    context: ToolContext,
    params: UpdateResumeContentInput
  ): Promise<ToolResponse> {
    try {
      // Create a merged context that includes both the base context and any additional context from params
      const mergedContext: ToolContext = {
        ...context,
        ...params.context
      };

      // Analyze the content using LLM
      const analysis = await this.analyzeContent(
        context.resumeContent,
        params.userInstruction,
        mergedContext
      );

      // Update the content
      const newHtml = this.updateContent(context.resumeContent, analysis);

      const result: UpdateResumeContentResult = {
        success: true,
        summary: analysis.explanation,
        changes: [{
          type: 'update',
          location: analysis.explanation,
          content: analysis.newContent,
          elementSelector: analysis.elementSelector
        }],
        newHtml
      };

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Calls the LLM service to analyze content
   * This is a placeholder - implement with your actual LLM service
   */
  private async callLLM(prompt: string): Promise<string> {
    // TODO: Implement actual LLM service call
    throw new Error('LLM service not implemented');
  }
} 