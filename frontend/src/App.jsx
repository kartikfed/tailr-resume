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
import PdfHtmlTestPage from './pages/PdfHtmlTestPage';

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
          {/* Make the purple gradient background fill the entire viewport */}
          <Box minH="100vh" minW="100vw" w="100vw" h="100vh" position="fixed" top={0} left={0} zIndex={-1} bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" />
          <Box minH="100vh" minW="100vw" w="100vw" h="100vh" position="relative">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/email" element={<EmailAuth />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <>
                      <Sidebar />
                      <Box ml={{ base: 0, md: '240px' }} p={0} minH="100vh">
                        <Dashboard />
                      </Box>
                    </>
                  </PrivateRoute>
                }
              />
              <Route
                path="/job-description"
                element={
                  <PrivateRoute>
                    <>
                      <Sidebar />
                      <Box ml={{ base: 0, md: '240px' }} p={4} minH="100vh">
                        <JobDescriptionPage />
                      </Box>
                    </>
                  </PrivateRoute>
                }
              />
              <Route
                path="/applications/:id"
                element={
                  <PrivateRoute>
                    <>
                      <Sidebar />
                      <Box ml={{ base: 0, md: '240px' }} p={4} minH="100vh">
                        <ApplicationDetails />
                      </Box>
                    </>
                  </PrivateRoute>
                }
              />
              <Route
                path="/pdf-test"
                element={
                  <PrivateRoute>
                    <>
                      <Sidebar />
                      <Box ml={{ base: 0, md: '240px' }} p={4} minH="100vh">
                        <PdfHtmlTestPage />
                      </Box>
                    </>
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