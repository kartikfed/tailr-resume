import React, { useState, ChangeEvent } from 'react';
import { supabase } from '../services/supabase';
import { Button, Input, VStack, Heading, Text, useToast, Container } from '@chakra-ui/react';

/**
 * Email/password authentication page
 */
export const EmailAuth: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const toast = useToast();

  const handleAuth = async () => {
    setLoading(true);
    let result;
    if (isSignUp) {
      result = await supabase.auth.signUp({ email, password });
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
    }
    const { error } = result;
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: isSignUp ? 'Sign up successful!' : 'Sign in successful!',
        description: isSignUp
          ? 'Check your email for a confirmation link (if required).'
          : 'You are now signed in.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={6}>
        <Heading>{isSignUp ? 'Sign Up' : 'Sign In'}</Heading>
        <Input
          placeholder="Email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          type="email"
        />
        <Input
          placeholder="Password"
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          type="password"
        />
        <Button
          onClick={handleAuth}
          isLoading={loading}
          colorScheme="purple"
          width="full"
        >
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </Button>
        <Button
          variant="link"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </Button>
      </VStack>
    </Container>
  );
}; 