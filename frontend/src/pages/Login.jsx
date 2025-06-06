import { useState } from 'react';
import { supabase } from '../services/supabase';
import {
  Box,
  Button,
  VStack,
  Heading,
  Text,
  Container,
  Input,
  Divider,
  Link,
  useToast,
  Avatar,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage
} from '@chakra-ui/react';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';

// Use environment variable for base URL (works for local and production)
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${BASE_URL}/auth/callback`, // Use env-based callback
        skipBrowserRedirect: false
      }
    });
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign in with Google',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    let result;
    if (isSignUp) {
      result = await supabase.auth.signUp({
        email,
        password,
        options: {
          redirectTo: `${BASE_URL}/auth/callback` // Use env-based callback
        }
      });
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
    }
    const { error } = result;
    if (error) {
      setError(error.message);
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
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-br, #a78bfa, #60a5fa)" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="sm" p={0}>
        <Box bg="white" borderRadius="2xl" boxShadow="2xl" p={8}>
          <VStack spacing={6} align="stretch">
            {/* Logo Circle */}
            <Box
              bg="purple.400"
              borderRadius="full"
              boxSize="64px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              alignSelf="center"
              mb={2}
            >
              <img src="/tailr-logo.png" alt="Tailr logo" style={{ width: '36px', height: '36px' }} />
            </Box>
            <Box textAlign="center">
              <Heading size="lg" mb={1} color="gray.800">{isSignUp ? 'Create an account' : 'Welcome back'}</Heading>
              <Text color="gray.500">{isSignUp ? 'Sign up to get started' : 'Sign in to your account to continue'}</Text>
            </Box>
            <form onSubmit={e => { e.preventDefault(); handleAuth(); }}>
              <VStack spacing={4} align="stretch">
                <FormControl isInvalid={!!error}>
                  <FormLabel color="gray.700">Email or Username</FormLabel>
                  <Input
                    placeholder="Enter your email or username"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    isDisabled={loading}
                    border="1px solid"
                    borderColor="gray.300"
                    _hover={{ borderColor: 'purple.400' }}
                    _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)' }}
                  />
                </FormControl>
                <FormControl isInvalid={!!error}>
                  <FormLabel color="gray.700">Password</FormLabel>
                  <Input
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    type="password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    isDisabled={loading}
                    border="1px solid"
                    borderColor="gray.300"
                    _hover={{ borderColor: 'purple.400' }}
                    _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)' }}
                  />
                  {error && <FormErrorMessage>{error}</FormErrorMessage>}
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="purple"
                  size="lg"
                  width="full"
                  isLoading={loading}
                >
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </Button>
              </VStack>
            </form>
            <HStack my={2} align="center" justify="center" spacing={4}>
              <Divider flex={1} borderColor="gray.200" />
              <Text fontSize="sm" color="gray.400" whiteSpace="nowrap">or continue with</Text>
              <Divider flex={1} borderColor="gray.200" />
            </HStack>
            <Button
              onClick={handleGoogleLogin}
              leftIcon={<FcGoogle />}
              bg="white"
              color="black"
              border="1px solid #e2e8f0"
              _hover={{ bg: 'gray.50' }}
              size="lg"
              width="full"
              isLoading={loading}
              fontWeight="medium"
              fontSize="md"
              boxShadow="sm"
            >
              {isSignUp ? 'Sign Up with Google' : 'Sign in with Google'}
            </Button>
            <Box textAlign="center">
              <Text fontSize="sm" color="gray.500">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <Link color="purple.500" onClick={() => setIsSignUp(!isSignUp)} fontWeight="medium">
                  {isSignUp ? 'Sign In' : 'Sign up'}
                </Link>
              </Text>
            </Box>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
} 