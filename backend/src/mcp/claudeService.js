/**
 * Claude MCP Integration Service
 * 
 * This service handles communication with the Anthropic API,
 * including tool calling via the Model Context Protocol (MCP).
 */

const Anthropic = require('@anthropic-ai/sdk');
const { formatToolsForMCP } = require('./toolDefinitions');
const toolHandlers = require('../tools/toolHandlers');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Strict Markdown system prompt for all resume flows
const DEFAULT_SYSTEM_PROMPT = `You are a resume formatting assistant. You will be given an entire resume text. Output ONLY the resume in valid escaped Markdown format. Do NOT include any explanations, introductions, or extra text. Do NOT include any preamble such as 'Here is the resume formatted in valid escaped markdown.' Formatting requirements: - Use # or ## for section headers (e.g., ## Experience) - Use * at the start of a line for bullet points - Use bold for names, roles, or other important text - Use italic for team/sub-section names if needed - Do not use all-caps for section headers; use escaped Markdown headings instead - Do not add any text before or after the resume - Preserve the original wording, punctuation, and order of the text - Maintain the overall structure of the resume including sections like Contact Information, Experience, Education, Projects, etc. - Ensure all dates, company names, and contact information are on separate lines for easy extraction - ALL markdown special characters must be escaped with backslashes (\\)\nExample Input: Designed and implemented a new data pipeline for analytics resulting in 30% faster reporting Collaborated with cross-functional teams to define requirements Improved data quality by 25% through validation scripts\nExample Output:\n\\* Designed and implemented a new data pipeline for analytics resulting in 30\\% faster reporting\n\\* Collaborated with cross-functional teams to define requirements\n\\* Improved data quality by 25\\% through validation scripts`;

/**
 * Sends a message to Claude and handles any tool calling
 * @param {Array} messages - The conversation history
 * @param {Array} files - Any files uploaded by the user
 * @returns {Object} - Claude's response
 */
async function sendMessageToClaudeWithMCP(messages, files = [], systemPrompt = DEFAULT_SYSTEM_PROMPT) {
    try {
      const tools = formatToolsForMCP();
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : msg.content
      }));
      console.log('Claude Service: Sending message to Claude');
      console.log('Claude Service: Number of messages:', formattedMessages.length);
      console.log('Claude Service: Last message length:', formattedMessages[formattedMessages.length - 1].content.length);
      const requestParams = {
        model: 'claude-3-7-sonnet-20250219',
        system: systemPrompt,
        messages: formattedMessages,
        max_tokens: 4096,
      };
      if (files && files.length > 0) {
        requestParams.tools = tools;
      }
      const response = await anthropic.messages.create(requestParams);
      console.log('Claude Service: Response received');
      console.log('Claude Service: Response type:', response.content[0].type);
      return response;
    } catch (error) {
      console.error('Claude Service: Error communicating with Claude:', error);
      throw new Error(`Failed to communicate with AI: ${error.message}`);
    }
  }

/**
 * Handles the tool calling loop
 * @param {Object} response - Claude's initial response
 * @param {Array} messages - The conversation history
 * @param {Array} tools - The tools available to Claude
 * @param {Array} files - Any files uploaded by the user
 * @returns {Object} - Claude's final response after tool execution
 */
async function handleToolCalls(response, messages, tools, files) {
  let currentResponse = response;
  let toolsUsed = [];
  
  // Keep processing tool calls until Claude returns a text response
  while (currentResponse.content && 
         currentResponse.content.length > 0 && 
         currentResponse.content[0].type === 'tool_use') {
    const toolCall = currentResponse.content[0];
    
    console.log(`Claude Service: Tool call - Name: ${toolCall.name}, Input:`, toolCall.input);
    
    // Execute the tool
    let toolResult;
    try {
      // Call the appropriate tool handler and pass context
      toolResult = await toolHandlers[toolCall.name](
        toolCall.input, 
        { files }  // Pass files and other context
      );
      console.log(`Claude Service: Tool result for ${toolCall.name}:`, toolResult);
    } catch (error) {
      // If the tool errors, return a helpful error message
      toolResult = { 
        error: `Error executing ${toolCall.name}: ${error.message}` 
      };
      console.error(`Claude Service: Tool execution error:`, error);
    }
    
    // Track tools that have been used
    toolsUsed.push({
      name: toolCall.name,
      input: toolCall.input,
      result: toolResult
    });
    
    // Create updated messages array with tool results
    const updatedMessages = [
      ...messages,
      { role: 'assistant', content: currentResponse.content },
      { role: 'user', content: [{ 
        type: 'tool_result',
        tool_use_id: toolCall.id,
        content: JSON.stringify(toolResult)
      }]}
    ];
    
    console.log('Claude Service: Sending tool result back to Claude');
    
    // Send updated messages to Claude
    currentResponse = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      system: DEFAULT_SYSTEM_PROMPT,
      messages: updatedMessages,
      tools: tools,
      max_tokens: 4096,
    });
    
    console.log('Claude Service: Received follow-up response from Claude');
  }
  
  // Add metadata about tools used to the response
  return {
    ...currentResponse,
    meta: {
      toolsUsed
    }
  };
}

module.exports = {
  sendMessageToClaudeWithMCP
};