import React, { useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Box, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

interface ResumeHtmlViewerProps {
  content: string;
  onTextSelect?: (selectedText: string) => void;
  className?: string;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: '100%',
  overflow: 'auto',
  backgroundColor: '#fff',
  '& .resume-container': {
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
  },
  '& .section': {
    marginBottom: theme.spacing(3),
  },
  '& .section-title': {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  '& .job-title': {
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
  '& .company-name': {
    fontStyle: 'italic',
  },
  '& .date-range': {
    color: theme.palette.text.secondary,
  },
  '& .bullet-point': {
    marginLeft: theme.spacing(2),
    marginBottom: theme.spacing(0.5),
  },
}));

/**
 * ResumeHtmlViewer component for rendering HTML content from PDF conversion
 * Includes text selection capabilities and proper styling
 */
const ResumeHtmlViewer: React.FC<ResumeHtmlViewerProps> = ({
  content,
  onTextSelect,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('ResumeHtmlViewer received content:', {
      contentLength: content?.length,
      contentPreview: content?.substring(0, 100),
      hasContent: !!content
    });
  }, [content]);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() && onTextSelect) {
        onTextSelect(selection.toString().trim());
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mouseup', handleSelection);
      return () => {
        container.removeEventListener('mouseup', handleSelection);
      };
    }
  }, [onTextSelect]);

  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(content || '', {
    ALLOWED_TAGS: [
      'div', 'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'strong', 'em', 'br', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['class', 'style'],
  });

  if (!content) {
    console.warn('ResumeHtmlViewer: No content provided');
    return (
      <StyledPaper className={className} elevation={0}>
        <Box className="resume-container">
          <p>No resume content available</p>
        </Box>
      </StyledPaper>
    );
  }

  return (
    <StyledPaper className={className} elevation={0}>
      <Box
        ref={containerRef}
        className="resume-container"
        sx={{
          '& *': {
            userSelect: 'text',
          },
        }}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </StyledPaper>
  );
};

export default ResumeHtmlViewer; 