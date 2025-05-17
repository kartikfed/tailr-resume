import React from 'react';
import {
  Select,
  FormControl,
  FormLabel,
  Text,
  VStack,
  Box,
  useColorModeValue
} from '@chakra-ui/react';

const TONE_OPTIONS = [
  {
    value: 'concise',
    label: 'Concise & Punchy',
    description: 'For product-focused roles',
    example: 'e.g., "Led cross-functional team to launch feature, increasing user engagement by 40%"'
  },
  {
    value: 'technical',
    label: 'Detailed & Technical',
    description: 'For engineering-heavy roles',
    example: 'e.g., "Implemented distributed caching system using Redis, reducing API latency by 60%"'
  },
  {
    value: 'plain',
    label: 'Plain Language',
    description: 'For nonprofit or generalist roles',
    example: 'e.g., "Collaborated with community partners to expand program reach by 200 families"'
  }
];

const ToneSelector = ({ value, onChange, label = 'Writing Style', labelColor }) => {
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const descriptionColor = useColorModeValue('gray.500', 'gray.300');

  return (
    <FormControl>
      <FormLabel color={labelColor}>{label}</FormLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size="md"
        bg="gray.700"
        color="white"
        borderColor="gray.600"
        _hover={{ borderColor: 'gray.500' }}
        _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #3182ce' }}
      >
        {TONE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {value && (
        <VStack align="start" mt={2} spacing={1}>
          <Text fontSize="sm" color="white" fontWeight="medium">
            {TONE_OPTIONS.find(opt => opt.value === value)?.description}
          </Text>
          <Text fontSize="xs" color="white" fontStyle="italic" opacity={0.9}>
            {TONE_OPTIONS.find(opt => opt.value === value)?.example}
          </Text>
        </VStack>
      )}
    </FormControl>
  );
};

export default ToneSelector; 