/**
 * API Routes for Spec Generation
 * 
 * This file defines the API endpoints for interacting with the
 * AI Spec Assistant, using Claude with MCP.
 */

const express = require('express');
const router = express.Router();
const { sendMessageToClaudeWithMCP } = require('../../mcp/claudeService');

// Simple in-memory storage for conversation history and files
// In production, use a database
const conversations = {};
const uploadedFiles = {};

/**
 * Start or continue a conversation with AI Spec Assistant
 */
router.post('/chat', async (req, res) => {
  try {
    const { conversationId, message, files = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Initialize or retrieve conversation history
    if (!conversations[conversationId]) {
      conversations[conversationId] = [];
    }
    
    // Add user message to history
    conversations[conversationId].push({
      role: 'user',
      content: message
    });
    
    // Get files for this conversation
    const conversationFiles = (uploadedFiles[conversationId] || []).filter(file => 
      files.includes(file.id)
    );
    
    console.log(`Processing message in conversation ${conversationId} with ${conversationFiles.length} files`);
    
    // Send to Claude with MCP
    const claudeResponse = await sendMessageToClaudeWithMCP(
      conversations[conversationId],
      conversationFiles
    );
    
    console.log('Received response from Claude');
    
    // Extract the response text
    let responseText = '';
    if (claudeResponse.content && claudeResponse.content.length > 0) {
      if (claudeResponse.content[0].type === 'text') {
        responseText = claudeResponse.content[0].text;
      }
    }
    
    // Add assistant response to history
    conversations[conversationId].push({
      role: 'assistant',
      content: responseText
    });
    
    // Return response to client
    res.json({
      conversationId,
      response: responseText,
      meta: claudeResponse.meta || {}
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Upload files for context
 */
router.post('/upload', (req, res) => {
  try {
    const { conversationId, files } = req.body;
    
    if (!conversationId || !files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }
    
    // Initialize files array for this conversation if not exists
    if (!uploadedFiles[conversationId]) {
      uploadedFiles[conversationId] = [];
    }
    
    // Add file metadata to the conversation
    const processedFiles = files.map((file, index) => {
      const fileId = `file-${Date.now()}-${index}`;
      const processedFile = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      };
      
      uploadedFiles[conversationId].push(processedFile);
      return processedFile;
    });
    
    res.json({
      message: `${processedFiles.length} files uploaded successfully`,
      files: processedFiles
    });
  } catch (error) {
    console.error('Error in upload endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get conversation history
 */
router.get('/conversation/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  
  if (!conversations[conversationId]) {
    conversations[conversationId] = [];
  }
  
  res.json({
    conversationId,
    messages: conversations[conversationId],
    files: uploadedFiles[conversationId] || []
  });
});

module.exports = router;