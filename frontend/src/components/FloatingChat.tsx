import React, { useState } from 'react';
import {
  Box,
  IconButton,
  useColorModeValue,
  SlideFade,
  Portal,
  useDisclosure,
  Image,
} from '@chakra-ui/react';
import ChatInterface from './ChatInterface';
import { ChatProps } from '../types/chat';

/**
 * FloatingChat component that provides a collapsible chat interface
 * @param props - ChatProps passed to the underlying ChatInterface
 */
const FloatingChat: React.FC<ChatProps> = (props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isOpen, onToggle } = useDisclosure();
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const fabBgGradient = useColorModeValue(
    'linear(to-br, blue.400, purple.500)',
    'linear(to-br, blue.500, purple.600)'
  );
  const fabHoverBgGradient = useColorModeValue(
    'linear(to-br, blue.500, purple.600)',
    'linear(to-br, blue.600, purple.700)'
  );
  const fabGlowColor = useColorModeValue('blue.200', 'blue.300');

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggle();
  };

  return (
    <Portal>
      <Box
        position="fixed"
        right="4"
        bottom="4"
        zIndex={1000}
      >
        {/* Floating Action Button with larger logo */}
        <IconButton
          aria-label={isExpanded ? 'Close chat' : 'Open chat'}
          icon={
            <Image
              src="/tailr-logo.png"
              alt="AI Chat Logo"
              boxSize="54px"
              borderRadius="full"
              objectFit="contain"
              filter="drop-shadow(0 0 8px rgba(80, 80, 255, 0.3))"
              transition="transform 0.2s"
            />
          }
          onClick={handleToggle}
          bgGradient={fabBgGradient}
          _hover={{
            bgGradient: fabHoverBgGradient,
            transform: 'scale(1.05)',
            boxShadow: `0 0 20px ${fabGlowColor}`,
          }}
          _active={{
            transform: 'scale(0.95)',
          }}
          height="64px"
          width="64px"
          minW="64px"
          minH="64px"
          isRound
          boxShadow={`0 0 15px ${fabGlowColor}`}
          transition="all 0.2s ease-in-out"
          color="white"
          mb={4}
          p={0}
        />

        {/* Chat Interface */}
        <SlideFade in={isOpen} offsetY="20px">
          <Box
            position="fixed"
            right="4"
            bottom="20"
            width={{ base: 'calc(100% - 2rem)', md: '500px', lg: '700px' }}
            height={{ base: 'calc(100% - 6rem)', md: '700px', lg: '800px' }}
            bg={bgColor}
            borderRadius="lg"
            boxShadow="2xl"
            overflow="hidden"
            zIndex={999}
          >
            <ChatInterface {...props} />
          </Box>
        </SlideFade>
      </Box>
    </Portal>
  );
};

export default FloatingChat; 