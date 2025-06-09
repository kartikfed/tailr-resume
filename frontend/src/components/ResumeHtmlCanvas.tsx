import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';

/**
 * Props for ResumeHtmlCanvas
 */
export interface ResumeHtmlCanvasProps {
  /** The HTML content to render in the iframe */
  htmlContent: string | null;
  /** The conversation ID for the current session */
  conversationId: string;
  /** Callback when the HTML content is updated */
  onUpdate: (newHtml: string) => void;
}

/**
 * Component that renders HTML content in an iframe and handles resume edits
 */
export const ResumeHtmlCanvas: React.FC<ResumeHtmlCanvasProps> = ({
  htmlContent,
  conversationId,
  onUpdate
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Add effect to log when htmlContent changes
  useEffect(() => {
    console.log('🔄 ResumeHtmlCanvas received new htmlContent:', {
      hasContent: !!htmlContent,
      contentLength: htmlContent?.length,
      preview: htmlContent?.substring(0, 100) + '...'
    });
  }, [htmlContent]);

  // Function to verify HTML structure
  const verifyHtmlStructure = (html: string) => {
    const structure = {
      hasDoctype: html.includes('<!DOCTYPE'),
      hasHtml: html.includes('<html'),
      hasHead: html.includes('<head'),
      hasBody: html.includes('<body'),
      hasStyle: html.includes('<style')
    };
    console.log('HTML structure verification:', structure);
    return structure;
  };

  return (
    <Box
      position="relative"
      width="100%"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="20px"
      overflow="hidden"
    >
      <iframe
        ref={iframeRef}
        srcDoc={htmlContent || ''}
        style={{
          width: '100%',
          minHeight: '1100px',
          border: 'none',
          background: 'white',
          borderRadius: '20px',
        }}
        sandbox="allow-same-origin allow-scripts allow-forms"
        title="Resume Preview"
      />
    </Box>
  );
};

export default ResumeHtmlCanvas; 