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
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const [startMode, setStartMode] = useState('choose'); // 'choose' | 'scratch' | 'existing'
  // Track if user started with an existing resume
  const [existingResumeMode, setExistingResumeMode] = useState(false);
  
  // State for structured resume data from Affinda
  const [highlightedText, setHighlightedText] = useState(null);
  const [highlightTimeout, setHighlightTimeout] = useState(null);
  const [promptPresets, setPromptPresets] = useState([]);
  const [writingTone, setWritingTone] = useState('concise');

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
  const handleSaveJobDescription = async () => {
    if (jobDescription.trim()) {
      try {
        setIsSavingJobDescription(true);
        // First save the job description
        setJobDescriptionSaved(true);
        
        // Then analyze it
        const response = await fetch('http://localhost:3000/api/spec/analyze-job-description', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: jobDescription,
            analysisType: 'full_analysis',
            writingTone
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze job description');
        }

        const analysis = await response.json();
        console.log('Job description analysis:', analysis);

        // Store the prompt presets and resume emphasis
        if (analysis.results.prompt_presets) {
          setPromptPresets(analysis.results.prompt_presets);
        }
        if (analysis.results.resume_emphasis) {
          setResumeEmphasis(analysis.results.resume_emphasis);
        }

        toast({
          title: 'Job description saved and analyzed',
          description: 'The job description has been analyzed and will be used as context for resume generation.',
          status: 'success',
          duration: 2000,
          isClosable: true,
          position: 'bottom-right'
        });
      } catch (error) {
        console.error('Error analyzing job description:', error);
        toast({
          title: 'Error',
          description: 'Failed to analyze job description. It has been saved but may not be fully optimized.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
          position: 'bottom-right'
        });
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
          <Box p={8} bg="white" borderRadius="lg" boxShadow="lg" minW="320px">
            <Heading as="h2" size="md" mb={4} textAlign="center">Upload Your Resume</Heading>
            <Text fontSize="sm" mb={4} textAlign="center">
              Upload your existing resume (PDF, DOCX, or TXT). The extracted text will be shown in the canvas for editing and optimization.
            </Text>
            <ToneSelector
              value={writingTone}
              onChange={setWritingTone}
              label="Select your preferred writing style"
            />
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
        <Box bg="white" borderBottom="1px solid" borderColor={borderColor} p={3}>
          <Container maxW="container.xl">
            <Flex align="center">
              <VStack align="start" spacing={0.5}>
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

        {/* Job Description Input Section */}
        <Box bg={bgColor} borderBottom="1px solid" borderColor={borderColor} p={3}>
          <Container maxW="container.xl" px={0}>
            <Flex align="center" justify="space-between" mb={2}>
              <Heading size="xs" minW="120px">Job Description</Heading>
            </Flex>
            <Textarea
              placeholder="Paste job description..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={2}
              fontSize="sm"
              bg="white"
              resize="vertical"
              mb={2}
              p={2}
              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #3182ce" }}
            />
            <Flex gap={2} mb={2}>
              <Button
                colorScheme="blue"
                size="xs"
                onClick={handleSaveJobDescription}
                isDisabled={!jobDescription.trim() || jobDescriptionSaved || isSavingJobDescription}
                isLoading={isSavingJobDescription}
                loadingText="Saving..."
              >
                {jobDescriptionSaved ? 'Saved' : 'Save'}
              </Button>
              {jobDescription.trim() && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleClearJobDescription}
                  isDisabled={isSavingJobDescription}
                >
                  Clear
                </Button>
              )}
            </Flex>
            {resumeEmphasis && (
              <Box mb={2} p={3} bg="blue.50" borderRadius="md" fontSize="sm">
                <Text fontWeight="medium" color="blue.700" mb={2}>
                  Resume Focus Points:
                </Text>
                <Text color="gray.700" mb={2}>
                  {resumeEmphasis.summary}
                </Text>
                <List spacing={2}>
                  {resumeEmphasis.key_points.map((point, index) => (
                    <ListItem key={index} display="flex" alignItems="center">
                      <ListIcon as={CheckCircleIcon} color="blue.500" />
                      <Text>{point}</Text>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            <ToneSelector
              value={writingTone}
              onChange={setWritingTone}
            />
          </Container>
        </Box>

        {/* Main Content - Responsive Flex Layout */}
        <Box flex="1" overflow="hidden">
          <Container maxW="container.xl" h="100%" p={0}>
            <Flex
              direction={{ base: 'column', md: 'row' }}
              h="100%"
              align="stretch"
              gap={{ base: 3, md: 0 }}
            >
              {/* Chat Pane (Left, 30% on desktop) */}
              <Box
                w={{ base: '100%', md: '30%' }}
                minW={{ md: '280px' }}
                maxW={{ md: '380px' }}
                h={{ base: 'auto', md: '100%' }}
                bg="white"
                borderRight={{ md: '1px solid' }}
                borderColor={borderColor}
                display="flex"
                flexDirection="column"
                mb={{ base: 2, md: 0 }}
                zIndex={1}
              >
                {/* Chat history */}
                <Box p={3} borderBottom="1px solid" borderColor="gray.100">
                  <Heading size="sm" mb={2}>Ask me anything</Heading>
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

              {/* Canvas (Right, 70% on desktop) */}
              <Box
                w={{ base: '100%', md: '70%' }}
                h={{ base: 'auto', md: '100%' }}
                bg="gray.50"
                p={6}
                display="flex"
                flexDirection="column"
                justifyContent="flex-start"
                alignItems="stretch"
                overflow="auto"
                zIndex={0}
              >
                <Box
                  maxW="850px"
                  mx="auto"
                  w="100%"
                  bg="white"
                  p={8}
                  borderRadius="md"
                  boxShadow="sm"
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
              </Box>
            </Flex>
          </Container>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;