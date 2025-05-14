const pdf = require('pdf-parse');

/**
 * Extracts text from a base64-encoded PDF file.
 * @param {string} base64String - The base64-encoded PDF file content.
 * @returns {Promise<string>} - The extracted text from the PDF.
 */
async function extractPdfText(base64String) {
  const buffer = Buffer.from(base64String, 'base64');
  const data = await pdf(buffer);
  return data.text;
}

module.exports = { extractPdfText }; 