import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  IconButton,
  useColorModeValue,
  SlideFade,
  Portal,
  useDisclosure,
  Image,
  chakra,
} from '@chakra-ui/react';
import ChatInterface from './ChatInterface';
import { ChatProps, Message } from '../types/chat';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutsideClick } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

/**
 * SVG Star/Diamond Icon for FAB
 */
const StarIcon: React.FC<{ rotated: boolean }> = ({ rotated }) => (
  <chakra.svg
    viewBox="0 0 32 32"
    width="32px"
    height="32px"
    display="block"
    transition="transform 0.4s cubic-bezier(0.4,0,0.2,1)"
    transform={rotated ? 'rotate(45deg)' : 'rotate(0deg)'}
    aria-label="Chat Icon"
    role="img"
    pointerEvents="none"
    style={{ filter: 'drop-shadow(0 0 8px rgba(80, 80, 255, 0.3))' }}
  >
    {/* White gradient reflection at the top */}
    <defs>
      <linearGradient id="fab-reflection" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
        <stop offset="40%" stopColor="#fff" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
    {/* Main star/diamond shape */}
    <polygon
      points="16,4 20,16 16,28 12,16"
      fill="#fff"
      filter="drop-shadow(0 2px 8px rgba(80,80,255,0.18))"
    />
    {/* Overlay gradient for 3D effect */}
    <polygon
      points="16,4 20,16 16,28 12,16"
      fill="url(#fab-reflection)"
    />
  </chakra.svg>
);

/**
 * FloatingChat component that provides a collapsible chat interface
 * @param props - ChatProps passed to the underlying ChatInterface
 */
const FloatingChat: React.FC<ChatProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const chatPaneRef = useRef<HTMLDivElement>(null);
  
  // Add collapse handler with useCallback
  const handleCollapse = useCallback(() => {
    if (!isAnimating) {
      setIsAnimating(true);
      setIsOpen(false);
    }
  }, [isAnimating]);

  // Add toggle handler with useCallback
  const handleToggle = useCallback(() => {
    if (!isAnimating) {
      setIsAnimating(true);
      setIsOpen(prev => !prev);
    }
  }, [isAnimating]);

  // Reset animation state when animation completes
  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
  }, []);

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

  // Close chat when clicking outside
  useOutsideClick({
    ref: chatPaneRef,
    handler: () => {
      if (isOpen && !isAnimating) {
        setIsAnimating(true);
        setIsOpen(false);
      }
    },
  });

  // Type-safe wrapper for onUpdateMessages
  const onUpdateMessages = props.onUpdateMessages
    ? (cb: (prev: Message[]) => Message[]) => {
        props.onUpdateMessages!((prev: any) => cb(prev as Message[]));
      }
    : undefined;

  // Animation variants for Framer Motion
  const chatPaneVariants = {
    hidden: {
      y: '100%',
      scale: 0.92,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    visible: {
      y: 0,
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: {
      y: '100%',
      scale: 0.92,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1],
      },
    },
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
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
          icon={<StarIcon rotated={isOpen} />}
          onClick={handleToggle}
          bgGradient="linear(to-br, #a084ee 0%, #a259e6 100%)"
          _hover={{
            transform: 'translateY(-4px) scale(1.05)',
            boxShadow: '0 8px 32px 0 rgba(80, 80, 255, 0.35), 0 2px 8px 0 rgba(80, 80, 255, 0.18)',
            bgGradient: 'linear(to-br, #b49bfc 0%, #a259e6 100%)',
            transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
          }}
          _active={{
            transform: 'scale(0.97)',
            boxShadow: '0 2px 8px 0 rgba(80, 80, 255, 0.18)',
          }}
          height="64px"
          width="64px"
          minW="64px"
          minH="64px"
          borderRadius="20px"
          boxShadow="0 4px 24px 0 rgba(80, 80, 255, 0.18), 0 1.5px 6px 0 rgba(80, 80, 255, 0.10)"
          transition="all 0.4s cubic-bezier(0.4,0,0.2,1)"
          color="white"
          mb={4}
          p={0}
        />

        {/* Chat Interface with custom animation */}
        <motion.div
          ref={chatPaneRef}
          initial="hidden"
          animate={isOpen ? 'visible' : 'hidden'}
          variants={chatPaneVariants}
          onAnimationComplete={handleAnimationComplete}
          style={{
            position: 'fixed',
            right: 16,
            bottom: 80,
            width: 'min(700px, 100vw - 2rem)',
            height: 'min(800px, 100vh - 6rem)',
            zIndex: 999,
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 8px 32px 0 rgba(80, 80, 255, 0.18), 0 2px 8px 0 rgba(80, 80, 255, 0.10)',
            background: bgColor,
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: isOpen ? 'auto' : 'none',
          }}
        >
          <ChatInterface {...props} onUpdateMessages={onUpdateMessages} onCollapse={handleCollapse} />
        </motion.div>
      </Box>
    </Portal>
  );
};

export default FloatingChat; 