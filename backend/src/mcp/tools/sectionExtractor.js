const { sendMessageToClaudeWithMCP } = require('../claudeService');

/**
 * Tool for extracting structured sections from resume content using LLM
 */
const sectionExtractorTool = {
  name: 'extract_resume_sections',
  description: 'Extract and structure resume content into standardized sections',
  parameters: {
    type: 'object',
    properties: {
      resumeContent: {
        type: 'string',
        description: 'The resume content to extract sections from'
      }
    },
    required: ['resumeContent']
  },
  handler: async ({ resumeContent }) => {
    try {
      console.log('Starting section extraction with content:', resumeContent.substring(0, 200) + '...');
      
      // Create a properly formatted messages array for Claude
      const messages = [
        {
          role: 'user',
          content: `You are a resume parsing expert. Your task is to analyze the provided resume content and extract it into standardized sections.
          
          Guidelines:
          - Identify and categorize content into these sections: Summary/Profile, Experience, Education, Skills
          - Preserve the original formatting and content within each section
          - Handle various resume formats and structures
          - If a section is not present, return an empty string for that section
          - Maintain bullet points, paragraphs, and other formatting
          
          Return the content in this exact JSON format:
          {
            "summary": { "content": "extracted summary text", "pendingRevision": null },
            "experience": { "content": "extracted experience text", "pendingRevision": null },
            "education": { "content": "extracted education text", "pendingRevision": null },
            "skills": { "content": "extracted skills text", "pendingRevision": null }
          }

          Here is the resume content to analyze:
          ${resumeContent}`
        }
      ];

      const response = await sendMessageToClaudeWithMCP(messages, []);
      console.log('Raw Claude response:', JSON.stringify(response, null, 2));
      
      if (!response || !response.content || response.content.length === 0) {
        throw new Error('No response from AI');
      }

      // Extract the JSON response from Claude's text
      const responseText = response.content[0].text;
      console.log('Claude response text:', responseText);
      
      // Find the JSON object in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error('No JSON object found in response');
        throw new Error('Could not parse AI response as JSON');
      }

      console.log('Found JSON match:', jsonMatch[0]);

      // Clean the JSON string by removing control characters and normalizing whitespace
      const cleanedJson = jsonMatch[0]
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      console.log('Cleaned JSON:', cleanedJson);

      try {
        const sections = JSON.parse(cleanedJson);
        console.log('Parsed sections:', JSON.stringify(sections, null, 2));
        
        // Validate the structure
        const requiredSections = ['summary', 'experience', 'education', 'skills'];
        for (const section of requiredSections) {
          if (!sections[section] || typeof sections[section] !== 'object') {
            console.log(`Section ${section} missing or invalid, creating empty section`);
            sections[section] = { content: '', pendingRevision: null };
          }
          // Ensure each section has the correct structure
          if (!sections[section].content) {
            console.log(`Section ${section} missing content, setting empty string`);
            sections[section].content = '';
          }
          if (!sections[section].pendingRevision) {
            sections[section].pendingRevision = null;
          }
        }

        console.log('Final validated sections:', JSON.stringify(sections, null, 2));
        return sections;
      } catch (parseError) {
        console.error('Error parsing cleaned JSON:', parseError);
        console.error('Cleaned JSON string:', cleanedJson);
        throw new Error('Failed to parse cleaned JSON response');
      }
    } catch (error) {
      console.error('Error extracting sections:', error);
      // Return empty sections on error
      return {
        summary: { content: '', pendingRevision: null },
        experience: { content: '', pendingRevision: null },
        education: { content: '', pendingRevision: null },
        skills: { content: '', pendingRevision: null }
      };
    }
  }
};

module.exports = sectionExtractorTool; 