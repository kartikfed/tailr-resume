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

/**
 * Component for rendering resume content with text selection and revision support
 */
const SpecCanvas = ({
  resumeStructured = null,
  resumeMarkdown = null,
  resumeHtml = null,
  resumeSections = null,
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
    resumeStructured,
    resumeMarkdown,
    jobDescriptionProvided,
    jobDescriptionLength: jobDescription?.length || 0,
    jobDescription: jobDescription?.substring(0, 50) + '...' // Log first 50 chars
  });

  // Check if any content is available
  const hasContent = () => {
    console.log('Checking content:', {
      hasStructured: !!resumeStructured,
      hasMarkdown: !!resumeMarkdown
    });
    
    return !!resumeStructured || !!resumeMarkdown;
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

  const [showReviseButton, setShowReviseButton] = useState(false);
  const [reviseButtonPosition, setReviseButtonPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const canvasRef = useRef(null);
  const floatingRef = useRef(null);
  const ignoreNextClickAway = useRef(false);
  const [showRevisionPopover, setShowRevisionPopover] = useState(false);
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

  // Add useEffect to monitor prop changes
  React.useEffect(() => {
    console.log('SpecCanvas: Props changed:', {
      highlightedText,
      resumeMarkdownLength: resumeMarkdown?.length,
      hasStructured: !!resumeStructured,
      timestamp: new Date().toISOString()
    });
  }, [highlightedText, resumeMarkdown, resumeStructured]);

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

  // Modify handleAcceptRevision to remove highlight logic
  const handleAcceptRevision = async (selectedText, revisedTextMarkdown) => {
    console.log('handleAcceptRevision called with:', {
      selectedText,
      revisedTextMarkdown
    });

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
  const revisionPopoverPortal = showRevisionPopover ? ReactDOM.createPortal(
    <Box
      position="absolute"
      top={reviseButtonPosition.top + 36}
      left={reviseButtonPosition.left}
      bg="gray.800"
      boxShadow="lg"
      borderRadius="xl"
      p={4}
      minW="480px"
      maxW="600px"
      zIndex={1001}
      pointerEvents="auto"
      color="gray.100"
      border="1px solid"
      borderColor="gray.700"
    >
      <VStack align="stretch" spacing={3}>
        {/* Add X button in top right */}
        <Flex justify="flex-end">
          <IconButton
            icon={<CloseIcon />}
            size="xs"
            variant="ghost"
            onClick={handleClosePopover}
            aria-label="Close popover"
            color="gray.400"
            _hover={{ bg: 'gray.700', color: 'gray.200' }}
          />
        </Flex>

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
              p={2}
              borderRadius="md"
            >
              <Text fontWeight="medium" fontSize="xs" color="gray.400" flex="1">Quick Revisions</Text>
              <IconButton
                icon={isQuickRevisionsOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                variant="ghost"
                colorScheme="purple"
                aria-label={isQuickRevisionsOpen ? "Collapse" : "Expand"}
                size="md"
                onClick={() => setIsQuickRevisionsOpen(!isQuickRevisionsOpen)}
                _hover={{ bg: 'gray.600' }}
              />
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
          {/* Render Markdown if present (Claude flow) */}
          {resumeMarkdown && (
            <Box key={resumeMarkdown.length}>
              <ReactMarkdown
                children={unescapeMarkdown(resumeMarkdown)}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({node, ...props}) => <Heading as="h1" size="lg" my={4} color={textColor} {...props} />,
                  h2: ({node, ...props}) => <Heading as="h2" size="md" my={3} color={textColor} {...props} />,
                  h3: ({node, ...props}) => <Heading as="h3" size="sm" my={2} color={textColor} {...props} />,
                  p: ({node, ...props}) => (
                    <Text my={2} color={textColor}>
                      {props.children}
                    </Text>
                  ),
                  strong: ({node, ...props}) => (
                    <Text as="span" fontWeight="bold" color={textColor}>
                      {props.children}
                    </Text>
                  ),
                  em: ({node, ...props}) => (
                    <Text as="span" fontStyle="italic" color={textColor}>
                      {props.children}
                    </Text>
                  ),
                  hr: ({node, ...props}) => <Divider my={4} borderColor={borderColor} {...props} />,
                  text: ({node, ...props}) => (
                    <Text as="span" color={textColor}>
                      {props.children}
                    </Text>
                  )
                }}
              />
            </Box>
          )}
          {/* Fallback: Render structured data (Affinda flow) */}
          {!resumeMarkdown && resumeStructured && (
            <>
              {/* Metadata */}
              {resumeStructured.metadata && (
                <Box mb={6}>
                  <Heading as="h3" size="md" mb={2} color={textColor}>Contact Information</Heading>
                  <VStack align="start" spacing={1}>
                    {resumeStructured.metadata.name && (
                      <Text fontWeight="bold" color={textColor}>{resumeStructured.metadata.name}</Text>
                    )}
                    {resumeStructured.metadata.email && (
                      <Text color="gray.600">{resumeStructured.metadata.email}</Text>
                    )}
                    {resumeStructured.metadata.phone && (
                      <Text color="gray.600">{resumeStructured.metadata.phone}</Text>
                    )}
                    {resumeStructured.metadata.location && (
                      <Text color="gray.600">{resumeStructured.metadata.location}</Text>
                    )}
                  </VStack>
                </Box>
              )}

              {/* Sections */}
              {resumeStructured.sections?.map((section) => (
                <Box key={section.id} mb={6}>
                  <Heading as="h3" size="md" mb={3} color={textColor}>{section.title}</Heading>
                  {section.type === 'text' && (
                    renderContent(section.content)
                  )}
                  {section.type === 'list' && section.items && (
                    <List spacing={4}>
                      {section.items.map((item) => (
                        <ListItem key={item.id}>
                          <Flex direction="column" gap={1}>
                            {item.title && (
                              <Text fontWeight="bold" color={textColor}>{item.title}</Text>
                            )}
                            {item.company && (
                              <Text color="gray.600">{item.company}</Text>
                            )}
                            {item.location && (
                              <Text color="gray.600" fontSize="sm">{item.location}</Text>
                            )}
                            {item.dates && (
                              <Text fontSize="sm" color="gray.500">{item.dates}</Text>
                            )}
                            {/* Render only bullets */}
                            {item.bullets && item.bullets.length > 0 && (
                              <List spacing={2} styleType="disc" pl={4}>
                                {item.bullets.map((bullet, bIdx) => (
                                  <ListItem key={bIdx} color="gray.700">{bullet}</ListItem>
                                ))}
                              </List>
                            )}
                            {item.name && (
                              <Badge colorScheme="blue" width="fit-content">
                                {item.name}
                              </Badge>
                            )}
                          </Flex>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              ))}
            </>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default SpecCanvas;