/**
 * PDF Text Extraction Utilities
 * 
 * Provides functions for extracting text and markdown from PDF files.
 */

import pdf from 'pdf-parse';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

interface PdfData {
  text: string;
  numpages: number;
  info: {
    PDFFormatVersion: string;
    IsAcroFormPresent: boolean;
    IsXFAPresent: boolean;
    [key: string]: any;
  };
}

/**
 * Extract raw text from a PDF file
 * @param input - PDF file buffer or base64 string
 * @returns Promise resolving to extracted text
 */
export async function extractPdfText(input: Buffer | string): Promise<string> {
  try {
    // Convert base64 string to Buffer if needed
    const buffer = typeof input === 'string' ? Buffer.from(input, 'base64') : input;
    const data: PdfData = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract markdown from a PDF file
 * @param buffer - PDF file buffer
 * @returns Promise resolving to extracted markdown
 */
export async function extractPdfMarkdown(buffer: Buffer): Promise<string> {
  try {
    // First extract the raw text
    const text = await extractPdfText(buffer);

    // Create a simple HTML structure from the text
    const html = `
      <html>
        <body>
          <article>
            ${text.split('\n').map(line => `<p>${line}</p>`).join('\n')}
          </article>
        </body>
      </html>
    `;

    // Use Readability to clean up the HTML
    const dom = new JSDOM(html);
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Failed to parse PDF content');
    }

    // Convert the cleaned HTML to markdown
    const markdown = article.textContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n');

    return markdown;
  } catch (error) {
    console.error('Error extracting PDF markdown:', error);
    throw new Error('Failed to extract markdown from PDF');
  }
} 