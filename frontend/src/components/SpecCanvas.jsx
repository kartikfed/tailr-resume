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
  useDisclosure
} from '@chakra-ui/react';
import { CheckCircleIcon, RepeatIcon, CloseIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import ReactDOM from 'react-dom';

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
  resumeEmphasis = null
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
    
    // Render the content normally
    return (
      <Box 
        whiteSpace="pre-wrap" 
        userSelect="text"
        position="relative"
      >
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>
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

  // Function to highlight a bullet point
  const highlightBulletPoint = (index) => {
    if (index >= 0 && index < bulletPointsRef.current.length) {
      setCurrentBulletIndex(index);
      const bullet = bulletPointsRef.current[index];
      setSelectedText(bullet.text);
      
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
        
        // Update popover position if it's open
        if (showRevisionPopover) {
          setReviseButtonPosition({
            top: rect.top + window.scrollY,
            left: rect.right + window.scrollX + 8
          });
        }
      }, 0); // Use setTimeout to ensure the highlight styles are applied
    }
  };

  const [showReviseButton, setShowReviseButton] = useState(false);
  const [reviseButtonPosition, setReviseButtonPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const canvasRef = useRef(null);
  const floatingRef = useRef(null);
  const ignoreNextClickAway = useRef(false);
  const [showRevisionPopover, setShowRevisionPopover] = useState(false);
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
  const [currentBulletIndex, setCurrentBulletIndex] = useState(-1);
  const bulletPointsRef = useRef([]);
  const [recentlyRevisedText, setRecentlyRevisedText] = useState(null);
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

  // On first render, highlight only the first bullet
  React.useEffect(() => {
    if (!hasUserNavigated && bulletPointsRef.current.length > 0) {
      setCurrentBulletIndex(0);
    }
  }, [resumeMarkdown, hasUserNavigated]);

  // Handle keyboard events
  const handleKeyDown = (event) => {
    if (!hasUserNavigated && bulletPointsRef.current.length > 0) {
      setHasUserNavigated(true);
    }
    // Handle space bar for bullet point navigation
    if (event.code === 'Space' && !event.repeat) {
      event.preventDefault();
      
      // Only handle space if we're not in an input or textarea
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      if (currentBulletIndex === -1) {
        // If no bullet is selected, select the first one
        highlightBulletPoint(0);
      } else {
        // Move to the next bullet point
        const nextIndex = (currentBulletIndex + 1) % bulletPointsRef.current.length;
        highlightBulletPoint(nextIndex);
      }
    }
    
    // Handle R key for expanding/collapsing revision dialog
    if (event.code === 'KeyR' && !event.repeat) {
      // Only handle R if we're not in an input or textarea
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      // If a bullet point is selected and revision popover is shown
      if (currentBulletIndex !== -1 && showRevisionPopover) {
        event.preventDefault(); // Prevent default behavior
        setIsRevisionPopoverExpanded(prev => !prev); // Use functional update to ensure we get the latest state
      }
    }

    // Handle Down Arrow for next bullet
    if (event.code === 'ArrowDown' && !event.repeat) {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
      event.preventDefault();
      if (currentBulletIndex === -1) {
        highlightBulletPoint(0);
      } else {
        const nextIndex = (currentBulletIndex + 1) % bulletPointsRef.current.length;
        highlightBulletPoint(nextIndex);
      }
    }

    // Handle Up Arrow for previous bullet
    if (event.code === 'ArrowUp' && !event.repeat) {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
      event.preventDefault();
      if (currentBulletIndex === -1) {
        highlightBulletPoint(bulletPointsRef.current.length - 1);
      } else {
        const prevIndex = (currentBulletIndex - 1 + bulletPointsRef.current.length) % bulletPointsRef.current.length;
        highlightBulletPoint(prevIndex);
      }
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

  // Modify handleAcceptRevision to add highlight effect
  const handleAcceptRevision = async (selectedText, revisedTextMarkdown) => {
    console.log('handleAcceptRevision called with:', {
      selectedText,
      revisedTextMarkdown
    });

    // Clear any text selection
    window.getSelection().removeAllRanges();
    setShowReviseButton(false);

    // Set the recently revised text to trigger highlight
    setRecentlyRevisedText(revisedTextMarkdown);
    
    // Clear any existing timeout
    if (highlightTimeout) {
      clearTimeout(highlightTimeout);
    }
    
    // Set timeout to clear highlight after 1 second
    const timeout = setTimeout(() => {
      setRecentlyRevisedText(null);
      setCurrentBulletIndex(-1); // Reset the current bullet index to remove purple highlight
    }, 1000);
    setHighlightTimeout(timeout);

    // Close the popover immediately
    setShowRevisionPopover(false);
    setHasSubmittedRevision(false);
    setRevisedText('');
    setRevisedTextMarkdown('');
    setUserInstructions('');
    setSelectedText('');
    
    // Update the content
    onAcceptRevision(selectedText, revisedTextMarkdown);
    
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

  // Update handleRegeneratePrompts toast
  const handleRegeneratePrompts = async () => {
    if (!selectedText || !jobDescription) return;
    
    setIsRegeneratingPrompts(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/spec/analyze-job-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: jobDescription,
          analysisType: 'full_analysis',
          selectedText,
          writingTone
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Failed to regenerate prompts:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData?.message || `Failed to regenerate prompts: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.results?.prompt_presets) {
        onRegeneratePrompts(data.results.prompt_presets);
        toast({
          title: 'Prompts Updated',
          description: 'New revision suggestions are ready',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
          containerStyle: {
            width: '320px',
            maxWidth: '100%',
          }
        });
      }
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Unable to generate new suggestions',
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
  const textColor = useColorModeValue('black', 'black');
  const bgColor = useColorModeValue('white', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.200');
  const inputBgColor = useColorModeValue('gray.50', 'gray.50');

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
  const reviseButtonPortal = showReviseButton && !showRevisionPopover ? ReactDOM.createPortal(
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
  const revisionPopoverPortal = showRevisionPopover ? ReactDOM.createPortal(
    <Box
      position="absolute"
      top={reviseButtonPosition.top}
      left={reviseButtonPosition.left}
      bg={isRevisionPopoverExpanded ? "gray.800" : "gray.900"}
      boxShadow="lg"
      borderRadius="xl"
      p={isRevisionPopoverExpanded ? 4 : 2}
      w={isRevisionPopoverExpanded ? "480px" : "120px"}
      zIndex={1001}
      pointerEvents="auto"
      color="gray.100"
      border="1px solid"
      borderColor={isRevisionPopoverExpanded ? "gray.700" : "purple.500"}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      overflow="hidden"
      willChange="width"
      _hover={!isRevisionPopoverExpanded ? {
        borderColor: "purple.400",
        boxShadow: "0 0 0 1px var(--chakra-colors-purple-400)",
      } : {}}
    >
      <VStack align="stretch" spacing={isRevisionPopoverExpanded ? 3 : 0} transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)">
        <Collapse in={isRevisionPopoverExpanded} animateOpacity style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <VStack align="stretch" spacing={3} transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)">
            {/* Original Text Section */}
            <Box>
              <Flex align="center" mb={2}>
                <Text fontWeight="medium" fontSize="xs" color="gray.400" mr={2}>Original</Text>
                <Box h="1px" flex="1" bg="gray.700" />
              </Flex>
              <Box 
                p={3} 
                bg="gray.700" 
                borderRadius="md" 
                fontSize="sm" 
                fontFamily="mono" 
                whiteSpace="pre-wrap" 
                color="gray.100" 
                border="1px solid"
                borderColor="gray.600"
              >
                {selectedText}
              </Box>
            </Box>

            {/* Revised Text Section */}
            {hasSubmittedRevision && (
              <Box>
                <Flex align="center" mb={2}>
                  <Text fontWeight="medium" fontSize="xs" color="green.400" mr={2}>Revised</Text>
                  <Box h="1px" flex="1" bg="gray.700" />
                </Flex>
                <Box
                  p={3}
                  bg="gray.700"
                  borderRadius="md"
                  fontSize="sm"
                  fontFamily="mono"
                  whiteSpace="pre-wrap"
                  color="gray.100"
                  border="1px solid"
                  borderColor="gray.600"
                >
                  <Text color="gray.100">{unescapeMarkdown(revisedText)}</Text>
                </Box>
              </Box>
            )}

            {/* Quick Revisions Section */}
            {promptPresets.length > 0 && (
              <Box>
                <Flex 
                  align="center" 
                  mb={2}
                  gap={1}
                >
                  <HStack spacing={1}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.300">Quick Revisions</Text>
                    <IconButton
                      icon={<ChevronDownIcon />}
                      size="md"
                      variant="ghost"
                      color="gray.400"
                      _hover={{ bg: 'gray.700', color: 'gray.200' }}
                      onClick={() => setIsQuickRevisionsOpen(!isQuickRevisionsOpen)}
                      aria-label={isQuickRevisionsOpen ? "Collapse quick revisions" : "Expand quick revisions"}
                      transform={isQuickRevisionsOpen ? "rotate(180deg)" : "none"}
                      transition="all 0.2s"
                    />
                  </HStack>
                </Flex>
                <Collapse in={isQuickRevisionsOpen}>
                  <Box mb={2}>
                    <Button
                      size="xs"
                      variant="solid"
                      onClick={handleRegeneratePrompts}
                      isLoading={isRegeneratingPrompts}
                      colorScheme="purple"
                      _hover={{ bg: 'purple.600' }}
                      fontSize="xs"
                      fontWeight="medium"
                      px={3}
                      mb={2}
                      leftIcon={<RepeatIcon />}
                    >
                      Regenerate
                    </Button>
                    <SimpleGrid columns={1} spacing={2}>
                      {promptPresets.map((preset, index) => (
                        <Button
                          key={index}
                          size="xs"
                          variant="outline"
                          onClick={() => setUserInstructions(preset.prompt)}
                          textAlign="left"
                          justifyContent="flex-start"
                          whiteSpace="normal"
                          height="auto"
                          py={2}
                          px={3}
                          color="gray.300"
                          borderColor="gray.600"
                          _hover={{ bg: 'gray.700', borderColor: 'gray.500', color: 'gray.100' }}
                          fontSize="sm"
                          maxW="400px"
                          alignSelf="flex-start"
                        >
                          {preset.title}
                        </Button>
                      ))}
                    </SimpleGrid>
                  </Box>
                </Collapse>
              </Box>
            )}
            
            {/* Instructions Input */}
            <Box>
              <Text fontWeight="medium" fontSize="xs" color="gray.400" mb={2}>Instructions</Text>
              <Textarea
                value={userInstructions}
                onChange={e => setUserInstructions(e.target.value)}
                placeholder="E.g., Make this more results-oriented"
                size="sm"
                rows={4}
                bg="gray.700"
                color="gray.100"
                _placeholder={{ color: 'gray.500' }}
                borderColor="gray.600"
                borderRadius="md"
                fontSize="sm"
                _hover={{ borderColor: 'gray.500' }}
                _focus={{ borderColor: 'blue.400', boxShadow: 'none' }}
                sx={{
                  '&::-webkit-scrollbar': {
                    width: '8px',
                    backgroundColor: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'gray.600',
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: 'gray.500',
                    },
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent',
                  },
                }}
              />
            </Box>

            <HStack justify="space-between" spacing={3} pt={1}>
              <HStack spacing={2}>
                {hasSubmittedRevision && (
                  <>
                    <Button 
                      size="sm" 
                      colorScheme="red" 
                      variant="outline"
                      onClick={handleReject}
                      _hover={{ bg: 'red.900', borderColor: 'red.400' }}
                    >
                      Reject
                    </Button>
                    <Button 
                      size="sm" 
                      colorScheme="green" 
                      variant="outline"
                      onClick={() => {
                        console.log('Accept button clicked');
                        handleAcceptRevision(selectedText, revisedTextMarkdown);
                      }}
                      _hover={{ bg: 'green.900', borderColor: 'green.400' }}
                    >
                      Accept
                    </Button>
                  </>
                )}
              </HStack>
              <Button
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={() => handleSubmitRevision(userInstructions)}
                isLoading={isSubmitting}
                loadingText="Revising..."
                _hover={{ bg: 'blue.900', borderColor: 'blue.400' }}
              >
                Submit
              </Button>
            </HStack>
          </VStack>
        </Collapse>

        {/* Collapsed state indicator with buttons */}
        {!isRevisionPopoverExpanded && (
          <Flex 
            align="center" 
            justify="space-between" 
            py={0.5}
            px={1.5}
            bg="gray.800"
            borderRadius="md"
            border="1px solid"
            borderColor="purple.500"
            _hover={{
              borderColor: "purple.400",
              bg: "gray.700"
            }}
          >
            <Text 
              fontSize="2xs" 
              color="purple.400" 
              fontWeight="medium"
              letterSpacing="0.5px"
            >
              Expand
            </Text>
            <HStack spacing={0.5}>
              <IconButton
                icon={<ChevronDownIcon />}
                size="xs"
                variant="ghost"
                onClick={() => setIsRevisionPopoverExpanded(!isRevisionPopoverExpanded)}
                aria-label={isRevisionPopoverExpanded ? "Collapse popover" : "Expand popover"}
                color="purple.400"
                _hover={{ bg: 'gray.700', color: 'purple.300' }}
                transform="rotate(-90deg)"
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                boxSize="18px"
                minW="18px"
                minH="18px"
              />
              <IconButton
                icon={<CloseIcon />}
                size="xs"
                variant="ghost"
                onClick={handleClosePopover}
                aria-label="Close popover"
                color="purple.400"
                _hover={{ bg: 'gray.700', color: 'purple.300' }}
                boxSize="18px"
                minW="18px"
                minH="18px"
              />
            </HStack>
          </Flex>
        )}
      </VStack>
    </Box>,
    document.body
  ) : null;

  // Debug: log showRevisionPopover before render
  console.log('showRevisionPopover (before render):', showRevisionPopover);

  // Add resume focus points section
  const renderResumeFocusPoints = () => {
    if (!resumeEmphasis) return null;

    return (
      <Box 
        mb={4} 
        bg="white"
        borderRadius="xl"
        border="1px solid"
        borderColor="purple.100"
        overflow="hidden"
        boxShadow="sm"
        transition="all 0.2s ease-in-out"
        _hover={{ boxShadow: 'md' }}
      >
        <Flex
          p={4}
          justify="space-between"
          align="center"
          cursor="pointer"
          onClick={onToggle}
          bg="purple.50"
          _hover={{ bg: 'purple.100' }}
          transition="all 0.2s ease-in-out"
        >
          <Heading size="sm" color="purple.700" fontWeight="600">Emphasis Areas</Heading>
          <IconButton
            icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            variant="ghost"
            colorScheme="purple"
            aria-label={isOpen ? "Collapse" : "Expand"}
            size="sm"
            _hover={{ bg: 'purple.200' }}
            transition="all 0.2s ease-in-out"
          />
        </Flex>
        <Collapse in={isOpen}>
          <Box p={4} pt={3}>
            <Text mb={4} color="purple.800" fontSize="sm" lineHeight="tall">
              {resumeEmphasis.summary}
            </Text>
            <List spacing={3}>
              {resumeEmphasis.key_points.map((point, index) => (
                <ListItem 
                  key={index} 
                  display="flex" 
                  alignItems="flex-start"
                  bg="purple.50"
                  p={2}
                  borderRadius="md"
                  transition="all 0.2s ease-in-out"
                  _hover={{ bg: 'purple.100' }}
                >
                  <ListIcon as={CheckCircleIcon} color="purple.500" mt={1} />
                  <Text color="purple.800" fontSize="sm">{point}</Text>
                </ListItem>
              ))}
            </List>
          </Box>
        </Collapse>
      </Box>
    );
  };

  return (
    <Box>
      {renderResumeFocusPoints()}
      <Box
        ref={canvasRef}
        p={6}
        bg={bgColor}
        borderRadius="xl"
        boxShadow="sm"
        position="relative"
        style={{ overflow: 'visible', zIndex: 9999 }}
        color={textColor}
        border="1px solid"
        borderColor={borderColor}
      >
        {/* Floating Revise Button (via portal) */}
        {reviseButtonPortal}
        {/* Revision Popover (via portal, fixed position for debug) */}
        {revisionPopoverPortal}
        {/* Loading indicator for explanation */}
        {isAddingExplanation && (
          <Box
            position="fixed"
            bottom="20px"
            right="20px"
            bg={bgColor}
            p={3}
            borderRadius="md"
            boxShadow="md"
            zIndex={1002}
            color={textColor}
            maxH="calc(100vh - 40px)"
            overflowY="auto"
            sx={{
              '&::-webkit-scrollbar': {
                width: '8px',
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'gray.600',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: 'gray.500',
                },
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
            }}
          >
            <Text fontSize="sm" color="gray.600">Adding explanation to chat...</Text>
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
              <ReactMarkdown
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({ node, children, ...props }) => (
                    <Heading as="h1" size="xl" mb={4} color={textColor} {...props}>
                      {children}
                    </Heading>
                  ),
                  h2: ({ node, children, ...props }) => (
                    <Heading as="h2" size="lg" mb={3} color={textColor} {...props}>
                      {children}
                    </Heading>
                  ),
                  h3: ({ node, children, ...props }) => (
                    <Heading as="h3" size="md" mb={2} color={textColor} {...props}>
                      {children}
                    </Heading>
                  ),
                  li: ({ node, children, ...props }) => {
                    // Get the text content of the list item
                    const textContent = React.Children.toArray(children)
                      .filter(child => typeof child === 'string')
                      .join('')
                      .trim();
                    
                    // Find the matching bullet point
                    const bulletIndex = bulletPointsRef.current.findIndex(
                      bullet => bullet.text === textContent
                    );
                    
                    // Check if this is the recently revised text
                    const isRecentlyRevised = recentlyRevisedText === textContent;
                    
                    // Add pulse animation for the first bullet if not navigated
                    const isFirstBullet = bulletIndex === 0;
                    const showPulse = isFirstBullet && !hasUserNavigated;
                    return (
                      <Box
                        as="li"
                        id={`bullet-${bulletIndex}`}
                        bg={
                          isRecentlyRevised 
                            ? 'green.100' 
                            : bulletIndex === currentBulletIndex 
                              ? 'purple.100' 
                              : 'transparent'
                        }
                        p={isRecentlyRevised || bulletIndex === currentBulletIndex ? 2 : 0}
                        borderRadius="md"
                        transition="all 0.2s"
                        position="relative"
                        style={showPulse ? { animation: 'pulse 1.2s infinite' } : {}}
                        {...props}
                      >
                        {children}
                        {bulletIndex === currentBulletIndex && (
                          <Box
                            position="absolute"
                            top="-20px"
                            right="0"
                            transform="scale(0.8)"
                            transformOrigin="top right"
                            style={showPulse ? { animation: 'pulse 1.2s infinite' } : {}}
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
                {resumeMarkdown}
              </ReactMarkdown>
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default SpecCanvas;