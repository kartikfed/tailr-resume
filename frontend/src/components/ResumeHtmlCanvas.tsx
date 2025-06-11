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
  /** Array of changes to highlight */
  changes?: Array<{
    type: 'update' | 'add' | 'remove' | 'reorder';
    location: string;
    content: string;
    elementSelector?: string;
  }>;
}

/**
 * Component that renders HTML content in an iframe and handles resume edits
 */
export const ResumeHtmlCanvas: React.FC<ResumeHtmlCanvasProps> = ({
  htmlContent,
  conversationId,
  onUpdate,
  changes = []
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);

  // Handle iframe load event
  const handleIframeLoad = () => {
    console.log('📄 Iframe loaded');
    setIsIframeLoaded(true);
  };

  // Add effect to handle content updates
  useEffect(() => {
    if (!iframeRef.current || !htmlContent) return;

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    console.log('📝 Updating iframe content');
    
    // Update the content
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // Reset iframe loaded state
    setIsIframeLoaded(false);
  }, [htmlContent]);

  // Add effect to handle changes and highlight modified elements
  useEffect(() => {
    if (!iframeRef.current || !changes.length || !isIframeLoaded) return;

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    console.log('🎨 Applying highlights for changes:', changes);

    // Helper to append style with retry if head is not available
    function appendStyleWithRetry(doc: Document, style: HTMLStyleElement, retries = 5, delay = 50) {
      if (doc.head) {
        doc.head.appendChild(style);
      } else if (retries > 0) {
        setTimeout(() => appendStyleWithRetry(doc, style, retries - 1, delay), delay);
      } else {
        console.warn('⚠️ iframeDoc.head is still null after retries, cannot append highlight style.');
      }
    }

    // Add highlight animation styles
    const style = iframeDoc.createElement('style');
    style.textContent = `
      .content-changed {
        position: relative;
        display: inline-block;
        animation: rippleGlow 2.5s ease-out forwards;
        isolation: isolate;
        white-space: normal;
        word-wrap: break-word;
        text-decoration: none !important;
        border: none !important;
        border-bottom: none !important;
        border-top: none !important;
      }

      .content-changed::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg,
          transparent 0%,
          rgba(139, 92, 246, 0.1) 25%,
          rgba(139, 92, 246, 0.3) 50%,
          rgba(139, 92, 246, 0.1) 75%,
          transparent 100%
        );
        animation: waveMove 2.5s ease-out forwards;
        border-radius: inherit;
        z-index: 1;
        pointer-events: none;
        will-change: transform, opacity;
        transform: translateX(-100%);
      }

      /* Ensure child elements stay above the animation */
      .content-changed * {
        position: relative;
        z-index: 2;
      }

      @keyframes rippleGlow {
        0% {
          background-color: rgba(139, 92, 246, 0.08);
          box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
        }
        40% {
          background-color: rgba(139, 92, 246, 0.12);
          box-shadow: 0 0 12px 3px rgba(139, 92, 246, 0.3);
        }
        100% {
          background-color: transparent;
          box-shadow: 0 0 0 0 rgba(139, 92, 246, 0);
        }
      }

      @keyframes waveMove {
        0% { 
          transform: translateX(-100%);
          opacity: 0;
        }
        10% { 
          opacity: 1;
        }
        90% { 
          opacity: 1;
        }
        100% { 
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    appendStyleWithRetry(iframeDoc, style);

    // Clear previous highlights
    const previousHighlights = iframeDoc.querySelectorAll('.content-changed');
    previousHighlights.forEach(el => {
      el.classList.remove('content-changed');
      // Force cleanup of any remnant styles
      (el as HTMLElement).style.removeProperty('background-color');
      (el as HTMLElement).style.removeProperty('box-shadow');
      (el as HTMLElement).style.removeProperty('display');
      (el as HTMLElement).style.removeProperty('position');
    });

    // Apply highlights to changed elements
    changes.forEach(change => {
      if (change.elementSelector) {
        console.log('🔍 Looking for element with selector:', change.elementSelector);
        const elements = iframeDoc.querySelectorAll(change.elementSelector);
        console.log('📌 Found elements:', elements.length);
        
        elements.forEach(el => {
          console.log('✨ Highlighting element:', el.outerHTML);
          // Force reflow to restart animation
          (el as HTMLElement).offsetHeight;
          el.classList.add('content-changed');
        });
      } else {
        console.warn('⚠️ No elementSelector provided for change:', change);
      }
    });

    // Remove highlights after animation completes
    const timeout = setTimeout(() => {
      const highlights = iframeDoc.querySelectorAll('.content-changed');
      highlights.forEach(el => {
        el.classList.remove('content-changed');
        // Force cleanup of any remnant styles
        (el as HTMLElement).style.removeProperty('background-color');
        (el as HTMLElement).style.removeProperty('box-shadow');
        (el as HTMLElement).style.removeProperty('display');
        (el as HTMLElement).style.removeProperty('position');
      });
    }, 2500);

    return () => {
      clearTimeout(timeout);
      // Cleanup any remaining highlights
      const remainingHighlights = iframeDoc.querySelectorAll('.content-changed');
      remainingHighlights.forEach(el => {
        el.classList.remove('content-changed');
        (el as HTMLElement).style.removeProperty('background-color');
        (el as HTMLElement).style.removeProperty('box-shadow');
        (el as HTMLElement).style.removeProperty('display');
        (el as HTMLElement).style.removeProperty('position');
      });
    };
  }, [changes, isIframeLoaded]);

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
        onLoad={handleIframeLoad}
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