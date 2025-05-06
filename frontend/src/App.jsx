import React, { useState, useEffect } from 'react';
import {
  ChakraProvider,
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Divider,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { sendMessage, uploadFiles, getConversation } from './services/apiService';

import ChatInput from './components/ChatInput';
import FileUpload from './components/FileUpload';
import MessageHistory from './components/MessageHistory';
import SpecDisplay from './components/SpecDisplay';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [generatedSpec, setGeneratedSpec] = useState(null);
  const [conversationId, setConversationId] = useState(`conv-${Date.now()}`);
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
      
      // Check if we need to update the spec
      // In a real implementation, this would parse structured data from Claude
      if (message.toLowerCase().includes('pdf') || 
          (assistantMessage.content && assistantMessage.content.toLowerCase().includes('pdf'))) {
        // This is a simplified way to detect if we should show a spec
        // In a real implementation, the backend would return structured data
        setGeneratedSpec({
          title: "PDF Export Feature Specification",
          status: "Draft",
          problemStatement: "Users currently cannot export reports in PDF format, limiting their ability to share data with stakeholders who require formatted, print-ready documents.",
          userStories: [
            "As a marketing manager, I want to export campaign performance reports as PDFs so I can share them with executives in a professional format.",
            "As a data analyst, I want to export data visualizations as PDFs so I can include them in presentations and reports.",
            "As a customer success manager, I want to export client usage reports as PDFs so I can review them with clients during meetings."
          ],
          requirements: [
            "The system must allow users to export any report view as a PDF document.",
            "PDF exports must maintain all formatting, including tables, charts, and graphs.",
            "Users should be able to customize headers and footers, including adding company logos.",
            "The export process should take no more than 5 seconds for standard reports.",
            "All PDFs should be accessible and meet WCAG 2.1 AA standards."
          ],
          successMetrics: [
            "50% of users utilize the PDF export feature within 3 months of release.",
            "Customer support tickets requesting PDF export capability reduced to zero.",
            "User satisfaction ratings for reporting features increase by 15%."
          ]
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
    try {
      // Call the API service to upload files
      const response = await uploadFiles(conversationId, files);
      
      // Update the uploaded files state with the response
      setUploadedFiles(prev => [...prev, ...response.files]);
      
      toast({
        title: 'Files uploaded',
        description: `${files.length} files uploaded and ready for reference`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload files',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <ChakraProvider>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading as="h1" size="xl">AI Spec Assistant</Heading>
            <Text mt={2} color="gray.600">
              Turn vague product requests into structured specifications
            </Text>
          </Box>

          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>Chat</Tab>
              <Tab>Generated Specification</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <FileUpload 
                    onFilesUploaded={handleFilesUploaded} 
                    isLoading={isLoading} 
                  />
                  
                  <Divider />
                  
                  <Box>
                    <Text fontWeight="medium" mb={3}>Conversation:</Text>
                    <Box 
                      border="1px solid" 
                      borderColor="gray.200" 
                      borderRadius="md" 
                      p={4} 
                      mb={4}
                      maxHeight="400px"
                      overflowY="auto"
                    >
                      <MessageHistory messages={messages} />
                    </Box>
                  </Box>
                  
                  <ChatInput 
                    onSendMessage={handleSendMessage} 
                    isLoading={isLoading} 
                  />
                </VStack>
              </TabPanel>
              
              <TabPanel>
                {generatedSpec ? (
                  <SpecDisplay spec={generatedSpec} />
                ) : (
                  <Box 
                    p={6} 
                    textAlign="center" 
                    color="gray.500" 
                    border="1px dashed" 
                    borderColor="gray.200" 
                    borderRadius="md"
                  >
                    <Text>No specification generated yet. Start a conversation to create one.</Text>
                  </Box>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
          
          {uploadedFiles.length > 0 && (
            <Box>
              <Text fontWeight="medium" mb={2}>Uploaded Files ({uploadedFiles.length}):</Text>
              <Box 
                p={3} 
                bg="gray.50" 
                borderRadius="md" 
                fontSize="sm"
              >
                {uploadedFiles.map((file, index) => (
                  <Text key={index}>{file.name}</Text>
                ))}
              </Box>
            </Box>
          )}
        </VStack>
      </Container>
    </ChakraProvider>
  );
}

export default App;