import React from 'react';
import {
  Box,
  VStack,
  Text,
  Divider,
  Badge,
  Flex
} from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';

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
        <Text>No messages yet</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch" width="100%">
      {messages.map((message, index) => (
        <Box key={index}>
          <Flex align="center" mb={2}>
            <Badge 
              colorScheme={
                message.role === 'user' ? 'blue' : 
                message.role === 'system' ? 'purple' : 'green'
              }
              px={2}
              py={1}
              borderRadius="md"
            >
              {message.role === 'user' ? 'You' : 
               message.role === 'system' ? "Tailr's Thoughts" : 'Tailr'}
            </Badge>
            {message.timestamp && (
              <Text fontSize="xs" color="gray.500" ml={2}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </Text>
            )}
          </Flex>
          
          <Box 
            bg={
              message.role === 'user' ? 'blue.50' : 
              message.role === 'system' ? 'purple.50' : 'green.50'
            }
            p={3}
            borderRadius="md"
            borderLeftWidth="4px"
            borderLeftColor={
              message.role === 'user' ? 'blue.200' : 
              message.role === 'system' ? 'purple.200' : 'green.200'
            }
          >
            {typeof message.content === 'string' ? (
              // Use ReactMarkdown to render markdown content
              <Box className="markdown-content" sx={{
                '& p': {
                  mb: 2,
                  '&:last-child': {
                    mb: 0
                  }
                },
                '& ul, & ol': {
                  pl: 4,
                  mb: 2
                },
                '& li': {
                  mb: 1
                },
                '& code': {
                  bg: 'gray.100',
                  px: 1,
                  py: 0.5,
                  borderRadius: 'sm',
                  fontFamily: 'monospace',
                  fontSize: '0.9em'
                },
                '& pre': {
                  bg: 'gray.100',
                  p: 2,
                  borderRadius: 'md',
                  overflowX: 'auto',
                  mb: 2,
                  '& code': {
                    bg: 'transparent',
                    p: 0
                  }
                },
                '& blockquote': {
                  borderLeft: '4px solid',
                  borderColor: 'gray.300',
                  pl: 4,
                  py: 1,
                  my: 2,
                  fontStyle: 'italic'
                },
                '& h1, & h2, & h3, & h4, & h5, & h6': {
                  fontWeight: 'bold',
                  mb: 2,
                  mt: 4
                },
                '& h1': { fontSize: '1.5em' },
                '& h2': { fontSize: '1.3em' },
                '& h3': { fontSize: '1.1em' },
                '& table': {
                  borderCollapse: 'collapse',
                  width: '100%',
                  mb: 2
                },
                '& th, & td': {
                  border: '1px solid',
                  borderColor: 'gray.300',
                  p: 2
                },
                '& th': {
                  bg: 'gray.100'
                }
              }}>
                <ReactMarkdown>
                  {message.content}
                </ReactMarkdown>
              </Box>
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