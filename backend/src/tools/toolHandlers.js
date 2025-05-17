/**
 * Resume-focused MCP Tool Handlers
 * 
 * This file implements the functionality for each resume-related tool
 * that Claude can call through MCP.
 */

const { sendMessageToClaudeWithMCP } = require('../mcp/claudeService');

/**
 * Search through uploaded context documents for resume-related content
 * @param {Object} input - Tool input parameters
 * @param {Object} context - Additional context like files
 * @returns {Object} - Search results
 */
async function searchContext(input, context) {
    const { query, maxResults = 5 } = input;
    const { files = [] } = context;
    
    console.log(`Searching context with query: "${query}" in ${files.length} files`);
    console.log(`Files available: ${files.map(f => f.name).join(', ')}`);
    
    if (files.length === 0) {
      return {
        results: [],
        message: "No files available to search"
      };
    }
    
    // Search through file content with resume-specific strategies
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
        
        // Strategy 2: Resume-specific keyword matching
        const resumeKeywords = extractResumeKeywords(query);
        const matchedKeywords = resumeKeywords.filter(keyword => 
          lowerContent.includes(keyword.toLowerCase())
        );
        
        if (matchedKeywords.length > 0) {
          // Find sections containing these keywords
          const sections = file.content.split(/\n\s*\n/);
          let bestSection = '';
          let maxMatches = 0;
          
          for (const section of sections) {
            const sectionLower = section.toLowerCase();
            const matches = matchedKeywords.filter(keyword => 
              sectionLower.includes(keyword.toLowerCase())
            ).length;
            
            if (matches > maxMatches) {
              maxMatches = matches;
              bestSection = section.trim();
            }
          }
          
          if (bestSection) {
            results.push({
              source: file.name,
              content: bestSection,
              fileId: file.id,
              matchType: 'keyword',
              matchedKeywords: matchedKeywords,
              keywordCount: maxMatches
            });
            
            console.log(`Found keyword matches in file: ${file.name} (${maxMatches} keywords)`);
          }
        }
      }
    }
    
    // Sort results by relevance
    results.sort((a, b) => {
      if (a.matchType === 'exact' && b.matchType !== 'exact') return -1;
      if (a.matchType !== 'exact' && b.matchType === 'exact') return 1;
      if (a.keywordCount && b.keywordCount) return b.keywordCount - a.keywordCount;
      return 0;
    });
    
    console.log(`Search results: ${results.length} matches found`);
    
    return {
      results: results.slice(0, maxResults),
      totalFound: results.length,
      filesSearched: files.length,
      message: results.length > 0 
        ? `Found ${results.length} relevant passages for resume content` 
        : "No relevant information found for this query"
    };
  }
  
  /**
   * Generate specific resume sections
   * @param {Object} input - Tool input parameters
   * @param {Object} context - Additional context
   * @returns {Object} - Generated section
   */
  async function generateResumeSection(input, context) {
    const { sectionType, context: sectionContext, tone = 'professional' } = input;
    
    console.log(`Generating resume section: ${sectionType} with tone: ${tone}`);
    
    // Resume section templates and guidance
    const sectionTemplates = {
      professional_summary: {
        title: "Professional Summary",
        description: "A compelling 2-3 sentence overview highlighting key qualifications and value proposition",
        guidance: "Focus on years of experience, key skills, and what you bring to the role",
        format: "paragraph"
      },
      work_experience: {
        title: "Work Experience",
        description: "Detailed work history with achievements and quantifiable results",
        guidance: "Use action verbs, include metrics and achievements, show career progression",
        format: "bullet_points"
      },
      skills: {
        title: "Skills",
        description: "Technical and soft skills relevant to the target role",
        guidance: "Categorize skills (Technical, Leadership, etc.), match job requirements",
        format: "categorized_list"
      },
      education: {
        title: "Education",
        description: "Educational background, degrees, certifications",
        guidance: "Include degree, institution, year, relevant coursework if recent graduate",
        format: "structured_list"
      },
      projects: {
        title: "Projects",
        description: "Relevant projects showcasing skills and achievements",
        guidance: "Focus on impact, technologies used, and measurable outcomes",
        format: "bullet_points"
      },
      certifications: {
        title: "Certifications",
        description: "Professional certifications and credentials",
        guidance: "Include certification name, issuing organization, year obtained",
        format: "structured_list"
      },
      achievements: {
        title: "Key Achievements",
        description: "Notable accomplishments and recognition",
        guidance: "Use quantifiable metrics, focus on impact and results",
        format: "bullet_points"
      },
      volunteer_experience: {
        title: "Volunteer Experience",
        description: "Community involvement and volunteer work",
        guidance: "Highlight leadership and skills developed through volunteer work",
        format: "bullet_points"
      }
    };
    
    const template = sectionTemplates[sectionType];
    
    if (!template) {
      return {
        error: `Unknown resume section type: ${sectionType}`
      };
    }
    
    return {
      sectionType,
      template,
      context: sectionContext,
      tone,
      message: `Generated template guidance for ${template.title} section`
    };
  }
  
  /**
   * Optimize content for ATS systems
   * @param {Object} input - Tool input parameters
   * @param {Object} context - Additional context
   * @returns {Object} - Optimization suggestions
   */
  async function optimizeForATS(input, context) {
    const { content, jobKeywords = [], optimizationType = 'full_optimization' } = input;
    
    console.log(`Optimizing content for ATS: ${optimizationType}`);
    
    const optimization = performATSOptimization(content, jobKeywords, optimizationType);
    
    return {
      optimizationType,
      originalContent: content,
      suggestions: optimization.suggestions,
      score: optimization.score,
      keywordAnalysis: optimization.keywords,
      message: `ATS optimization complete with score: ${optimization.score}/100`
    };
  }
  
  // Helper functions
  
  function extractResumeKeywords(query) {
    // Extract meaningful keywords from the query for resume searching
    const commonWords = ['and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'for', 'with', 'by'];
    const words = query.toLowerCase().split(/\s+/);
    return words.filter(word => 
      word.length > 2 && !commonWords.includes(word)
    );
  }
  
  function performJobAnalysis(content, analysisType) {
    // Simplified job analysis - in production, this would be more sophisticated
    const analysis = {
      full_analysis: {
        required_skills: extractSkills(content, 'required'),
        preferred_qualifications: extractSkills(content, 'preferred'),
        experience_level: extractExperienceLevel(content),
        key_responsibilities: extractResponsibilities(content),
        company_info: extractCompanyInfo(content)
      },
      required_skills: extractSkills(content, 'required'),
      preferred_qualifications: extractSkills(content, 'preferred'),
      keywords: extractATSKeywords(content),
      experience_level: extractExperienceLevel(content),
      responsibilities: extractResponsibilities(content)
    };
    
    return analysis[analysisType] || analysis.full_analysis;
  }
  
  function extractSkills(content, type) {
    // Simple skill extraction - look for common patterns
    const skillPatterns = {
      required: /required.*?(?:skills|qualifications|experience).*?[:.-](.*?)(?:\n|$)/gi,
      preferred: /preferred.*?(?:skills|qualifications|experience).*?[:.-](.*?)(?:\n|$)/gi
    };
    
    const pattern = skillPatterns[type];
    const matches = content.match(pattern) || [];
    
    return matches.map(match => match.trim()).slice(0, 5);
  }
  
  function extractExperienceLevel(content) {
    // Look for experience indicators
    const expPatterns = [
      /(\d+)[\+\-\s]*years?\s+(?:of\s+)?experience/i,
      /(\d+)[\+\-\s]*years?\s+(?:in|with)/i,
      /(entry|junior|mid|senior|principal|lead|director)/i
    ];
    
    for (const pattern of expPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return 'Not specified';
  }
  
  function extractResponsibilities(content) {
    // Simple responsibility extraction
    const responsibilities = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.match(/^[\s]*[-•*]\s/)) {
        responsibilities.push(line.trim());
      }
    }
    
    return responsibilities.slice(0, 10);
  }
  
  function extractCompanyInfo(content) {
    // Extract basic company information
    return {
      description: "Company information extracted from job posting",
      industry: "Industry information if available"
    };
  }
  
  function extractATSKeywords(content) {
    // Extract important keywords for ATS optimization
    const keywords = new Set();
    
    // Common resume keywords to look for
    const skillKeywords = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    skillKeywords.forEach(skill => {
      if (skill.length > 3) keywords.add(skill);
    });
    
    return Array.from(keywords).slice(0, 20);
  }
  
  function performATSOptimization(content, jobKeywords, type) {
    // Simplified ATS optimization analysis
    const suggestions = [];
    let score = 75; // Base score
    
    // Check keyword density
    const keywordMatches = jobKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );
    
    const keywordScore = (keywordMatches.length / Math.max(jobKeywords.length, 1)) * 100;
    score = Math.round((score + keywordScore) / 2);
    
    if (keywordMatches.length < jobKeywords.length / 2) {
      suggestions.push("Consider adding more relevant keywords from the job description");
    }
    
    suggestions.push("Use standard resume section headers (Experience, Education, Skills)");
    suggestions.push("Avoid images, tables, and complex formatting for better ATS compatibility");
    
    return {
      score,
      suggestions,
      keywords: {
        matched: keywordMatches,
        missing: jobKeywords.filter(k => !keywordMatches.includes(k)),
        total: jobKeywords.length
      }
    };
  }
  
  // Export all tool handlers
  module.exports = {
    searchContext,
    generateResumeSection,
    optimizeForATS
  };