import React, { useState, useEffect } from 'react';
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
  Badge
} from '@chakra-ui/react';
import { sendMessage, uploadFiles, getConversation } from './services/apiService';

import ChatInput from './components/ChatInput';
import FileUpload from './components/FileUpload';
import MessageHistory from './components/MessageHistory';
import SpecDisplay from './components/SpecDisplay';
import SpecCanvas from './components/SpecCanvas';

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
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [userInstructions, setUserInstructions] = useState('');
  const [revisedText, setRevisedText] = useState('');
  const [revisedTextMarkdown, setRevisedTextMarkdown] = useState('');
  const [hasSubmittedRevision, setHasSubmittedRevision] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  
  // Color mode values for styling
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const [startMode, setStartMode] = useState('choose'); // 'choose' | 'scratch' | 'existing'
  // Track if user started with an existing resume
  const [existingResumeMode, setExistingResumeMode] = useState(false);
  
  // State for structured resume data from Affinda
  const [highlightedText, setHighlightedText] = useState(null);
  const [highlightTimeout, setHighlightTimeout] = useState(null);

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
            setMessages(conversationData.messages);
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
            position: 'bottom-right'
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
  const handleSaveJobDescription = () => {
    if (jobDescription.trim()) {
      setJobDescriptionSaved(true);
      toast({
        title: 'Job description saved',
        description: 'This job description will be used as context for all resume generation.',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'bottom-right'
      });
    }
  };

  // Function to clear job description
  const handleClearJobDescription = () => {
    setJobDescription('');
    setJobDescriptionSaved(false);
    toast({
      title: 'Job description cleared',
      status: 'info',
      duration: 2000,
      isClosable: true,
      position: 'bottom-right'
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
    // If user started with an existing resume, prepend the detailed plan
    if (existingResumeMode && resumeStructured) {
      enhancedMessage = `${resumeOptimizationPlan}\n\nEXISTING RESUME:\n${JSON.stringify(resumeStructured, null, 2)}\n\nUSER REQUEST:\n${message}`;
      if (jobDescriptionSaved && jobDescription.trim()) {
        enhancedMessage += `\n\nJOB DESCRIPTION CONTEXT:\n${jobDescription}`;
      }
    } else if (jobDescriptionSaved && jobDescription.trim()) {
      enhancedMessage = `${message}\n\nWhen responding, always:\n1. Suggest what to do and how to edit the resume content.\n2. End your response with: 'Would you like me to update the view with these changes?'\nDo not make any changes until the user explicitly says yes.\n\nJOB DESCRIPTION CONTEXT:\n${jobDescription}\n\nPlease use this job description to tailor the resume content accordingly, ensuring it includes relevant keywords and matches the job requirements.`;
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
      toast({
        title: 'Error',
        description: error.message || 'Failed to get response from AI',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'bottom-right'
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
        <Heading as="h2" size="lg" mb={4} textAlign="center">Welcome to AI Resume Assistant</Heading>
        <Text fontSize="md" mb={6} textAlign="center">
          How would you like to get started?
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
        position: "bottom-right"
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
          <Box p={8} bg="white" borderRadius="lg" boxShadow="lg" minW="320px">
            <Heading as="h2" size="md" mb={4} textAlign="center">Upload Your Resume</Heading>
            <Text fontSize="sm" mb={4} textAlign="center">
              Upload your existing resume (PDF, DOCX, or TXT). The extracted text will be shown in the canvas for editing and optimization.
            </Text>
            <FileUpload
              onFilesUploaded={handleExistingResumeUpload}
              isLoading={isLoading}
              conversationId={conversationId}
            />
          </Box>
        </Flex>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider>
      <Box h="100vh" display="flex" flexDirection="column">
        {/* Header */}
        <Box bg="white" borderBottom="1px solid" borderColor={borderColor} p={4}>
          <Container maxW="container.xl">
            <Flex align="center">
              <VStack align="start" spacing={1}>
                <Heading as="h1" size="lg">AI Resume Assistant</Heading>
                <Text fontSize="sm" color="gray.600">
                  Create tailored, ATS-friendly resumes for specific job applications
                </Text>
              </VStack>
              <Spacer />
              {uploadedFiles.length > 0 && (
                <Text fontSize="sm" color="blue.600" fontWeight="medium">
                  {uploadedFiles.length} file(s) uploaded
                </Text>
              )}
            </Flex>
          </Container>
        </Box>

        {/* Job Description Input Section (now compact) */}
        <Box bg={bgColor} borderBottom="1px solid" borderColor={borderColor} p={2}>
          <Container maxW="container.xl" py={1} px={0}>
            <Flex align="center" justify="space-between">
              <Heading size="xs" minW="120px">Job Description</Heading>
              {jobDescriptionSaved && (
                <Badge colorScheme="green" px={2} py={0.5} fontSize="xs">
                  ✓ Saved as Context
                </Badge>
              )}
            </Flex>
            <Textarea
              placeholder="Paste job description..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={2}
              fontSize="sm"
              bg="white"
              resize="vertical"
              mt={1}
              mb={1}
              p={2}
              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #3182ce" }}
            />
            <Flex gap={2} mb={1}>
              <Button
                colorScheme="blue"
                size="xs"
                onClick={handleSaveJobDescription}
                isDisabled={!jobDescription.trim() || jobDescriptionSaved}
              >
                {jobDescriptionSaved ? 'Saved' : 'Save'}
              </Button>
              {jobDescription.trim() && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleClearJobDescription}
                >
                  Clear
                </Button>
              )}
            </Flex>
          </Container>
        </Box>

        {/* Main Content - Responsive Flex Layout */}
        <Box flex="1" overflow="hidden">
          <Container maxW="container.xl" h="100%" p={0}>
            <Flex
              direction={{ base: 'column', md: 'row' }}
              h="100%"
              align="stretch"
              gap={{ base: 4, md: 0 }}
            >
              {/* Chat Pane (Left, 35% on desktop) */}
              <Box
                w={{ base: '100%', md: '35%' }}
                minW={{ md: '320px' }}
                maxW={{ md: '420px' }}
                h={{ base: 'auto', md: '100%' }}
                bg="white"
                borderRight={{ md: '1px solid' }}
                borderColor={borderColor}
                display="flex"
                flexDirection="column"
                mb={{ base: 2, md: 0 }}
                zIndex={1}
              >
                {/* File upload and chat history */}
                <Box p={3} borderBottom="1px solid" borderColor="gray.100">
                  <Heading size="sm" mb={2}>Conversation</Heading>
                  <FileUpload
                    onFilesUploaded={handleFilesUploaded}
                    isLoading={isLoading}
                    conversationId={conversationId}
                  />
                </Box>
                <VStack flex="1" spacing={0} align="stretch" overflow="hidden">
                  <Box flex="1" overflow="auto" p={3}>
                    <MessageHistory messages={messages} />
                  </Box>
                  <Box p={3} borderTop="1px solid" borderColor="gray.100">
                    <ChatInput
                      onSendMessage={handleSendMessage}
                      isLoading={isLoading}
                    />
                  </Box>
                </VStack>
              </Box>

              {/* Canvas (Right, 65% on desktop, prominent) */}
              <Box
                w={{ base: '100%', md: '65%' }}
                h={{ base: 'auto', md: '100%' }}
                bg="gray.50"
                p={{ base: 2, md: 6 }}
                display="flex"
                flexDirection="column"
                justifyContent="flex-start"
                alignItems="stretch"
                overflow="auto"
                zIndex={0}
              >
                {/* Debug logging */}
                {console.log('App.jsx passing to SpecCanvas:', {
                  resumeStructured,
                  resumeMarkdown: canvasContent,
                  resumeHtml: null,
                  resumeSections: null
                })}
                {/* Label above canvas */}
                <Heading as="h2" size="md" mb={4} color="gray.600" userSelect="none">Revise Here</Heading>
                {/* Resume Canvas is now visually dominant */}
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
                />
              </Box>
            </Flex>
          </Container>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;