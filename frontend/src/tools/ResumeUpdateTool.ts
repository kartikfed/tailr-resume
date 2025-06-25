import { ToolContext, ToolResponse } from './index';
import { UpdateResumeContentInput, UpdateResumeContentResult } from '../types/tools';

interface LLMAnalysis {
  targetElement: string;
  newContent: string;
  explanation: string;
  elementSelector: string;
}

function sanitizeToPlainText(input: string): string {
  return input.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
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

1. Identify what content they're referring to by:
* Looking for semantic matches (e.g., "skills" section)
* Considering the content type (e.g., lists, paragraphs)
* Using flexible matching to find similar content


2. Extract the current text of that content
3. Generate the revised version. 
4. Return the exact HTML element to replace and the new content

IMPORTANT: For the elementSelector, you MUST provide a valid CSS selector that uniquely identifies the element to be modified.

IMPORTANT: No hallucinations are allowed. The revision must NOT introduce new content that is not present in the original content.

IMPORTANT: The revision must be identical or as similar as possible in length to the original content.

Return JSON: {
  "targetElement": "exact HTML of element to replace",
  "newContent": "revised content",
  "explanation": "what you identified",
  "elementSelector": "CSS selector to identify the element (e.g., #summary, .experience-item:nth-child(2))"
}`;

    // Call LLM API here to get analysis
    const response = await this.callLLM(analysisPrompt);
    const analysis = JSON.parse(response);
    
    // Validate the elementSelector
    if (!analysis.elementSelector || typeof analysis.elementSelector !== 'string') {
      throw new Error('Invalid elementSelector returned from LLM');
    }

    return analysis;
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

    // Sanitize new content and update only text
    const sanitizedContent = sanitizeToPlainText(analysis.newContent);
    targetElement.textContent = sanitizedContent;

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