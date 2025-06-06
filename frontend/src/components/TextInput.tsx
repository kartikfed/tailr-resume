import React, { useState, ChangeEvent, FocusEvent } from 'react';
import {
  Box,
  Textarea,
  Text,
  useColorModeValue
} from '@chakra-ui/react';

/**
 * Props for TextInput component
 */
export interface TextInputProps {
  id?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  locked?: boolean;
  rows?: number;
}

/**
 * A styled textarea input with label and error display
 */
const TextInput = React.forwardRef<HTMLTextAreaElement, TextInputProps>(({
  id,
  value,
  onChange,
  placeholder,
  label,
  error,
  locked = false,
  rows = 3
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const bgColor = useColorModeValue('gray.700', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.600', 'gray.600');
  const textColor = useColorModeValue('gray.100', 'gray.100');
  const borderColor = useColorModeValue('gray.600', 'gray.600');
  const focusBorderColor = useColorModeValue('blue.400', 'blue.400');
  const errorColor = useColorModeValue('red.400', 'red.400');

  const handleFocus = () => {
    if (!locked) {
      setIsFocused(true);
    }
  };

  const handleBlur = () => {
    if (!locked) {
      setIsFocused(false);
    }
  };

  return (
    <Box position="relative" width="100%">
      <Textarea
        ref={ref}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={isFocused ? '' : placeholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        bg={bgColor}
        color={textColor}
        border="1px solid"
        borderColor={error ? errorColor : isFocused ? focusBorderColor : borderColor}
        borderRadius="lg"
        p={3}
        fontSize="sm"
        rows={rows}
        resize="none"
        overflowY="auto"
        whiteSpace="pre-wrap"
        wordBreak="break-word"
        transition="all 0.2s"
        _hover={{
          bg: hoverBgColor,
          borderColor: error ? errorColor : isFocused ? focusBorderColor : 'gray.500',
        }}
        _focus={{
          bg: bgColor,
          borderColor: error ? errorColor : focusBorderColor,
          boxShadow: `0 0 0 1px ${error ? errorColor : focusBorderColor}`,
          transform: 'translateY(-1px)',
        }}
        _placeholder={{
          color: 'gray.400',
          opacity: 0.8,
        }}
        sx={{
          '&::-webkit-scrollbar': {
            width: '8px',
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: isFocused ? 'gray.500' : 'gray.600',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: isFocused ? 'gray.400' : 'gray.500',
            },
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
        }}
      />
      {(isFocused || value) && (
        <Text
          position="absolute"
          top="-8px"
          left="12px"
          px={1}
          fontSize="xs"
          fontWeight="medium"
          color={error ? errorColor : isFocused ? focusBorderColor : textColor}
          bg={bgColor}
          transition="all 0.2s"
          pointerEvents="none"
        >
          {error || label || placeholder}
        </Text>
      )}
    </Box>
  );
});

export default TextInput; 