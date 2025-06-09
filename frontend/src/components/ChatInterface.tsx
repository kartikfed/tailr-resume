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
  useColorModeValue,
  IconButton,
  HStack,
  Avatar
} from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';
import { ChatProps, Message } from '../types/chat';
import { useChat } from '../hooks/useChat';
import { ChevronDownIcon } from '@chakra-ui/icons';

/**
 * ChatInterface component for displaying and managing chat conversations
 */
interface ChatInterfaceProps {
  conversationId: string;
  onUpdateMessages?: (callback: (prevMessages: Message[]) => Message[]) => void;
  onToolResponse?: (response: any) => void;
  onCollapse?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ conversationId, onUpdateMessages, onToolResponse, onCollapse }) => {
  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const { messages, isLoading, error, sendMessage } = useChat(conversationId, onUpdateMessages);

  // Glassy, modern color values
  const bgGradient = 'linear-gradient(135deg, #f8f6ff 0%, #ece9fe 100%)';
  const borderColor = 'rgba(160, 132, 238, 0.18)';
  const shadow = '0 8px 32px 0 rgba(160, 132, 238, 0.18), 0 2px 8px 0 rgba(160, 132, 238, 0.10)';
  const assistantBubble = 'white';
  const userBubble = 'linear-gradient(135deg, #a084ee 0%, #a259e6 100%)';
  const userText = 'white';
  const assistantText = '#1a1a1a';
  const inputBg = 'rgba(255,255,255,0.85)';
  const inputBorder = 'rgba(160, 132, 238, 0.18)';
  const inputShadow = '0 2px 8px rgba(160, 132, 238, 0.10)';
  const sendBtnBg = 'linear-gradient(135deg, #a084ee 0%, #a259e6 100%)';

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
      const response = await sendMessage(input);
      if (response?.toolResponse) {
        const toolResponse = response.toolResponse;
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
        if (onToolResponse) {
          onToolResponse(toolResponse);
        }
      }
      setInput('');
    } catch (err) {
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
    <Box
      bg={bgGradient}
      borderRadius="2xl"
      border={`1.5px solid ${borderColor}`}
      boxShadow={shadow}
      width="100%"
      height="100%"
      display="flex"
      flexDirection="column"
      position="relative"
      overflow="hidden"
    >
      {/* Header */}
      <Flex align="center" px={6} py={4} borderBottom={`1px solid ${borderColor}`} bg="rgba(255,255,255,0.85)" zIndex={1} position="relative">
        <Avatar name="Talir AI Assistant" bgGradient="linear(135deg, #a084ee 0%, #a259e6 100%)" color="white" size="md" mr={4} />
        <Box flex="1">
          <Text fontWeight={700} fontSize="lg" color="#1a1a1a" mb={0} letterSpacing="-0.01em">Talir AI Assistant</Text>
          <Text fontSize="sm" color="#8b5cf6" fontWeight={500} mt={-1}>Resume & Career Optimization</Text>
        </Box>
        {onCollapse && (
          <IconButton
            aria-label="Collapse chat"
            icon={<ChevronDownIcon boxSize={6} />}
            variant="ghost"
            colorScheme="gray"
            onClick={onCollapse}
            borderRadius="full"
            size="sm"
            _hover={{ bg: 'gray.100' }}
            ml={2}
          />
        )}
      </Flex>
      {/* Messages Container */}
      <Box
        flex="1"
        overflowY="auto"
        px={{ base: 2, md: 6 }}
        py={4}
        display="flex"
        flexDirection="column"
        gap={4}
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#e0e7ff',
            borderRadius: '24px',
          },
        }}
        bg="transparent"
      >
        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          return (
            <Flex
              key={index}
              alignSelf={isUser ? 'flex-end' : 'flex-start'}
              maxW="85%"
              direction="row"
              mb={1}
            >
              {!isUser && (
                <Avatar
                  name="Talir"
                  size="sm"
                  bgGradient="linear(135deg, #a084ee 0%, #a259e6 100%)"
                  color="white"
                  mr={2}
                  mt={1}
                />
              )}
              <Box
                bg={isUser ? userBubble : assistantBubble}
                color={isUser ? userText : assistantText}
                px={isUser ? 5 : 5}
                py={isUser ? 3 : 3}
                borderRadius={isUser ? '18px 18px 6px 18px' : '18px 18px 18px 6px'}
                boxShadow={isUser ? '0 2px 8px rgba(160, 132, 238, 0.10)' : '0 2px 8px rgba(160, 132, 238, 0.06)'}
                fontSize="16px"
                fontWeight={isUser ? 500 : 400}
                whiteSpace="pre-line"
                wordBreak="break-word"
                minW="0"
                maxW="100%"
              >
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </Box>
            </Flex>
          );
        })}
        {isLoading && (
          <Flex alignSelf="flex-start" p={3}>
            <Spinner size="sm" color="#a084ee" />
          </Flex>
        )}
        <div ref={messagesEndRef} />
      </Box>
      {/* Input Container */}
      <Box
        as="form"
        onSubmit={handleSubmit}
        px={{ base: 2, md: 6 }}
        py={4}
        bg="rgba(255,255,255,0.92)"
        borderTop={`1px solid ${borderColor}`}
        position="relative"
        zIndex={1}
        display="flex"
        alignItems="center"
        gap={3}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          size="lg"
          borderRadius="2xl"
          bg={inputBg}
          color="#1a1a1a"
          border={`1.5px solid ${inputBorder}`}
          boxShadow={inputShadow}
          _placeholder={{ color: '#b5aee0' }}
          _focus={{
            borderColor: '#a084ee',
            boxShadow: '0 0 0 1.5px #a084ee',
            bg: 'white',
          }}
          pr="60px"
          fontSize="16px"
        />
        <Button
          type="submit"
          isLoading={isLoading}
          borderRadius="full"
          minW="48px"
          minH="48px"
          px={0}
          py={0}
          bg={sendBtnBg}
          color="white"
          fontSize="2xl"
          boxShadow="0 2px 8px rgba(160, 132, 238, 0.10)"
          _hover={{ bg: '#a259e6' }}
          _active={{ bg: '#a084ee' }}
          position="absolute"
          right={{ base: 4, md: 8 }}
          top="50%"
          transform="translateY(-50%)"
          zIndex={2}
        >
          <Box as="span" fontWeight={700} fontSize="2xl">&#8594;</Box>
        </Button>
      </Box>
    </Box>
  );
};

export default ChatInterface; 