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
  // New state for job description
  const [jobDescription, setJobDescription] = useState('');
  const [jobDescriptionSaved, setJobDescriptionSaved] = useState(false);
  // New state for the canvas content
  const [canvasContent, setCanvasContent] = useState(null);
  const toast = useToast();
  
  // Color mode values for styling
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
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
          }
          
          toast({
            title: 'Conversation loaded',
            status: 'info',
            duration: 2000,
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
        duration: 3000,
        isClosable: true,
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
    });
  };

  // Function to extract pure resume content from Claude's response
  const extractResumeFromMessage = (content) => {
    // First, try to find the actual resume content by looking for common patterns
    
    // Strategy 1: Look for content between introduction and explanation
    // Find where the actual resume starts (after introductory text)
    const resumeStartPatterns = [
      /(?:here is|here's) a (?:tailored )?resume[^:]*:\s*/i,
      /(?:below is|following is) (?:the )?resume[^:]*:\s*/i,
      /resume for[^:]*:\s*/i,
      /^[A-Z][a-z]+ [A-Z][a-z]+\s*$/m, // Name pattern (like "John Smith")
      /^[A-Z][a-z]+ [A-Z][a-z]+\s+Software Engineer/m // Name + title pattern
    ];
    
    // Find where the resume content starts
    let resumeStart = 0;
    for (const pattern of resumeStartPatterns) {
      const match = content.match(pattern);
      if (match) {
        resumeStart = match.index + match[0].length;
        break;
      }
    }
    
    // Strategy 2: Look for where the explanation/analysis begins
    const explanationStartPatterns = [
      /This resume (?:is tailored|highlights)/i,
      /The resume (?:uses|highlights|focuses)/i,
      /(?:^|\n)(?:This|The) (?:approach|resume|targeted approach)/i,
      /(?:^|\n)Key highlights/i,
      /(?:^|\n)The (?:skills|work experience|education)/i
    ];
    
    // Find where the explanation starts (end of resume)
    let resumeEnd = content.length;
    for (const pattern of explanationStartPatterns) {
      const match = content.slice(resumeStart).match(pattern);
      if (match) {
        resumeEnd = resumeStart + match.index;
        break;
      }
    }
    
    // Extract the resume content
    let resumeContent = content.slice(resumeStart, resumeEnd).trim();
    
    // Strategy 3: Clean up any remaining conversational bits
    // Remove any lines that are clearly explanatory
    const linesToRemove = [
      /^This resume.*/i,
      /^The resume.*/i,
      /^Key highlights.*/i,
      /^This targeted approach.*/i,
      /^(?:This|The) (?:approach|content|structure).*/i
    ];
    
    const lines = resumeContent.split('\n');
    const cleanedLines = lines.filter(line => {
      return !linesToRemove.some(pattern => pattern.test(line.trim()));
    });
    
    resumeContent = cleanedLines.join('\n').trim();
    
    // Strategy 4: Verify this looks like actual resume content
    const resumeIndicators = [
      /^[A-Z][a-z]+ [A-Z][a-z]+/m, // Name
      /(?:Professional Summary|Summary|Experience|Education|Skills)/i,
      /@[\w.-]+\.[a-z]{2,}/i, // Email
      /\d{3}[-.]?\d{3}[-.]?\d{4}/, // Phone
      /\b\d+\+ years? of experience\b/i,
      /^[•\-*]\s+/m // Bullet points
    ];
    
    const hasResumeIndicators = resumeIndicators.some(pattern => 
      pattern.test(resumeContent)
    );
    
    // Only return content if it looks like a resume and has substantial content
    if (hasResumeIndicators && resumeContent.length > 100) {
      // Format the content for better display
      let formatted = resumeContent;
      
      // Convert resume sections to markdown headers if they aren't already
      if (!formatted.includes('##')) {
        formatted = formatted.replace(/^(Professional Summary|Summary|Objective)$/gmi, '## $1');
        formatted = formatted.replace(/^(Work Experience|Experience|Employment History|Professional Experience)$/gmi, '## $1');
        formatted = formatted.replace(/^(Technical Skills|Skills|Core Competencies)$/gmi, '## $1');
        formatted = formatted.replace(/^(Education|Academic Background)$/gmi, '## $1');
        formatted = formatted.replace(/^(Projects|Key Projects)$/gmi, '## $1');
        formatted = formatted.replace(/^(Certifications|Licenses)$/gmi, '## $1');
      }
      
      // Convert job titles and companies to subheaders
      formatted = formatted.replace(/^([A-Z][^|\n]+)\s*\|\s*([^|\n]+)\s*\|\s*([^|\n]+)$/gmi, '### $1\n**$2** | $3');
      
      // Ensure bullet points are properly formatted
      formatted = formatted.replace(/^[-•*]\s+/gm, '- ');
      
      // Clean up any bold markers that might be misplaced
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '**$1**');
      
      // Add proper spacing between sections
      formatted = formatted.replace(/^## /gm, '\n## ');
      
      // Clean up excessive whitespace
      formatted = formatted.replace(/\n{3,}/g, '\n\n');
      
      return formatted.trim();
    }
    
    return null;
  };

  // Handle sending messages to the backend
  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    setIsLoading(true);

    // Add job description context to the message if available
    let enhancedMessage = message;
    if (jobDescriptionSaved && jobDescription.trim()) {
      enhancedMessage = `${message}

JOB DESCRIPTION CONTEXT:
${jobDescription}

Please use this job description to tailor the resume content accordingly, ensuring it includes relevant keywords and matches the job requirements.`;
    }

    // Add user message to the conversation (store the original message, not the enhanced one)
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // Call the API service with the enhanced message
      const response = await sendMessage(
        conversationId, 
        enhancedMessage, 
        uploadedFiles.map(file => file.id)
      );
      
      // Parse the response
      const assistantMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        tools: response.meta?.toolsUsed || []
      };
      
      // Add assistant response to the conversation
      setMessages(prev => [...prev, assistantMessage]);
      
      // Check if the response contains resume content and update canvas
      console.log('Checking for resume content in response...');
      const resumeContent = extractResumeFromMessage(response.response);
      
      if (resumeContent) {
        console.log('Resume content detected, updating canvas');
        setCanvasContent(resumeContent);
        
        // Also update the old spec display for backwards compatibility
        setGeneratedSpec({
          title: "Generated Resume",
          status: "Draft",
          content: resumeContent
        });
      } else {
        console.log('No resume content detected');
        // Still try to detect any structured content
        if (response.response.includes('##') || response.response.includes('###')) {
          console.log('Found structured content, updating canvas anyway');
          setCanvasContent(response.response);
        }
      }
    
      setIsLoading(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to get response from AI',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
    }
  };

  // Handle file uploads
  const handleFilesUploaded = async (files) => {
    // This function should only update the UI state, not trigger another upload
    console.log('App: Received uploaded files:', files);
    
    // Simply add the files to our state - no API call needed here
    setUploadedFiles(prev => [...prev, ...files]);
  };

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
                {/* Resume Canvas is now visually dominant */}
                <SpecCanvas
                  content={canvasContent}
                  title="Generated Resume"
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