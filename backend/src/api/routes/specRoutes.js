/**
 * API Routes for Spec Generation
 * 
 * This file defines the API endpoints for interacting with the
 * AI Spec Assistant, using Claude with MCP.
 */

const express = require('express');
const router = express.Router();
const { sendMessageToClaudeWithMCP } = require('../../mcp/claudeService');
const { extractPdfText, extractPdfMarkdown, extractPdfHtml } = require('../../../utils/pdfExtract');
const { parseResumeWithAffinda, affindaResumeToMarkdown } = require('../../../utils/affindaResume');
const sectionExtractorTool = require('../../mcp/tools/sectionExtractor');
const AFFINDA_API_KEY = process.env.AFFINDA_API_KEY;

// Simple in-memory storage for conversation history and files
// In production, use a database
const conversations = {};
const uploadedFiles = {};

/**
 * Start or continue a conversation with AI Resume Assistant
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
        console.log('Backend Chat: Files available, adding resume-focused context');
        
        // Extract resume-related keywords from the user's message
        const messageWords = message.toLowerCase().split(/\s+/);
        const searchQueries = [];
        
        // Resume-specific search terms
        if (messageWords.some(word => ['resume', 'cv', 'experience', 'work'].includes(word))) {
          searchQueries.push('work experience');
          searchQueries.push('experience');
          searchQueries.push('employment');
        }
        if (messageWords.some(word => ['job', 'position', 'role', 'posting'].includes(word))) {
          searchQueries.push('job requirements');
          searchQueries.push('qualifications');
          searchQueries.push('responsibilities');
        }
        if (messageWords.some(word => ['skills', 'technical', 'abilities'].includes(word))) {
          searchQueries.push('skills');
          searchQueries.push('technical skills');
          searchQueries.push('capabilities');
        }
        if (messageWords.some(word => ['education', 'degree', 'certification'].includes(word))) {
          searchQueries.push('education');
          searchQueries.push('degree');
          searchQueries.push('certification');
        }
        if (messageWords.some(word => ['create', 'generate', 'write', 'build'].includes(word))) {
          searchQueries.push('resume');
          searchQueries.push('experience');
          searchQueries.push('skills');
        }
        
        // If no specific queries, use generic resume terms
        if (searchQueries.length === 0) {
          searchQueries.push(message);
          searchQueries.push('experience');
          searchQueries.push('skills');
        }
        
        // Try multiple search queries until we find results
        const { searchContext } = require('../../tools/toolHandlers');
        let allResults = [];
        
        for (const query of searchQueries) {
          console.log(`Backend Chat: Searching with query: "${query}"`);
          const searchResult = await searchContext({ query, maxResults: 3 }, { files: conversationFiles });
          
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
            `From "${r.source}":\n${r.content}`
          ).join('\n\n---\n\n');
          
          finalMessage = `${message}
  
  CONTEXT FROM UPLOADED FILES:
  ${contextInfo}
  
  Please use this context to create professional, ATS-friendly resume content that matches the requirements and highlights relevant experience.`;
          
          contextAdded = true;
          console.log('Backend Chat: Enhanced message with resume context created');
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
/**
 * Upload files for context
 */
/**
 * Upload files for context
 */
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
        // Check for useClaude flag (query param or fileData)
        const useClaude = fileData.useClaude || req.query.useClaude;
        if (
          fileData.isPdf ||
          fileData.type === 'application/pdf' ||
          fileData.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
          try {
            if (useClaude) {
              // New flow: extract raw text and send to Claude
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
            } else {
              // Existing Affinda flow
              const buffer = Buffer.from(fileData.content, 'base64');
              console.log(`Backend: Sending file to Affinda: ${fileData.name}, type: ${fileData.type}`);
              const affindaData = await parseResumeWithAffinda(buffer, fileData.name, AFFINDA_API_KEY);
              console.log('Backend: Affinda full response:', JSON.stringify(affindaData, null, 2));
              console.log('Backend: Affinda skills array:', JSON.stringify(affindaData.skills, null, 2));

              // Structure the data for the frontend
              const structuredData = {
                metadata: {
                  name: affindaData.name?.formatted || '',
                  email: affindaData.emails?.[0] || '',
                  phone: affindaData.phoneNumbers?.[0] || '',
                  location: affindaData.location?.formatted || ''
                },
                sections: []
              };

              // Add personal details section at the top
              const personalDetailsSection = affindaData.sections?.find(section => 
                section.sectionType === 'PersonalDetails'
              );

              if (personalDetailsSection) {
                structuredData.sections.push({
                  id: 'personal-details',
                  title: 'Personal Details',
                  content: personalDetailsSection.text,
                  type: 'text'
                });
              }

              // Add summary if available
              if (affindaData.summary) {
                structuredData.sections.push({
                  id: 'summary',
                  title: 'Summary',
                  content: affindaData.summary,
                  type: 'text'
                });
              }

              // Add work experience if available
              if (affindaData.workExperience?.length > 0) {
                structuredData.sections.push({
                  id: 'experience',
                  title: 'Experience',
                  items: affindaData.workExperience.map(exp => {
                    // Extract only bullet points from jobDescription
                    let bullets = [];
                    if (exp.jobDescription) {
                      const lines = exp.jobDescription.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
                      // Find bullet lines
                      bullets = lines.filter(line => /^[-•*]\s*/.test(line)).map(line => line.replace(/^[-•*]\s*/, ''));
                      // If no bullets found, treat each line as a bullet
                      if (bullets.length === 0) {
                        bullets = lines;
                      }
                    }
                    return {
                      id: `exp-${exp.id}`,
                      title: exp.jobTitle,
                      company: exp.organization,
                      location: exp.location?.formatted || '',
                      dates: `${exp.dates?.startDate || ''} - ${exp.dates?.endDate || 'Present'}`,
                      bullets,
                      type: 'experience'
                    };
                  }),
                  type: 'list'
                });
              }

              // Process all sections from Affinda
              if (affindaData.sections) {
                affindaData.sections.forEach(section => {
                  // Skip sections we've already handled (summary, experience, and personal details)
                  if (section.sectionType === 'Summary' || 
                      section.sectionType === 'WorkExperience' || 
                      section.sectionType === 'PersonalDetails') {
                    return;
                  }

                  // For education section
                  if (section.sectionType === 'Education' && affindaData.education?.length > 0) {
                    structuredData.sections.push({
                      id: 'education',
                      title: 'Education',
                      items: affindaData.education.map(edu => ({
                        id: `edu-${edu.id}`,
                        degree: edu.accreditation?.education,
                        institution: edu.organization,
                        dates: edu.dates?.completionDate || '',
                        content: section.text, // Use the raw text from the section
                        type: 'education'
                      })),
                      type: 'list'
                    });
                    return;
                  }

                  // For skills section, clean the formatting while preserving content
                  if (section.sectionType === 'Skills' && affindaData.skills?.length > 0) {
                    // Clean each skill by removing special characters and extra formatting
                    const cleanedSkills = affindaData.skills.map(skill => {
                      // Remove special characters and extra formatting while preserving the actual skill text
                      return skill.name
                        .replace(/[•|\-–—]/g, '') // Remove bullets, pipes, and dashes
                        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                        .trim(); // Remove leading/trailing whitespace
                    })
                    .filter(skill => skill.length > 0) // Remove any empty skills
                    .filter((skill, index, self) => self.indexOf(skill) === index); // Remove duplicates

                    // Join skills with bullet points, ensuring no extra spaces
                    const formattedSkills = cleanedSkills
                      .map(skill => skill.trim())
                      .filter(skill => skill) // Remove any empty strings
                      .join(' • ');

                    structuredData.sections.push({
                      id: 'skills',
                      title: 'Skills',
                      content: formattedSkills,
                      type: 'text'
                    });
                    return;
                  }

                  // For all other sections, use the raw text
                  structuredData.sections.push({
                    id: section.sectionType.toLowerCase(),
                    title: section.sectionType,
                    content: section.text,
                    type: 'text'
                  });
                });
              }

              console.log('Backend: Structured data for frontend:', JSON.stringify(structuredData, null, 2));
              fileContent = JSON.stringify(structuredData);
              console.log('Backend: Final fileContent length:', fileContent.length);
              console.log('Backend: Final fileContent preview:', fileContent.substring(0, 200) + '...');
              console.log('Backend: Final fileContent is valid JSON:', (() => {
                try {
                  JSON.parse(fileContent);
                  return true;
                } catch (e) {
                  return false;
                }
              })());
            }
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
          contentLength: f.content ? f.content.length : 0,
          isJson: f.content ? f.content.startsWith('{') : false
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
        firstFileContentPreview: response.files[0]?.content?.substring(0, 200) + '...',
        firstFileContentIsJson: response.files[0]?.content?.startsWith('{')
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
    const { selectedText, jobDescription, userInstructions } = req.body;
    if (!selectedText || !jobDescription) {
      return res.status(400).json({ error: 'selectedText and jobDescription are required.' });
    }
    const systemPrompt = `You are a resume bullet point formatter operating in STRICT OUTPUT MODE.

OUTPUT FORMAT REQUIREMENT: 
Your response must preserve ALL original markdown formatting from the selected text.

CRITICAL INSTRUCTIONS:
1. DO NOT add any NEW markdown formatting
2. NO headers, titles, notes, explanations, or comments
3. NO multiple lines or line breaks
4. PRESERVE all original markdown formatting from the selected text
5. ONLY modify the text between <<< and >>> delimiters
6. DO NOT add information not present in the original text
7. DO NOT modify facts, numbers, or achievements
8. ONLY revise the wording using the job description for context
9. DO NOT output ANYTHING else - no resume sections, no contact info, no education, no skills
10. DO NOT create new bullet points or achievements
11. DO NOT add dates, locations, or company names


STRICT ANTI-HALLUCINATION RULE:
- DO NOT invent new achievements, metrics, or details
- DO NOT change any numerical values present in the original text
- DO NOT add information that wasn't in the original text
- ONLY use factual information contained within the delimiters and other context provided
- DO NOT create new sections or content
- DO NOT add contact information or personal details
- DO NOT add education or skills sections
- DO NOT add any content outside the delimited text

VERIFICATION STEP:
Before submitting, confirm your response contains:
1. Preserves all original markdown formatting
2. No explanations or additional text
3. No headers or section titles
4. No contact information
5. No education or skills sections
6. No dates or locations
7. No company names
11. No NEW markdown formatting

Selected Text to Revise:
<<<
${selectedText}
>>>

All information outside the delimiters (job description, full resume, etc.) is CONTEXT ONLY to help improve the revision of the text within the delimiters.`;

    let userContent = `Selected Text:\n<<<\n${selectedText}\n>>>\nJob Description: ${jobDescription}`;
    if (userInstructions) {
      userContent += `\nUser Instructions: ${userInstructions}`;
    }
    // Include the full resume content as context
    const resumeContent = req.body.resumeContent || '';
    userContent += `\nFull Resume Content: ${resumeContent}`;
    userContent += `\n\nRemember: Output ONLY the revised text, and nothing else.`;
    const messages = [
      { role: 'user', content: userContent }
    ];
    const claudeResponse = await sendMessageToClaudeWithMCP(messages, [], systemPrompt);
    let revisedText = '';
    if (claudeResponse.content && claudeResponse.content.length > 0 && claudeResponse.content[0].type === 'text') {
      revisedText = claudeResponse.content[0].text.trim();
      
      // Validate the response format
      // if (!revisedText.startsWith('* ')) {
      //   console.error('Invalid response format - does not start with asterisk:', revisedText);
      //   revisedText = `* ${revisedText.replace(/^[*\s]+/, '')}`;
      // }
      
      // Only remove line breaks and normalize spaces, preserve other markdown
      revisedText = revisedText
        .replace(/\n/g, ' ') // Remove line breaks
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
      
      // // Ensure it starts with an asterisk
      // if (!revisedText.startsWith('*')) {
      //   revisedText = `* ${revisedText}`;
      // }
      
      // // Ensure it's a single line
      // revisedText = revisedText.split('\n')[0];
    }
    console.log('Backend /revise: Claude response:', claudeResponse);
    console.log('Backend /revise: revisedText:', revisedText);
    console.log('CLAUDES REVISION:', revisedText);
    res.json({ revisedText });
  } catch (error) {
    console.error('Backend: Error in /revise endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;