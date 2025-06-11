import React from 'react';
import {
  Box,
  VStack,
  Text,
  Progress,
  Badge,
  HStack,
  Divider,
  useColorModeValue,
  Flex,
  Tooltip,
} from '@chakra-ui/react';

interface SectionAnalysis {
  matches: Array<{
    jobText: string;
    jobType: string;
    jobPriority: string;
    resumeText: string;
    resumeSection: string;
    similarity: number;
  }>;
  score: number;
}

interface AnalyticsResults {
  overallScore: number;
  sectionAnalysis: {
    summary: SectionAnalysis;
    experience: SectionAnalysis;
    skills: SectionAnalysis;
    education: SectionAnalysis;
    projects: SectionAnalysis;
  };
  recommendations: string[];
  rawScores: any[];
}

interface ResumeAnalyticsProps {
  results: AnalyticsResults;
}

/**
 * ResumeAnalytics component displays the analysis results of resume matching against job requirements
 */
export const ResumeAnalytics: React.FC<ResumeAnalyticsProps> = ({ results }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtitleColor = useColorModeValue('gray.600', 'gray.400');

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'yellow';
    return 'red';
  };

  const formatScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'red';
      case 'important':
        return 'orange';
      default:
        return 'blue';
    }
  };

  return (
    <Box
      bg={bgColor}
      borderRadius="xl"
      border="1px solid"
      borderColor={borderColor}
      p={6}
      boxShadow="sm"
    >
      {/* Overall Score */}
      <VStack spacing={6} align="stretch">
        <Box>
          <Text fontSize="lg" fontWeight="bold" color={textColor} mb={2}>
            Overall Match Score
          </Text>
          <Progress
            value={results.overallScore * 100}
            colorScheme={getScoreColor(results.overallScore)}
            borderRadius="full"
            size="lg"
            mb={2}
          />
          <Text fontSize="2xl" fontWeight="bold" color={getScoreColor(results.overallScore)}>
            {formatScore(results.overallScore)}
          </Text>
        </Box>

        <Divider />

        {/* Section Scores */}
        <Box>
          <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>
            Section Analysis
          </Text>
          <VStack spacing={4} align="stretch">
            {Object.entries(results.sectionAnalysis).map(([section, analysis]) => (
              <Box key={section}>
                <Flex justify="space-between" align="center" mb={2}>
                  <Text
                    fontSize="md"
                    fontWeight="medium"
                    color={textColor}
                    textTransform="capitalize"
                  >
                    {section}
                  </Text>
                  <Badge
                    colorScheme={getScoreColor(analysis.score)}
                    fontSize="sm"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {formatScore(analysis.score)}
                  </Badge>
                </Flex>
                <Progress
                  value={analysis.score * 100}
                  colorScheme={getScoreColor(analysis.score)}
                  size="sm"
                  borderRadius="full"
                />
              </Box>
            ))}
          </VStack>
        </Box>

        <Divider />

        {/* Top Matches */}
        <Box>
          <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>
            Top Matches
          </Text>
          <VStack spacing={3} align="stretch">
            {results.rawScores
              .sort((a, b) => b.similarity - a.similarity)
              .slice(0, 5)
              .map((match, index) => (
                <Box
                  key={index}
                  p={3}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <HStack spacing={2} mb={1}>
                    <Badge colorScheme={getPriorityColor(match.jobPriority)}>
                      {match.jobPriority}
                    </Badge>
                    <Badge colorScheme="purple">{match.jobType}</Badge>
                  </HStack>
                  <Text fontSize="sm" color={textColor} fontWeight="medium">
                    {match.jobText}
                  </Text>
                  <Text fontSize="sm" color={subtitleColor}>
                    Matches with: {match.resumeText}
                  </Text>
                  <Tooltip label={`Similarity: ${formatScore(match.similarity)}`}>
                    <Progress
                      value={match.similarity * 100}
                      colorScheme={getScoreColor(match.similarity)}
                      size="xs"
                      mt={2}
                      borderRadius="full"
                    />
                  </Tooltip>
                </Box>
              ))}
          </VStack>
        </Box>

        <Divider />

        {/* Recommendations */}
        <Box>
          <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>
            Recommendations
          </Text>
          <VStack spacing={3} align="stretch">
            {results.recommendations.map((recommendation, index) => (
              <Box
                key={index}
                p={3}
                borderRadius="md"
                bg={useColorModeValue('gray.50', 'gray.700')}
              >
                <Text fontSize="sm" color={textColor}>
                  {recommendation}
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}; 