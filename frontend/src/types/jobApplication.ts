/**
 * Represents a keyword with its category, variations, and context
 */
export interface Keyword {
  term: string;
  category: 'hard_skill' | 'soft_skill' | 'tool' | 'certification' | 'experience';
  variations: string[];
  context: string;
}

/**
 * Represents a keyword priority structure
 */
export interface KeywordsByPriority {
  critical: Keyword[];
  important: Keyword[];
  nice_to_have: Keyword[];
}

/**
 * Represents an acronym pair
 */
export interface AcronymPair {
  short: string;
  long: string;
}

/**
 * Represents an experience requirement
 */
export interface ExperienceRequirement {
  skill: string;
  years: string;
  requirement_type: 'required' | 'preferred';
}

/**
 * Represents section-specific keywords
 */
export interface SectionKeywords {
  summary_emphasis: string[];
  skills_section: string[];
  experience_bullets: string[];
}

/**
 * Represents company information
 */
export interface CompanyInfo {
  description: string;
  industry: string;
}

/**
 * Represents resume emphasis points
 */
export interface ResumeEmphasis {
  summary: string;
  key_points: string[];
}

/**
 * Represents a job application in the system
 */
export interface JobApplication {
  id: string;
  user_id: string;
  job_title: string;
  company_name: string;
  job_url?: string;
  job_description: string;
  status: 'draft' | 'submitted' | 'interviewing' | 'offered' | 'rejected';
  resume_file_id: string;
  created_at: string;
  updated_at: string;
  
  // Analysis results
  required_skills?: string[];
  preferred_qualifications?: string[];
  experience_level?: string;
  key_responsibilities?: string[];
  company_info?: CompanyInfo;
  keywords?: string[];
  resume_emphasis?: ResumeEmphasis;
  
  // New fields
  keywords_by_priority?: KeywordsByPriority;
  exact_phrases?: string[];
  acronym_pairs?: AcronymPair[];
  experience_requirements?: ExperienceRequirement[];
  section_keywords?: SectionKeywords;
}

/**
 * Represents the response from job description analysis
 */
export interface JobAnalysisResponse {
  results?: {
    required_skills: string[];
    preferred_qualifications: string[];
    experience_level: string;
    key_responsibilities: string[];
    company_info: CompanyInfo;
    keywords: string[];
    resume_emphasis: ResumeEmphasis;
    keywords_by_priority: KeywordsByPriority;
    exact_phrases: string[];
    acronym_pairs: AcronymPair[];
    experience_requirements: ExperienceRequirement[];
    section_keywords: SectionKeywords;
  };
} 