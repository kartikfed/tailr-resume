import React, { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

interface ResumeViewerProps {
  html: string;
  className?: string;
}

/**
 * A component that renders HTML content with high fidelity, preserving all styling and formatting.
 * Includes print support and proper sanitization.
 */
const ResumeViewer: React.FC<ResumeViewerProps> = ({ html, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Sanitize HTML and preserve necessary styles
  const sanitizedHtml = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'strong', 'em', 'br', 'hr', 'a',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'style', 'head', 'meta', 'title'
    ],
    ALLOWED_ATTR: [
      'class', 'style', 'href', 'target', 'rel',
      'id', 'name', 'type', 'content', 'charset',
      'media', 'lang'
    ],
    ALLOWED_STYLES: [
      'color', 'background-color', 'font-size', 'font-family',
      'font-weight', 'text-align', 'margin', 'padding',
      'border', 'width', 'height', 'display', 'position',
      'line-height', 'letter-spacing', 'text-decoration',
      'text-transform', 'white-space', 'overflow',
      'text-overflow', 'word-wrap', 'word-break',
      'box-sizing', 'flex', 'flex-direction', 'justify-content',
      'align-items', 'gap', 'grid', 'grid-template-columns',
      'grid-template-rows', 'grid-gap'
    ],
    PARSER_MEDIA_TYPE: 'text/html'
  });

  // Handle print functionality
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`resume-viewer-container ${className}`}>
      <div className="resume-controls">
        <button 
          onClick={handlePrint}
          className="print-button"
        >
          Print Resume
        </button>
      </div>
      <div 
        ref={containerRef}
        className="resume-content"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
      <style>{`
        .resume-viewer-container {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .resume-controls {
          position: sticky;
          top: 0;
          background: white;
          padding: 1rem;
          border-bottom: 1px solid #eee;
          z-index: 100;
          display: flex;
          justify-content: flex-end;
        }

        .print-button {
          padding: 0.5rem 1rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.2s;
        }

        .print-button:hover {
          background: #0056b3;
        }

        .resume-content {
          padding: 2rem;
          overflow: auto;
        }

        /* Print styles */
        @media print {
          .resume-controls {
            display: none;
          }

          .resume-content {
            padding: 0;
            box-shadow: none;
          }

          body {
            margin: 0;
            padding: 0;
          }
        }

        /* Ensure proper font rendering */
        .resume-content * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  );
};

export default ResumeViewer; 