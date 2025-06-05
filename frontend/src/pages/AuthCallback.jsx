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
        console.log('Hash fragment:', hash); // Debug log

        if (hash) {
          // Parse the hash fragment
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          console.log('Access token:', accessToken ? 'Present' : 'Missing'); // Debug log
          console.log('Refresh token:', refreshToken ? 'Present' : 'Missing'); // Debug log
          
          if (accessToken && refreshToken) {
            // Set the session using the tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (error) {
              console.error('Error setting session:', error); // Debug log
              throw error;
            }
            
            // Get the current session to verify
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.error('Error getting session:', sessionError); // Debug log
              throw sessionError;
            }
            
            if (session) {
              console.log('Session established successfully'); // Debug log
              navigate('/');
            } else {
              console.error('No session established'); // Debug log
              throw new Error('No session established');
            }
          } else {
            console.error('Missing tokens in hash fragment'); // Debug log
            throw new Error('Missing tokens in hash fragment');
          }
        } else {
          console.error('No hash fragment found'); // Debug log
          throw new Error('No hash fragment found');
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