import React, { useState } from 'react';
import {
  Box,
  Input,
  Tag,
  TagLabel,
  TagCloseButton,
  HStack,
  VStack,
  Text
} from '@chakra-ui/react';

/**
 * A reusable component for inputting and managing tags
 * @param {Object} props - Component props
 * @param {string[]} props.tags - Current tags
 * @param {Function} props.onChange - Callback when tags change
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.label - Input label
 */
export const TagInput = ({ tags = [], onChange, placeholder, label }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        onChange([...tags, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <VStack align="stretch" spacing={2}>
      {label && <Text fontSize="sm" fontWeight="medium">{label}</Text>}
      <Box
        borderWidth="1.5px"
        borderColor="#b0b3b8"
        borderRadius="12px"
        p={2.5}
        bg="#fafaff"
        _focusWithin={{
          borderColor: '#a18aff',
          boxShadow: '0 0 0 1.5px #a18aff'
        }}
      >
        <HStack wrap="wrap" spacing={2}>
          {tags.map((tag, index) => (
            <Tag
              key={index}
              size="md"
              borderRadius="full"
              variant="solid"
              colorScheme="purple"
            >
              <TagLabel>{tag}</TagLabel>
              <TagCloseButton onClick={() => handleRemoveTag(tag)} />
            </Tag>
          ))}
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            variant="unstyled"
            size="md"
            minW="120px"
            color="#1a1a1a"
            fontSize="md"
            fontWeight={500}
            _placeholder={{ color: 'gray.400', fontWeight: 400 }}
          />
        </HStack>
      </Box>
    </VStack>
  );
}; 