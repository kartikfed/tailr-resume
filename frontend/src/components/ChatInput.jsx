import React, { useState } from 'react';
import { 
  Box, 
  Textarea, 
  Button, 
  Flex,
  Text
} from '@chakra-ui/react';

/**
 * Component for entering messages to the AI Spec Assistant
 */
const ChatInput = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() === '') return;
    
    onSendMessage(message);
    setMessage('');
  };

  return (
    <Box as="form" onSubmit={handleSubmit} width="100%">
      <Text mb={2} fontWeight="medium">Enter your product specification request:</Text>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="E.g., 'Create a spec for adding PDF export to our reporting feature'"
        size="md"
        rows={4}
        mb={3}
        isDisabled={isLoading}
      />
      <Flex justifyContent="flex-end">
        <Button 
          type="submit" 
          colorScheme="blue" 
          isLoading={isLoading}
          loadingText="Sending..."
          isDisabled={message.trim() === '' || isLoading}
        >
          Send
        </Button>
      </Flex>
    </Box>
  );
};

export default ChatInput;