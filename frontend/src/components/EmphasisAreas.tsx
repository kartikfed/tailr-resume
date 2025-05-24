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
  useDisclosure
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

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
  
  // Color mode values
  const bgColor = useColorModeValue('purple.900', 'purple.900');
  const textColor = useColorModeValue('gray.100', 'gray.100');
  const badgeBgColor = useColorModeValue('purple.700', 'purple.700');
  const borderColor = useColorModeValue('purple.700', 'purple.700');

  if (!emphasis) return null;

  // Convert emphasis object to array of EmphasisArea objects with proper type checking
  const emphasisAreas: EmphasisArea[] = Object.entries(emphasis)
    .filter(([_, items]) => {
      // Ensure items is an array and has elements
      return Array.isArray(items) && items.length > 0;
    })
    .map(([category, items]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      items: items as string[]
    }));

  if (emphasisAreas.length === 0) return null;

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      p={4}
      mb={6}
      border="1px solid"
      borderColor={borderColor}
    >
      <VStack align="stretch" spacing={4}>
        <HStack justify="space-between" align="center">
          <Text
            color={textColor}
            fontSize="lg"
            fontWeight="bold"
          >
            Emphasis Areas
          </Text>
          <IconButton
            aria-label={isOpen ? "Collapse emphasis areas" : "Expand emphasis areas"}
            icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            size="sm"
            variant="ghost"
            color={textColor}
            onClick={onToggle}
          />
        </HStack>
        
        <Collapse in={isOpen}>
          <VStack align="stretch" spacing={4}>
            {emphasisAreas.map((area) => (
              <Box key={area.category}>
                <Text
                  color={textColor}
                  fontSize="sm"
                  fontWeight="medium"
                  mb={2}
                >
                  {area.category}
                </Text>
                <HStack wrap="wrap" spacing={2}>
                  {Array.isArray(area.items) && area.items.map((item, index) => (
                    <Badge
                      key={index}
                      bg={badgeBgColor}
                      color={textColor}
                      px={2}
                      py={1}
                      borderRadius="md"
                      fontSize="xs"
                    >
                      {item}
                    </Badge>
                  ))}
                </HStack>
              </Box>
            ))}
          </VStack>
        </Collapse>
      </VStack>
    </Box>
  );
};

export default EmphasisAreas; 