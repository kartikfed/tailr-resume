/**
 * Reads a File or Blob as base64 (for PDFs) or text (for others).
 * @param file - The File or Blob to read
 * @param fileName - The file name (to determine extension)
 * @returns Promise<string> - The file content as base64 or text
 */
export function readFileContent(file: File | Blob, fileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const isPdf = fileName.toLowerCase().endsWith('.pdf');

    reader.onerror = (error) => reject(error);

    if (isPdf) {
      reader.onload = function(event) {
        // event.target.result is a data URL: 'data:application/pdf;base64,...'
        const dataUrl = event.target?.result as string;
        // Extract base64 part
        const base64String = dataUrl.split(',')[1];
        resolve(base64String);
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = function(event) {
        resolve(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  });
} 