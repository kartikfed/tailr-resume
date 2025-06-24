import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Spinner,
  Heading,
  Divider,
  Box,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';

interface RequirementCoverage {
  requirement: string;
  best_match: string | null;
  score: number;
}

interface ResumeCoverageItem {
  resume_chunk: string;
  best_match: string | null;
  score: number;
}

interface BidirectionalAnalysis {
  requirementCoverage: RequirementCoverage[];
  resumeCoverage: ResumeCoverageItem[];
}

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: BidirectionalAnalysis | null;
  isLoading: boolean;
}

const formatScore = (score: number) => {
  const percentage = (score * 100).toFixed(1);
  let color;
  if (score > 0.7) color = 'green.500';
  else if (score > 0.5) color = 'yellow.500';
  else color = 'red.500';
  return <Text as="span" color={color} fontWeight="bold">{percentage}%</Text>;
};

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  analysis,
  isLoading,
}) => {
  const headerBg = 'linear-gradient(90deg, #a18aff 0%, #7f56d9 100%)';
  const sectionTitleColor = '#a18aff';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent
        maxW="800px"
        borderRadius="22px"
        boxShadow="0 8px 32px rgba(127,86,217,0.10)"
        overflow="hidden"
      >
        <Box bgGradient={headerBg} px={6} py={4} display="flex" alignItems="center">
          <Text fontSize="2xl" fontWeight="bold" color="white">
            Resume Analysis
          </Text>
        </Box>

        <ModalBody px={0} py={6} bg="white">
          {isLoading ? (
            <VStack spacing={4} justify="center" h="300px">
              <Spinner size="xl" color={sectionTitleColor} />
              <Text color="gray.600">Analyzing...</Text>
            </VStack>
          ) : analysis ? (
            <Tabs isFitted variant="enclosed-colored" colorScheme="purple">
              <TabList mb="1em">
                <Tab>Requirement Coverage</Tab>
                <Tab>Resume Coverage</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    {(analysis.requirementCoverage || []).map((item, index) => (
                      <Box key={index} p={4} borderWidth="1px" borderRadius="lg" borderColor="gray.200">
                        <Heading size="sm" mb={2} color="gray.700">Job Requirement:</Heading>
                        <Text mb={3} color="gray.800" fontWeight="semibold">"{item.requirement}"</Text>
                        <Divider my={3} />
                        <Text color="gray.600" fontSize="sm">Best Resume Match:</Text>
                        <Text mb={2} color="gray.800" fontStyle="italic">"{item.best_match || 'No strong match found'}"</Text>
                        <Text color="gray.600">Similarity: {formatScore(item.score)}</Text>
                      </Box>
                    ))}
                  </VStack>
                </TabPanel>
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    {(analysis.resumeCoverage || []).length > 0 ? (
                      (analysis.resumeCoverage || []).map((item, index) => (
                        <Box key={index} p={4} borderWidth="1px" borderRadius="lg" borderColor="gray.200">
                          <Text mb={3} color="gray.800" fontWeight="semibold">"{item.resume_chunk}"</Text>
                          <Divider my={3} />
                          <Text color="gray.600" fontSize="sm">Best Job Match:</Text>
                          <Text mb={2} color="gray.800" fontStyle="italic">"{item.best_match || 'No strong match found'}"</Text>
                          <Text color="gray.600">Similarity: {formatScore(item.score)}</Text>
                        </Box>
                      ))
                    ) : (
                      <Text color="gray.600" textAlign="center" py={10}>Could not extract key content from resume.</Text>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          ) : (
            <Text color="gray.600" textAlign="center" py={10}>No analysis results to display.</Text>
          )}
        </ModalBody>

        <ModalFooter bg="white" px={10} py={6} borderTop="1px solid #f3f3f6">
          <Button onClick={onClose} size="lg" borderRadius="10px">
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};