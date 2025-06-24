/**
 * API Routes for Tailr, an AI resume assistant
 * 
 * This file defines the API endpoints for interacting with Tailr.
 */

const express = require('express');
const router = express.Router();
const { sendMessageToClaude, sendChatMessage, DEFAULT_SYSTEM_PROMPT } = require('../../services/claudeService');
const { extractPdfText, extractPdfMarkdown } = require('../../utils/pdfExtract');
const { extractJobDescription } = require('../../utils/jobScraper');
const { handleUpdateResumeContent, resumeStore } = require('../../services/toolHandlers');
const { generateEmbeddings } = require('../../services/embeddingService');
const { extractTextChunks, extractKeyResumeContent } = require('../../utils/resumeParser');
const puppeteer = require('puppeteer');
 
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
 * Calculates the cosine similarity between two vectors.
 * @param {number[]} vecA - The first vector.
 * @param {number[]} vecB - The second vector.
 * @returns {number} The cosine similarity score.
 */
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Start or continue a conversation with Claude
 */
router.post('/chat', async (req, res) => {
  try {
    const { conversationId, message, context } = req.body;
    
    console.log('Chat request received:', {
      conversationId,
      messageLength: message?.length,
      hasContext: !!context,
      contextContent: context ? {
        resumeLength: context.content?.resume?.length,
        jobDescriptionLength: context.content?.jobDescription?.length,
        analysisLength: context.content?.analysis?.length
      } : null
    });
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    // Store resume content in resumeStore if available
    if (context?.content?.resume) {
      resumeStore[conversationId] = context.content.resume;
      console.log('📝 Stored resume content in resumeStore:', {
        conversationId,
        contentLength: context.content.resume.length,
        hasContent: !!resumeStore[conversationId],
        contentPreview: context.content.resume.substring(0, 100) + '...'
      });
    } else {
      console.log('⚠️ No resume content in context for conversation:', conversationId);
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
    
    // Format messages for Claude
    const formattedMessages = conversations[conversationId].map(msg => ({
      role: msg.role === 'system' ? 'assistant' : msg.role,
      content: msg.content
    }));
    
    // Send to Claude using the new chat-specific method
    const claudeResponse = await sendChatMessage(formattedMessages, context);
    
    // Check for tool_use in Claude's response
    const toolUseBlock = claudeResponse.content && claudeResponse.content.find && claudeResponse.content.find(block => block.type === 'tool_use');
    
    if (claudeResponse.stop_reason === 'tool_use' && toolUseBlock) {
      console.log('🛠️ Tool use detected:', {
        toolName: toolUseBlock.name,
        toolId: toolUseBlock.id,
        input: toolUseBlock.input
      });

      // Execute the tool
      let toolResult;
      if (toolUseBlock.name === 'updateResumeContent') {
        toolResult = await handleUpdateResumeContent({
          conversationId,
          ...toolUseBlock.input
        });
      } else {
        toolResult = {
          success: false,
          summary: `Unknown tool: ${toolUseBlock.name}`,
          error: `Tool ${toolUseBlock.name} not implemented`
        };
      }

      // Prepare the assistant message with the tool_use block
      const toolUseAssistantMessage = {
        role: 'assistant',
        content: claudeResponse.content
      };

      // Prepare the tool_result message
      const toolResultMessage = {
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: toolUseBlock.id,
          content: JSON.stringify(toolResult)
        }]
      };

      // Continue the conversation with only the tool_use and tool_result messages
      const finalResponse = await sendChatMessage([
        toolUseAssistantMessage,
        toolResultMessage
      ], context);

      let responseText = '';
      if (finalResponse.content && finalResponse.content.length > 0) {
        if (finalResponse.content[0].type === 'text') {
          responseText = finalResponse.content[0].text;
        }
      }

      conversations[conversationId].push({
        role: 'assistant',
        content: responseText
      });

      // Handle tool response
      if (toolResult) {
        return res.json({ 
          response: responseText, 
          toolResponse: {
            ...toolResult,
            newHtml: toolResult.newHtml || resumeStore[conversationId]
          }
        });
      }
    }
    // Extract response text (no tool use)
    let responseText = '';
    if (claudeResponse.content && claudeResponse.content.length > 0) {
      if (claudeResponse.content[0].type === 'text') {
        responseText = claudeResponse.content[0].text;
      }
    }
    // Add Claude's response to conversation history
    conversations[conversationId].push({
      role: 'assistant',
      content: responseText
    });
    res.json({ response: responseText });
  } catch (error) {
    console.error('❌ Chat route error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

/**
 * Upload files for context
 */
router.post('/upload', async (req, res) => {
    try {
      const { conversationId, files } = req.body;
      
      // console.log('Backend: Received upload request');
      // console.log('Backend: Raw request body keys:', Object.keys(req.body));
      // console.log('Backend: Conversation ID:', conversationId);
      // console.log('Backend: Files array:', files);
      
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
            const claudeResponse = await sendMessageToClaude(messages, [], systemPrompt);
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
3. The revised text should be no longer than ~10% longer than the original text
4. Provide the revised bullet point

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
    const claudeResponse = await sendMessageToClaude(messages, [], systemPrompt);
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
    const systemPrompt = `You are an expert job description analyzer with deep knowledge of ATS (Applicant Tracking Systems) and how recruiters search for candidates. Your task is to analyze the provided job description and extract key information optimized for resume matching.
Analysis Requirements:
Core Analysis (keep your existing requirements)

Extract required skills and technical requirements
Identify preferred qualifications
Determine experience level (Entry, Mid, Senior, etc.)
List key responsibilities
Extract company information and industry
Provide resume emphasis guidance

ATS-Specific Enhancements (NEW)

Job Title Extraction: Extract the exact job title as it appears (most critical for ATS matching)
Keyword Categorization: Categorize keywords by importance and type
Exact Phrase Identification: Find multi-word phrases that should be matched exactly
Acronym Detection: Identify acronyms and their full forms
Experience Quantification: Extract specific experience requirements with numbers
Skill Variations: Identify common alternative terms for key skills

IMPORTANT Guidelines:

Be specific and detailed in your analysis
Include both technical and soft skills
Extract exact experience requirements with numbers
Prioritize keywords by recruiter search likelihood
Include industry-specific terminology
Identify exact phrases that commonly appear in ATS searches



Response Format:
json{
  "job_title": "exact job title from posting",
  "required_skills": ["skill1", "skill2", ...],
  "preferred_qualifications": ["qual1", "qual2", ...],
  "experience_level": "level",
  "key_responsibilities": ["resp1", "resp2", ...],
  "company_info": {
    "description": "company description",
    "industry": "industry"
  },
  "keywords_by_priority": {
    "critical": [
      {
        "term": "keyword",
        "category": "hard_skill|soft_skill|tool|certification|experience",
        "variations": ["alt1", "alt2"],
        "context": "where this appears in job description"
      }
    ],
    "important": [...],
    "nice_to_have": [...]
  },
  "exact_phrases": [
    "multi-word phrases that should match exactly",
    "full-stack development",
    "project management"
  ],
  "acronym_pairs": [
    {"short": "AWS", "long": "Amazon Web Services"},
    {"short": "API", "long": "Application Programming Interface"}
  ],
  "experience_requirements": [
    {
      "skill": "Python",
      "years": "3+",
      "requirement_type": "required|preferred"
    }
  ],
  "section_keywords": {
    "summary_emphasis": ["top 3-5 keywords for resume summary"],
    "skills_section": ["keywords that should appear in skills section"],
    "experience_bullets": ["keywords to weave into experience descriptions"]
  },
  "resume_emphasis": {
    "summary": "A brief, 2-3 sentence overview of what to emphasize in the resume",
    "key_points": [
      "First key point to emphasize",
      "Second key point to emphasize", 
      "Third key point to emphasize"
    ]
  }
}

For the required_skills, preferred_qualifications, key_responsibilities, and exact_phrases fields, ensure that items are ordered by importance to the job, with the most important one being first.

Key Focus Areas:
Prioritize by recruiter search patterns:

Job title (most critical - 10.6x interview likelihood)
Skills mentioned multiple times or in requirements section
Exact multi-word phrases that shouldn't be paraphrased
Both acronym and full forms of technical terms`;


    const messages = [
      { role: 'user', content: `Please analyze this job description${selectedText ? ' and selected text' : ''}:\n\nJob Description:\n${content}${selectedText ? `\n\nSelected Text to Tailor Prompts For:\n${selectedText}` : ''}` }
    ];
    
    console.log('Sending request to Claude for analysis...');
    console.log('System prompt length:', systemPrompt.length);
    console.log('Message content length:', messages[0].content.length);
    
    // Send to Claude for analysis
    const claudeResponse = await sendMessageToClaude(messages,systemPrompt);
    
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

/**
 * Generate quick revision prompts for a selected bullet point
 */
router.post('/generate-prompts', async (req, res) => {
  try {
    const { selectedText, jobDescription, writingTone = 'concise' } = req.body;
    if (!selectedText || !jobDescription) {
      return res.status(400).json({ error: 'Selected text and job description are required' });
    }

    // System prompt for Claude
    const systemPrompt = `You are an expert resume coach. Your task is to generate exactly 3 quick revision prompts that will help improve the selected text from the resume to better align with the job description.

Core Principles for Effective Resume Bullet Points:
1. Start with strong action verbs
2. Follow the WHAT-HOW-WHY structure
3. Quantify achievements ONLY when explicitly stated in the original text
4. Be specific and concrete, but NEVER invent details
5. Focus on accomplishments rather than responsibilities
6. Keep bullet points concise and relevant

CRITICAL RULES:
- NEVER invent or hallucinate metrics, numbers, or specific achievements
- ONLY use information that is explicitly stated in the original text
- Focus on improving the language, structure, and alignment while preserving the factual content
- Each prompt should be specific to the selected text and job description
- Prompts should be actionable, clear, and concise (no more than 1 sentence)
- Prompts should ALWAYS directive statements - this means they should be worded as if the user is being told what to do.
- Generate EXACTLY 3 prompts, no more and no less
- Each prompt should be unique and offer a different perspective on improving the text

Your response should be a JSON object with the following structure:
{
  "prompts": [
    {
      "title": "Short, clear title for the prompt",
      "prompt": "Detailed prompt that will guide the revision"
    }
  ]
}`;

    const messages = [
      {
        role: 'user',
        content: `Selected Text: ${selectedText}\n\nJob Description: ${jobDescription}\n\nWriting Tone: ${writingTone}`
      }
    ];

    const claudeResponse = await sendMessageToClaude(messages, [], systemPrompt);
    let prompts = [];

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
          prompts = parsedResponse.prompts.slice(0, 3);
          if (prompts.length !== 3) {
            throw new Error('Invalid number of prompts generated');
          }
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (error) {
        console.error('Error parsing Claude response:', error);
        throw new Error('Failed to parse prompts response');
      }
    }

    res.json({ prompts });
  } catch (error) {
    console.error('Error generating prompts:', error);
    res.status(500).json({ error: 'Failed to generate prompts' });
  }
});

/**
 * Scrape job description from a provided URL
 */
router.post('/scrape-job', async (req, res) => {
    try {
        const { url } = req.body;
        
        console.log('Received scrape request for URL:', url);
        
        if (!url) {
            console.log('Error: URL is missing from request body');
            return res.status(400).json({ error: 'URL is required' });
        }

        // Validate URL format
        let urlObj;
        try {
            urlObj = new URL(url);
            console.log('URL parsed successfully. Hostname:', urlObj.hostname);
        } catch (error) {
            console.log('Error: Invalid URL format:', error.message);
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        // Check if it's a supported job board URL
        const isGreenhouse = urlObj.hostname.includes('greenhouse.io');
        const isLever = urlObj.hostname.includes('lever.co');
        const isAshby = urlObj.hostname.includes('jobs.ashbyhq.com');
        const isJobvite = urlObj.hostname.includes('jobs.jobvite.com');
        
        console.log('URL type check:', {
            isGreenhouse,
            isLever,
            isAshby,
            isJobvite,
            hostname: urlObj.hostname
        });

        if (!isGreenhouse && !isLever && !isAshby && !isJobvite) {
            console.log('Error: Unsupported job board URL');
            return res.status(400).json({ error: 'Unsupported job board URL. Currently supporting Greenhouse, Lever, Ashby, and Jobvite.' });
        }

        console.log('Starting job description extraction...');
        const jobDescription = await extractJobDescription(url);
        
        if (!jobDescription) {
            console.log('Error: Could not extract job description');
            return res.status(404).json({ error: 'Could not extract job description from the provided URL' });
        }

        console.log('Successfully extracted job description. Length:', jobDescription.length);
        res.json({ jobDescription });
    } catch (error) {
        console.error('Error in scrape-job endpoint:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Error scraping job description: ' + error.message });
    }
});

/**
 * Convert PDF to HTML using Claude
 */
router.post('/pdf-to-html', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'PDF content is required' });
    }

    // Create system prompt for Claude
    const systemPrompt = `You are a document conversion specialist that transforms resume PDFs into semantic, AI-friendly HTML with perfect visual fidelity and structured data attributes.

Core Requirements:

CRITICAL: The html must be visually indistinguishable from the original PDF. 

1. Editable Elements
* Every editable element MUST have be generated in a way to make it easy for the AI to make targeted edits

2. Visual Fidelity
* Match original PDF EXACTLY:
  - Typography (font sizes, weights, styles)
  - Layout (spacing, alignment, indentation)
  - Colors (text, accents, borders)
  - Visual hierarchy
  - Non-text elements (lines, separators, etc)

3. Quality Checklist
Before finalizing, verify:
* Every editable element is generated in a way to make it easy for the AI to make targeted edits
* All content is properly grouped
* No duplicate IDs exist
* All required attributes are present

Process:
1. Analyze content structure
2. Generate html that is easy for the AI to make targeted edits
3. Validate all requirements

Output:
Deliver HTML that:
- Has unique, semantic identifiers
- Includes rich context for AI targeting
- Every single element must have a unique CSS selector
- Preserves original content
- Groups related information
- Maintains visual structure
- Has embedded CSS that is visually indistinguishable from the original PDF;`

    // Send to Claude with properly formatted message content
    const messages = [
      { 
        role: 'user', 
        content: [
          {
            type: 'text',
            text: 'Please convert this PDF document to semantic HTML while preserving its visual structure and formatting.'
          },
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: content
            }
          }
        ]
      }
    ];

    console.log('PDF to HTML: Sending request to Claude');
    console.log('PDF to HTML: Message content:', JSON.stringify(messages[0].content, null, 2));

    const claudeResponse = await sendMessageToClaude(messages, [], systemPrompt);
    
    if (!claudeResponse.content || claudeResponse.content.length === 0) {
      throw new Error('No response from Claude');
    }

    // Extract HTML from Claude's response
    const html = claudeResponse.content[0].text;

    // Set proper headers for HTML content
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Send the HTML response
    res.send(html);
  } catch (error) {
    console.error('Error converting PDF to HTML:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/export-pdf', async (req, res) => {
  try {
    const { htmlContent } = req.body;

    if (!htmlContent) {
      return res.status(400).json({ error: 'htmlContent is required' });
    }

    console.log('Received HTML for PDF export:', htmlContent);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    });

    const { width, height } = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const width = Math.max(
        body.scrollWidth,
        body.offsetWidth,
        html.clientWidth,
        html.scrollWidth,
        html.offsetWidth
      );
      const height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      );
      return { width, height };
    });

    const pdfBuffer = await page.pdf({
      width: `${width}px`,
      height: `${height}px`,
      printBackground: true,
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

module.exports = router;

/**
 * Analyze similarity between job requirements and resume content.
 */
router.post('/analyze-similarity', async (req, res) => {
  try {
    const { jobRequirements, resumeHtml } = req.body;

    if (!jobRequirements || !resumeHtml) {
      return res.status(400).json({ error: 'jobRequirements and resumeHtml are required.' });
    }

    // 1. Extract text from job requirements and resume for both analyses
    const requirementTexts = [
      ...jobRequirements.required_skills,
      ...jobRequirements.preferred_qualifications,
      ...jobRequirements.key_responsibilities,
      ...(jobRequirements.exact_phrases || []),
    ].filter(text => text && text.trim() !== '');

    const allResumeTexts = extractTextChunks(resumeHtml);
    const keyResumeTexts = extractKeyResumeContent(resumeHtml);

    if (requirementTexts.length === 0) {
      return res.status(400).json({ error: 'Could not extract text from job requirements.' });
    }

    // 2. Generate embeddings for all text sets
    const [requirementEmbeddings, allResumeEmbeddings, keyResumeEmbeddings] = await Promise.all([
      generateEmbeddings(requirementTexts),
      generateEmbeddings(allResumeTexts),
      generateEmbeddings(keyResumeTexts),
    ]);

    // 3. Perform Requirement Coverage analysis (existing logic)
    const requirementCoverage = [];
    requirementTexts.forEach((reqText, reqIndex) => {
      let bestMatch = { score: -1, resume_chunk: null };
      allResumeTexts.forEach((resumeText, resumeIndex) => {
        const score = cosineSimilarity(requirementEmbeddings[reqIndex], allResumeEmbeddings[resumeIndex]);
        if (score > bestMatch.score) {
          bestMatch = { score, resume_chunk: resumeText };
        }
      });
      requirementCoverage.push({
        requirement: reqText,
        best_match: bestMatch.resume_chunk,
        score: bestMatch.score,
      });
    });

    // 4. Perform Resume Coverage analysis (new logic)
    const resumeCoverage = [];
    keyResumeTexts.forEach((resumeText, resumeIndex) => {
      let bestMatchForChunk = { score: -1, requirement: null };
      requirementTexts.forEach((reqText, reqIndex) => {
        const score = cosineSimilarity(keyResumeEmbeddings[resumeIndex], requirementEmbeddings[reqIndex]);
        if (score > bestMatchForChunk.score) {
          bestMatchForChunk = { score, requirement: reqText };
        }
      });
      resumeCoverage.push({
        resume_chunk: resumeText,
        best_match: bestMatchForChunk.requirement,
        score: bestMatchForChunk.score,
      });
    });

    // 5. Sort results
    requirementCoverage.sort((a, b) => b.score - a.score);
    resumeCoverage.sort((a, b) => b.score - a.score);

    res.json({
      message: 'Similarity analysis completed successfully.',
      analysis: {
        requirementCoverage,
        resumeCoverage, // Changed from unalignedContent
      },
    });

  } catch (error) {
    console.error('Error in similarity analysis endpoint:', error);
    res.status(500).json({ error: `Failed to analyze similarity: ${error.message}` });
  }
});
