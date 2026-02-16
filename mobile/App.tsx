import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import Navigation from './src/components/Navigation';
import LoginScreen from './src/screens/LoginScreen';
import SecurityWrapper from './src/components/SecurityWrapper';
import { Colors } from './src/constants/Theme';
import { ToastProvider } from './src/hooks/useToast';

import { authAPI } from './src/api/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const prepare = useCallback(async () => {
    try {
      const token = await authAPI.getToken();
      if (token) {
        // Log in by validating the token against the backend
        try {
          await authAPI.validateToken();
          setIsAuthenticated(true);
        } catch (error) {
          console.log('Token validation failed, clearing session');
          await authAPI.logout();
        }
      }
    } catch (e) {
      console.warn('Initialization Error:', e);
    } finally {
      // Ensure splash shown for at least 800ms for branding
      setTimeout(() => setReady(true), 800);
    }
  }, []);

  useEffect(() => {
    prepare();
  }, [prepare]);

  const handleLogout = async () => {
    await authAPI.logout();
    setIsAuthenticated(false);
  };

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <View style={styles.container}>
            <StatusBar style="light" />
            {isAuthenticated ? (
              <SecurityWrapper isAuthenticated={isAuthenticated}>
                <Navigation onLogout={handleLogout} />
              </SecurityWrapper>
            ) : (
              <LoginScreen onLogin={() => setIsAuthenticated(true)} />
            )}
          </View>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

