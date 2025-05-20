import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, ChevronLeftIcon } from '@chakra-ui/icons';
import { Box, IconButton, Collapse, useColorModeValue } from '@chakra-ui/react';

const PURPLE_BG = '#8f3fff';
const KEY_DARK = '#23213a';
const KEY_TOP = '#2d2950';
const KEY_LABEL = '#e0e6ff';
const KEY_ACCENT = '#ff5c8a';
const INSTRUCTION_COLOR = '#fff';

const keyStyles = {
  boxShadow: '0 4px 16px rgba(30, 0, 60, 0.25)',
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0.5rem',
  minWidth: '48px',
  minHeight: '48px',
  background: `linear-gradient(180deg, ${KEY_TOP} 70%, ${KEY_DARK} 100%)`,
  position: 'relative' as const,
};

const labelStyles = {
  color: KEY_LABEL,
  fontWeight: 700,
  fontSize: '1.5rem',
  letterSpacing: '0.1em',
  textShadow: '0 2px 8px #0008',
  marginBottom: '0.25rem',
};

const spaceLabelStyles = {
  ...labelStyles,
  fontSize: '1rem',
  padding: '0 1.5rem',
};

const instructionStyles = {
  color: INSTRUCTION_COLOR,
  fontSize: '0.875rem',
  marginTop: '0.25rem',
  textAlign: 'center' as const,
  fontWeight: 500,
  opacity: 0.92,
};

const arrowKeyStyles = {
  ...keyStyles,
  minWidth: '40px',
  minHeight: '40px',
  padding: 0,
};

const SMALL_LABEL_STYLE = {
  color: INSTRUCTION_COLOR,
  fontSize: '0.75rem',
  marginTop: '0.25rem',
  textAlign: 'center' as const,
  fontWeight: 500,
  opacity: 0.92,
  minWidth: '60px',
};

const PURPLE_BORDER = '#8f3fff';

const KeyboardInstructions: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState('0px');
  const bgColor = useColorModeValue('purple.900', 'purple.900');
  const borderColor = useColorModeValue('gray.700', 'gray.700');
  const textColor = useColorModeValue('gray.100', 'gray.100');

  useEffect(() => {
    if (isExpanded && contentRef.current) {
      setMaxHeight(contentRef.current.scrollHeight + 'px');
    } else {
      setMaxHeight('0px');
    }
  }, [isExpanded]);

  return (
    <Box
      position="fixed"
      right="20px"
      top="80px"
      zIndex={2}
      w={isExpanded ? '420px' : '60px'}
      minW={isExpanded ? '420px' : '60px'}
      maxW={isExpanded ? '420px' : '60px'}
      h={isExpanded ? '70px' : '60px'}
      minH={isExpanded ? '70px' : '60px'}
      bg={isExpanded ? bgColor : 'transparent'}
      display="flex"
      flexDirection="column"
      borderRadius="xl"
      overflow="hidden"
      border={isExpanded ? '1px solid' : 'none'}
      borderColor={borderColor}
      boxShadow={isExpanded ? 'lg' : 'none'}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      alignItems="center"
      justifyContent={isExpanded ? 'flex-start' : 'center'}
    >
      {/* Toggle Button (Always Visible When Collapsed) */}
      {!isExpanded && (
        <Box
          w="60px"
          h="60px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <IconButton
            icon={<ChevronLeftIcon boxSize="24px" />}
            onClick={() => setIsExpanded(true)}
            bg="purple.900"
            color="white"
            borderRadius="full"
            boxShadow="lg"
            _hover={{ bg: 'purple.800', transform: 'scale(1.1)', opacity: 1 }}
            size="lg"
            aria-label="Expand keyboard shortcuts"
            transition="all 0.2s ease-in-out"
            opacity={0.8}
          />
        </Box>
      )}

      {/* Content */}
      <Collapse in={isExpanded} animateOpacity style={{ width: '100%', position: 'relative' }}>
        <Box
          ref={contentRef}
          px={4}
          pt={10}
          pb={8}
          overflowX="auto"
          overflowY="hidden"
          transition="max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s"
          maxHeight={maxHeight}
          opacity={isExpanded ? 1 : 0}
          width="100%"
          height="64px"
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          gap={6}
          flexWrap="nowrap"
          position="relative"
          pr="56px"
        >
          {/* Space Key */}
          <Box display="flex" flexDirection="column" alignItems="center" minW="90px" style={{paddingTop: 4, paddingBottom: 8}}>
            <Box style={{ ...keyStyles, minWidth: '90px', minHeight: '36px', flexDirection: 'column' }}>
              <svg width="80" height="36" viewBox="0 0 90 36" style={{ marginBottom: 0 }}>
                <rect x="2" y="2" width="86" height="32" rx="7" fill={KEY_TOP} stroke={PURPLE_BORDER} strokeWidth="2" />
                <text x="50%" y="60%" textAnchor="middle" fill={KEY_LABEL} fontSize="1rem" fontWeight="bold" fontFamily="inherit">SPACE</text>
              </svg>
            </Box>
            <span style={{ ...SMALL_LABEL_STYLE, fontSize: '0.8rem', minWidth: 70, whiteSpace: 'nowrap', display: 'block', paddingBottom: 6 }}>Next bullet</span>
          </Box>

          {/* OR text */}
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minW="32px" style={{paddingTop: 4, paddingBottom: 8}}>
            <span style={{ color: INSTRUCTION_COLOR, fontSize: '0.95rem', fontWeight: 500, opacity: 0.92, marginTop: '0.5rem', minWidth: 24, whiteSpace: 'nowrap', display: 'block', paddingBottom: 6 }}>OR</span>
          </Box>

          {/* Up Arrow Key */}
          <Box display="flex" flexDirection="column" alignItems="center" minW="56px" style={{paddingTop: 4, paddingBottom: 8}}>
            <Box style={{ ...arrowKeyStyles, minWidth: '36px', minHeight: '36px', padding: 0 }}>
              <svg width="36" height="36" viewBox="0 0 36 36" style={{ marginBottom: 0 }}>
                <rect x="2" y="2" width="32" height="32" rx="7" fill={KEY_TOP} stroke={PURPLE_BORDER} strokeWidth="2" />
                <polygon points="18,8 28,26 8,26" fill={KEY_LABEL} />
              </svg>
            </Box>
            <span style={{ ...SMALL_LABEL_STYLE, fontSize: '0.8rem', minWidth: 56, whiteSpace: 'nowrap', display: 'block', paddingBottom: 6 }}>Previous</span>
          </Box>

          {/* Down Arrow Key */}
          <Box display="flex" flexDirection="column" alignItems="center" minW="56px" style={{paddingTop: 4, paddingBottom: 8}}>
            <Box style={{ ...arrowKeyStyles, minWidth: '36px', minHeight: '36px', padding: 0 }}>
              <svg width="36" height="36" viewBox="0 0 36 36" style={{ marginBottom: 0 }}>
                <rect x="2" y="2" width="32" height="32" rx="7" fill={KEY_TOP} stroke={PURPLE_BORDER} strokeWidth="2" />
                <polygon points="8,14 28,14 18,28" fill={KEY_LABEL} />
              </svg>
            </Box>
            <span style={{ ...SMALL_LABEL_STYLE, fontSize: '0.8rem', minWidth: 56, whiteSpace: 'nowrap', display: 'block', paddingBottom: 6 }}>Next</span>
          </Box>

          {/* Collapse Button (overlay, right edge, vertically centered) */}
          <Box
            position="absolute"
            top="50%"
            right="16px"
            transform="translateY(-50%)"
            zIndex={3}
          >
            <IconButton
              icon={<ChevronLeftIcon boxSize="22px" />}
              onClick={() => setIsExpanded(false)}
              bg="purple.900"
              color="white"
              borderRadius="full"
              boxShadow="md"
              _hover={{ bg: 'purple.800', transform: 'scale(1.1)', opacity: 1 }}
              size="md"
              aria-label="Collapse keyboard shortcuts"
              transition="all 0.2s ease-in-out"
              opacity={0.8}
            />
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default KeyboardInstructions; 