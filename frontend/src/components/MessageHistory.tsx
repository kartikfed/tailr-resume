import React from 'react';
import {
  Box,
  VStack,
  Text,
  Divider,
  Badge,
  Flex,
  useColorModeValue
} from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';

/**
 * Message object interface
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | object;
  timestamp?: string;
  tools?: { name: string }[];
}

/**
 * Props for MessageHistory component
 */
export interface MessageHistoryProps {
  messages: Message[];
}

/**
 * Component for displaying message history between user and AI
 */
const MessageHistory: React.FC<MessageHistoryProps> = ({ messages }) => {
  // Dark theme colors
  const userBg = useColorModeValue('purple.900', 'blue.800');
  const userBorder = useColorModeValue('purple.700', 'blue.400');
  const aiBg = useColorModeValue('gray.800', 'gray.800');
  const aiBorder = useColorModeValue('gray.700', 'gray.700');
  const textColor = useColorModeValue('gray.100', 'gray.100');
  const timestampColor = useColorModeValue('gray.400', 'gray.400');
  const codeBg = useColorModeValue('gray.900', 'gray.900');
  const codeBorder = useColorModeValue('gray.700', 'gray.700');
  const blockquoteBg = useColorModeValue('gray.800', 'gray.800');
  const blockquoteBorder = useColorModeValue('purple.700', 'purple.700');
  const tableBorder = useColorModeValue('gray.700', 'gray.700');
  const tableHeaderBg = useColorModeValue('gray.800', 'gray.800');

  if (messages.length === 0) {
    return (
      <Box 
        p={6} 
        textAlign="center" 
        color={textColor}
        border="1px dashed" 
        borderColor={aiBorder}
        borderRadius="md"
        bg={aiBg}
        fontFamily="mono"
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
              colorScheme={message.role === 'user' ? 'purple' : 'blue'}
              px={2}
              py={1}
              borderRadius="md"
              fontFamily="mono"
              fontSize="xs"
              letterSpacing="0.5px"
            >
              {message.role === 'user' ? 'You' : 'Tailr'}
            </Badge>
            {message.timestamp && (
              <Text fontSize="xs" color={timestampColor} ml={2} fontFamily="mono">
                {new Date(message.timestamp).toLocaleTimeString()}
              </Text>
            )}
          </Flex>
          
          <Box 
            bg={message.role === 'user' ? userBg : aiBg}
            p={3}
            borderRadius="md"
            border={message.role === 'user' ? '2px solid' : '1px solid'}
            borderColor={message.role === 'user' ? userBorder : aiBorder}
            boxShadow={message.role === 'user' ? '0 2px 8px rgba(0, 80, 200, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.1)'}
            fontFamily="mono"
            fontSize="sm"
            color={textColor}
          >
            {typeof message.content === 'string' ? (
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
                  bg: codeBg,
                  px: 1,
                  py: 0.5,
                  borderRadius: 'sm',
                  fontFamily: 'mono',
                  fontSize: '0.9em',
                  border: '1px solid',
                  borderColor: codeBorder
                },
                '& pre': {
                  bg: codeBg,
                  p: 2,
                  borderRadius: 'md',
                  overflowX: 'auto',
                  mb: 2,
                  border: '1px solid',
                  borderColor: codeBorder,
                  '& code': {
                    bg: 'transparent',
                    p: 0,
                    border: 'none'
                  }
                },
                '& blockquote': {
                  borderLeft: '4px solid',
                  borderColor: blockquoteBorder,
                  pl: 4,
                  py: 1,
                  my: 2,
                  fontStyle: 'italic',
                  bg: blockquoteBg,
                  borderRadius: 'md'
                },
                '& h1, & h2, & h3, & h4, & h5, & h6': {
                  fontWeight: 'bold',
                  mb: 2,
                  mt: 4,
                  color: textColor
                },
                '& h1': { fontSize: '1.5em' },
                '& h2': { fontSize: '1.3em' },
                '& h3': { fontSize: '1.1em' },
                '& table': {
                  borderCollapse: 'collapse',
                  width: '100%',
                  mb: 2,
                  border: '1px solid',
                  borderColor: tableBorder
                },
                '& th, & td': {
                  border: '1px solid',
                  borderColor: tableBorder,
                  p: 2
                },
                '& th': {
                  bg: tableHeaderBg
                }
              }}>
                <ReactMarkdown>
                  {message.content}
                </ReactMarkdown>
              </Box>
            ) : (
              <Text whiteSpace="pre-wrap" fontFamily="mono">
                {JSON.stringify(message.content, null, 2)}
              </Text>
            )}
            
            {/* Display tool usage if available */}
            {message.tools && message.tools.length > 0 && (
              <Box mt={3} p={2} bg={codeBg} borderRadius="sm" border="1px solid" borderColor={codeBorder}>
                <Text fontSize="sm" fontWeight="bold" color={textColor}>Tools Used:</Text>
                {message.tools.map((tool, toolIndex) => (
                  <Text key={toolIndex} fontSize="xs" as="pre" fontFamily="mono" color={textColor}>
                    {tool.name}
                  </Text>
                ))}
              </Box>
            )}
          </Box>
          
          {index < messages.length - 1 && <Divider my={4} borderColor={aiBorder} />}
        </Box>
      ))}
    </VStack>
  );
};

export default MessageHistory; 