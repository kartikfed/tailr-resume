import React from 'react';
import {
  Box,
  VStack,
  Text,
  Divider,
  Badge,
  Flex
} from '@chakra-ui/react';

/**
 * Component for displaying message history between user and AI
 */
const MessageHistory = ({ messages }) => {
  if (messages.length === 0) {
    return (
      <Box 
        p={6} 
        textAlign="center" 
        color="gray.500" 
        border="1px dashed" 
        borderColor="gray.200" 
        borderRadius="md"
      >
        <Text>No messages yet. Start by entering a product specification request.</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch" width="100%">
      {messages.map((message, index) => (
        <Box key={index}>
          <Flex align="center" mb={2}>
            <Badge 
              colorScheme={message.role === 'user' ? 'blue' : 'green'}
              px={2}
              py={1}
              borderRadius="md"
            >
              {message.role === 'user' ? 'You' : 'AI Spec Assistant'}
            </Badge>
            {message.timestamp && (
              <Text fontSize="xs" color="gray.500" ml={2}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </Text>
            )}
          </Flex>
          
          <Box 
            bg={message.role === 'user' ? 'blue.50' : 'green.50'}
            p={3}
            borderRadius="md"
            borderLeftWidth="4px"
            borderLeftColor={message.role === 'user' ? 'blue.200' : 'green.200'}
          >
            {typeof message.content === 'string' ? (
              // Display regular text message
              <Text whiteSpace="pre-wrap">{message.content}</Text>
            ) : (
              // For structured content (like tool results)
              <Text whiteSpace="pre-wrap">
                {JSON.stringify(message.content, null, 2)}
              </Text>
            )}
            
            {/* Display tool usage if available */}
            {message.tools && message.tools.length > 0 && (
              <Box mt={3} p={2} bg="gray.100" borderRadius="sm">
                <Text fontSize="sm" fontWeight="bold">Tools Used:</Text>
                {message.tools.map((tool, toolIndex) => (
                  <Text key={toolIndex} fontSize="xs" as="pre" fontFamily="monospace">
                    {tool.name}
                  </Text>
                ))}
              </Box>
            )}
          </Box>
          
          {index < messages.length - 1 && <Divider my={4} />}
        </Box>
      ))}
    </VStack>
  );
};

export default MessageHistory;