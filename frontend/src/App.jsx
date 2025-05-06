import React from 'react';
import { Box, Heading, Text, Container } from '@chakra-ui/react';

function App() {
  return (
    <Container maxW="container.xl" py={10}>
      <Box textAlign="center" py={10}>
        <Heading as="h1" size="2xl" mb={4}>
          AI Spec Assistant
        </Heading>
        <Text fontSize="xl">
          Turn vague product requests into structured specifications
        </Text>
      </Box>
    </Container>
  );
}

export default App;
