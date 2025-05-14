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
  Spacer
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
  // New state for the canvas content
  const [canvasContent, setCanvasContent] = useState(null);
  const toast = useToast();
  
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

  // Function to check if a message contains a specification
  const extractSpecFromMessage = (content) => {
    // Look for specification-like content
    // You can customize this logic based on how you want to detect specs
    const specKeywords = [
      'product requirement document',
      'prd',
      'specification',
      'requirements document',
      'functional requirements',
      'user stories',
      'objectives'
    ];
    
    const lowerContent = content.toLowerCase();
    const containsSpecKeywords = specKeywords.some(keyword => 
      lowerContent.includes(keyword)
    );
    
    // Also check for structured content (numbered sections)
    const hasStructuredContent = /^\d+\.\s+/.test(content) || 
                                content.includes('## ') || 
                                content.includes('### ');
    
    if (containsSpecKeywords || hasStructuredContent) {
      return content;
    }
    
    return null;
  };

  // Handle sending messages to the backend
  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    setIsLoading(true);

    // Add user message to the conversation
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // Call the API service to send the message
      const response = await sendMessage(
        conversationId, 
        message, 
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
      
      // Check if the response contains a specification and update canvas
      const specContent = extractSpecFromMessage(response.response);
      if (specContent) {
        setCanvasContent(specContent);
        
        // Also update the old spec display for backwards compatibility
        setGeneratedSpec({
          title: "Generated Specification",
          status: "Draft",
          content: specContent
        });
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
        <Box bg="white" borderBottom="1px solid" borderColor="gray.200" p={4}>
          <Container maxW="container.xl">
            <Flex align="center">
              <VStack align="start" spacing={1}>
                <Heading as="h1" size="lg">AI Spec Assistant</Heading>
                <Text fontSize="sm" color="gray.600">
                  Turn vague product requests into structured specifications
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

        {/* Main Content */}
        <Box flex="1" overflow="hidden">
          <Container maxW="container.xl" h="100%" p={0}>
            <HStack spacing={0} h="100%" align="stretch">
              {/* Left Side - Chat */}
              <Box 
                w="50%" 
                h="100%" 
                bg="white" 
                borderRight="1px solid" 
                borderColor="gray.200"
                display="flex"
                flexDirection="column"
              >
                <Box p={4} borderBottom="1px solid" borderColor="gray.100">
                  <Heading size="md" mb={4}>Conversation</Heading>
                  <FileUpload 
                    onFilesUploaded={handleFilesUploaded} 
                    isLoading={isLoading}
                    conversationId={conversationId}
                  />
                </Box>
                
                <VStack flex="1" spacing={0} align="stretch" overflow="hidden">
                  <Box 
                    flex="1"
                    overflow="auto"
                    p={4}
                  >
                    <MessageHistory messages={messages} />
                  </Box>
                  
                  <Box p={4} borderTop="1px solid" borderColor="gray.100">
                    <ChatInput 
                      onSendMessage={handleSendMessage} 
                      isLoading={isLoading} 
                    />
                  </Box>
                </VStack>
              </Box>

              {/* Right Side - Spec Canvas */}
              <Box w="50%" h="100%" bg="gray.50" p={4}>
                <SpecCanvas 
                  content={canvasContent}
                  title="Generated Specification"
                />
              </Box>
            </HStack>
          </Container>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;