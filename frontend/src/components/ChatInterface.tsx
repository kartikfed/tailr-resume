import React, { useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  Input,
  Button,
  useToast,
  Text,
  Flex,
  Spinner,
  useColorModeValue
} from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import { ChatProps } from '../types/chat';
import { useChat } from '../hooks/useChat';

/**
 * ChatInterface component for displaying and managing chat conversations
 */
const ChatInterface: React.FC<ChatProps> = ({ conversationId, onUpdateMessages, onToolResponse }) => {
  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const { messages, isLoading, error, sendMessage } = useChat(conversationId, onUpdateMessages);

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const userMessageBg = useColorModeValue('blue.500', 'blue.400');
  const assistantMessageBg = useColorModeValue('gray.100', 'gray.700');
  const userMessageColor = useColorModeValue('white', 'white');
  const assistantMessageColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right'
      });
    }
  }, [error, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    try {
      console.log('🤖 Sending message to Claude:', input);
      const response = await sendMessage(input);
      
      // Check if the response contains a tool call
      if (response?.toolResponse) {
        const toolResponse = response.toolResponse;
        console.log('🛠️ Tool response received in ChatInterface:', {
          success: toolResponse.success,
          hasNewHtml: !!toolResponse.newHtml,
          newHtmlLength: toolResponse.newHtml?.length,
          explanation: toolResponse.explanation,
          changes: toolResponse.changes
        });
        
        // Notify parent component about the update
        if (onUpdateMessages) {
          onUpdateMessages(prevMessages => [
            ...prevMessages,
            {
              role: 'system',
              content: `Resume updated: ${toolResponse.explanation}`,
              timestamp: new Date().toISOString()
            }
          ]);
        }

        // Call the tool response callback regardless of changes type
        if (onToolResponse) {
          console.log('📤 Forwarding tool response to parent', {
            hasCallback: !!onToolResponse,
            toolResponse: {
              success: toolResponse.success,
              hasNewHtml: !!toolResponse.newHtml,
              newHtmlLength: toolResponse.newHtml?.length
            }
          });
          onToolResponse(toolResponse);
        } else {
          console.log('⚠️ No onToolResponse callback provided');
        }
      } else {
        console.log('📥 Regular response received (no tool response)');
      }
      
      setInput('');
    } catch (err) {
      console.error('❌ Error in ChatInterface:', err);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top-right'
      });
    }
  };

  return (
    <Box h="100%" display="flex" flexDirection="column" bg={bgColor} borderRadius="lg" boxShadow="sm">
      {/* Messages Container */}
      <VStack 
        flex="1" 
        overflowY="auto" 
        spacing={4} 
        p={4}
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'gray.200',
            borderRadius: '24px',
          },
        }}
      >
        {messages.map((message, index) => (
          <Box
            key={index}
            alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
            maxW="70%"
            bg={message.role === 'user' ? userMessageBg : assistantMessageBg}
            color={message.role === 'user' ? userMessageColor : assistantMessageColor}
            p={3}
            borderRadius="lg"
            boxShadow="sm"
          >
           {message.content}
          </Box>
        ))}
        {isLoading && (
          <Flex alignSelf="flex-start" p={3}>
            <Spinner size="sm" color="blue.500" />
          </Flex>
        )}
        <div ref={messagesEndRef} />
      </VStack>
      
      {/* Input Container */}
      <Box p={4} borderTop="1px" borderColor={borderColor}>
        <form onSubmit={handleSubmit}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            mb={2}
            size="lg"
            borderRadius="lg"
            bg={useColorModeValue('white', 'gray.700')}
            color={useColorModeValue('gray.800', 'white')}
            _placeholder={{ color: useColorModeValue('gray.500', 'gray.400') }}
            _focus={{
              borderColor: 'blue.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
            }}
          />
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isLoading}
            width="100%"
            size="lg"
            borderRadius="lg"
          >
            Send
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default ChatInterface; 