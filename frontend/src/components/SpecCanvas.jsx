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

/**
 * Component for rendering resume content with text selection and revision support
 */
const SpecCanvas = ({
  resumeStructured = null,
  onAcceptRevision,
  onRejectRevision
}) => {
  const [selectedText, setSelectedText] = useState(null);
  const toast = useToast();

  // Debug logging
  console.log('SpecCanvas received props:', {
    resumeStructured
  });

  // Check if any content is available
  const hasContent = () => {
    console.log('Checking content:', {
      hasStructured: !!resumeStructured
    });
    
    return !!resumeStructured;
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
      toast({
        title: 'Text selected',
        description: 'You can now request a revision for this text',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleRequestRevision = () => {
    if (selectedText) {
      toast({
        title: 'Revision requested',
        description: 'The AI will analyze your selection and suggest improvements',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
      // TODO: Implement revision request logic
    }
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

  return (
    <Box
      p={6}
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      onMouseUp={handleTextSelection}
    >
      <VStack align="stretch" spacing={6}>
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

        {/* Revision UI */}
        {selectedText && (
          <Box
            position="fixed"
            bottom={4}
            right={4}
            bg="white"
            p={4}
            borderRadius="md"
            boxShadow="lg"
            zIndex={10}
          >
            <VStack align="stretch" spacing={2}>
              <Text fontSize="sm" fontWeight="medium">Selected Text:</Text>
              <Text fontSize="sm" color="gray.600">{selectedText}</Text>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={handleRequestRevision}
              >
                Request Revision
              </Button>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default SpecCanvas;