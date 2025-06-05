import React from 'react';
import {
  Box,
  VStack,
  Text,
  Badge,
  HStack,
  useColorModeValue,
  Collapse,
  IconButton,
  useDisclosure,
  Icon
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { FiZap } from 'react-icons/fi';

interface EmphasisArea {
  category: string;
  items: string[];
}

interface EmphasisAreasProps {
  emphasis: {
    skills?: string[];
    experience?: string[];
    education?: string[];
    certifications?: string[];
    [key: string]: string[] | undefined;
  } | null;
}

/**
 * Component to display emphasis areas for resume optimization
 */
const EmphasisAreas: React.FC<EmphasisAreasProps> = ({ emphasis }) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  
  // Color mode values
  const bgColor = useColorModeValue('purple.900', 'purple.900');
  const textColor = useColorModeValue('gray.100', 'gray.100');
  const badgeBgColor = useColorModeValue('purple.700', 'purple.700');
  const borderColor = useColorModeValue('purple.700', 'purple.700');

  if (!emphasis) return null;

  // Flatten all emphasis items into a single list for 'Key Focus Points'
  const allItems: string[] = Object.values(emphasis)
    .filter((items) => Array.isArray(items) && items.length > 0)
    .flat() as string[];

  if (allItems.length === 0) return null;

  return (
    <Box
      maxW="800px"
      w="100%"
      bg="rgba(255,255,255,0.95)"
      borderRadius="20px"
      border="0.5px solid rgba(255,255,255,0.2)"
      boxShadow="0 8px 32px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.05)"
      backdropFilter="blur(40px) saturate(180%)"
      overflow="hidden"
      mb={8}
      animation="slideUp 0.6s cubic-bezier(0.4,0,0.2,1)"
    >
      {/* Section Header */}
      <Box
        bg="rgba(139,92,246,0.08)"
        borderBottom="0.5px solid rgba(139,92,246,0.15)"
        px={{ base: 6, md: 8 }}
        py={{ base: 5, md: 6 }}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        position="relative"
      >
        <HStack spacing={3} align="center">
          <Box
            w="24px"
            h="24px"
            bgGradient="linear(135deg, #8B5CF6, #A855F7)"
            borderRadius="6px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="white"
            fontSize="16px"
            fontWeight={600}
          >
            <Icon as={FiZap as any} />
          </Box>
          <Text fontSize="20px" fontWeight={700} color="#1a1a1a" letterSpacing="-0.02em">
            Emphasis Areas
          </Text>
        </HStack>
        <IconButton
          aria-label={isOpen ? "Collapse emphasis areas" : "Expand emphasis areas"}
          icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          size="sm"
          variant="ghost"
          color="#8B5CF6"
          bg="rgba(139,92,246,0.1)"
          border="1px solid rgba(139,92,246,0.2)"
          borderRadius="8px"
          fontSize="18px"
          _hover={{ bg: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)', transform: 'translateY(-1px)' }}
          onClick={onToggle}
        />
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          height="2px"
          bgGradient="linear(90deg, #8B5CF6, #A855F7, #C084FC)"
          opacity={1}
        />
      </Box>
      <Collapse in={isOpen} animateOpacity>
        <Box px={{ base: 5, md: 8 }} py={{ base: 6, md: 8 }}>
          {/* Category Label */}
          <HStack mb={6} align="center" spacing={2}>
            <Box w="16px" h="2px" borderRadius="1px" bgGradient="linear(90deg, #8B5CF6, #A855F7)" />
            <Text fontSize="12px" fontWeight={600} color="#8B5CF6" textTransform="uppercase" letterSpacing="0.5px">
              Key Focus Points
            </Text>
          </HStack>
          <VStack align="stretch" spacing={4}>
            {allItems.map((item, idx) => (
              <Box
                key={idx}
                className={selectedIdx === idx ? 'selected' : ''}
                bg={selectedIdx === idx ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.8)'}
                border={selectedIdx === idx ? '1.5px solid rgba(139,92,246,0.3)' : '1px solid rgba(139,92,246,0.12)'}
                borderRadius="14px"
                p={{ base: 4, md: 5 }}
                position="relative"
                boxShadow={selectedIdx === idx ? '0 8px 32px rgba(139,92,246,0.15), 0 2px 8px rgba(0,0,0,0.08)' : undefined}
                transition="all 0.3s cubic-bezier(0.4,0,0.2,1)"
                cursor="pointer"
                _hover={{
                  background: 'rgba(255,255,255,0.95)',
                  borderColor: 'rgba(139,92,246,0.25)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 32px rgba(139,92,246,0.12), 0 2px 8px rgba(0,0,0,0.08)'
                }}
                onClick={() => setSelectedIdx(idx)}
                tabIndex={0}
                role="button"
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedIdx(idx);
                }}
              >
                {/* Item number (show on hover on desktop, always on mobile) */}
                <Box
                  position="absolute"
                  top="16px"
                  left="20px"
                  w="24px"
                  h="24px"
                  bg="rgba(139,92,246,0.1)"
                  border="1px solid rgba(139,92,246,0.2)"
                  borderRadius="6px"
                  display={{ base: 'flex', md: 'none' }}
                  alignItems="center"
                  justifyContent="center"
                  fontSize="11px"
                  fontWeight={600}
                  color="#8B5CF6"
                  opacity={1}
                  zIndex={2}
                >
                  {idx + 1}
                </Box>
                <Text
                  fontSize="14px"
                  lineHeight="1.6"
                  color="#1a1a1a"
                  fontWeight={500}
                  letterSpacing="-0.01em"
                  ml={{ base: 0, md: '40px' }}
                >
                  {/* Bold and purple keywords: match all-caps or phrases in ** or <b> */}
                  {item.split(/(\*\*[^*]+\*\*|<b>[^<]+<\/b>|[A-Z][A-Z\s]+(?=\s|$))/g).map((part, i) => {
                    if (!part) return null;
                    // Bold and purple for **text** or <b>text</b> or ALL CAPS
                    if (/^(\*\*[^*]+\*\*|<b>[^<]+<\/b>|[A-Z][A-Z\s]+)$/.test(part.trim())) {
                      return <span key={i} style={{ color: '#8B5CF6', fontWeight: 700 }}>{part.replace(/\*\*|<b>|<\/b>/g, '').trim()}</span>;
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </Text>
                {/* Checkmark for selected */}
                {selectedIdx === idx && (
                  <Box
                    position="absolute"
                    top="16px"
                    right="20px"
                    w="20px"
                    h="20px"
                    bgGradient="linear(135deg, #8B5CF6, #A855F7)"
                    borderRadius="50%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="white"
                    fontSize="11px"
                    fontWeight={600}
                    zIndex={2}
                  >
                    ✓
                  </Box>
                )}
              </Box>
            ))}
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default EmphasisAreas; 