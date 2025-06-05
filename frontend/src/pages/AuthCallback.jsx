import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Box, Spinner, Text } from '@chakra-ui/react';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment from the URL
        const hash = window.location.hash;
        if (hash) {
          // Parse the hash fragment
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken && refreshToken) {
            // Set the session using the tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (error) throw error;
            
            // Navigate to dashboard on success
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bgGradient="linear(to-br, #a78bfa, #60a5fa)">
      <Box textAlign="center">
        <Spinner size="xl" color="white" mb={4} />
        <Text color="white" fontSize="lg">Completing sign in...</Text>
      </Box>
    </Box>
  );
} 