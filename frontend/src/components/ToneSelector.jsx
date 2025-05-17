import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  useColorModeValue,
  IconButton,
  Collapse,
  Flex,
  useOutsideClick
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(TONE_OPTIONS.find(opt => opt.value === value) || TONE_OPTIONS[0]);
  const dropdownRef = useRef(null);
  const textColor = useColorModeValue('gray.600', 'gray.200');
  const descriptionColor = useColorModeValue('gray.500', 'gray.300');
  const bgColor = useColorModeValue('gray.700', 'gray.700');
  const hoverBgColor = useColorModeValue('purple.700', 'purple.700');
  const borderColor = useColorModeValue('purple.700', 'purple.700');

  useOutsideClick({
    ref: dropdownRef,
    handler: () => setIsOpen(false),
  });

  useEffect(() => {
    setSelectedOption(TONE_OPTIONS.find(opt => opt.value === value) || TONE_OPTIONS[0]);
  }, [value]);

  const handleSelect = (option) => {
    setSelectedOption(option);
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <Box position="relative" ref={dropdownRef}>
      <Box
        onClick={() => setIsOpen(!isOpen)}
        cursor="pointer"
        bg={bgColor}
        color="white"
        p={3}
        borderRadius="lg"
        border="1px solid"
        borderColor={borderColor}
        transition="all 0.2s ease"
        _hover={{
          bg: hoverBgColor,
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(128, 90, 213, 0.2)'
        }}
        _active={{
          transform: 'translateY(0)',
          boxShadow: '0 2px 6px rgba(128, 90, 213, 0.15)'
        }}
      >
        <Flex justify="space-between" align="center">
          <Text fontWeight="medium">{selectedOption.label}</Text>
          <ChevronDownIcon 
            transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
            transition="transform 0.2s ease"
          />
        </Flex>
      </Box>

      <Collapse in={isOpen} animateOpacity>
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={-1}
          bg={bgColor}
          borderRadius="0 0 lg lg"
          border="1px solid"
          borderColor={borderColor}
          borderTop="none"
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"
          zIndex={10}
          overflow="hidden"
          transformOrigin="top"
          transition="all 0.2s ease"
        >
          <VStack spacing={0} align="stretch">
            {TONE_OPTIONS.map((option) => (
              <Box
                key={option.value}
                p={3}
                cursor="pointer"
                bg={option.value === selectedOption.value ? 'purple.700' : 'transparent'}
                _hover={{
                  bg: option.value === selectedOption.value ? 'purple.700' : 'purple.800',
                }}
                onClick={() => handleSelect(option)}
                transition="all 0.2s ease"
              >
                <Text color="white" fontWeight="medium">{option.label}</Text>
                <Text fontSize="sm" color="gray.300" mt={1}>{option.description}</Text>
              </Box>
            ))}
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ToneSelector; 