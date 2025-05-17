const pdf2md = require('pdf2md');
const pdf = require('pdf-parse');

/**
 * Extracts structured Markdown from a base64-encoded PDF file.
 * @param {string} base64String - The base64-encoded PDF file content.
 * @returns {Promise<string>} - The extracted Markdown from the PDF.
 */
async function extractPdfMarkdown(base64String) {
  const buffer = Buffer.from(base64String, 'base64');
  const markdown = await pdf2md.default(buffer);
  return markdown;
}

function textToHtml(text) {
  // Headings: lines in ALL CAPS or followed by dashes/underscores
  text = text.replace(/^([A-Z][A-Z\s]+)\n[-_]+$/gm, '<h2>$1</h2>');
  // Bullets: lines starting with -, *, or •
  text = text.replace(/^[-*•]\s+(.*)$/gm, '<li>$1</li>');
  // Group consecutive <li> into <ul>
  text = text.replace(/(<li>.*?<\/li>)+/gs, match => `<ul>${match}</ul>`);
  // Paragraphs: double newlines become <p>
  text = text.replace(/\n{2,}/g, '</p><p>');
  // Single newlines inside paragraphs
  text = text.replace(/([^\n])\n([^\n])/g, '$1 $2');
  // Wrap everything in <p> if not already
  if (!/^<h2>/.test(text)) text = `<p>${text}</p>`;
  return text;
}

async function extractPdfHtml(base64String) {
  const buffer = Buffer.from(base64String, 'base64');
  const data = await pdf(buffer);
  return textToHtml(data.text);
}

/**
 * Extracts plain text from a base64-encoded PDF file.
 * @param {string} base64String - The base64-encoded PDF file content.
 * @returns {Promise<string>} - The extracted plain text from the PDF.
 */
async function extractPdfText(base64String) {
  const buffer = Buffer.from(base64String, 'base64');
  const data = await pdf(buffer);
  return data.text;
}

module.exports = { extractPdfMarkdown, extractPdfHtml, extractPdfText }; 