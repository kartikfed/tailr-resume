/**
 * Claude Integration Service
 * 
 * This service handles communication with the Anthropic API,
 */

const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEFAULT_SYSTEM_PROMPT = `
// You are an expert resume editor with access to the following tools:

// 1. resumeEdit: Edit resume content using natural language instructions
//    - Use this tool to make precise changes to resume HTML content
//    - Provide clear instructions about what needs to be changed
//    - The tool will handle the HTML manipulation while preserving structure

// When a user asks you to edit their resume:
// 1. Understand their request
// 2. Use the resumeEdit tool to make the changes
// 3. After using the tool, you MUST provide the modified HTML content in your response
// 4. Format your response as follows:
//    [HTML]
//    <!DOCTYPE html>
//    <html>
//    ... your modified HTML here ...
//    </html>
   
//    [EXPLANATION]
//    Brief explanation of the changes made

// IMPORTANT:
// - After using the resumeEdit tool, you MUST include the complete modified HTML in your response
// - The HTML must maintain all existing structure, classes, and styling
// - Do not include any other text or formatting in your response
`;

const CHAT_SYSTEM_PROMPT = `You are a helpful AI assistant specializing in resume optimization and job applications. 
Your role is to provide clear, concise, and accurate responses to help users improve their resumes and job applications.
Focus on being professional, constructive, and specific in your feedback.`;

/**
 * Sends a message to Claude for specialized tasks (PDF conversion, analysis, etc.)
 * @param {Array} messages - The conversation history
 * @param {string} systemPrompt - The system prompt for the specific task
 * @returns {Object} - Claude's response
 */
async function sendMessageToClaude(messages, systemPrompt) {
    try {
      // Format messages properly for Claude API
      const formattedMessages = messages.map(msg => {
        // If the message has an array of content items
        if (Array.isArray(msg.content)) {
          return {
            role: msg.role,
            content: msg.content.map(contentItem => {
              // Handle different content types
              switch (contentItem.type) {
                case 'document':
                  return {
                    type: 'document',
                    source: contentItem.source
                  };
                case 'text':
                  return contentItem;
                default:
                  // Convert unknown types to text
                  return {
                    type: 'text',
                    text: JSON.stringify(contentItem)
                  };
              }
            })
          };
        }
        // If the message has a simple text content
        return {
          role: msg.role,
          content: msg.content
        };
      });

      console.log('🤖 Claude Service: Sending message to Claude');
      console.log('📨 Claude Service: Number of messages:', formattedMessages.length);
      console.log('📝 Claude Service: Last message content:', JSON.stringify(formattedMessages[formattedMessages.length - 1].content, null, 2));

      const requestParams = {
        model: 'claude-3-7-sonnet-20250219',
        system: systemPrompt,
        messages: formattedMessages,
        max_tokens: 4096,
      };

      const response = await anthropic.messages.create(requestParams);
      console.log('📥 Claude Service: Response received');
      console.log('🔍 Claude Service: Response type:', response.content[0].type);
      return response;
    } catch (error) {
      console.error('❌ Claude Service: Error communicating with Claude:', error);
      throw new Error(`Failed to communicate with AI: ${error.message}`);
    }
}

/**
 * Sends a chat message to Claude for general conversation
 * @param {Array} messages - The conversation history
 * @param {Object} context - Optional context object containing resume, job description, and analysis
 * @returns {Object} - Claude's response
 */
async function sendChatMessage(messages, context = {}) {
    try {
      // Format messages for chat
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Create context-aware system prompt
      const contextAwareSystemPrompt = `You are a helpful AI assistant specializing in resume optimization and job applications. You have access to the following context:

Current Resume Version: ${context?.resumeVersion?.version || 'Not available'}
Job Description Version: ${context?.jobDescriptionVersion?.version || 'Not available'}
Analysis Version: ${context?.analysisVersion?.version || 'Not available'}

You have access to the following tool:

- updateResumeContent: Use this tool to update resume content based on natural language instructions. This tool will:
  * Understand what content the user wants to modify
  * Find the relevant content in the resume
  * Generate appropriate new content
  * Make the update while preserving formatting

Resume Content:
\`\`\`html
${context?.content?.resume || 'Not available'}
\`\`\`

Job Description:
\`\`\`
${context?.content?.jobDescription || 'Not available'}
\`\`\`

Job Analysis:
\`\`\`json
${context?.content?.analysis || 'Not available'}
\`\`\`

IMPORTANT INSTRUCTIONS:
1. When the user asks to edit or modify content:
   * Use the updateResumeContent tool with their natural language instruction
   * The tool will handle finding and updating the content
2. Do not just describe the changes - actually make them using the tool
3. If you need to make multiple changes, use the tool multiple times
4. After making changes, explain what you changed and why

Please provide clear, concise, and accurate responses based on this context. Focus on helping the user optimize their resume for the specific job description.`;

      console.log('🤖 Claude Service: Sending chat message to Claude');
      console.log('📨 Claude Service: Number of messages:', formattedMessages.length);
      console.log('📝 Claude Service: Last message content:', JSON.stringify(formattedMessages[formattedMessages.length - 1].content, null, 2));
      console.log('🔍 Claude Service: Context available:', {
        hasResume: Boolean(context?.content?.resume),
        hasJobDescription: Boolean(context?.content?.jobDescription),
        hasAnalysis: Boolean(context?.content?.analysis),
        resumeVersion: context?.resumeVersion?.version,
        jobDescriptionVersion: context?.jobDescriptionVersion?.version,
        analysisVersion: context?.analysisVersion?.version,
        resumeLength: context?.content?.resume?.length,
        jobDescriptionLength: context?.content?.jobDescription?.length,
        analysisLength: context?.content?.analysis?.length
      });

      const requestParams = {
        model: 'claude-3-7-sonnet-20250219',
        system: contextAwareSystemPrompt,
        messages: formattedMessages,
        max_tokens: 4096,
        tools: [
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
        ]
      };

      const response = await anthropic.messages.create(requestParams);
      console.log('📥 Claude Service: Chat response received');
      return response;
    } catch (error) {
      console.error('❌ Claude Service: Error in chat communication:', error);
      throw new Error(`Failed to process chat message: ${error.message}`);
    }
}

module.exports = {
  sendMessageToClaude,
  sendChatMessage,
  DEFAULT_SYSTEM_PROMPT,
  CHAT_SYSTEM_PROMPT
};