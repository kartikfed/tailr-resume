import React, { useState } from 'react';
import {
  Input,
  Button,
  HStack,
  useColorModeValue
} from '@chakra-ui/react';

/**
 * Component for entering messages to the AI Spec Assistant
 */
const ChatInput = ({ onSendMessage, isLoading, bg, color }) => {
  const [message, setMessage] = useState('');
  const borderColor = useColorModeValue('gray.600', 'gray.600');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <HStack>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          size="md"
          bg={bg}
          color={color}
          borderColor={borderColor}
          _placeholder={{ color: 'gray.400' }}
          _hover={{ borderColor: 'gray.500' }}
          _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #3182ce' }}
        />
        <Button
          type="submit"
          colorScheme="blue"
          size="md"
          isLoading={isLoading}
          loadingText="Sending..."
        >
          Send
        </Button>
      </HStack>
    </form>
  );
};

export default ChatInput;