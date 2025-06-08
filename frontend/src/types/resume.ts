/**
 * Represents a section in the resume (header or main section)
 */
export interface ResumeSection {
  type: 'header' | 'section';
  title: string;
  content: string;
  subSections?: JobSection[];
}

/**
 * Represents a job entry within a section
 */
export interface JobSection {
  type: 'job';
  title: string;
  company: string;
  date: string;
  bullets: string[];
}

/**
 * Represents the complete parsed resume structure
 */
export interface ParsedResume {
  sections: ResumeSection[];
  rawHtml: string;
} 