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
  Textarea,
  Button,
  useColorModeValue,
  Badge,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import { sendMessage, uploadFiles, getConversation } from './services/apiService';
import { CheckCircleIcon } from '@chakra-ui/icons';

import ChatInput from './components/ChatInput';
import FileUpload from './components/FileUpload';
import MessageHistory from './components/MessageHistory';
import SpecDisplay from './components/SpecDisplay';
import SpecCanvas from './components/SpecCanvas';
import ToneSelector from './components/ToneSelector';
import TextInput from './components/TextInput';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [generatedSpec, setGeneratedSpec] = useState(null);
  const [conversationId, setConversationId] = useState(`conv-${Date.now()}`);
  const [canvasContent, setCanvasContent] = useState('');
  const [resumeStructured, setResumeStructured] = useState(null);
  const [resumeMarkdown, setResumeMarkdown] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobDescriptionSaved, setJobDescriptionSaved] = useState(false);
  const [jobDescriptionProvided, setJobDescriptionProvided] = useState(false);
  const [isSavingJobDescription, setIsSavingJobDescription] = useState(false);
  const [resumeEmphasis, setResumeEmphasis] = useState(null);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
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
  const cardBgColor = useColorModeValue('gray.800', 'gray.800');
  const inputBgColor = useColorModeValue('gray.700', 'gray.700');
  const canvasBgColor = useColorModeValue('white', 'white');
  const chatPaneBgColor = useColorModeValue('purple.900', 'purple.900');
  const chatInputBgColor = useColorModeValue('purple.800', 'purple.800');
  
  const [startMode, setStartMode] = useState('choose'); // 'choose' | 'scratch' | 'existing'
  // Track if user started with an existing resume
  const [existingResumeMode, setExistingResumeMode] = useState(false);
  
  // State for structured resume data from Affinda
  const [highlightedText, setHighlightedText] = useState(null);
  const [highlightTimeout, setHighlightTimeout] = useState(null);
  const [promptPresets, setPromptPresets] = useState([]);
  const [writingTone, setWritingTone] = useState('concise');

  const textBlockRef = useRef(null);
  const [logoHeight, setLogoHeight] = useState(0);

  useLayoutEffect(() => {
    if (textBlockRef.current) {
      setLogoHeight(textBlockRef.current.offsetHeight);
    }
  }, [startMode]);

  // Load existing conversation if available
  useEffect(() => {
    const loadConversation = async () => {
      try {
        // Get conversation from URL or local storage
        const urlParams = new URLSearchParams(window.location.search);
        const savedConvId = urlParams.get('conversationId') || localStorage.getItem('lastConversationId');
        
        if (savedConvId) {
          setConversationId(savedConvId);
          
          // Fetch conversation history
          const conversationData = await getConversation(savedConvId);
          
          if (conversationData.messages) {
            // Add timestamps to messages that don't have them
            const messagesWithTimestamps = conversationData.messages.map(msg => ({
              ...msg,
              timestamp: msg.timestamp || new Date().toISOString()
            }));
            setMessages(messagesWithTimestamps);
          }
          
          if (conversationData.files) {
            setUploadedFiles(conversationData.files);
            // If we have files, try to parse the structured data
            if (conversationData.files[0]?.content) {
              try {
                const structured = JSON.parse(conversationData.files[0].content);
                setResumeStructured(structured);
              } catch (error) {
                console.error('Error parsing saved file content:', error);
              }
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
        // If there's an error, just start a new conversation
      }
    };
    
    loadConversation();
  }, [toast]);

  // Function to save job description
  const handleSaveJobDescription = async () => {
    if (jobDescription.trim()) {
      try {
        setIsSavingJobDescription(true);
        // First save the job description
        setJobDescriptionSaved(true);
        setJobDescriptionProvided(true);

        console.log('Sending job description for analysis:', {
          url: `${import.meta.env.VITE_API_URL}/api/spec/analyze-job-description`,
          contentLength: jobDescription.length
        });

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
          console.error('Analysis failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          throw new Error(errorData?.message || `Failed to analyze job description: ${response.status} ${response.statusText}`);
        }

        const analysis = await response.json();
        console.log('Job description analysis:', analysis);

        // Store the analysis results
        if (analysis.results) {
          if (analysis.results.resume_emphasis) {
            setResumeEmphasis(analysis.results.resume_emphasis);
          }
          if (analysis.results.prompt_presets) {
            setPromptPresets(analysis.results.prompt_presets);
          }
        }

        // Show success toast
        toast({
          title: 'Job description saved and analyzed',
          description: 'The job description has been analyzed and will be used as context for resume generation.',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top-right'
        });
      } catch (error) {
        console.error('Error analyzing job description:', error);
        // Show error toast with more detailed message
        toast({
          title: 'Analysis failed',
          description: error.message || 'Failed to analyze job description. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top-right'
        });
        // Don't clear the saved state since the job description was saved
        setJobDescriptionSaved(true);
        setJobDescriptionProvided(true);
      } finally {
        setIsSavingJobDescription(false);
      }
    }
  };

  // Function to clear job description
  const handleClearJobDescription = () => {
    setJobDescription('');
    setJobDescriptionSaved(false);
    setPromptPresets([]); // Clear prompt presets
    setResumeEmphasis(null); // Clear resume emphasis
    toast({
      title: 'Job description cleared',
      status: 'info',
      duration: 2000,
      isClosable: true,
      position: 'top-right'
    });
  };

  // Detailed resume optimization plan for system prompt
  const resumeOptimizationPlan = `You are an expert resume coach. When optimizing a resume for a specific job description, always follow this repeatable plan:

Step 1: Job Description Analysis
- Extract all role-specific keywords, hard/soft skills, and candidate traits.
- Categorize the content into buckets: core competencies, tools/technologies, collaboration, domain focus, cultural traits.

Step 2: Resume Assessment
- Map the resume content against the categories from Step 1.
- Identify what is covered, partially represented, or missing.
- Evaluate for impact, clarity, quantified results, and outcome-oriented phrasing.

Step 3: Strategic Repositioning
- Rewrite the professional summary to align with the job's themes and tone.
- Revise each experience bullet: start with action verbs, show ownership, quantify impact, and mirror JD language.
- Consolidate repetitive points.

Step 4: Fill Gaps and Tailor Further
- Add missing competencies or traits in the most relevant section.
- Adjust tone and language to match the JD.

Step 5: Skills Section Optimization
- Include relevant tools, frameworks, and methodologies from the JD.
- Group skills thematically and add domain-specific tags if relevant.

Step 6: Final QA and Formatting
- Ensure ATS compatibility, consistent formatting, and conciseness.

Always inform your suggestions and edits by the specific resume and job description provided.

When responding:
1. Suggest what to do and how to edit the resume content, referencing the plan above.
2. End your response with: 'Would you like me to update the view with these changes?'
Do not make any changes until the user explicitly says yes.`;

  // Handle sending messages to the backend
  const handleSendMessage = async (message) => {
    if (!message.trim()) return;
    setIsLoading(true);
    // Add user message to conversation
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    let enhancedMessage = message;

    // Always include the current resume content
    if (resumeStructured) {
      // If we have structured data, convert it to markdown
      const structuredData = resumeStructured;
      const resumeContent = `RESUME CONTENT:
${structuredData.metadata.name}
${structuredData.metadata.email}
${structuredData.metadata.phone}
${structuredData.metadata.location}

${structuredData.sections.map(section => {
  if (section.type === 'list') {
    return `${section.title}\n${section.items.map(item => {
      if (item.type === 'experience') {
        return `${item.title} at ${item.company}\n${item.location}\n${item.dates}\n${item.bullets.map(bullet => `• ${bullet}`).join('\n')}`;
      } else if (item.type === 'education') {
        return `${item.degree} at ${item.institution}\n${item.dates}\n${item.content}`;
      }
      return item.content;
    }).join('\n\n')}`;
  }
  return `${section.title}\n${section.content}`;
}).join('\n\n')}`;
      enhancedMessage = `${message}\n\n${resumeContent}`;
    } else if (canvasContent) {
      // If we have markdown content, use it directly
      enhancedMessage = `${message}\n\nRESUME CONTENT:\n${canvasContent}`;
    }

    // Add job description context if available
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

  // Update file upload handlers to use structured data from Affinda
  const handleFilesUploaded = async (files) => {
    console.log('App: Received uploaded files:', files);
    setUploadedFiles(prev => [...prev, ...files]);
    if (files && files.length > 0 && files[0].content) {
      try {
        // Try to parse as JSON (Affinda flow)
        const structured = JSON.parse(files[0].content);
        console.log('App: Parsed structured resume:', structured);
        setResumeStructured(structured);
        setCanvasContent(null);
      } catch (error) {
        // If not JSON, treat as Markdown (Claude flow)
        console.log('App: Treating file content as Markdown');
        setResumeStructured(null);
        setCanvasContent(files[0].content);
      }
    } else {
      console.log('App: No content found in uploaded file');
    }
  };

  const handleExistingResumeUpload = (files) => {
    setUploadedFiles(prev => [...prev, ...files]);
    if (files && files.length > 0 && files[0].content) {
      try {
        const structured = JSON.parse(files[0].content);
        setResumeStructured(structured);
        setCanvasContent(null);
      } catch (error) {
        // If not JSON, treat as Markdown (Claude flow)
        console.log('App: Treating file content as Markdown');
        setResumeStructured(null);
        setCanvasContent(files[0].content);
      }
    }
    setStartMode('scratch'); // Enter main UI after upload
  };

  // Inline StartScreen component
  const StartScreen = () => (
    <Flex direction="column" align="center" justify="center" minH="100vh" bg={bgColor}>
      <Box p={8} bg="white" borderRadius="lg" boxShadow="lg" minW="320px">
        <Heading as="h2" size="lg" mb={4} textAlign="center">Welcome to Tailr</Heading>
        <Text fontSize="md" mb={6} textAlign="center">
          Tailor any resume for any job application
        </Text>
        <VStack spacing={4}>
          <Button colorScheme="blue" size="lg" w="100%" onClick={() => { setStartMode('scratch'); setExistingResumeMode(false); }}>
            Start from Scratch
          </Button>
          <Button colorScheme="teal" size="lg" w="100%" onClick={() => { setStartMode('existing'); setExistingResumeMode(true); }}>
            Start with an Existing Resume
          </Button>
        </VStack>
      </Box>
    </Flex>
  );

  // Accept a revision for selected text
  function acceptRevision(selectedText, revisedText) {
    if (resumeStructured) {
      setResumeStructured(prev => ({
        ...prev,
        sections: prev.sections.map(section => ({
          ...section,
          content: section.content === selectedText ? revisedText : section.content,
          items: section.items?.map(item => ({
            ...item,
            bullets: item.bullets?.map(bullet => bullet === selectedText ? revisedText : bullet)
          }))
        }))
      }));
    } else if (canvasContent) {
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

  // Reject a pending revision for a section
  function rejectRevision(sectionKey) {
    setResumeSections(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        pendingRevision: null
      }
    }));
  }

  // Add handler for regenerating prompts
  const handleRegeneratePrompts = (newPrompts) => {
    setPromptPresets(newPrompts);
  };

  // In the return, render StartScreen or main UI based on startMode
  if (startMode === 'choose') {
    return (
      <ChakraProvider>
        <StartScreen />
      </ChakraProvider>
    );
  }
  if (startMode === 'existing') {
    // Show only file upload for resume, then proceed
    return (
      <ChakraProvider>
        <Flex direction="column" align="center" justify="center" minH="100vh" bg={bgColor}>
          <Box 
            p={8} 
            bg={chatPaneBgColor}
            borderRadius="xl"
            boxShadow="lg" 
            minW="320px"
            border="1px solid"
            borderColor="purple.700"
          >
            <Heading as="h2" size="md" mb={4} textAlign="center" color="white">Tailr Your Resume</Heading>
            <Text fontSize="sm" mb={4} textAlign="center" color="white" opacity={0.9}>
              Upload your existing resume (PDF, DOCX, or TXT). The extracted text will be shown in the canvas for editing and optimization.
            </Text>
            <ToneSelector
              value={writingTone}
              onChange={setWritingTone}
              label="Select your preferred writing style"
              labelColor="white"
            />
            <FileUpload
              onFilesUploaded={handleExistingResumeUpload}
              isLoading={isLoading}
              conversationId={conversationId}
              bg={chatInputBgColor}
              color="white"
            />
          </Box>
        </Flex>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider>
      <Box minH="100vh" display="flex" flexDirection="column" bg={bgColor}>
        {/* Header */}
        <Box bg={cardBgColor} borderBottom="1px solid" borderColor={borderColor} p={3}>
          <Container maxW="container.xl">
            <Flex align="center">
              <Box
                display="flex"
                alignItems="center"
                mr={4}
                height={logoHeight ? `${logoHeight}px` : 'auto'}
              >
                <img
                  src="/tailr-logo.png"
                  alt="Tailr logo"
                  style={{
                    height: logoHeight ? `${logoHeight}px` : 'auto',
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </Box>
              <VStack align="start" spacing={0.5} ref={textBlockRef}>
                <Heading as="h1" size="2xl" fontWeight="bold" color="white">Tailr</Heading>
                <Text fontSize="md" color="gray.400">
                  Tailor any resume for any job application
                </Text>
              </VStack>
              <Spacer />
            </Flex>
          </Container>
        </Box>

        {/* Job Description Input Section */}
        <Box bg={bgColor} borderBottom="1px solid" borderColor={borderColor} p={4}>
          <Container maxW="container.xl" px={0}>
            <Flex align="center" justify="space-between" mb={3}>
              <Heading size="sm" minW="120px" color={textColor}>Job Description</Heading>
              <Text fontSize="xs" color="gray.500">Paste the job description to tailor your resume</Text>
            </Flex>
            <Box position="relative" w={{ base: '100%', md: '70%' }}>
              <TextInput
                id="job-description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={5}
                mb={3}
                h="120px"
              />
              <Flex gap={2} mb={2}>
                <Button
                  colorScheme="blue"
                  size="sm"
                  onClick={handleSaveJobDescription}
                  isDisabled={!jobDescription.trim() || jobDescriptionSaved || isSavingJobDescription}
                  isLoading={isSavingJobDescription}
                  loadingText="Analyzing..."
                  leftIcon={<CheckCircleIcon />}
                  _hover={{ transform: 'translateY(-1px)', boxShadow: 'sm' }}
                  transition="all 0.2s"
                >
                  {jobDescriptionSaved ? 'Analyzed' : 'Analyze'}
                </Button>
                {jobDescription.trim() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearJobDescription}
                    isDisabled={isSavingJobDescription}
                    color={textColor}
                    borderColor={borderColor}
                    _hover={{ 
                      bg: 'gray.50',
                      borderColor: 'gray.400',
                      transform: 'translateY(-1px)',
                      boxShadow: 'sm'
                    }}
                    transition="all 0.2s"
                  >
                    Clear
                  </Button>
                )}
              </Flex>
            </Box>
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
            >
              {/* Canvas (Left, 70% on desktop) */}
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
                  resumeStructured={resumeStructured}
                  resumeMarkdown={canvasContent}
                  resumeHtml={null}
                  resumeSections={null}
                  onAcceptRevision={acceptRevision}
                  onRejectRevision={rejectRevision}
                  jobDescriptionProvided={!!jobDescription.trim()}
                  jobDescription={jobDescription}
                  highlightedText={highlightedText}
                  promptPresets={promptPresets}
                  onRegeneratePrompts={handleRegeneratePrompts}
                  writingTone={writingTone}
                  conversationId={conversationId}
                  onUpdateMessages={setMessages}
                />
              </Box>

              {/* Chat Pane (Right, 30% on desktop) */}
              <Box
                w={{ base: '100%', md: '30%' }}
                minW={{ md: '340px' }}
                maxW={{ md: '480px' }}
                h={{ base: 'auto', md: '100%' }}
                bg={chatPaneBgColor}
                borderRight={{ md: '1px solid' }}
                borderColor={borderColor}
                display="flex"
                flexDirection="column"
                mb={{ base: 2, md: 0 }}
                zIndex={1}
                borderRadius="xl"
                overflow="hidden"
                border="1px solid"
              >
                {/* Chat history */}
                <Box p={3} borderBottom="1px solid" borderColor={borderColor}>
                  <Heading size="sm" mb={2} color={textColor}>Ask me anything</Heading>
                </Box>
                <VStack flex="1" spacing={0} align="stretch" overflow="hidden">
                  <Box flex="1" overflow="auto" p={3}>
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
                </VStack>
              </Box>
            </Flex>
          </Container>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;