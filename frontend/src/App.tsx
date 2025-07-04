import React, { ReactNode } from 'react';
import {
  ChakraProvider,
  Box,
  ColorModeScript
} from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { EmailAuth } from './pages/EmailAuth';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';

import { theme } from './theme';
import ApplicationDetails from './pages/ApplicationDetails';
import JobDescriptionPage from './pages/JobDescriptionPage';
import PdfHtmlTestPage from './pages/PdfHtmlTestPage';


interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/" />;
};

const App: React.FC = () => {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config?.initialColorMode || 'light'} />
      <AuthProvider>
        <Router>
          {/* Make the purple gradient background fill the entire viewport */}
          <Box minH="100vh" minW="100vw" w="100vw" h="100vh" position="fixed" top={0} left={0} zIndex={-1} bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" />
          <Box minH="100vh" minW="100vw" w="100vw" h="100vh" position="relative">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/email" element={<EmailAuth />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
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
};

export default App; 