import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  ChakraProvider,
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Divider,
  useToast,
  Flex,
  Spacer,
  Button,
  useColorModeValue,
  IconButton,
  Collapse,
  Progress
} from '@chakra-ui/react';
import { sendMessage, uploadFiles, getConversation } from './services/apiService';
import { CheckCircleIcon, ChevronLeftIcon, ChatIcon } from '@chakra-ui/icons';

import ChatInput from './components/ChatInput';
import FileUpload from './components/FileUpload';
import MessageHistory from './components/MessageHistory';
import SpecCanvas from './components/SpecCanvas';
import ToneSelector from './components/ToneSelector';
import TextInput from './components/TextInput';
import KeyboardInstructions from './components/KeyboardInstructions';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [conversationId, setConversationId] = useState(`conv-${Date.now()}`);
  const [canvasContent, setCanvasContent] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobDescriptionSaved, setJobDescriptionSaved] = useState(false);
  const [jobDescriptionProvided, setJobDescriptionProvided] = useState(false);
  const [isSavingJobDescription, setIsSavingJobDescription] = useState(false);
  const [resumeEmphasis, setResumeEmphasis] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [userInstructions, setUserInstructions] = useState('');
  const [revisedText, setRevisedText] = useState('');
  const [revisedTextMarkdown, setRevisedTextMarkdown] = useState('');
  const [hasSubmittedRevision, setHasSubmittedRevision] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  
  // Color mode values for styling
  const bgColor = useColorModeValue('gray.900', 'gray.900');
  const borderColor = useColorModeValue('gray.700', 'gray.700');
  const textColor = useColorModeValue('gray.100', 'gray.100');
  const chatPaneBgColor = useColorModeValue('purple.900', 'purple.900');
  const chatInputBgColor = useColorModeValue('purple.800', 'purple.800');
  
  const [appMode, setAppMode] = useState('upload');
  const [highlightedText, setHighlightedText] = useState(null);
  const [promptPresets, setPromptPresets] = useState([]);
  const [writingTone, setWritingTone] = useState('concise');

  const textBlockRef = useRef(null);
  const [logoHeight, setLogoHeight] = useState(0);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [progressValue, setProgressValue] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');

  useLayoutEffect(() => {
    if (textBlockRef.current) {
      setLogoHeight(textBlockRef.current.offsetHeight);
    }
  }, [appMode]);

  // Load existing conversation if available
  useEffect(() => {
    const loadConversation = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const savedConvId = urlParams.get('conversationId') || localStorage.getItem('lastConversationId');
        
        if (savedConvId) {
          setConversationId(savedConvId);
          
          const conversationData = await getConversation(savedConvId);
          
          if (conversationData.messages) {
            const messagesWithTimestamps = conversationData.messages.map(msg => ({
              ...msg,
              timestamp: msg.timestamp || new Date().toISOString()
            }));
            setMessages(messagesWithTimestamps);
          }
          
          if (conversationData.files) {
            setUploadedFiles(conversationData.files);
            if (conversationData.files[0]?.content) {
              setCanvasContent(conversationData.files[0].content);
            }
          }
          
          toast({
            title: 'Conversation loaded',
            status: 'info',
            duration: 2000,
            isClosable: true,
            position: 'top-right'
          });
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
      }
    };
    
    loadConversation();
  }, [toast]);

  // Function to save job description
  const handleSaveJobDescription = async () => {
    if (jobDescription.trim()) {
      try {
        setIsSavingJobDescription(true);
        setIsAnalyzing(true);
        setProgressValue(0);
        setAnalysisStage('Initializing analysis...');
        
        // Start smooth progress animation with easing
        let startTime = Date.now();
        const duration = 2000; // 2 seconds for initial progress
        const targetProgress = 30; // First target is 30%
        
        const progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / duration) * targetProgress, targetProgress);
          
          // Easing function for smoother animation
          const easeOutQuad = (t) => t * (2 - t);
          const easedProgress = easeOutQuad(progress / targetProgress) * targetProgress;
          
          setProgressValue(easedProgress);
          
          if (progress >= targetProgress) {
            clearInterval(progressInterval);
          }
        }, 16); // 60fps for smooth animation

        setJobDescriptionSaved(true);
        setJobDescriptionProvided(true);

        // Update stage with smooth progress
        setAnalysisStage('Extracting key requirements...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Second phase of progress
        startTime = Date.now();
        const secondDuration = 2500; // 2.5 seconds
        const secondTarget = 60; // Second target is 60%
        
        const secondInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / secondDuration) * (secondTarget - targetProgress) + targetProgress, secondTarget);
          
          // Easing function for smoother animation
          const easeOutQuad = (t) => t * (2 - t);
          const easedProgress = easeOutQuad((progress - targetProgress) / (secondTarget - targetProgress)) * (secondTarget - targetProgress) + targetProgress;
          
          setProgressValue(easedProgress);
          
          if (progress >= secondTarget) {
            clearInterval(secondInterval);
          }
        }, 16);

        setAnalysisStage('Analyzing skills and qualifications...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/spec/analyze-job-description`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: jobDescription,
            analysisType: 'full_analysis'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Failed to analyze job description: ${response.status} ${response.statusText}`);
        }

        // Third phase of progress
        startTime = Date.now();
        const thirdDuration = 2000; // 2 seconds
        const thirdTarget = 90; // Third target is 90%
        
        const thirdInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / thirdDuration) * (thirdTarget - secondTarget) + secondTarget, thirdTarget);
          
          // Easing function for smoother animation
          const easeOutQuad = (t) => t * (2 - t);
          const easedProgress = easeOutQuad((progress - secondTarget) / (thirdTarget - secondTarget)) * (thirdTarget - secondTarget) + secondTarget;
          
          setProgressValue(easedProgress);
          
          if (progress >= thirdTarget) {
            clearInterval(thirdInterval);
          }
        }, 16);

        setAnalysisStage('Processing analysis results...');
        const analysis = await response.json();

        if (analysis.results) {
          if (analysis.results.resume_emphasis) {
            setResumeEmphasis(analysis.results.resume_emphasis);
          }
          if (analysis.results.prompt_presets) {
            setPromptPresets(analysis.results.prompt_presets);
          }
        }

        // Final phase - complete to 100%
        startTime = Date.now();
        const finalDuration = 1000; // 1 second for final completion
        
        const finalInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / finalDuration) * (100 - thirdTarget) + thirdTarget, 100);
          
          // Easing function for smoother animation
          const easeOutQuad = (t) => t * (2 - t);
          const easedProgress = easeOutQuad((progress - thirdTarget) / (100 - thirdTarget)) * (100 - thirdTarget) + thirdTarget;
          
          setProgressValue(easedProgress);
          
          if (progress >= 100) {
            clearInterval(finalInterval);
          }
        }, 16);

        setAnalysisStage('Analysis complete!');

        toast({
          title: 'Job description saved and analyzed',
          description: 'The job description has been analyzed and will be used as context for resume generation.',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top-right'
        });
      } catch (error) {
        toast({
          title: 'Analysis failed',
          description: error.message || 'Failed to analyze job description. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top-right'
        });
        setJobDescriptionSaved(true);
        setJobDescriptionProvided(true);
      } finally {
        setIsSavingJobDescription(false);
        setIsAnalyzing(false);
        setProgressValue(0);
        setAnalysisStage('');
      }
    }
  };

  // Handle sending messages to the backend
  const handleSendMessage = async (message) => {
    if (!message.trim()) return;
    setIsLoading(true);
    
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    let enhancedMessage = message;

    if (canvasContent) {
      enhancedMessage = `${message}\n\nRESUME CONTENT:\n${canvasContent}`;
    }

    if (jobDescriptionSaved && jobDescription.trim()) {
      enhancedMessage += `\n\nJOB DESCRIPTION CONTEXT:\n${jobDescription}`;
    }

    try {
      const response = await sendMessage(
        conversationId, 
        enhancedMessage, 
        uploadedFiles.map(file => file.id)
      );
      const assistantMessage = {
        content: response.response,
        timestamp: new Date().toISOString(),
        tools: response.meta?.toolsUsed || []
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to get response from AI',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top-right'
      });
      setIsLoading(false);
    }
  };

  // Update file upload handlers
  const handleFilesUploaded = async (files) => {
    setUploadedFiles(prev => [...prev, ...files]);
    if (files && files.length > 0 && files[0].content) {
      setCanvasContent(files[0].content);
    }
  };

  const handleExistingResumeUpload = (files) => {
    setUploadedFiles(prev => [...prev, ...files]);
    if (files && files.length > 0 && files[0].content) {
      setCanvasContent(files[0].content);
    }
    setAppMode('jobDescription');
  };

  // Accept a revision for selected text
  function acceptRevision(selectedText, revisedText) {
    if (canvasContent) {
      const unescapeMarkdown = (text) => text.replace(/\\([#*_[\]()`~>\-!{}<>|.])/g, '$1');
      const original = canvasContent;
      const unescapedOriginal = unescapeMarkdown(original);
      const unescapedSelected = unescapeMarkdown(selectedText);
      const idx = unescapedOriginal.indexOf(unescapedSelected);
      if (idx === -1) return;
      
      let origStart = 0, origEnd = 0, uIdx = 0;
      while (origStart < original.length && uIdx < idx) {
        if (original[origStart] === '\\' && /[#*_[\]()`~>\-!{}<>|.]/.test(original[origStart+1])) {
          origStart += 2;
        } else {
          origStart++;
        }
        uIdx++;
      }
      origEnd = origStart;
      let uLen = 0;
      while (origEnd < original.length && uLen < unescapedSelected.length) {
        if (original[origEnd] === '\\' && /[#*_[\]()`~>\-!{}<>|.]/.test(original[origEnd+1])) {
          origEnd += 2;
        } else {
          origEnd++;
        }
        uLen++;
      }
      
      const updatedContent = original.slice(0, origStart) + revisedText + original.slice(origEnd);
      setCanvasContent(updatedContent);
      
      toast({
        title: "Text updated",
        description: "The selected text has been replaced",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right"
      });
    }
  }

  // Add handler for regenerating prompts
  const handleRegeneratePrompts = (newPrompts) => {
    setPromptPresets(newPrompts);
  };

  return (
    <ChakraProvider>
      {appMode === 'upload' ? (
        <Flex direction="column" align="center" justify="center" minH="100vh" bg={bgColor}>
          <Box 
            p={12} 
            bg={chatPaneBgColor}
            borderRadius="xl"
            boxShadow="lg" 
            minW="1000px"
            minH="600px"
            border="1px solid"
            borderColor="purple.700"
            display="flex"
            gap={12}
          >
            {/* Left Side - Logo and Text */}
            <Box 
              flex="1" 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
              gap={6}
            >
              <img
                src="/tailr-logo.png"
                alt="Tailr logo"
                style={{
                  height: '240px',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
              <VStack align="start" spacing={2}>
                <Heading 
                  as="h1" 
                  size="3xl" 
                  fontWeight="bold" 
                  color="purple.300"
                  fontFamily="mono"
                  letterSpacing="0.5px"
                >
                  Tailr
                </Heading>
                <Text 
                  fontSize="lg" 
                  color="gray.400"
                  fontFamily="mono"
                  letterSpacing="0.3px"
                >
                  Tailor any resume for any job application
                </Text>
              </VStack>
            </Box>

            {/* Vertical Divider */}
            <Box 
              w="1px" 
              bg="purple.700" 
              opacity={0.5}
              my={8}
            />

            {/* Right Side - Upload UI */}
            <Box 
              flex="1" 
              display="flex" 
              flexDirection="column" 
              justifyContent="center"
              gap={8}
              fontSize="lg"
            >
              <Box>
                <Text 
                  fontSize="xl" 
                  fontWeight="medium" 
                  color="white" 
                  mb={4}
                >
                  Upload your resume
                </Text>
                <FileUpload
                  onFilesUploaded={handleExistingResumeUpload}
                  isLoading={isLoading}
                  conversationId={conversationId}
                  bg={chatInputBgColor}
                  color="white"
                  fontSize="lg"
                  hideOptionalLabel={true}
                />
              </Box>
            </Box>
          </Box>
        </Flex>
      ) : appMode === 'jobDescription' ? (
        <Flex direction="column" align="center" justify="center" minH="100vh" bg={bgColor}>
          <Box 
            p={12} 
            bg={chatPaneBgColor}
            borderRadius="xl"
            boxShadow="lg" 
            minW="1000px"
            minH="600px"
            border="1px solid"
            borderColor="purple.700"
            display="flex"
            flexDirection="column"
            gap={8}
          >
            {/* Writing Style Selector */}
            <Box>
              <Text 
                fontSize="xl" 
                fontWeight="medium" 
                color="white" 
                mb={4}
              >
                Select your preferred writing style
              </Text>
              <ToneSelector
                value={writingTone}
                onChange={setWritingTone}
                label=""
                labelColor="white"
                fontSize="lg"
              />
            </Box>

            {/* Header */}
            <Box>
              <Text 
                fontSize="xl" 
                fontWeight="medium" 
                color="white" 
                mb={4}
              >
                Paste the job description you want to tailor your resume for
              </Text>
            </Box>

            {/* Job Description Input */}
            <Box flex="1">
              <TextInput
                id="job-description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={12}
                h="400px"
                placeholder=""
              />
            </Box>

            {/* Progress Bar */}
            {isAnalyzing && (
              <Box w="100%" mb={4}>
                <Text 
                  color="white" 
                  fontSize="sm" 
                  mb={2}
                  textAlign="center"
                >
                  {analysisStage}
                </Text>
                <Progress
                  value={progressValue}
                  size="sm"
                  colorScheme="green"
                  bg="gray.700"
                  borderRadius="full"
                  hasStripe
                  isAnimated
                  transition="all 0.3s ease-in-out"
                />
              </Box>
            )}

            {/* Action Buttons */}
            <Flex gap={4} justify="flex-end">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setAppMode('upload')}
                color={textColor}
                borderColor={borderColor}
                _hover={{ 
                  bg: 'purple.800',
                  borderColor: 'purple.600',
                }}
              >
                Back
              </Button>
              <Button
                colorScheme="purple"
                size="lg"
                onClick={async () => {
                  await handleSaveJobDescription();
                  setAppMode('main');
                }}
                isDisabled={!jobDescription.trim() || jobDescriptionSaved || isSavingJobDescription}
                isLoading={isSavingJobDescription}
                loadingText="Analyzing..."
                leftIcon={<CheckCircleIcon />}
              >
                Analyze & Continue
              </Button>
            </Flex>
          </Box>
        </Flex>
      ) : (
        <Box minH="100vh" display="flex" flexDirection="column" bg={bgColor}>
          {/* Header */}
          <Box bg={bgColor} p={3}>
            <Container maxW="container.xl" px={0}>
              <Flex align="center">
                <Box
                  display="flex"
                  alignItems="center"
                  mr={4}
                >
                  <img
                    src="/tailr-logo.png"
                    alt="Tailr logo"
                    style={{
                      height: '56px',
                      width: 'auto',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                </Box>
                <VStack align="start" spacing={0.5} ref={textBlockRef}>
                  <Heading 
                    as="h1" 
                    size="2xl" 
                    fontWeight="bold" 
                    color="purple.300"
                    fontFamily="mono"
                    letterSpacing="0.5px"
                  >
                    Tailr
                  </Heading>
                  <Text 
                    fontSize="md" 
                    color="gray.400"
                    fontFamily="mono"
                    letterSpacing="0.3px"
                  >
                    Tailor any resume for any job application
                  </Text>
                </VStack>
                <Spacer />
              </Flex>
            </Container>
          </Box>

          {/* Main Content - Responsive Flex Layout */}
          <Box flex="1">
            <Container maxW="container.xl" h="100%" p={0}>
              <Flex
                direction={{ base: 'column', md: 'row' }}
                h="100%"
                align="stretch"
                gap={{ base: 3, md: 0 }}
                position="relative"
              >
                {/* Canvas (Left) */}
                <Box
                  w={{ base: '100%', md: '70%' }}
                  h={{ base: 'auto', md: '100%' }}
                  px={0}
                  pt={2}
                  pb={8}
                  pr={2}
                  display="flex"
                  flexDirection="column"
                  justifyContent="flex-start"
                  alignItems="stretch"
                  overflow="auto"
                  zIndex={0}
                >
                  <SpecCanvas
                    resumeMarkdown={canvasContent}
                    onAcceptRevision={acceptRevision}
                    jobDescriptionProvided={!!jobDescription.trim()}
                    jobDescription={jobDescription}
                    highlightedText={highlightedText}
                    promptPresets={promptPresets}
                    onRegeneratePrompts={handleRegeneratePrompts}
                    writingTone={writingTone}
                    conversationId={conversationId}
                    onUpdateMessages={setMessages}
                    resumeEmphasis={resumeEmphasis}
                  />
                </Box>

                {/* Keyboard Navigation Instructions (Top Right, above chat pane) */}
                <Box
                  display={{ base: 'none', md: 'block' }}
                  position="fixed"
                  top="80px"
                  right="20px"
                  zIndex={1}
                  width="auto"
                  maxW="340px"
                  bg="transparent"
                  boxShadow="none"
                  borderRadius="none"
                >
                  <KeyboardInstructions />
                </Box>

                {/* Chat Pane (Right) */}
                <Box
                  position={{ md: 'fixed' }}
                  right={{ md: '20px' }}
                  top={{ md: '180px' }}
                  w={{ base: '100%', md: isChatExpanded ? '400px' : '60px' }}
                  minW={{ md: isChatExpanded ? '400px' : '60px' }}
                  maxW={{ md: isChatExpanded ? '600px' : '60px' }}
                  h={{ base: 'auto', md: 'calc(100vh - 180px)' }}
                  bg={chatPaneBgColor}
                  display="flex"
                  flexDirection="column"
                  mb={{ base: 2, md: 0 }}
                  zIndex={1}
                  borderRadius="xl"
                  overflow="hidden"
                  border="1px solid"
                  borderColor={borderColor}
                  transition="all 0.3s ease-in-out"
                >
                  {/* Chat Header */}
                  <Collapse in={isChatExpanded} animateOpacity>
                    <Box p={3} borderBottom="1px solid" borderColor={borderColor}>
                      <Flex align="center" justify="space-between">
                        <Heading 
                          size="sm" 
                          color={textColor}
                          fontFamily="mono"
                          letterSpacing="0.5px"
                          fontWeight="medium"
                        >
                          Chat with Tailr
                        </Heading>
                        <IconButton
                          icon={<ChatIcon boxSize="22px" />}
                          onClick={() => setIsChatExpanded(!isChatExpanded)}
                          bg="transparent"
                          color="white"
                          _hover={{ bg: 'purple.800' }}
                          size="sm"
                          aria-label={isChatExpanded ? "Collapse chat" : "Expand chat"}
                        />
                      </Flex>
                    </Box>
                  </Collapse>

                  {/* Toggle Button (Always Visible) */}
                  {!isChatExpanded && (
                    <Box 
                      position="absolute" 
                      top="50%" 
                      left="50%" 
                      transform="translate(-50%, -50%)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <IconButton
                        icon={<ChatIcon boxSize="24px" />}
                        onClick={() => setIsChatExpanded(!isChatExpanded)}
                        bg="transparent"
                        color="white"
                        _hover={{ 
                          bg: 'purple.800',
                          transform: 'scale(1.1)',
                          opacity: 1
                        }}
                        size="lg"
                        aria-label="Expand chat"
                        transition="all 0.2s ease-in-out"
                        opacity={0.8}
                      />
                    </Box>
                  )}

                  {/* Chat Content */}
                  <Collapse in={isChatExpanded} animateOpacity>
                    <Box display="flex" flexDirection="column" height="100%" minH="300px" maxH="calc(100vh - 200px)">
                      <Box 
                        flex="1" 
                        overflowY="auto" 
                        p={3}
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
                        <MessageHistory messages={messages} />
                      </Box>
                      <Box p={3} borderTop="1px solid" borderColor={borderColor}>
                        <ChatInput
                          onSendMessage={handleSendMessage}
                          isLoading={isLoading}
                          bg={chatInputBgColor}
                          color={textColor}
                        />
                      </Box>
                    </Box>
                  </Collapse>
                </Box>
              </Flex>
            </Container>
          </Box>
        </Box>
      )}
    </ChakraProvider>
  );
}

export default App;