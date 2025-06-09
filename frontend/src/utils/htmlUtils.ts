/**
 * Extracts HTML content from a string that may contain non-HTML content
 * @param content - The string that may contain HTML and other content
 * @returns The extracted HTML content
 */
export function extractHtmlContent(content: string): string {
  console.log('Extracting HTML content from:', {
    contentLength: content.length,
    preview: content.substring(0, 100) + '...'
  });

  // Find the first HTML tag
  const htmlStartIndex = content.indexOf('<');
  if (htmlStartIndex === -1) {
    console.warn('No HTML tags found in content');
    return '';
  }

  // Find the last HTML tag
  const htmlEndIndex = content.lastIndexOf('>');
  if (htmlEndIndex === -1) {
    console.warn('No closing HTML tag found in content');
    return '';
  }

  // Extract the HTML content
  const htmlContent = content.slice(htmlStartIndex, htmlEndIndex + 1);
  console.log('Extracted HTML content:', {
    contentLength: htmlContent.length,
    preview: htmlContent.substring(0, 100) + '...'
  });

  // Verify it's valid HTML by checking for opening and closing tags
  const hasOpeningHtml = /<html[^>]*>/i.test(htmlContent);
  const hasClosingHtml = /<\/html>/i.test(htmlContent);

  // If it's a complete HTML document, return it
  if (hasOpeningHtml && hasClosingHtml) {
    console.log('Found complete HTML document');
    return htmlContent;
  }

  // If it's not a complete HTML document, wrap it in HTML tags
  console.log('Wrapping partial HTML content in document structure');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${htmlContent}
</body>
</html>`;
} 