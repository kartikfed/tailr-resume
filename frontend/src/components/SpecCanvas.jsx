import React, { useState, useRef } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  useToast,
  Button,
  List,
  ListItem,
  ListIcon,
  Flex,
  Badge,
  Divider,
  Textarea,
  HStack
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReactDOM from 'react-dom';

/**
 * Component for rendering resume content with text selection and revision support
 */
const SpecCanvas = ({
  resumeStructured = null,
  resumeMarkdown = null,
  onAcceptRevision,
  onRejectRevision
}) => {
  // Debug logging
  console.log('SpecCanvas received props:', {
    resumeStructured,
    resumeMarkdown
  });

  // Check if any content is available
  const hasContent = () => {
    console.log('Checking content:', {
      hasStructured: !!resumeStructured,
      hasMarkdown: !!resumeMarkdown
    });
    
    return !!resumeStructured || !!resumeMarkdown;
  };

  // Helper function to render content with proper line breaks and allow fine-grained selection
  const renderContent = (content) => {
    if (!content) return null;
    return (
      <Box whiteSpace="pre-wrap" userSelect="text">
        {content}
      </Box>
    );
  };

  // Helper function to unescape Markdown special characters
  function unescapeMarkdown(text) {
    if (!text) return text;
    // Unescape common Markdown characters: \\* \\# \\_ \\` \\~ \\> \\- \\! \\[ \\] \\( \\) \\{ \\} \\< \\> \\| \\.
    return text.replace(/\\([#*_[\]()`~>\-!{}<>|.])/g, '$1');
  }

  const [showReviseButton, setShowReviseButton] = useState(false);
  const [reviseButtonPosition, setReviseButtonPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const canvasRef = useRef(null);
  const floatingRef = useRef(null);
  const ignoreNextClickAway = useRef(false);
  const [showRevisionPopover, setShowRevisionPopover] = useState(false);
  const [userInstructions, setUserInstructions] = useState('');

  // Remove onMouseUp from the canvas and use selectionchange event
  React.useEffect(() => {
    function handleSelectionChange() {
      if (showRevisionPopover) return; // Ignore selection changes while popover is open
      const selection = window.getSelection();
      const text = selection.toString().trim();
      if (
        text.length > 0 &&
        canvasRef.current &&
        selection.rangeCount > 0 &&
        canvasRef.current.contains(selection.anchorNode)
      ) {
        setSelectedText(text);
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setReviseButtonPosition({
          top: rect.top + window.scrollY - 40,
          left: rect.left + window.scrollX
        });
        setShowReviseButton(true);
      } else {
        setShowReviseButton(false);
        setShowRevisionPopover(false);
        setSelectedText('');
      }
    }
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [showRevisionPopover]);

  // Show popover when Revise button is clicked
  const handleReviseClick = () => {
    setShowRevisionPopover(true);
  };

  // Close popover
  const handleClosePopover = () => {
    setShowRevisionPopover(false);
    setUserInstructions('');
  };

  if (!hasContent()) {
    return (
      <Box
        p={8}
        bg="white"
        borderRadius="lg"
        boxShadow="sm"
        textAlign="center"
        color="gray.500"
      >
        <Text>No resume loaded</Text>
      </Box>
    );
  }

  if (resumeMarkdown) {
    console.log('Rendering resumeMarkdown:', resumeMarkdown);
  }

  // Render the Revise button as a portal
  const reviseButtonPortal = showReviseButton ? ReactDOM.createPortal(
    <Box
      ref={floatingRef}
      position="absolute"
      top={reviseButtonPosition.top}
      left={reviseButtonPosition.left}
      zIndex={1000}
    >
      <Button size="sm" colorScheme="blue" pointerEvents="auto" onClick={handleReviseClick}>
        Revise
      </Button>
    </Box>,
    document.body
  ) : null;

  // Render the popover as a separate portal at the same coordinates (with offset)
  const revisionPopoverPortal = showRevisionPopover ? ReactDOM.createPortal(
    <Box
      position="absolute"
      top={reviseButtonPosition.top + 36}
      left={reviseButtonPosition.left}
      bg="white"
      boxShadow="lg"
      borderRadius="md"
      p={4}
      minW="320px"
      zIndex={1001}
      pointerEvents="auto"
    >
      <VStack align="stretch" spacing={3}>
        <Text fontWeight="bold" fontSize="sm">Selected Text:</Text>
        <Box p={2} bg="gray.50" borderRadius="md" fontSize="sm" fontFamily="mono" whiteSpace="pre-wrap">
          {selectedText}
        </Box>
        <Text fontWeight="bold" fontSize="sm">Instructions (optional):</Text>
        <Textarea
          value={userInstructions}
          onChange={e => setUserInstructions(e.target.value)}
          placeholder="E.g., Make this more results-oriented"
          size="sm"
          rows={2}
        />
        <HStack justify="end" spacing={2} pt={2}>
          <Button size="sm" onClick={handleClosePopover}>Cancel</Button>
          <Button size="sm" colorScheme="blue" isDisabled={!selectedText}>Submit</Button>
        </HStack>
      </VStack>
    </Box>,
    document.body
  ) : null;

  // Debug: log showRevisionPopover before render
  console.log('showRevisionPopover (before render):', showRevisionPopover);

  // Debug: test portal
  const testPortal = ReactDOM.createPortal(
    <div style={{ position: 'fixed', top: 200, left: 200, background: 'red', zIndex: 9999, padding: 20 }}>
      TEST PORTAL
    </div>,
    document.body
  );

  return (
    <Box
      ref={canvasRef}
      p={6}
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      position="relative"
      style={{ overflow: 'visible', zIndex: 9999 }}
    >
      {/* Floating Revise Button (via portal) */}
      {reviseButtonPortal}
      {/* Revision Popover (via portal, fixed position for debug) */}
      {revisionPopoverPortal}
      {/* Debug: test portal */}
      {testPortal}
      <VStack align="stretch" spacing={6}>
        {/* Render Markdown if present (Claude flow) */}
        {resumeMarkdown && (
          <Box>
            <ReactMarkdown
              children={unescapeMarkdown(resumeMarkdown)}
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <Heading as="h1" size="lg" my={4} {...props} />,
                h2: ({node, ...props}) => <Heading as="h2" size="md" my={3} {...props} />,
                h3: ({node, ...props}) => <Heading as="h3" size="sm" my={2} {...props} />,
                p: ({node, ...props}) => <Text my={2} {...props} />,
                strong: ({node, ...props}) => <Text as="span" fontWeight="bold" {...props} />,
                em: ({node, ...props}) => <Text as="span" fontStyle="italic" {...props} />,
                hr: ({node, ...props}) => <Divider my={4} {...props} />,
              }}
            />
          </Box>
        )}
        {/* Fallback: Render structured data (Affinda flow) */}
        {!resumeMarkdown && resumeStructured && (
          <>
            {/* Metadata */}
            {resumeStructured.metadata && (
              <Box mb={6}>
                <Heading as="h3" size="md" mb={2}>Contact Information</Heading>
                <VStack align="start" spacing={1}>
                  {resumeStructured.metadata.name && (
                    <Text fontWeight="bold">{resumeStructured.metadata.name}</Text>
                  )}
                  {resumeStructured.metadata.email && (
                    <Text>{resumeStructured.metadata.email}</Text>
                  )}
                  {resumeStructured.metadata.phone && (
                    <Text>{resumeStructured.metadata.phone}</Text>
                  )}
                  {resumeStructured.metadata.location && (
                    <Text>{resumeStructured.metadata.location}</Text>
                  )}
                </VStack>
              </Box>
            )}

            {/* Sections */}
            {resumeStructured.sections?.map((section) => (
              <Box key={section.id} mb={6}>
                <Heading as="h3" size="md" mb={3}>{section.title}</Heading>
                {section.type === 'text' && (
                  renderContent(section.content)
                )}
                {section.type === 'list' && section.items && (
                  <List spacing={4}>
                    {section.items.map((item) => (
                      <ListItem key={item.id}>
                        <Flex direction="column" gap={1}>
                          {item.title && (
                            <Text fontWeight="bold">{item.title}</Text>
                          )}
                          {item.company && (
                            <Text color="gray.600">{item.company}</Text>
                          )}
                          {item.location && (
                            <Text color="gray.600" fontSize="sm">{item.location}</Text>
                          )}
                          {item.dates && (
                            <Text fontSize="sm" color="gray.500">{item.dates}</Text>
                          )}
                          {/* Render only bullets */}
                          {item.bullets && item.bullets.length > 0 && (
                            <List spacing={2} styleType="disc" pl={4}>
                              {item.bullets.map((bullet, bIdx) => (
                                <ListItem key={bIdx}>{bullet}</ListItem>
                              ))}
                            </List>
                          )}
                          {item.name && (
                            <Badge colorScheme="blue" width="fit-content">
                              {item.name}
                            </Badge>
                          )}
                        </Flex>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            ))}
          </>
        )}
      </VStack>
    </Box>
  );
};

export default SpecCanvas;