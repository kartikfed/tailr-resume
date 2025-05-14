/**
 * MCP Tool Handlers
 * 
 * This file implements the actual functionality for each tool
 * that Claude can call through MCP.
 */

// In a production application, these would connect to actual services
// For now, we're implementing simplified versions for the MVP

/**
 * Search through uploaded context documents
 * @param {Object} input - Tool input parameters
 * @param {Object} context - Additional context like files
 * @returns {Object} - Search results
 */
async function searchContext(input, context) {
    const { query, maxResults = 3 } = input;
    const { files = [] } = context;
    
    console.log(`Searching context with query: "${query}" in ${files.length} files`);
    console.log(`Files available: ${files.map(f => f.name).join(', ')}`);
    
    if (files.length === 0) {
      return {
        results: [],
        message: "No context files available to search"
      };
    }
    
    // Search through file content with multiple strategies
    const results = [];
    
    for (const file of files) {
      console.log(`Examining file: ${file.name}, has content: ${Boolean(file.content)}`);
      
      if (file.content) {
        const lowerContent = file.content.toLowerCase();
        const lowerQuery = query.toLowerCase();
        
        // Strategy 1: Exact phrase match
        if (lowerContent.includes(lowerQuery)) {
          const matchIndex = lowerContent.indexOf(lowerQuery);
          const start = Math.max(0, matchIndex - 100);
          const end = Math.min(file.content.length, matchIndex + query.length + 100);
          const snippet = file.content.substring(start, end);
          
          results.push({
            source: file.name,
            content: snippet,
            fileId: file.id,
            matchType: 'exact'
          });
          
          console.log(`Found exact match in file: ${file.name}`);
          continue;
        }
        
        // Strategy 2: Individual word matches
        const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 2);
        const matchedWords = queryWords.filter(word => lowerContent.includes(word));
        
        if (matchedWords.length > 0) {
          // Find the best section that contains the most matched words
          const sentences = file.content.split(/[.!?]+/);
          let bestSentence = '';
          let maxMatches = 0;
          
          for (const sentence of sentences) {
            const sentenceLower = sentence.toLowerCase();
            const matches = matchedWords.filter(word => sentenceLower.includes(word)).length;
            if (matches > maxMatches) {
              maxMatches = matches;
              bestSentence = sentence.trim();
            }
          }
          
          if (bestSentence) {
            results.push({
              source: file.name,
              content: bestSentence,
              fileId: file.id,
              matchType: 'partial',
              wordsMatched: matchedWords.length,
              totalWords: queryWords.length
            });
            
            console.log(`Found partial match in file: ${file.name} (${matchedWords.length}/${queryWords.length} words)`);
          }
        }
      } else {
        console.log(`File ${file.name} has no content to search`);
      }
    }
    
    // Sort results by relevance (exact matches first, then by number of word matches)
    results.sort((a, b) => {
      if (a.matchType === 'exact' && b.matchType !== 'exact') return -1;
      if (a.matchType !== 'exact' && b.matchType === 'exact') return 1;
      if (a.wordsMatched && b.wordsMatched) return b.wordsMatched - a.wordsMatched;
      return 0;
    });
    
    console.log(`Search results: ${results.length} matches found`);
    
    return {
      results: results.slice(0, maxResults),
      totalFound: results.length,
      filesSearched: files.length,
      message: results.length > 0 
        ? `Found ${results.length} relevant passages in uploaded files` 
        : "No relevant information found in uploaded files for this query"
    };
  }
  
  /**
   * Generate a specific section of a PRD
   * @param {Object} input - Tool input parameters
   * @param {Object} context - Additional context
   * @returns {Object} - Generated PRD section
   */
  async function generatePRDSection(input, context) {
    const { sectionType, context: sectionContext } = input;
    
    console.log(`Generating PRD section: ${sectionType}`);
    
    // Each section type has a specific structure and content guidance
    const sectionTemplates = {
      problem_statement: {
        title: "Problem Statement",
        description: "Clear description of the problem this feature solves",
        guidance: "Focus on user pain points and business impact"
      },
      user_stories: {
        title: "User Stories",
        description: "User-focused scenarios describing how the feature will be used",
        guidance: "Use format: 'As a [user type], I want to [action] so that [benefit]'"
      },
      requirements: {
        title: "Requirements",
        description: "Specific, measurable requirements for the feature",
        guidance: "Categorize as functional, non-functional, and technical requirements"
      },
      success_metrics: {
        title: "Success Metrics",
        description: "How success will be measured for this feature",
        guidance: "Include both qualitative and quantitative metrics"
      },
      user_flow: {
        title: "User Flow",
        description: "Step-by-step description of how users will interact with the feature",
        guidance: "Include key screens, actions, and decision points"
      },
      technical_considerations: {
        title: "Technical Considerations",
        description: "Technical aspects that need to be addressed",
        guidance: "Include dependencies, constraints, and implementation notes"
      }
    };
    
    const template = sectionTemplates[sectionType];
    
    if (!template) {
      return {
        error: `Unknown section type: ${sectionType}`
      };
    }
    
    // In a real implementation, this would be more sophisticated
    // For now, we return the template with guidance for Claude
    return {
      sectionType,
      template,
      contextProvided: sectionContext,
      message: `Generated template for ${template.title} section`
    };
  }
  
  /**
   * Analyze an uploaded file
   * @param {Object} input - Tool input parameters
   * @param {Object} context - Additional context including files
   * @returns {Object} - Analysis results
   */
  async function analyzeFile(input, context) {
    const { fileId, analysisType } = input;
    const { files = [] } = context;
    
    console.log(`Analyzing file ${fileId} for ${analysisType}`);
    
    // In a real implementation, this would access the actual file
    // For now, we return mock analysis results
    
    // Find the file by ID
    const file = files.find(f => f.id === fileId);
    
    if (!file) {
      return {
        error: `File with ID ${fileId} not found`
      };
    }
    
    // Mock analysis results based on analysis type
    const analysisResults = {
      summary: {
        title: "File Summary",
        content: `This file contains information about ${file.name}. It includes sections on features, requirements, and implementation details.`
      },
      requirements: {
        title: "Extracted Requirements",
        items: [
          "The system must support PDF export with customizable headers and footers",
          "PDF exports should maintain all formatting from the original data",
          "Users should be able to set default export settings"
        ]
      },
      stakeholders: {
        title: "Identified Stakeholders",
        items: [
          "Product team: Responsible for feature definition",
          "Engineering: Responsible for implementation",
          "Customer Success: Will need to update documentation"
        ]
      },
      dependencies: {
        title: "Identified Dependencies",
        items: [
          "Requires ReportEngine library integration",
          "Depends on the authentication service for user preferences",
          "Will need updates to the frontend UI components"
        ]
      }
    };
    
    const result = analysisResults[analysisType];
    
    if (!result) {
      return {
        error: `Unknown analysis type: ${analysisType}`
      };
    }
    
    return {
      fileId,
      fileName: file.name,
      analysisType,
      results: result,
      message: `Completed ${analysisType} analysis for ${file.name}`
    };
  }
  
  // Export all tool handlers
  module.exports = {
    searchContext,
    generatePRDSection,
    analyzeFile
  };