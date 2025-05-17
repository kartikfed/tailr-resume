import React from 'react';
import {
  Select,
  FormControl,
  FormLabel,
  Text,
  VStack,
  Box
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

const ToneSelector = ({ value, onChange, label = 'Writing Style' }) => {
  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size="md"
      >
        {TONE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {value && (
        <VStack align="start" mt={2} spacing={1}>
          <Text fontSize="sm" color="gray.600">
            {TONE_OPTIONS.find(opt => opt.value === value)?.description}
          </Text>
          <Text fontSize="xs" color="gray.500" fontStyle="italic">
            {TONE_OPTIONS.find(opt => opt.value === value)?.example}
          </Text>
        </VStack>
      )}
    </FormControl>
  );
};

export default ToneSelector; 