import React from 'react';
import {
  Box,
  Heading,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Button,
  useClipboard,
  Flex,
  Badge
} from '@chakra-ui/react';

/**
 * Component for displaying the generated specification
 */
const SpecDisplay = ({ spec }) => {
  const { hasCopied, onCopy } = useClipboard(spec ? JSON.stringify(spec, null, 2) : '');

  if (!spec) {
    return null;
  }

  // Extract sections from spec (in a real implementation, this would parse a structured PRD)
  const sections = [
    { 
      title: 'Problem Statement',
      content: spec.problemStatement || 'No problem statement generated yet.'
    },
    { 
      title: 'User Stories',
      content: Array.isArray(spec.userStories) 
        ? spec.userStories.join('\n\n') 
        : (spec.userStories || 'No user stories generated yet.')
    },
    { 
      title: 'Requirements',
      content: Array.isArray(spec.requirements) 
        ? spec.requirements.join('\n\n') 
        : (spec.requirements || 'No requirements generated yet.')
    },
    { 
      title: 'Success Metrics',
      content: Array.isArray(spec.successMetrics) 
        ? spec.successMetrics.join('\n\n') 
        : (spec.successMetrics || 'No success metrics generated yet.')
    }
  ];

  return (
    <Box 
      width="100%"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      p={4}
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Generated Product Specification</Heading>
        <Button 
          size="sm" 
          onClick={onCopy} 
          colorScheme="blue" 
          variant="outline"
        >
          {hasCopied ? 'Copied!' : 'Copy to Clipboard'}
        </Button>
      </Flex>
      
      {spec.title && (
        <Heading size="lg" mb={4}>{spec.title}</Heading>
      )}
      
      {spec.status && (
        <Flex mb={4}>
          <Badge colorScheme="purple" fontSize="sm" px={2} py={1}>
            Status: {spec.status}
          </Badge>
        </Flex>
      )}
      
      <Accordion allowToggle defaultIndex={[0]}>
        {sections.map((section, index) => (
          <AccordionItem key={index}>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="medium">
                  {section.title}
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <Text whiteSpace="pre-wrap">{section.content}</Text>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
  );
};

export default SpecDisplay;