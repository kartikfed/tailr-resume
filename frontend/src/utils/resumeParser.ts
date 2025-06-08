import { ResumeSection, JobSection, ParsedResume } from '../types/resume';

/**
 * Utility class for parsing resume HTML into a structured format
 */
export class ResumeParser {
  private doc: Document;

  /**
   * Creates a new ResumeParser instance
   * @param html - The HTML string to parse
   */
  constructor(html: string) {
    this.doc = new DOMParser().parseFromString(html, 'text/html');
  }

  /**
   * Parses the resume HTML into a structured format
   * @returns ParsedResume object containing sections and raw HTML
   */
  parse(): ParsedResume {
    const sections: ResumeSection[] = [];
    
    // Find all sections in the resume
    const sectionElements = this.doc.querySelectorAll('.section');
    
    sectionElements.forEach(section => {
      const title = section.querySelector('.section-title')?.textContent?.trim() || '';
      
      // Find all job entries within this section
      const jobElements = section.querySelectorAll('.job');
      const jobs: JobSection[] = [];
      
      jobElements.forEach(job => {
        // Find both job-header divs
        const jobHeaders = job.querySelectorAll('.job-header');
        let company = '';
        let location = '';
        let jobTitle = '';
        let tenure = '';
        if (jobHeaders.length >= 2) {
          // First header: company and location
          company = jobHeaders[0].querySelector('.company')?.textContent?.trim() || '';
          location = jobHeaders[0].querySelector('.date')?.textContent?.trim() || '';
          // Second header: job title and tenure
          jobTitle = jobHeaders[1].querySelector('.job-title')?.textContent?.trim() || '';
          tenure = jobHeaders[1].querySelector('.date')?.textContent?.trim() || '';
        }
        // Fallbacks if only one header
        if (jobHeaders.length === 1) {
          company = jobHeaders[0].querySelector('.company')?.textContent?.trim() || '';
          jobTitle = jobHeaders[0].querySelector('.job-title')?.textContent?.trim() || '';
          location = jobHeaders[0].querySelector('.date')?.textContent?.trim() || '';
        }
        // Find all bullet points within this job
        const bullets = Array.from(job.querySelectorAll('.responsibilities li'))
          .map(li => li.textContent?.trim() || '')
          .filter(bullet => bullet.length > 0);
        
        if (jobTitle || company || bullets.length > 0) {
          jobs.push({
            type: 'job',
            title: jobTitle,
            company: company ? `${company}${location ? ' — ' + location : ''}` : '',
            date: tenure,
            bullets
          });
        }
      });
      
      // Only add sections that have content
      if (title || jobs.length > 0) {
        sections.push({
          type: 'section',
          title,
          content: section.innerHTML,
          subSections: jobs
        });
      }
    });
    
    return {
      sections,
      rawHtml: this.doc.documentElement.outerHTML
    };
  }
} 