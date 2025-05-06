/**
 * API Routes for Spec Generation (Testing Version)
 * 
 * This is a simplified version of the routes for testing the frontend
 * without implementing the full functionality.
 */

const express = require('express');
const router = express.Router();

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
      content: message,
      timestamp: new Date().toISOString()
    });
    
    // Simple mock response based on message content
    let response;
    let toolsUsed = [];
    
    // Check for keywords in the message
    if (message.toLowerCase().includes('pdf')) {
      response = "Based on your request about PDF export, I'll help create a specification. I'll start by looking for relevant information in your uploaded files.";
      
      // Mock tools used
      toolsUsed = [
        { 
          name: 'searchContext', 
          input: { query: 'PDF export requirements' },
          result: {
            results: [
              {
                source: "Legacy Spec.docx",
                content: "The current export functionality is limited to CSV only. PDF export was planned but not implemented."
              }
            ]
          }
        },
        { 
          name: 'generatePRDSection', 
          input: { sectionType: 'problem_statement', context: 'PDF export feature' },
          result: {
            sectionType: "problem_statement",
            template: {
              title: "Problem Statement",
              description: "Clear description of the problem this feature solves"
            }
          }
        }
      ];
      
      // Add follow-up after "tool usage"
      response += "\n\nAfter analyzing the context, I've created a draft specification for the PDF export feature. The current system only supports CSV exports, but users need PDF for sharing formatted reports with stakeholders. I've organized the specification into standard PRD sections that outline the requirements, user stories, and success metrics.";
    } else {
      response = "I'll help you create a product specification for that request. To get started, could you provide more details about what specific feature or functionality you need specified? Also, if you have any existing documentation or requirements, uploading those files would help me create a more accurate specification.";
    }
    
    // Add assistant response to history
    conversations[conversationId].push({
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });
    
    // Send response with delay to simulate processing time
    setTimeout(() => {
      res.json({
        conversationId,
        response: response,
        meta: {
          toolsUsed
        }
      });
    }, 1500);
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
    
    // Simulate processing time
    setTimeout(() => {
      res.json({
        message: `${processedFiles.length} files uploaded successfully`,
        files: processedFiles
      });
    }, 800);
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
  
  // Create mock conversation if it doesn't exist
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