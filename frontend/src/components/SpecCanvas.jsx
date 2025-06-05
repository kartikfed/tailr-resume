import React, { useState, useRef } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  useToast,
  Button,
  List,
  ListItem,
  ListIcon,
  Flex,
  Badge,
  Divider,
  Textarea,
  HStack,
  SimpleGrid,
  IconButton,
  PopoverBody,
  useColorModeValue,
  Collapse,
  useDisclosure,
  Spinner
} from '@chakra-ui/react';
import { CheckCircleIcon, RepeatIcon, CloseIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import ReactDOM from 'react-dom';
import EmphasisAreas from './EmphasisAreas';

// Add at the very top of the file, before the component definition
const pulseKeyframes = `
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(143, 63, 255, 0.5); }
  70% { box-shadow: 0 0 0 10px rgba(143, 63, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(143, 63, 255, 0); }
}`;

/**
 * Component for rendering resume content with text selection and revision support
 */
const SpecCanvas = ({
  resumeMarkdown = null,
  onAcceptRevision,
  onRejectRevision,
  jobDescriptionProvided = false,
  jobDescription = '',
  highlightedText = null,
  promptPresets = [],
  onRegeneratePrompts = null,
  writingTone = 'concise',
  conversationId,
  onUpdateMessages,
  resumeEmphasis = null,
  getQuickRevisionsForBullet = null
}) => {
  // Debug logging
  console.log('SpecCanvas received props:', {
    resumeMarkdown,
    jobDescriptionProvided,
    jobDescriptionLength: jobDescription?.length || 0,
    jobDescription: jobDescription?.substring(0, 50) + '...' // Log first 50 chars
  });

  // Check if any content is available
  const hasContent = () => {
    console.log('Checking content:', {
      hasMarkdown: !!resumeMarkdown
    });
    
    return !!resumeMarkdown;
  };

  // Helper function to render content with proper line breaks and allow fine-grained selection
  const renderContent = (content) => {
    if (!content) return null;
    
    console.log('SpecCanvas: Rendering content:', {
      contentLength: content.length,
      contentPreview: content.substring(0, 100) + '...'
    });
    
    return (
      <Box 
        whiteSpace="pre-wrap" 
        userSelect="text"
        position="relative"
      >
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          components={{
            h1: ({ node, children, ...props }) => (
              <Heading 
                as="h1" 
                size="xl" 
                mb={4} 
                color="#7c3aed" 
                fontWeight="bold"
                fontFamily="inherit"
                {...props}
              >
                {children}
              </Heading>
            ),
            h2: ({ node, children, ...props }) => (
              <Heading 
                as="h2" 
                size="lg" 
                mb={3} 
                color="#7c3aed"
                fontWeight="bold"
                fontFamily="inherit"
                {...props}
              >
                {children}
              </Heading>
            ),
            h3: ({ node, children, ...props }) => (
              <Heading 
                as="h3" 
                size="md" 
                mb={2} 
                color="#8b5cf6"
                fontWeight="bold"
                fontFamily="inherit"
                {...props}
              >
                {children}
              </Heading>
            ),
            p: ({ node, children, ...props }) => (
              <Text 
                color="#1a1a1a"
                fontFamily="inherit"
                fontSize="16px"
                fontWeight="normal"
                mb={4}
                {...props}
              >
                {children}
              </Text>
            ),
            li: ({ node, children, ...props }) => {
              const textContent = React.Children.toArray(children)
                .filter(child => typeof child === 'string')
                .join('')
                .trim();
              
              const bulletIndex = bulletPointsRef.current.findIndex(
                bullet => bullet.text === textContent
              );
              
              const isRecentlyRevised = lastRevisedText === textContent;
              const isSelected = bulletIndex === currentBulletIndex;
              
              return (
                <Box
                  as="li"
                  id={`bullet-${bulletIndex}`}
                  bg={
                    isRecentlyRevised 
                      ? recentlyRevisedBg
                      : isSelected
                        ? selectedBulletBg
                        : 'transparent'
                  }
                  p={isRecentlyRevised || isSelected ? 2 : 0}
                  borderRadius="md"
                  transition="all 0.2s"
                  position="relative"
                  style={{
                    ...(isSelected ? { animation: 'pulse 1.2s infinite' } : {}),
                    listStyleType: 'none',
                  }}
                  border={isSelected ? '1px solid' : 'none'}
                  borderColor={selectedBulletBorder}
                  color="#1a1a1a"
                  fontFamily="inherit"
                  fontSize="16px"
                  fontWeight="normal"
                  _before={{
                    content: '"•"',
                    color: '#8b5cf6',
                    fontWeight: 'bold',
                    display: 'inline-block',
                    width: '1em',
                    marginLeft: '-1em'
                  }}
                  {...props}
                >
                  {children}
                  {isSelected && (
                    <Box
                      position="absolute"
                      top="-20px"
                      right="0"
                      transform="scale(0.8)"
                      transformOrigin="top right"
                      style={{ animation: 'pulse 1.2s infinite' }}
                    >
                      <svg width="40" height="40" viewBox="0 0 40 40">
                        <rect x="2" y="2" width="36" height="36" rx="8" fill="#2d2950" stroke="#8f3fff" strokeWidth="2" />
                        <text x="50%" y="60%" textAnchor="middle" fill="#e0e6ff" fontSize="1.5rem" fontWeight="bold" fontFamily="inherit">R</text>
                      </svg>
                    </Box>
                  )}
                </Box>
              );
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </Box>
    );
  };

  // Helper function to unescape Markdown special characters
  function unescapeMarkdown(text) {
    if (!text) return text;
    // Unescape common Markdown characters: \\* \\# \\_ \\` \\~ \\> \\- \\! \\[ \\] \\( \\) \\{ \\} \\< \\> \\| \\.
    return text.replace(/\\([#*_[\]()`~>\-!{}<>|.])/g, '$1');
  }

  // Function to find all bullet points in the markdown content
  const findBulletPoints = (content) => {
    if (!content) return [];
    const lines = content.split('\n');
    return lines
      .map((line, index) => {
        // Match bullet points with various markers
        const match = line.trim().match(/^[-*•]\s+(.+)$/);
        if (match) {
          return {
            index,
            text: match[1].trim(),
            line: line.trim(),
            id: `bullet-${index}` // Add unique ID for each bullet point
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  const [currentBulletIndex, setCurrentBulletIndex] = useState(-1);
  const [showRevisionPopover, setShowRevisionPopover] = useState(false);
  const [reviseButtonPosition, setReviseButtonPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');

  // Add useEffect to update popover position when current bullet changes
  React.useEffect(() => {
    if (currentBulletIndex !== -1) {
      const element = document.getElementById(`bullet-${currentBulletIndex}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        const newPosition = {
          top: rect.top + window.scrollY,
          left: rect.right + window.scrollX + 8
        };
        setReviseButtonPosition(newPosition);
        setShowRevisionPopover(true);
      }
    }
  }, [currentBulletIndex]);

  // Add scroll event listener to update popover position
  React.useEffect(() => {
    if (currentBulletIndex === -1) return;

    const handleScroll = () => {
      const element = document.getElementById(`bullet-${currentBulletIndex}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        setReviseButtonPosition({
          top: rect.top + window.scrollY,
          left: rect.right + window.scrollX + 8
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentBulletIndex]);

  // Function to highlight a bullet point
  const highlightBulletPoint = (index) => {
    if (index >= 0 && index < bulletPointsRef.current.length) {
      setCurrentBulletIndex(index);
      const bullet = bulletPointsRef.current[index];
      setSelectedText(bullet.text);
      setShowRevisionPopover(true);
      setHasUserNavigated(true); // Mark as user navigated
      // Clear any previous revision state when changing bullets
      setRevisedText('');
      setRevisedTextMarkdown('');
      setHasSubmittedRevision(false);
      // Use setTimeout to ensure the highlight styles are applied before scrolling
      setTimeout(() => {
        // Find the actual highlighted element (Box component with id)
        const element = document.getElementById(`bullet-${index}`);
        if (!element) return;

        // Get the element's bounding rectangle
        const rect = element.getBoundingClientRect();
        
        // Calculate the total height needed for the complete highlighted area
        const totalHeight = rect.height + 40; // Base height + R key indicator height
        
        // Calculate the viewport height
        const viewportHeight = window.innerHeight;
        
        // Calculate the element's position relative to the viewport
        const elementTop = rect.top;
        const elementBottom = rect.bottom;
        
        // Add padding to prevent the highlight from touching viewport edges
        const viewportPadding = 20;
        
        // Calculate the scroll position needed to show the complete highlighted area
        let scrollAmount = 0;
        
        // If the element is partially above the viewport
        if (elementTop < viewportPadding) {
          scrollAmount = elementTop - viewportPadding;
        }
        // If the element is partially below the viewport
        else if (elementBottom > viewportHeight - viewportPadding) {
          scrollAmount = elementBottom - (viewportHeight - viewportPadding);
        }
        
        // If we need to scroll
        if (scrollAmount !== 0) {
          window.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
          });
        }
        
        // Update popover position
        setReviseButtonPosition({
          top: rect.top + window.scrollY,
          left: rect.right + window.scrollX + 8
        });
      }, 0);
    }
  };

  const [showReviseButton, setShowReviseButton] = useState(false);
  const canvasRef = useRef(null);
  const floatingRef = useRef(null);
  const ignoreNextClickAway = useRef(false);
  const [isRevisionPopoverExpanded, setIsRevisionPopoverExpanded] = useState(true);
  const [userInstructions, setUserInstructions] = useState('');
  const [revisedText, setRevisedText] = useState('');
  const [revisedTextMarkdown, setRevisedTextMarkdown] = useState('');
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [hasSubmittedRevision, setHasSubmittedRevision] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegeneratingPrompts, setIsRegeneratingPrompts] = useState(false);
  const [isAddingExplanation, setIsAddingExplanation] = useState(false);
  const toast = useToast();
  const [highlightTimeout, setHighlightTimeout] = useState(null);
  const [localHighlightedText, setLocalHighlightedText] = useState(null);
  const [highlightPosition, setHighlightPosition] = useState(null);
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const [isQuickRevisionsOpen, setIsQuickRevisionsOpen] = useState(false);
  const bulletPointsRef = useRef([]);
  const [lastRevisedText, setLastRevisedText] = useState(null);
  const [hasUserNavigated, setHasUserNavigated] = useState(false);

  // Add useEffect to monitor prop changes
  React.useEffect(() => {
    console.log('SpecCanvas: Props changed:', {
      highlightedText,
      resumeMarkdownLength: resumeMarkdown?.length,
      hasMarkdown: !!resumeMarkdown,
      timestamp: new Date().toISOString()
    });
  }, [highlightedText, resumeMarkdown]);

  // Update bullet points when markdown content changes
  React.useEffect(() => {
    if (resumeMarkdown) {
      const bullets = findBulletPoints(resumeMarkdown);
      bulletPointsRef.current = bullets;
      console.log('Updated bullet points:', bullets);
    }
  }, [resumeMarkdown]);

  // On first render, highlight only the first bullet but don't show popover
  React.useEffect(() => {
    if (!hasUserNavigated && bulletPointsRef.current.length > 0) {
      const firstBullet = bulletPointsRef.current[0];
      setCurrentBulletIndex(0);
      setSelectedText(firstBullet.text); // Set the selected text for the first bullet
      setShowRevisionPopover(false); // Don't show popover on first load
    }
  }, [resumeMarkdown, hasUserNavigated]);

  // Add useEffect to update selected text when current bullet changes
  React.useEffect(() => {
    if (currentBulletIndex >= 0 && currentBulletIndex < bulletPointsRef.current.length) {
      const bullet = bulletPointsRef.current[currentBulletIndex];
      setSelectedText(bullet.text);
    }
  }, [currentBulletIndex]);

  // Handle keyboard events
  const handleKeyDown = (e) => {
    // Ignore keyboard shortcuts if user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    // Handle space key for bullet selection
    if (e.key === ' ' && !e.repeat) {
      e.preventDefault();
      let nextIndex;
      if (currentBulletIndex === null || currentBulletIndex === -1) {
        // Select first bullet if none selected
        nextIndex = 0;
      } else {
        // Move to next bullet, wrap around if at the end
        nextIndex = (currentBulletIndex + 1) % bulletPointsRef.current.length;
      }
      // Update the current bullet index
      setCurrentBulletIndex(nextIndex);
      setHasUserNavigated(true); // Mark as user navigated
      // Selected text will be updated by the useEffect above
      setShowRevisionPopover(false); // Don't show popover when cycling through bullets
      // Clear any previous revision state when cycling bullets
      setRevisedText('');
      setRevisedTextMarkdown('');
      setHasSubmittedRevision(false);
      // Use setTimeout to ensure the highlight styles are applied before scrolling
      setTimeout(() => {
        const element = document.getElementById(`bullet-${nextIndex}`);
        if (!element) return;
        const rect = element.getBoundingClientRect();
        setReviseButtonPosition({
          top: rect.top + window.scrollY,
          left: rect.right + window.scrollX + 8
        });
      }, 0);
    }
    // Handle R key for expanding/collapsing revision dialog
    if (e.code === 'KeyR' && !e.repeat) {
      // Only handle R if we're not in an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      // If a bullet point is selected
      if (currentBulletIndex !== -1) {
        e.preventDefault(); // Prevent default behavior
        setShowRevisionPopover(true);
        setIsRevisionPopoverExpanded(prev => !prev); // Use functional update to ensure we get the latest state
      }
    }
    // Handle Down Arrow for next bullet
    if (e.code === 'ArrowDown' && !e.repeat) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      if (currentBulletIndex === -1) {
        highlightBulletPoint(0);
      } else {
        const nextIndex = (currentBulletIndex + 1) % bulletPointsRef.current.length;
        highlightBulletPoint(nextIndex);
      }
      setHasUserNavigated(true); // Mark as user navigated
      // Clear any previous revision state when cycling bullets
      setRevisedText('');
      setRevisedTextMarkdown('');
      setHasSubmittedRevision(false);
    }
    // Handle Up Arrow for previous bullet
    if (e.code === 'ArrowUp' && !e.repeat) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      if (currentBulletIndex === -1) {
        highlightBulletPoint(bulletPointsRef.current.length - 1);
      } else {
        const prevIndex = (currentBulletIndex - 1 + bulletPointsRef.current.length) % bulletPointsRef.current.length;
        highlightBulletPoint(prevIndex);
      }
      setHasUserNavigated(true); // Mark as user navigated
      // Clear any previous revision state when cycling bullets
      setRevisedText('');
      setRevisedTextMarkdown('');
      setHasSubmittedRevision(false);
    }
  };

  // Add keyboard event listener
  React.useEffect(() => {
    if (bulletPointsRef.current.length > 0) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [currentBulletIndex, bulletPointsRef.current.length]);

  // Remove onMouseUp from the canvas and use selectionchange event
  React.useEffect(() => {
    function handleSelectionChange() {
      if (showRevisionPopover) return; // Ignore selection changes while popover is open
      const selection = window.getSelection();
      const text = selection.toString().trim();
      if (
        text.length > 0 &&
        canvasRef.current &&
        selection.rangeCount > 0 &&
        canvasRef.current.contains(selection.anchorNode)
      ) {
        setSelectedText(text);
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setReviseButtonPosition({
          top: rect.top + window.scrollY - 40,
          left: rect.left + window.scrollX
        });
        setShowReviseButton(true);
      } else {
        setShowReviseButton(false);
        setShowRevisionPopover(false);
        setSelectedText('');
      }
    }
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [showRevisionPopover]);

  // Show popover when Revise button is clicked
  const handleReviseClick = () => {
    setShowRevisionPopover(true);
  };

  // Close popover
  const handleClosePopover = () => {
    setShowRevisionPopover(false);
    setUserInstructions('');
  };

  // Update handleSubmitRevision toast
  const handleSubmitRevision = async (prompt) => {
    if (!selectedText || !jobDescription) {
      toast({
        title: 'Missing Information',
        description: 'Please select text and provide a job description',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
        containerStyle: {
          width: '320px',
          maxWidth: '100%',
        }
      });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Submitting revision request with:', {
        selectedText,
        jobDescription: jobDescription.substring(0, 100) + '...',
        userInstructions: prompt,
        writingTone
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/spec/revise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedText,
          jobDescription,
          userInstructions: prompt,
          resumeContent: resumeMarkdown,
          writingTone,
          conversationId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get revision');
      }

      const data = await response.json();
      console.log('Revision response:', data);
      
      setRevisedText(data.revisedText);
      setRevisedTextMarkdown(data.revisedText);
      setHasSubmittedRevision(true);
      
      toast({
        title: 'Revision Ready',
        description: 'Text has been revised based on your instructions',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
        containerStyle: {
          width: '320px',
          maxWidth: '100%',
        }
      });
    } catch (error) {
      toast({
        title: 'Revision Failed',
        description: 'Unable to process your revision request',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
        containerStyle: {
          width: '320px',
          maxWidth: '100%',
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update handleAcceptRevision to handle version management
  const handleAcceptRevision = async (selectedText, revisedTextMarkdown) => {
    console.log('handleAcceptRevision called with:', {
      selectedText,
      revisedTextMarkdown
    });

    // Clear any text selection
    window.getSelection().removeAllRanges();
    setShowReviseButton(false);
    setHasUserNavigated(true); // Mark as user navigated after accepting
    // Set the recently revised text to trigger highlight
    setLastRevisedText(revisedTextMarkdown);
    // Do NOT clear currentBulletIndex here; keep the current bullet selected
    // Clear any existing timeout
    if (highlightTimeout) {
      clearTimeout(highlightTimeout);
    }
    // Set timeout to clear highlight after 1 second
    const timeout = setTimeout(() => {
      setLastRevisedText(null);
    }, 1000);
    setHighlightTimeout(timeout);

    // Close the popover immediately
    setShowRevisionPopover(false);
    setHasSubmittedRevision(false);
    setRevisedText('');
    setRevisedTextMarkdown('');
    setUserInstructions('');
    setSelectedText('');
    
    // Call the parent's onAcceptRevision to create a new version
    if (onAcceptRevision) {
      await onAcceptRevision(selectedText, revisedTextMarkdown);
    }
    
    // Add the explanation to the chat history
    if (conversationId) {
      setIsAddingExplanation(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/spec/revise`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            selectedText,
            jobDescription,
            userInstructions: userInstructions || 'Revise this text',
            resumeContent: resumeMarkdown,
            writingTone,
            conversationId,
            addToChat: true
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add explanation to chat');
        }

        const data = await response.json();
        
        const systemMessage = {
          role: 'system',
          content: data.explanation,
          timestamp: new Date().toISOString()
        };
        
        if (onUpdateMessages) {
          onUpdateMessages(prevMessages => [...prevMessages, systemMessage]);
        }
      } catch (error) {
        toast({
          title: 'Chat Update Failed',
          description: 'Unable to add explanation to chat',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
          containerStyle: {
            width: '320px',
            maxWidth: '100%',
          }
        });
      } finally {
        setIsAddingExplanation(false);
      }
    }
  };

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (highlightTimeout) {
        clearTimeout(highlightTimeout);
      }
    };
  }, [highlightTimeout]);

  // Handle reject - just close the popover
  const handleReject = () => {
    setShowRevisionPopover(false);
    setHasSubmittedRevision(false);
    setRevisedText('');
    setRevisedTextMarkdown('');
    setUserInstructions('');
  };

  // Update handleRegeneratePrompts to handle regeneration
  const handleRegeneratePrompts = async () => {
    if (!selectedText || !jobDescription) {
      toast({
        title: "Missing Information",
        description: "Please select text and provide a job description",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });
      return;
    }

    try {
      setIsRegeneratingPrompts(true);
      // Force regenerate and update cache
      await onRegeneratePrompts(selectedText, true);
      toast({
        title: "Prompts Updated",
        description: "New revision suggestions are ready",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });
    } catch (error) {
      console.error('Error generating prompts:', error);
      toast({
        title: "Error",
        description: "Failed to generate quick revisions",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });
    } finally {
      setIsRegeneratingPrompts(false);
    }
  };

  const handleAnalyzeJobDescription = async () => {
    if (!selectedText || !jobDescription) return;
    
    try {
      setIsAnalyzing(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/spec/analyze-job-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: jobDescription,
          selectedText,
          analysisType: 'full_analysis'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze job description');
      }

      const analysis = await response.json();
      console.log('Job description analysis:', analysis);

      // Update prompt presets if available
      if (analysis.results?.prompt_presets && onRegeneratePrompts) {
        onRegeneratePrompts(analysis.results.prompt_presets);
      }

      toast({
        title: 'Analysis Complete',
        description: 'Job description has been analyzed',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
        containerStyle: {
          width: '320px',
          maxWidth: '100%',
        }
      });

      return analysis;
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: 'Unable to analyze job description',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
        containerStyle: {
          width: '320px',
          maxWidth: '100%',
        }
      });
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add color mode values at the top of the component
  const textColor = useColorModeValue('gray.900', 'gray.900');
  const bgColor = useColorModeValue('gray.100', 'gray.100');
  const borderColor = useColorModeValue('gray.300', 'gray.300');
  const inputBgColor = useColorModeValue('gray.50', 'gray.50');
  const headingColor = useColorModeValue('purple.500', 'purple.500');
  const bulletColor = useColorModeValue('blue.400', 'blue.400');
  const highlightColor = useColorModeValue('purple.700', 'purple.700');
  const selectedBulletBg = useColorModeValue('#ede9fe', '#ede9fe'); // light purple
  const selectedBulletBorder = useColorModeValue('#a78bfa', '#a78bfa'); // medium purple
  const recentlyRevisedBg = useColorModeValue('#d1fae5', '#d1fae5'); // light green
  const recentlyRevisedTextColor = useColorModeValue('green.800', 'green.800');

  // Add the keyframes to the document head once
  React.useEffect(() => {
    if (!document.getElementById('pulse-keyframes')) {
      const style = document.createElement('style');
      style.id = 'pulse-keyframes';
      style.innerHTML = pulseKeyframes;
      document.head.appendChild(style);
    }
  }, []);

  if (!hasContent()) {
    return (
      <Box
        p={8}
        bg="white"
        borderRadius="lg"
        boxShadow="sm"
        textAlign="center"
        color="gray.500"
      >
        <Text>No resume loaded</Text>
      </Box>
    );
  }

  if (resumeMarkdown) {
    console.log('Rendering resumeMarkdown:', resumeMarkdown);
  }

  // Render the Revise button as a portal
  const reviseButtonPortal = showReviseButton ? ReactDOM.createPortal(
    <Box
      ref={floatingRef}
      position="absolute"
      top={reviseButtonPosition.top}
      left={reviseButtonPosition.left}
      zIndex={1000}
    >
      <Button
        size="sm"
        colorScheme="purple"
        variant="solid"
        pointerEvents="auto"
        onClick={handleReviseClick}
        isDisabled={!jobDescriptionProvided}
        opacity={jobDescriptionProvided ? 1 : 0.5}
        _hover={jobDescriptionProvided ? { bg: 'purple.600' } : { cursor: "not-allowed" }}
        transition="all 0.2s"
      >
        Revise
      </Button>
    </Box>,
    document.body
  ) : null;

  // Render the popover as a separate portal at the same coordinates (with offset)
  const revisionPopoverPortal = showRevisionPopover && isRevisionPopoverExpanded ? ReactDOM.createPortal(
    <Box
      position="absolute"
      top={`${reviseButtonPosition.top}px`}
      left={`${reviseButtonPosition.left}px`}
      bg="#fff"
      borderRadius="20px"
      border="1px solid #ececff"
      boxShadow="0 8px 32px rgba(139,92,246,0.10), 0 1px 3px rgba(0,0,0,0.05)"
      p={0}
      w="600px"
      zIndex={9999}
      pointerEvents="auto"
      color="#1a1a1a"
      fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif"
      fontSize="16px"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      overflow="hidden"
      style={{
        transform: 'translateY(-50%)',
        marginTop: '20px'
      }}
    >
      <Box px={7} pt={7} pb={6}>
        {/* Original Text Section */}
        <HStack mb={3} align="center">
          <Box as="span" color="#8B5CF6" fontSize="18px" mr={2}>
            <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect width="20" height="20" rx="5" fill="#F3F0FF"/><path d="M7.5 5.5A1.5 1.5 0 0 1 9 4h2c.83 0 1.5.67 1.5 1.5V6H15c.28 0 .5.22.5.5v8A1.5 1.5 0 0 1 14 16H6a1.5 1.5 0 0 1-1.5-1.5v-8c0-.28.22-.5.5-.5h2.5v-.5ZM9 4.5v1h2v-1H9Zm-3 2v8A.5.5 0 0 0 6 15h8a.5.5 0 0 0 .5-.5v-8H6Z" fill="#8B5CF6"/></svg>
          </Box>
          <Text fontWeight={700} fontSize="15px" color="#1a1a1a">Original</Text>
        </HStack>
        <Box
          p={4}
          bg="#fafbfc"
          borderRadius="12px"
          fontSize="15px"
          fontFamily="SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
          whiteSpace="pre-wrap"
          color="#1a1a1a"
          border="1px solid #ececff"
          mb={6}
        >
          {selectedText}
        </Box>
        {/* Revised Output and Accept/Reject UX (moved up) */}
        {hasSubmittedRevision && (
          <Box mb={6}>
            <Text fontWeight={700} fontSize="15px" color="#1a1a1a" mb={2}>Revised</Text>
            <Box
              p={4}
              bg="#fafbfc"
              borderRadius="12px"
              fontSize="15px"
              fontFamily="SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
              whiteSpace="pre-wrap"
              color="#1a1a1a"
              border="1px solid #ececff"
              mb={4}
            >
              {unescapeMarkdown(revisedText)}
            </Box>
            <HStack spacing={3} justify="flex-end">
              <Button
                size="md"
                variant="outline"
                color="#ef4444"
                borderColor="#ef4444"
                borderRadius="10px"
                fontWeight={600}
                onClick={handleReject}
                _hover={{ bg: '#fef2f2', borderColor: '#ef4444' }}
              >
                Reject
              </Button>
              <Button
                size="md"
                variant="solid"
                bgGradient="linear(135deg, #8B5CF6 0%, #A855F7 100%)"
                color="#fff"
                borderRadius="10px"
                fontWeight={600}
                onClick={() => handleAcceptRevision(selectedText, revisedTextMarkdown)}
                _hover={{ bgGradient: 'linear(135deg, #A855F7 0%, #8B5CF6 100%)', transform: 'translateY(-1px)', boxShadow: '0 4px 16px rgba(139,92,246,0.15)' }}
                _active={{ transform: 'translateY(0)' }}
              >
                Accept
              </Button>
            </HStack>
            <Divider my={6} borderColor="#ececff" />
          </Box>
        )}
        {/* Quick Revisions Section */}
        {getQuickRevisionsForBullet && (
          <Box mb={6}>
            <Box
              bg="rgba(139,92,246,0.06)"
              borderRadius="12px"
              border="1px solid rgba(139,92,246,0.12)"
              px={5}
              py={3}
              mb={2}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              cursor="pointer"
              onClick={() => setIsQuickRevisionsOpen(!isQuickRevisionsOpen)}
              _hover={{ bg: 'rgba(139,92,246,0.09)' }}
              transition="all 0.2s"
            >
              <Text color="#8B5CF6" fontWeight={600} fontSize="15px">Quick Revisions</Text>
              <Box color="#8B5CF6" fontSize="18px" ml={2}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Box>
            </Box>
            <Collapse in={isQuickRevisionsOpen} animateOpacity>
              <Box mt={2} mb={2}>
                <Button
                  size="sm"
                  variant="ghost"
                  color="#8B5CF6"
                  fontWeight={600}
                  fontSize="15px"
                  borderRadius="8px"
                  px={3}
                  py={2}
                  mb={2}
                  isLoading={isRegeneratingPrompts}
                  onClick={handleRegeneratePrompts}
                  _hover={{ bg: 'rgba(139,92,246,0.08)' }}
                >
                  {getQuickRevisionsForBullet(selectedText)?.length > 0 ? 'Regenerate' : 'Generate'}
                </Button>
                <VStack align="stretch" spacing={2}>
                  {getQuickRevisionsForBullet(selectedText)?.length > 0 ? (
                    getQuickRevisionsForBullet(selectedText).map((preset, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="ghost"
                        justifyContent="flex-start"
                        color="#8B5CF6"
                        fontWeight={600}
                        fontSize="15px"
                        borderRadius="8px"
                        px={3}
                        py={2}
                        _hover={{ bg: 'rgba(139,92,246,0.08)' }}
                        onClick={() => setUserInstructions(preset.prompt)}
                      >
                        {preset.title}
                      </Button>
                    ))
                  ) : (
                    <Text color="#8B5CF6" fontSize="14px" py={2} textAlign="center">No quick revisions available</Text>
                  )}
                </VStack>
              </Box>
            </Collapse>
          </Box>
        )}
        {/* Instructions Section */}
        <Box mb={2}>
          <Text fontWeight={700} fontSize="15px" color="#1a1a1a" mb={2}>Instructions</Text>
          <Textarea
            value={userInstructions}
            onChange={e => setUserInstructions(e.target.value)}
            placeholder="E.g., Make this more results-oriented"
            size="md"
            rows={4}
            bg="#fff"
            color="#1a1a1a"
            borderRadius="12px"
            border="1px solid #ececff"
            fontSize="15px"
            fontFamily="inherit"
            _placeholder={{ color: '#b0b6c3' }}
            _focus={{ borderColor: '#8B5CF6', boxShadow: '0 0 0 2px rgba(139,92,246,0.10)' }}
            mb={1}
            resize="vertical"
            maxLength={500}
          />
          <Flex justify="flex-end" fontSize="12px" color="#b0b6c3">
            {userInstructions.length} / 500
          </Flex>
        </Box>
        <Button
          w="100%"
          mt={4}
          py={5}
          borderRadius="12px"
          fontSize="16px"
          fontWeight={600}
          bgGradient="linear(135deg, #8B5CF6 0%, #A855F7 100%)"
          color="#fff"
          _hover={{ bgGradient: 'linear(135deg, #A855F7 0%, #8B5CF6 100%)', transform: 'translateY(-1px)', boxShadow: '0 4px 16px rgba(139,92,246,0.15)' }}
          _active={{ transform: 'translateY(0)' }}
          isLoading={isSubmitting}
          loadingText="Revising..."
          onClick={() => handleSubmitRevision(userInstructions)}
        >
          Submit
        </Button>
      </Box>
    </Box>,
    document.body
  ) : null;

  // Debug: log showRevisionPopover before render
  console.log('showRevisionPopover (before render):', showRevisionPopover);

  return (
    <Box>
      {/* Show emphasis areas if available */}
      <EmphasisAreas emphasis={resumeEmphasis} />
      <Box
        ref={canvasRef}
        p={{ base: 4, md: 8 }}
        bg="#f8fafc"
        borderRadius="16px"
        border="1px solid #e5e7eb"
        boxShadow="0 4px 24px rgba(139,92,246,0.08), 0 1.5px 6px rgba(0,0,0,0.04)"
        position="relative"
        color="#1a1a1a"
        fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif"
        fontSize="16px"
        lineHeight="1.7"
        _hover={{ boxShadow: '0 8px 32px rgba(139,92,246,0.12), 0 1.5px 6px rgba(0,0,0,0.06)' }}
        transition="all 0.2s cubic-bezier(0.4,0,0.2,1)"
      >
        {/* Floating Revise Button (via portal) */}
        {reviseButtonPortal}
        {/* Revision Popover (via portal) */}
        {revisionPopoverPortal}
        {/* Loading indicator for explanation */}
        {isAddingExplanation && (
          <Box
            position="fixed"
            bottom="20px"
            right="20px"
            bg="#f8fafc"
            p={3}
            borderRadius="md"
            boxShadow="md"
            zIndex={1002}
            color="#1a1a1a"
            maxH="calc(100vh - 40px)"
            overflowY="auto"
            border="1px solid #e5e7eb"
          >
            <Text fontSize="sm" color="#8b949e">Adding explanation to chat...</Text>
          </Box>
        )}
        <VStack align="stretch" spacing={6}>
          {/* Render Markdown */}
          {resumeMarkdown && (
            <Box 
              whiteSpace="pre-wrap" 
              userSelect="text"
              position="relative"
            >
              {renderContent(resumeMarkdown)}
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default SpecCanvas;