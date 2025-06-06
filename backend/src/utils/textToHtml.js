/**
 * Converts plain text to structured HTML
 * @param {string} text - Plain text content
 * @returns {string} - HTML content
 */
function textToHtml(text) {
  try {
    console.log('Converting text to HTML...');
    
    // Split into sections based on double newlines
    const sections = text.split(/\n{2,}/);
    
    // Process each section
    const processedSections = sections.map(section => {
      // Clean up the section text
      let cleanText = section.trim();
      
      // Check if it's a heading (all caps or followed by dashes/underscores)
      if (/^[A-Z][A-Z\s]+$/.test(cleanText) || /^[A-Z][A-Z\s]+\n[-_]+$/.test(cleanText)) {
        return `<h2 class="section-title">${cleanText.replace(/\n[-_]+$/, '')}</h2>`;
      }
      
      // Check if it's a bullet list
      if (cleanText.split('\n').every(line => /^[-*•]\s/.test(line.trim()))) {
        const bullets = cleanText.split('\n').map(line => {
          const content = line.trim().replace(/^[-*•]\s+/, '');
          return `<li class="bullet-point">${content}</li>`;
        }).join('\n');
        return `<ul class="bullet-list">${bullets}</ul>`;
      }
      
      // Check if it's a job entry (contains company name and dates)
      if (cleanText.includes(' at ') || cleanText.includes(' - ')) {
        const lines = cleanText.split('\n');
        const title = lines[0];
        const company = lines[1]?.includes(' at ') ? lines[1].split(' at ')[1] : '';
        const dates = lines[1]?.match(/\d{4}/g) ? lines[1].match(/\d{4}/g).join(' - ') : '';
        
        return `
          <div class="job-entry">
            <div class="job-title">${title}</div>
            ${company ? `<div class="company-name">${company}</div>` : ''}
            ${dates ? `<div class="date-range">${dates}</div>` : ''}
          </div>
        `;
      }
      
      // Regular paragraph
      return `<p class="paragraph">${cleanText}</p>`;
    });
    
    // Combine all sections
    const html = `
      <div class="resume-container">
        ${processedSections.join('\n')}
      </div>
    `;
    
    console.log('HTML conversion complete:', {
      sections: sections.length,
      htmlLength: html.length,
      htmlPreview: html.substring(0, 200) + '...'
    });
    
    return html;
  } catch (error) {
    console.error('Error in textToHtml:', error);
    throw new Error(`Failed to convert text to HTML: ${error.message}`);
  }
}

module.exports = {
  textToHtml
}; 