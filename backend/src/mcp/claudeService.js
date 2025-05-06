/**
 * Claude MCP Integration Service
 * 
 * This service handles communication with the Anthropic API,
 * including tool calling via the Model Context Protocol (MCP).
 */

const { Anthropic } = require('@anthropic-ai/sdk');
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

// System prompt for the AI Spec Assistant
const SYSTEM_PROMPT = `You are AI Spec Assistant, an expert at converting vague product requests into 
structured Product Requirement Documents (PRDs). Your job is to help product managers 
create clear, comprehensive specifications from their initial ideas.

When analyzing a product request:
1. Ask clarifying questions if the request is ambiguous
2. Use the searchContext tool to find relevant information in uploaded documents
3. Use the analyzeFile tool to extract information from specific files
4. Use the generatePRDSection tool to create structured sections of the PRD

Always aim to create specifications that are:
- Clear and unambiguous
- Actionable for developers
- Focused on user needs and business goals
- Structured with appropriate sections`;

/**
 * Sends a message to Claude and handles any tool calling
 * @param {Array} messages - The conversation history
 * @param {Array} files - Any files uploaded by the user
 * @returns {Object} - Claude's response
 */
async function sendMessageToClaudeWithMCP(messages, files = []) {
  try {
    // Format tools for Claude
    const tools = formatToolsForMCP();
    
    // Format messages for the Anthropic API
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : msg.content
    }));
    
    // Initial message to Claude with tools
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      system: SYSTEM_PROMPT,
      messages: formattedMessages,
      tools: tools,
      max_tokens: 4096,
    });

    // Check if Claude wants to call a tool
    if (response.content && 
        response.content.length > 0 && 
        response.content[0].type === 'tool_use') {
      // Handle tool calling loop
      return await handleToolCalls(response, formattedMessages, tools, files);
    }

    // If no tool calls, return the response directly
    return response;
  } catch (error) {
    console.error('Error communicating with Claude:', error);
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
    const toolCall = currentResponse.content[0].tool_use;
    
    // Log tool usage
    console.log(`Claude is calling tool: ${toolCall.name}`);
    
    // Execute the tool
    let toolResult;
    try {
      // Call the appropriate tool handler and pass context
      toolResult = await toolHandlers[toolCall.name](
        toolCall.input, 
        { files }  // Pass files and other context
      );
    } catch (error) {
      // If the tool errors, return a helpful error message
      toolResult = { 
        error: `Error executing ${toolCall.name}: ${error.message}` 
      };
      console.error(`Tool execution error:`, error);
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
      { role: 'assistant', content: [{ type: 'tool_use', tool_use: toolCall }] },
      { role: 'user', content: [{ type: 'tool_result', tool_result: { 
        name: toolCall.name, 
        content: toolResult
      }}]}
    ];
    
    // Send updated messages to Claude
    currentResponse = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      system: SYSTEM_PROMPT,
      messages: updatedMessages,
      tools: tools,
      max_tokens: 4096,
    });
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