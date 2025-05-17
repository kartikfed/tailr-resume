/**
 * Resume-focused MCP Tool Handlers
 * 
 * This file implements the functionality for each resume-related tool
 * that Claude can call through MCP.
 */

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
      if (!file.content) continue;
      
      // Split content into lines for better matching
      const lines = file.content.split('\n');
      
      // Look for lines containing the query
      const matches = lines.filter(line => 
        line.toLowerCase().includes(query.toLowerCase())
      );
      
      if (matches.length > 0) {
        results.push({
          file: file.name,
          matches: matches.slice(0, maxResults)
        });
      }
    }
    
    return {
      results: results.slice(0, maxResults),
      message: `Found ${results.length} relevant sections`
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

module.exports = {
  searchContext,
  optimizeForATS,
  performJobAnalysis
};