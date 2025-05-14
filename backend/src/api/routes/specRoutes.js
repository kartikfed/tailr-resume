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
      
      // Always use ALL files for this conversation (filter out files without content)
      const conversationFiles = (uploadedFiles[conversationId] || []).filter(file => 
        file.content && file.content.length > 0
      );
      
      console.log(`Backend Chat: Processing message in conversation ${conversationId}`);
      console.log(`Backend Chat: Message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
      console.log(`Backend Chat: Available files with content:`, 
        conversationFiles.map(f => ({ 
          id: f.id, 
          name: f.name, 
          contentLength: f.content ? f.content.length : 0
        }))
      );
      
      let finalMessage = message;
      let contextAdded = false;
      
      // If we have files, always include their content as context
      if (conversationFiles.length > 0) {
        console.log('Backend Chat: Files available, adding full content as context');
        
        // Extract keywords from the user's message for better searching
        const messageWords = message.toLowerCase().split(/\s+/);
        const searchQueries = [];
        
        // Add specific search terms based on message content
        if (messageWords.some(word => ['pdf', 'export', 'button'].includes(word))) {
          searchQueries.push('pdf export');
          searchQueries.push('pdf');
          searchQueries.push('export');
          searchQueries.push('button');
        }
        if (messageWords.some(word => ['spec', 'specification', 'requirement', 'feature'].includes(word))) {
          searchQueries.push('requirement');
          searchQueries.push('feature');
          searchQueries.push('spec');
        }
        if (messageWords.some(word => ['secret', 'code', 'label'].includes(word))) {
          searchQueries.push('secret code');
          searchQueries.push('code');
          searchQueries.push('label');
        }
        
        // If no specific queries, use the whole message or fallback terms
        if (searchQueries.length === 0) {
          searchQueries.push(message);
          searchQueries.push('content');
        }
        
        // Try multiple search queries until we find results
        const { searchContext } = require('../../tools/toolHandlers');
        let allResults = [];
        
        for (const query of searchQueries) {
          console.log(`Backend Chat: Searching with query: "${query}"`);
          const searchResult = await searchContext({ query, maxResults: 2 }, { files: conversationFiles });
          
          if (searchResult.results && searchResult.results.length > 0) {
            allResults = [...allResults, ...searchResult.results];
            console.log(`Backend Chat: Found ${searchResult.results.length} results for "${query}"`);
          }
        }
        
        // If we still have no results, include the full file content
        if (allResults.length === 0) {
          console.log('Backend Chat: No search results found, including full file content');
          allResults = conversationFiles.map(file => ({
            source: file.name,
            content: file.content,
            fileId: file.id
          }));
        }
        
        // Remove duplicates and format context
        const uniqueResults = allResults.filter((result, index, self) =>
          index === self.findIndex(r => r.source === result.source && r.content === result.content)
        );
        
        if (uniqueResults.length > 0) {
          const contextInfo = uniqueResults.map(r => 
            `From file "${r.source}":\n${r.content}`
          ).join('\n\n---\n\n');
          
          finalMessage = `${message}
  
  CONTEXT FROM UPLOADED FILES:
  ${contextInfo}
  
  Please use this context to provide a comprehensive and accurate response.`;
          
          contextAdded = true;
          console.log('Backend Chat: Enhanced message with context created');
          console.log(`Backend Chat: Added context from ${uniqueResults.length} source(s)`);
        }
      }
      
      // Add the (possibly enhanced) message to history
      conversations[conversationId].push({
        role: 'user',
        content: finalMessage
      });
      
      console.log(`Backend Chat: Sending enhanced message to Claude${contextAdded ? ' (with context)' : ''}`);
      
      // Send to Claude with MCP - pass empty files array since we've included context in message
      const claudeResponse = await sendMessageToClaudeWithMCP(
        conversations[conversationId],
        []  // No files needed - context is in the message
      );
      
      console.log('Backend Chat: Received response from Claude');
      
      // Extract the response text and filter out thinking tags
      let responseText = '';
      if (claudeResponse.content && claudeResponse.content.length > 0) {
        if (claudeResponse.content[0].type === 'text') {
          responseText = claudeResponse.content[0].text;
        }
      }
      
      // Filter out thinking tags and other internal content
      responseText = responseText.replace(/<thinking>[\s\S]*?<\/thinking>/g, '');
      responseText = responseText.trim();
      
      // Add assistant response to history
      conversations[conversationId].push({
        role: 'assistant',
        content: responseText
      });
      
      // Return response to client
      res.json({
        conversationId,
        response: responseText,
        meta: { 
          ...(claudeResponse.meta || {}),
          contextAdded,
          filesUsed: conversationFiles.length,
          searchQueriesUsed: contextAdded
        }
      });
    } catch (error) {
      console.error('Backend Chat: Error in chat endpoint:', error);
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  });

/**
 * Upload files for context
 */
/**
 * Upload files for context
 */
/**
 * Upload files for context
 */
/**
 * Upload files for context
 */
router.post('/upload', (req, res) => {
    try {
      const { conversationId, files } = req.body;
      
      console.log('Backend: Received upload request');
      console.log('Backend: Raw request body keys:', Object.keys(req.body));
      console.log('Backend: Conversation ID:', conversationId);
      console.log('Backend: Files array:', files);
      
      if (!conversationId || !files || !Array.isArray(files)) {
        console.log('Backend: Invalid request format');
        return res.status(400).json({ error: 'Invalid request format' });
      }
      
      // Initialize files array for this conversation if not exists
      if (!uploadedFiles[conversationId]) {
        uploadedFiles[conversationId] = [];
      }
      
      // Add file metadata to the conversation
      const processedFiles = files.map((fileData, index) => {
        console.log(`Backend: Raw file data ${index + 1}:`, {
          keys: Object.keys(fileData),
          name: fileData.name,
          type: fileData.type,
          size: fileData.size,
          hasContentProperty: 'content' in fileData,
          contentType: typeof fileData.content,
          contentLength: fileData.content ? fileData.content.length : 0,
          contentPreview: fileData.content ? 
            fileData.content.substring(0, 50) + '...' : 
            'No content property or empty'
        });
        
        const fileId = `file-${Date.now()}-${index}`;
        const processedFile = {
          id: fileId,
          name: fileData.name,
          type: fileData.type,
          size: fileData.size,
          content: fileData.content || '', // Ensure content property exists
          uploadedAt: new Date().toISOString()
        };
        
        console.log(`Backend: Processed file ${fileId}:`, {
          name: processedFile.name,
          hasContent: Boolean(processedFile.content),
          contentLength: processedFile.content ? processedFile.content.length : 0
        });
        
        uploadedFiles[conversationId].push(processedFile);
        return processedFile;
      });
      
      console.log(`Backend: Total files stored for conversation ${conversationId}: ${uploadedFiles[conversationId].length}`);
      console.log('Backend: Stored files with content check:', 
        uploadedFiles[conversationId].map(f => ({ 
          name: f.name, 
          hasContent: Boolean(f.content),
          contentLength: f.content ? f.content.length : 0
        }))
      );
      
      res.json({
        message: `${processedFiles.length} files uploaded successfully`,
        files: processedFiles.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: file.uploadedAt
        }))
      });
    } catch (error) {
      console.error('Backend: Error in upload endpoint:', error);
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