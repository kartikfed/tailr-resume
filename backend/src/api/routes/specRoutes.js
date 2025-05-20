/**
 * API Routes for Spec Generation
 * 
 * This file defines the API endpoints for interacting with the
 * AI Spec Assistant, using Claude with MCP.
 */

const express = require('express');
const router = express.Router();
const { sendMessageToClaudeWithMCP } = require('../../mcp/claudeService');
const { extractPdfText, extractPdfMarkdown } = require('../../../utils/pdfExtract');
const sectionExtractorTool = require('../../mcp/tools/sectionExtractor');

// Simple in-memory storage for conversation history and files
// In production, use a database
const conversations = {};
const uploadedFiles = {};
const jobAnalysisResults = {}; // Store job analysis results by conversation ID

// Helper function to unescape Markdown special characters
function unescapeMarkdown(text) {
  if (!text) return text;
  // Unescape common Markdown characters: \\* \\# \\_ \\` \\~ \\> \\- \\! \\[ \\] \\( \\) \\{ \\} \\< \\> \\| \\.
  return text.replace(/\\([#*_[\]()`~>\-!{}<>|.])/g, '$1');
}

/**
 * Start or continue a conversation with Tailr
 */
router.post('/chat', async (req, res) => {
    try {
      const { conversationId, message, files = [] } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      if (!conversationId) {
        return res.status(400).json({ error: 'Conversation ID is required' });
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
      
      // Add job analysis results to context if available
      const jobAnalysis = jobAnalysisResults[conversationId];
      if (jobAnalysis) {
        console.log('Backend Chat: Adding job analysis results to context');
        const analysisContext = `JOB ANALYSIS CONTEXT:
Required Skills: ${jobAnalysis.required_skills.join(', ')}
Preferred Qualifications: ${jobAnalysis.preferred_qualifications.join(', ')}
Experience Level: ${jobAnalysis.experience_level}
Key Responsibilities: ${jobAnalysis.key_responsibilities.join('\n')}
Company Info: ${jobAnalysis.company_info.description}
Industry: ${jobAnalysis.company_info.industry}
Keywords: ${jobAnalysis.keywords.join(', ')}

Please use this job analysis to tailor the resume content to match the requirements and highlight relevant experience.`;
        
        finalMessage = `${message}\n\n${analysisContext}`;
        contextAdded = true;
        console.log('Backend Chat: Added job analysis context');
      }
      
      // If we have files, always include their content as context
      if (conversationFiles.length > 0) {
        console.log('Backend Chat: Files available, adding resume-focused context');
        
        // Get the full resume content from the first file
        const resumeFile = conversationFiles[0];
        let resumeContent = '';
        
        try {
          if (resumeFile.content.startsWith('{')) {
            // If it's JSON (Affinda structured data), convert to markdown
            const structuredData = JSON.parse(resumeFile.content);
            resumeContent = `RESUME CONTENT:
${structuredData.metadata.name}
${structuredData.metadata.email}
${structuredData.metadata.phone}
${structuredData.metadata.location}

${structuredData.sections.map(section => {
  if (section.type === 'list') {
    return `${section.title}\n${section.items.map(item => {
      if (item.type === 'experience') {
        return `${item.title} at ${item.company}\n${item.location}\n${item.dates}\n${item.bullets.map(bullet => `• ${bullet}`).join('\n')}`;
      } else if (item.type === 'education') {
        return `${item.degree} at ${item.institution}\n${item.dates}\n${item.content}`;
      }
      return item.content;
    }).join('\n\n')}`;
  }
  return `${section.title}\n${section.content}`;
}).join('\n\n')}`;
          } else {
            // If it's already markdown, use it directly
            resumeContent = `RESUME CONTENT:\n${resumeFile.content}`;
          }
        } catch (error) {
          console.error('Error processing resume content:', error);
          resumeContent = `RESUME CONTENT:\n${resumeFile.content}`;
        }
        
        finalMessage = `${message}\n\n${resumeContent}`;
        contextAdded = true;
        console.log('Backend Chat: Added resume content');
      }
      
      // Add the (possibly enhanced) message to history
      conversations[conversationId].push({
        role: 'user',
        content: finalMessage
      });
      
      console.log(`Backend Chat: Sending enhanced message to Claude${contextAdded ? ' (with context)' : ''}`);
      
      // Convert any system messages to assistant messages for Claude API compatibility
      const formattedMessages = conversations[conversationId].map(msg => ({
        role: msg.role === 'system' ? 'assistant' : msg.role,
        content: msg.content
      }));
      
      // Add a system message at the start of the conversation to provide context
      if (conversationFiles.length > 0) {
        formattedMessages.unshift({
          role: 'assistant',
          content: `I am reviewing your resume and will provide feedback based on the content you've shared. I will always give an explanation that meets your request. I can see your resume content and will use it to answer your questions.I will always respond to your direct question or prompt. My goal is to always prioritize meeting your request. I will use everything I have available to me as context. As a resume support expert, my goal is to help you improve your resume in the best way possible, otherwise I have failed. I will never just spit out content without explaining exactly how i am attempting to answer your question or meet your request.`
        });
      }
      
      // Send to Claude with MCP - pass empty files array since we've included context in message
      const claudeResponse = await sendMessageToClaudeWithMCP(
        formattedMessages,
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
          resumeFocused: true
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
router.post('/upload', async (req, res) => {
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
      
      // Process files asynchronously for PDF extraction
      const processedFiles = await Promise.all(files.map(async (fileData, index) => {
        const fileId = `file-${Date.now()}-${index}`;
        let fileContent = fileData.content || '';
        
        if (
          fileData.isPdf ||
          fileData.type === 'application/pdf' ||
          fileData.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          try {
            // Extract raw text and send to Claude
            const rawText = await extractPdfText(fileData.content);
            const systemPrompt = `You are a resume formatting assistant. You will be given an entire resume text. Output ONLY the resume in valid escaped Markdown format. Do NOT include any explanations, introductions, or extra text. Formatting requirements: - Use # or ## for section headers (e.g., ## Experience) - Use * at the start of a line for bullet points - Use bold for names, roles, or other important text - Use italic for team/sub-section names if needed - Do not use all-caps for section headers; use escaped Markdown headings instead - Do not add any text before or after the resume - Preserve the original wording, punctuation, and order of the text - Maintain the overall structure of the resume including sections like Contact Information, Experience, Education, Projects, etc. - Ensure all dates, company names, and contact information are on separate lines for easy extraction - ALL markdown special characters must be escaped with backslashes () Example Input: Designed and implemented a new data pipeline for analytics resulting in 30% faster reporting Collaborated with cross-functional teams to define requirements Improved data quality by 25% through validation scripts Example Output: * Designed and implemented a new data pipeline for analytics resulting in 30% faster reporting * Collaborated with cross-functional teams to define requirements * Improved data quality by 25% through validation scripts`;
            const messages = [
              { role: 'user', content: rawText }
            ];
            const claudeResponse = await sendMessageToClaudeWithMCP(messages, [], systemPrompt);
            let markdown = '';
            if (claudeResponse.content && claudeResponse.content.length > 0 && claudeResponse.content[0].type === 'text') {
              markdown = claudeResponse.content[0].text;
            }
            fileContent = markdown;
          } catch (err) {
            console.error(`Backend: Failed to process resume:`, err);
            fileContent = '';
          }
        }
        
        const processedFile = {
          id: fileId,
          name: fileData.name,
          type: fileData.type,
          size: fileData.size,
          content: fileContent,
          uploadedAt: new Date().toISOString()
        };
        
        uploadedFiles[conversationId] = uploadedFiles[conversationId] || [];
        uploadedFiles[conversationId].push(processedFile);
        return processedFile;
      }));
      
      console.log(`Backend: Total files stored for conversation ${conversationId}: ${uploadedFiles[conversationId].length}`);
      console.log('Backend: Stored files with content check:', 
        uploadedFiles[conversationId].map(f => ({ 
          name: f.name, 
          hasContent: Boolean(f.content),
          contentLength: f.content ? f.content.length : 0
        }))
      );
      
      const response = {
        message: `${processedFiles.length} files uploaded successfully`,
        files: processedFiles.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedAt: file.uploadedAt,
          content: file.content
        }))
      };

      console.log('Backend: Sending response:', {
        message: response.message,
        fileCount: response.files.length,
        firstFileContentType: typeof response.files[0]?.content,
        firstFileContentPreview: response.files[0]?.content?.substring(0, 200) + '...'
      });
      
      res.json(response);
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

// Add a new endpoint for resume revision
router.post('/revise', async (req, res) => {
  try {
    const { selectedText, jobDescription, userInstructions, resumeContent, jobAnalysis, writingTone = 'concise', conversationId, addToChat = false } = req.body;
    
    if (!selectedText || !jobDescription) {
      return res.status(400).json({ error: 'Selected text and job description are required' });
    }

    // Create system prompt for Claude
    const systemPrompt = `You are an expert resume coach. Your task is to revise the selected text from the resume to better align with the job description while maintaining absolute truthfulness to the original content.

Core Principles for Effective Resume Bullet Points:
1. Start with strong action verbs
2. Follow the WHAT-HOW-WHY structure
3. Quantify achievements ONLY when explicitly stated in the original text
4. Be specific and concrete, but NEVER invent details
5. Focus on accomplishments rather than responsibilities
6. Keep bullet points concise and relevant

Revision Process:
1. Analyze the original bullet point for:
   - Missing action verbs
   - Unclear structure
   - Opportunities for better alignment with job description
   - Natural keyword integration
2. Restructure using the WHAT-HOW-WHY framework
3. Provide the revised bullet point

CRITICAL RULES:
- NEVER invent or hallucinate metrics, numbers, or specific achievements
- ONLY use information that is explicitly stated in the original text
- If the original text doesn't mention specific numbers or metrics, maintain that in the revision
- Focus on improving the language, structure, and alignment while preserving the factual content
- If you're unsure about any detail, err on the side of keeping the original information

BAD PROMPT PRESET EXAMPLES (DO NOT GENERATE THESE):
1. "Strengthen this bullet point by including a specific A/B test I ran, the hypothesis, implementation details, and quantifiable results that drove product decisions"
   - BAD because it asks to invent specific details not present in the original text
2. "Rework this to showcase my experience with full stack development using PHP/MySQL and React/TypeScript/JavaScript, highlighting a specific feature I built end-to-end"
   - BAD because it asks to add specific technologies and features not mentioned in the original text
3. "Transform this bullet point to emphasize my experience building recommendation systems or personalized user experiences with metrics on user engagement or conversion improvement"
   - BAD because it asks to add specific systems and metrics not present in the original text

GOOD PROMPT PRESET EXAMPLES:
1. "Make this more results-oriented by emphasizing the impact"
   - GOOD because it focuses on structure and emphasis without inventing details
2. "Strengthen the action verb and clarify the outcome"
   - GOOD because it improves language without adding new information
3. "Align this with the job description's focus on leadership"
   - GOOD because it adjusts emphasis without inventing new details

Writing Style Guidelines:
${writingTone === 'concise' ? `
- Use concise, impactful language
- Focus on strong action verbs
- Keep descriptions brief and clear` : 
writingTone === 'detailed' ? `
- Use detailed, technical language
- Focus on comprehensive descriptions
- Emphasize technical accuracy` : `
- Use clear, accessible language
- Focus on straightforward descriptions
- Emphasize readability`}

Your response should be a JSON object with the following structure:
{
  "revised_text": "The revised bullet point, maintaining absolute truthfulness to the original content",
  "explanation": "Brief explanation of the changes made, focusing on language and structure improvements"
}`;

    console.log('=== Revision Request Started ===');
    console.log('Selected text length:', selectedText.length);
    console.log('Job description length:', jobDescription.length);
    console.log('Job analysis provided:', Boolean(jobAnalysis));

    // Use job analysis if provided
    let analysisContext = '';
    if (jobAnalysis) {
      console.log('Job analysis details:', {
        requiredSkills: jobAnalysis.required_skills?.length || 0,
        preferredQualifications: jobAnalysis.preferred_qualifications?.length || 0,
        experienceLevel: jobAnalysis.experience_level,
        responsibilities: jobAnalysis.key_responsibilities?.length || 0,
        companyInfo: Boolean(jobAnalysis.company_info),
        keywords: jobAnalysis.keywords?.length || 0
      });

      analysisContext = `\nJob Analysis Context:
Required Skills: ${jobAnalysis.required_skills.join(', ')}
Preferred Qualifications: ${jobAnalysis.preferred_qualifications.join(', ')}
Experience Level: ${jobAnalysis.experience_level}
Key Responsibilities: ${jobAnalysis.key_responsibilities.join('\n')}
Company Info: ${jobAnalysis.company_info.description}
Industry: ${jobAnalysis.company_info.industry}
Keywords: ${jobAnalysis.keywords.join(', ')}`;
      
      console.log('Analysis context length:', analysisContext.length);
      console.log('Analysis context preview:', analysisContext.substring(0, 200) + '...');
    }

    let userContent = `Selected Text:\n<<<\n${selectedText}\n>>>\nJob Description: ${jobDescription}${analysisContext}`;
    if (userInstructions) {
      userContent += `\nUser Instructions: ${userInstructions}`;
    }
    // Include the full resume content as context
    userContent += `\nFull Resume Content: ${resumeContent}`;
    userContent += `\n\nRemember: Output ONLY the revised text, and nothing else.`;

    console.log('Final user content length:', userContent.length);
    console.log('Context breakdown:', {
      selectedTextLength: selectedText.length,
      jobDescriptionLength: jobDescription.length,
      analysisContextLength: analysisContext.length,
      userInstructionsLength: userInstructions?.length || 0,
      resumeContentLength: resumeContent.length
    });

    const messages = [
      { role: 'user', content: userContent }
    ];
    const claudeResponse = await sendMessageToClaudeWithMCP(messages, [], systemPrompt);
    let revisedText = '';
    let explanation = '';
    if (claudeResponse.content && claudeResponse.content.length > 0 && claudeResponse.content[0].type === 'text') {
      const responseText = claudeResponse.content[0].text.trim();
      
      try {
        // Parse the JSON response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const cleanedJson = jsonMatch[0]
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
          
          const parsedResponse = JSON.parse(cleanedJson);
          revisedText = parsedResponse.revised_text;
          explanation = parsedResponse.explanation;
          
          // Only remove line breaks and normalize spaces, preserve other markdown
          revisedText = revisedText
            .replace(/\n/g, ' ') // Remove line breaks
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (error) {
        console.error('Error parsing Claude response:', error);
        throw new Error('Failed to parse revision response');
      }
    }
    console.log('Backend /revise: Claude response:', claudeResponse);
    console.log('Backend /revise: revisedText:', revisedText);
    console.log('Backend /revise: explanation:', explanation);
    console.log('=== Revision Request Completed ===');
    
    // Add the revision explanation to the chat history if conversationId is provided and addToChat is true
    if (conversationId && addToChat) {
      if (!conversations[conversationId]) {
        conversations[conversationId] = [];
      }
      conversations[conversationId].push({
        role: 'system',
        content: explanation,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      revisedText,
      explanation
    });
  } catch (error) {
    console.error('Error in revision endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Analyze a job description to extract key requirements and information
 */
router.post('/analyze-job-description', async (req, res) => {
  try {
    const { content, analysisType = 'full_analysis', selectedText, writingTone = 'concise' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Job description content is required' });
    }
    
    console.log('=== Job Description Analysis Started ===');
    console.log('Analysis type:', analysisType);
    console.log('Content length:', content.length);
    console.log('Selected text provided:', Boolean(selectedText));
    console.log('Writing tone:', writingTone);
    
    // Create system prompt for Claude
    const systemPrompt = `You are an expert job description analyzer. Your task is to analyze the provided job description and extract key information in a structured format.

Analysis Requirements:
1. Extract required skills and technical requirements
2. Identify preferred qualifications
3. Determine experience level (Entry, Mid, Senior, etc.)
4. List key responsibilities
5. Extract company information and industry
6. Identify keywords for ATS optimization
7. Generate 3 concise prompt presets for resume revision
8. Provide a brief summary of key points to emphasize in the resume

Writing Style Guidelines for Prompt Presets:
${writingTone === 'concise' ? `
- Use direct, action-oriented language
- Focus on quantifiable achievements and metrics
- Keep prompts punchy and results-focused
- Emphasize impact and outcomes
- Use strong action verbs
- Example: "Make this more results-oriented with metrics"` : 
writingTone === 'technical' ? `
- Use precise technical terminology
- Focus on technical depth and complexity
- Emphasize system architecture and implementation
- Include specific technologies and methodologies
- Example: "Highlight the technical architecture and scalability"` : `
- Use clear, accessible language
- Focus on collaboration and community impact
- Emphasize stakeholder engagement
- Avoid technical jargon
- Example: "Emphasize community impact and stakeholder collaboration"`}

Your response must be in the following JSON format:
{
  "required_skills": ["skill1", "skill2", ...],
  "preferred_qualifications": ["qual1", "qual2", ...],
  "experience_level": "level",
  "key_responsibilities": ["resp1", "resp2", ...],
  "company_info": {
    "description": "company description",
    "industry": "industry"
  },
  "keywords": ["keyword1", "keyword2", ...],
  "prompt_presets": [
    {
      "title": "short descriptive title",
      "prompt": "concise prompt text"
    }
  ],
  "resume_emphasis": {
    "summary": "A brief, 2-3 sentence overview of what to emphasize in the resume",
    "key_points": [
      "First key point to emphasize",
      "Second key point to emphasize",
      "Third key point to emphasize"
    ]
  }
}

IMPORTANT:
- Be specific and detailed in your analysis
- Include both technical and soft skills
- Extract exact experience requirements
- List all major responsibilities
- Include industry-specific keywords
- Generate exactly 3 prompt presets that are:
  * Relevant to the job requirements
  * Concise and actionable
  * Focused on different aspects (e.g., technical skills, leadership, impact)
  * Clear and easy to understand
  * Written from the user's perspective, as if they're asking for the revision
  * Should use direct, first-person language
  * Should NOT use phrases like "revise my resume" or "update my resume" since they apply to single bullet points
  * Should use natural language that a user would use when asking for a revision
  * Should match the specified writing tone
  * If selected text is provided, tailor the prompts to be more specific to that text
- The resume_emphasis section should:
  * Provide a concise summary of what to emphasize in the resume
  * List 3-4 key points that are most important for this role
  * Focus on the most critical aspects that will make the resume stand out
  * Be specific to the role and company
- Format response as valid JSON only`;

    const messages = [
      { role: 'user', content: `Please analyze this job description${selectedText ? ' and selected text' : ''}:\n\nJob Description:\n${content}${selectedText ? `\n\nSelected Text to Tailor Prompts For:\n${selectedText}` : ''}` }
    ];
    
    console.log('Sending request to Claude for analysis...');
    console.log('System prompt length:', systemPrompt.length);
    console.log('Message content length:', messages[0].content.length);
    
    // Send to Claude for analysis
    const claudeResponse = await sendMessageToClaudeWithMCP(messages, [], systemPrompt);
    
    console.log('Received response from Claude');
    console.log('Response type:', typeof claudeResponse);
    console.log('Response content:', claudeResponse.content);
    
    if (!claudeResponse.content || claudeResponse.content.length === 0) {
      throw new Error('Empty response from Claude');
    }
    
    // Extract the JSON from Claude's response
    const responseText = claudeResponse.content[0].text;
    console.log('Raw response text:', responseText);
    
    // Find the JSON object in the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }
    
    const cleanedJson = jsonMatch[0]
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    console.log('Cleaned JSON:', cleanedJson);
    
    const analysis = JSON.parse(cleanedJson);
    console.log('Successfully parsed JSON response');
    
    // Return the requested analysis type or full analysis
    const results = analysisType === 'full_analysis' ? analysis : analysis[analysisType];
    
    console.log('Analysis results:', {
      analysisType,
      resultKeys: Object.keys(results),
      resultPreview: JSON.stringify(results).substring(0, 100) + '...'
    });
    
    console.log('=== Job Description Analysis Completed ===');
    
    res.json({
      fileName: 'job-description.txt',
      analysisType,
      results,
      message: `Completed ${analysisType} analysis of job description`
    });
  } catch (error) {
    console.error('Error in job description analysis:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: `Failed to analyze job description: ${error.message}`
    });
  }
});

module.exports = router;