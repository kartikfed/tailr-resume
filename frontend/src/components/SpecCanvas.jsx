import React from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Divider,
  Badge,
  Container
} from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';

/**
 * Component for rendering specifications in a canvas-like experience
 */
const SpecCanvas = ({ content, title = "Generated Specification" }) => {
  
  // If no content, show empty state
  if (!content) {
    return (
      <Box
        h="100%"
        bg="gray.50"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={8}
      >
        <VStack spacing={4} textAlign="center">
          <Heading size="md" color="gray.500">
            No Specification Generated
          </Heading>
          <Text color="gray.400">
            Upload a file and ask Claude to create a specification to see it rendered here.
          </Text>
        </VStack>
      </Box>
    );
  }

  // Function to process the content and convert to proper markdown
  const processContent = (text) => {
    // If the content is already formatted nicely, use it as-is
    // Otherwise, try to extract and format it
    
    // Check if content looks like it's already in a structured format
    if (text.includes('## ') || text.includes('### ') || text.includes('#### ')) {
      return text;
    }
    
    // Try to convert numbered sections to markdown headers
    let processedText = text;
    
    // Convert numbered sections like "1. Overview" to "## 1. Overview"
    processedText = processedText.replace(/^(\d+\.\s+)([^.\n]+)$/gm, '## $1$2');
    
    // Convert lettered subsections like "- " to "### "
    processedText = processedText.replace(/^-\s+([^:]+):/gm, '### $1');
    
    // Ensure proper spacing between sections
    processedText = processedText.replace(/## /g, '\n\n## ');
    
    return processedText;
  };

  const processedContent = processContent(content);

  return (
    <Box
      h="100%"
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box
        bg="blue.50"
        borderBottom="1px solid"
        borderColor="gray.200"
        p={4}
      >
        <Heading size="md" color="blue.900">
          {title}
        </Heading>
        <Badge colorScheme="blue" size="sm" mt={1}>
          Live Preview
        </Badge>
      </Box>

      {/* Content */}
      <Box
        flex="1"
        overflow="auto"
        p={6}
      >
        <Container maxW="none" p={0}>
          <ReactMarkdown
            components={{
              // Custom styling for markdown elements
              h1: ({ children }) => (
                <Heading as="h1" size="xl" mb={4} color="gray.800" borderBottom="2px solid" borderColor="blue.200" pb={2}>
                  {children}
                </Heading>
              ),
              h2: ({ children }) => (
                <Heading as="h2" size="lg" mb={3} mt={6} color="gray.700">
                  {children}
                </Heading>
              ),
              h3: ({ children }) => (
                <Heading as="h3" size="md" mb={2} mt={4} color="gray.600">
                  {children}
                </Heading>
              ),
              h4: ({ children }) => (
                <Heading as="h4" size="sm" mb={2} mt={3} color="gray.600">
                  {children}
                </Heading>
              ),
              p: ({ children }) => (
                <Text mb={3} lineHeight={1.6} color="gray.700">
                  {children}
                </Text>
              ),
              ul: ({ children }) => (
                <Box as="ul" ml={4} mb={3}>
                  {children}
                </Box>
              ),
              ol: ({ children }) => (
                <Box as="ol" ml={4} mb={3}>
                  {children}
                </Box>
              ),
              li: ({ children }) => (
                <Text as="li" mb={1} color="gray.700">
                  {children}
                </Text>
              ),
              blockquote: ({ children }) => (
                <Box
                  borderLeft="4px solid"
                  borderColor="blue.200"
                  bg="blue.50"
                  p={4}
                  mb={4}
                  fontStyle="italic"
                >
                  {children}
                </Box>
              ),
              hr: () => <Divider my={6} />
            }}
          >
            {processedContent}
          </ReactMarkdown>
        </Container>
      </Box>
    </Box>
  );
};

export default SpecCanvas;