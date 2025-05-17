import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  useToast,
  Button,
  List,
  ListItem,
  ListIcon,
  Flex,
  Badge,
  Divider
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Component for rendering resume content with text selection and revision support
 */
const SpecCanvas = ({
  resumeStructured = null,
  resumeMarkdown = null,
  onAcceptRevision,
  onRejectRevision
}) => {
  // Debug logging
  console.log('SpecCanvas received props:', {
    resumeStructured,
    resumeMarkdown
  });

  // Check if any content is available
  const hasContent = () => {
    console.log('Checking content:', {
      hasStructured: !!resumeStructured,
      hasMarkdown: !!resumeMarkdown
    });
    
    return !!resumeStructured || !!resumeMarkdown;
  };

  // Helper function to render content with proper line breaks
  const renderContent = (content) => {
    if (!content) return null;
    
    // Split content by newlines and filter out empty lines
    const lines = content.split('\n').filter(line => line.trim());
    
    return (
      <VStack align="start" spacing={2}>
        {lines.map((line, index) => (
          <Text key={index} whiteSpace="pre-wrap">
            {line}
          </Text>
        ))}
      </VStack>
    );
  };

  // Helper function to unescape Markdown special characters
  function unescapeMarkdown(text) {
    if (!text) return text;
    // Unescape common Markdown characters: \\* \\# \\_ \\` \\~ \\> \\- \\! \\[ \\] \\( \\) \\{ \\} \\< \\> \\| \\.
    return text.replace(/\\([#*_[\]()`~>\-!{}<>|.])/g, '$1');
  }

  if (!hasContent()) {
    return (
      <Box
        p={8}
        bg="white"
        borderRadius="lg"
        boxShadow="sm"
        textAlign="center"
        color="gray.500"
      >
        <Text>No resume loaded</Text>
      </Box>
    );
  }

  if (resumeMarkdown) {
    console.log('Rendering resumeMarkdown:', resumeMarkdown);
  }

  return (
    <Box
      p={6}
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
    >
      <VStack align="stretch" spacing={6}>
        {/* Render Markdown if present (Claude flow) */}
        {resumeMarkdown && (
          <Box>
            <ReactMarkdown
              children={unescapeMarkdown(resumeMarkdown)}
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <Heading as="h1" size="lg" my={4} {...props} />,
                h2: ({node, ...props}) => <Heading as="h2" size="md" my={3} {...props} />,
                h3: ({node, ...props}) => <Heading as="h3" size="sm" my={2} {...props} />,
                p: ({node, ...props}) => <Text my={2} {...props} />,
                ul: ({node, ...props}) => <List styleType="disc" pl={4} {...props} />,
                ol: ({node, ...props}) => <List as="ol" styleType="decimal" pl={4} {...props} />,
                strong: ({node, ...props}) => <Text as="span" fontWeight="bold" {...props} />,
                em: ({node, ...props}) => <Text as="span" fontStyle="italic" {...props} />,
                hr: ({node, ...props}) => <Divider my={4} {...props} />,
              }}
            />
          </Box>
        )}
        {/* Fallback: Render structured data (Affinda flow) */}
        {!resumeMarkdown && resumeStructured && (
          <>
            {/* Metadata */}
            {resumeStructured.metadata && (
              <Box mb={6}>
                <Heading as="h3" size="md" mb={2}>Contact Information</Heading>
                <VStack align="start" spacing={1}>
                  {resumeStructured.metadata.name && (
                    <Text fontWeight="bold">{resumeStructured.metadata.name}</Text>
                  )}
                  {resumeStructured.metadata.email && (
                    <Text>{resumeStructured.metadata.email}</Text>
                  )}
                  {resumeStructured.metadata.phone && (
                    <Text>{resumeStructured.metadata.phone}</Text>
                  )}
                  {resumeStructured.metadata.location && (
                    <Text>{resumeStructured.metadata.location}</Text>
                  )}
                </VStack>
              </Box>
            )}

            {/* Sections */}
            {resumeStructured.sections?.map((section) => (
              <Box key={section.id} mb={6}>
                <Heading as="h3" size="md" mb={3}>{section.title}</Heading>
                {section.type === 'text' && (
                  renderContent(section.content)
                )}
                {section.type === 'list' && section.items && (
                  <List spacing={4}>
                    {section.items.map((item) => (
                      <ListItem key={item.id}>
                        <Flex direction="column" gap={1}>
                          {item.title && (
                            <Text fontWeight="bold">{item.title}</Text>
                          )}
                          {item.company && (
                            <Text color="gray.600">{item.company}</Text>
                          )}
                          {item.location && (
                            <Text color="gray.600" fontSize="sm">{item.location}</Text>
                          )}
                          {item.dates && (
                            <Text fontSize="sm" color="gray.500">{item.dates}</Text>
                          )}
                          {/* Render only bullets */}
                          {item.bullets && item.bullets.length > 0 && (
                            <List spacing={2} styleType="disc" pl={4}>
                              {item.bullets.map((bullet, bIdx) => (
                                <ListItem key={bIdx}>{bullet}</ListItem>
                              ))}
                            </List>
                          )}
                          {item.name && (
                            <Badge colorScheme="blue" width="fit-content">
                              {item.name}
                            </Badge>
                          )}
                        </Flex>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            ))}
          </>
        )}
      </VStack>
    </Box>
  );
};

export default SpecCanvas;