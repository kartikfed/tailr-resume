/**
 * MCP Tool Definitions for Tailr
 * 
 * This file defines the tools that Claude can use through Model Context Protocol
 * for resume creation and optimization.
 */

// Tool definitions for resume assistance
const toolDefinitions = [
    {
      // Tool for searching through uploaded documents (resumes, job descriptions, etc.)
      name: "searchContext",
      description: "Search through uploaded documents to find relevant experience, skills, achievements, or requirements. Use this when you need to find specific information from uploaded resumes, job descriptions, or other career documents.",
      input_schema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find relevant information (e.g., 'software engineering experience', 'leadership skills', 'required qualifications', 'Python programming')"
          },
          maxResults: {
            type: "integer",
            description: "Maximum number of relevant passages to return",
            default: 5
          }
        },
        required: ["query"]
      }
    },
    {
      // Tool for generating specific resume sections
      name: "generateResumeSection",
      description: "Generate specific sections of a resume based on user experience and job requirements. Use this to create tailored resume content.",
      input_schema: {
        type: "object",
        properties: {
          sectionType: {
            type: "string",
            description: "The type of resume section to generate",
            enum: [
              "professional_summary",
              "work_experience", 
              "skills",
              "education",
              "projects",
              "certifications",
              "achievements",
              "volunteer_experience"
            ]
          },
          context: {
            type: "string",
            description: "Specific context or requirements for this section (e.g., job role, years of experience, key skills to highlight)"
          },
          tone: {
            type: "string",
            description: "Tone and style for the section",
            enum: ["professional", "technical", "creative", "leadership-focused"],
            default: "professional"
          }
        },
        required: ["sectionType", "context"]
      }
    },
    {
      // Tool for optimizing content for ATS
      name: "optimizeForATS",
      description: "Analyze and optimize resume content for Applicant Tracking Systems (ATS). Use this to ensure the resume will pass through ATS filters.",
      input_schema: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "Resume content to optimize for ATS"
          },
          jobKeywords: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Important keywords from the job description that should be included"
          },
          optimizationType: {
            type: "string",
            description: "Type of ATS optimization to perform",
            enum: ["keyword_density", "formatting_check", "section_order", "skills_matching", "full_optimization"],
            default: "full_optimization"
          }
        },
        required: ["content"]
      }
    }
  ];
  
  // Format tools in the structure expected by the Anthropic API
  const formatToolsForMCP = () => {
    return toolDefinitions.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema
    }));
  };
  
  module.exports = {
    toolDefinitions,
    formatToolsForMCP
  };