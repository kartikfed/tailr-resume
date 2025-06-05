import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  ChakraProvider,
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Divider,
  useToast,
  Flex,
  Spacer,
  Button,
  useColorModeValue,
  IconButton,
  Collapse,
  Progress,
  Input,
  ColorModeScript
} from '@chakra-ui/react';
import { sendMessage, uploadFiles, getConversation } from './services/apiService';
import { CheckCircleIcon, ChevronLeftIcon, ChatIcon, LinkIcon } from '@chakra-ui/icons';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { EmailAuth } from './pages/EmailAuth';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { supabase } from './services/supabase';
import { Sidebar } from './components/Sidebar';

import ChatInput from './components/ChatInput';
import FileUpload from './components/FileUpload';
import MessageHistory from './components/MessageHistory';
import SpecCanvas from './components/SpecCanvas';
import ToneSelector from './components/ToneSelector';
import TextInput from './components/TextInput';
import { theme } from './theme';
import ApplicationDetails from './pages/ApplicationDetails';
import { ResumeManager } from './components/ResumeManager';
import JobDescriptionPage from './pages/JobDescriptionPage';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <AuthProvider>
        <Router>
          <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/email" element={<EmailAuth />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Flex direction="row" align="stretch" minH="100vh" bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                      <Sidebar />
                      <Box ml="0" flex={1} p={0}>
                        <Dashboard />
                      </Box>
                    </Flex>
                  </PrivateRoute>
                }
              />
              <Route
                path="/job-description"
                element={
                  <PrivateRoute>
                    <Flex direction="row" align="stretch" minH="100vh" bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                      <Sidebar />
                      <Box ml="0" flex={1} p={4}>
                        <JobDescriptionPage />
                      </Box>
                    </Flex>
                  </PrivateRoute>
                }
              />
              <Route
                path="/applications/:id"
                element={
                  <PrivateRoute>
                    <Flex direction="row" align="stretch" minH="100vh" bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                      <Sidebar />
                      <Box ml="0" flex={1} p={4}>
                        <ApplicationDetails />
                      </Box>
                    </Flex>
                  </PrivateRoute>
                }
              />
            </Routes>
          </Box>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;