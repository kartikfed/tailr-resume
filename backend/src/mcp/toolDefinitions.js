/**
 * MCP Tool Definitions for AI Spec Assistant
 * 
 * This file defines the tools that Claude can use through Model Context Protocol.
 * Each tool has a name, description, and parameters schema.
 */

// Tool definitions to be provided to Claude in MCP format
const toolDefinitions = [
    {
      // Tool for searching through context documents uploaded by the user
      name: "searchContext",
      description: "Search through uploaded documents to find relevant information for creating a product spec",
      input_schema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find relevant information in uploaded documents"
          },
          maxResults: {
            type: "integer",
            description: "Maximum number of relevant passages to return",
            default: 3
          }
        },
        required: ["query"]
      }
    },
    {
      // Tool for generating structured PRD sections
      name: "generatePRDSection",
      description: "Generate a specific section of a PRD based on user requirements",
      input_schema: {
        type: "object",
        properties: {
          sectionType: {
            type: "string",
            description: "The type of PRD section to generate",
            enum: [
              "problem_statement", 
              "user_stories", 
              "requirements", 
              "success_metrics", 
              "user_flow",
              "technical_considerations"
            ]
          },
          context: {
            type: "string",
            description: "Specific context or requirements for this section"
          }
        },
        required: ["sectionType", "context"]
      }
    },
    {
      // Tool for analyzing uploaded files to extract relevant information
      name: "analyzeFile",
      description: "Extract and summarize key information from an uploaded file",
      input_schema: {
        type: "object",
        properties: {
          fileId: {
            type: "string",
            description: "ID of the file to analyze"
          },
          analysisType: {
            type: "string",
            description: "Type of analysis to perform",
            enum: ["summary", "requirements", "stakeholders", "dependencies"]
          }
        },
        required: ["fileId", "analysisType"]
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