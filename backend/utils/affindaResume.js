const axios = require('axios');
const FormData = require('form-data');

/**
 * Sends a resume file to Affinda and returns the parsed structured data.
 * @param {Buffer} fileBuffer - The resume file as a Buffer.
 * @param {string} filename - The original filename (for extension).
 * @param {string} apiKey - Your Affinda API key.
 * @returns {Promise<Object>} - The parsed resume JSON from Affinda.
 */
async function parseResumeWithAffinda(fileBuffer, filename, apiKey) {
  const form = new FormData();
  form.append('file', fileBuffer, filename);

  const response = await axios.post(
    'https://api.affinda.com/v2/resumes',
    form,
    {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${apiKey}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );
  return response.data.data; // Affinda returns { data: { ...parsedResume } }
}

function affindaResumeToMarkdown(data) {
  let md = '';
  if (data.name && data.name.raw) md += `# ${data.name.raw}\n\n`;
  if (data.summary) md += `## Professional Summary\n${data.summary}\n\n`;
  if (data.workExperience && data.workExperience.length) {
    md += `## Experience\n`;
    data.workExperience.forEach(exp => {
      md += `### ${exp.jobTitle || ''} at ${exp.organization || ''}\n`;
      if (exp.dates && (exp.dates.startDate || exp.dates.endDate)) {
        md += `*${exp.dates.startDate || ''} - ${exp.dates.endDate || 'Present'}*\n`;
      }
      if (exp.jobDescription) md += `${exp.jobDescription}\n`;
      md += '\n';
    });
  }
  if (data.education && data.education.length) {
    md += `## Education\n`;
    data.education.forEach(edu => {
      md += `### ${edu.accreditation?.education || ''} at ${edu.organization || ''}\n`;
      if (edu.dates && edu.dates.completionDate) {
        md += `*Completed: ${edu.dates.completionDate}*\n`;
      }
      md += '\n';
    });
  }
  if (data.skills && data.skills.length) {
    md += `## Skills\n`;
    data.skills.forEach(skill => {
      md += `- ${skill.name}\n`;
    });
    md += '\n';
  }
  return md.trim();
}

module.exports = { parseResumeWithAffinda, affindaResumeToMarkdown }; 