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

/**
 * Sends a message to Claude and handles any tool calling
 * @param {Array} messages - The conversation history
 * @param {Array} files - Any files uploaded by the user
 * @returns {Object} - Claude's response
 */
async function sendMessageToClaudeWithMCP(messages, files = []) {
    try {
      // Format tools for Claude (but we may not use them if we have context in messages)
      const tools = formatToolsForMCP();
      
      // Simplified system prompt since we're pre-processing file content
      let systemPrompt = `You are AI Spec Assistant, an expert at converting vague product requests into 
  structured Product Requirement Documents (PRDs). Your job is to help product managers 
  create clear, comprehensive specifications from their initial ideas.
  
  Always aim to create specifications that are:
  - Clear and unambiguous
  - Actionable for developers
  - Focused on user needs and business goals
  - Structured with appropriate sections
  
  When provided with context from uploaded files, use that information to answer questions directly.`;
      
      // Format messages for the Anthropic API
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : msg.content
      }));
      
      console.log('Claude Service: Sending message to Claude');
      console.log('Claude Service: Number of messages:', formattedMessages.length);
      console.log('Claude Service: Last message length:', formattedMessages[formattedMessages.length - 1].content.length);
      
      // Send to Claude without tools if we don't have files (context is in message)
      const requestParams = {
        model: 'claude-3-opus-20240229',
        system: systemPrompt,
        messages: formattedMessages,
        max_tokens: 4096,
      };
      
      // Only add tools if we have files to work with
      if (files && files.length > 0) {
        requestParams.tools = tools;
      }
      
      const response = await anthropic.messages.create(requestParams);
  
      console.log('Claude Service: Response received');
      console.log('Claude Service: Response type:', response.content[0].type);
  
      // For our simplified approach, we don't expect tool calls
      // Just return the response directly
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
      model: 'claude-3-opus-20240229',
      system: systemPrompt,
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