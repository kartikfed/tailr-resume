import React, { useState, FormEvent, ChangeEvent } from 'react';
import {
  Input,
  Button,
  HStack,
  useColorModeValue,
  Box
} from '@chakra-ui/react';

/**
 * Props for ChatInput component
 */
export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  bg?: string;
  color?: string;
}

/**
 * Component for entering messages to the AI Spec Assistant
 */
const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading = false, bg, color }) => {
  const [message, setMessage] = useState<string>('');
  
  // Dark theme colors
  const inputBg = useColorModeValue('gray.800', 'gray.800');
  const inputBorder = useColorModeValue('gray.700', 'gray.700');
  const inputText = useColorModeValue('gray.100', 'gray.100');
  const placeholderColor = useColorModeValue('gray.500', 'gray.500');
  const buttonBg = useColorModeValue('purple.600', 'purple.600');
  const buttonHoverBg = useColorModeValue('purple.500', 'purple.500');
  const buttonActiveBg = useColorModeValue('purple.700', 'purple.700');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      p={4}
      bg={bg || 'gray.900'}
      borderRadius="lg"
      border="2px solid"
      borderColor="purple.500"
      boxShadow="0 0 15px rgba(143, 63, 255, 0.15)"
      _hover={{
        boxShadow: '0 0 20px rgba(143, 63, 255, 0.2)',
        borderColor: 'purple.400'
      }}
      transition="all 0.2s ease-in-out"
    >
      <HStack spacing={3}>
        <Input
          value={message}
          onChange={handleInputChange}
          placeholder="Type your message..."
          size="md"
          bg={inputBg}
          color={color || inputText}
          borderColor={inputBorder}
          borderWidth="1px"
          borderRadius="md"
          fontFamily="mono"
          fontSize="sm"
          _placeholder={{ 
            color: placeholderColor,
            fontFamily: 'mono'
          }}
          _hover={{ 
            borderColor: 'purple.500',
            boxShadow: '0 0 0 1px rgba(143, 63, 255, 0.2)'
          }}
          _focus={{ 
            borderColor: 'purple.400', 
            boxShadow: '0 0 0 1px rgba(143, 63, 255, 0.3)',
            outline: 'none'
          }}
          _focusVisible={{
            outline: 'none',
            borderColor: 'purple.400',
            boxShadow: '0 0 0 1px rgba(143, 63, 255, 0.3)'
          }}
        />
        <Button
          type="submit"
          size="md"
          bg={buttonBg}
          color="white"
          _hover={{ 
            bg: buttonHoverBg,
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(143, 63, 255, 0.2)'
          }}
          _active={{ 
            bg: buttonActiveBg,
            transform: 'translateY(0)'
          }}
          isLoading={isLoading}
          loadingText="Sending..."
          fontFamily="mono"
          fontSize="sm"
          fontWeight="medium"
          letterSpacing="0.5px"
          transition="all 0.2s ease-in-out"
        >
          Send
        </Button>
      </HStack>
    </Box>
  );
};

export default ChatInput; 