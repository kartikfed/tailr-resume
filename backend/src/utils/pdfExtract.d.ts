/**
 * Extracts text content from a PDF file
 * @param content - The base64 encoded PDF content
 * @returns Promise<string> - The extracted text content
 */
export function extractPdfText(content: string): Promise<string>;

/**
 * Extracts markdown content from a PDF file
 * @param content - The base64 encoded PDF content
 * @returns Promise<string> - The extracted markdown content
 */
export function extractPdfMarkdown(content: string): Promise<string>; 