import 'react-native-gesture-handler';
// import 'react-native-reanimated';
import React, { useState, useEffect, useCallback } from 'react';
import { deactivateKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Navigation from './src/components/Navigation';
import LoginScreen from './src/screens/LoginScreen';
import SecurityWrapper from './src/components/SecurityWrapper';
import { Colors } from './src/constants/Theme';
import { ToastProvider } from './src/hooks/useToast';

import { authAPI } from './src/api/client';
import { QueryClient, MutationCache, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Sync React Query's online state with a manual check to avoid native module issues
onlineManager.setEventListener((setOnline: (online: boolean) => void) => {
  const check = async () => {
    try {
      await fetch('https://www.google.com', { mode: 'no-cors' });
      setOnline(true);
    } catch (e) {
      setOnline(false);
    }
  };

  const interval = setInterval(check, 10000);
  check();

  return () => clearInterval(interval);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 60 * 24,
      gcTime: 1000 * 60 * 60 * 24,
    },
    mutations: {
      retry: 10,
      retryDelay: (attempt: number) => Math.min(attempt * 1000, 30000),
      networkMode: 'online',
    }
  },
  mutationCache: new MutationCache({
    onSuccess: () => {
      queryClient.invalidateQueries();
    }
  })
});

const CACHE_FILE = FileSystem.documentDirectory + 'estommy_offline_v7.json';
const legacyPersister = {
  persistClient: async (client: any) => {
    try {
      await FileSystem.writeAsStringAsync(CACHE_FILE, JSON.stringify(client));
    } catch (e) { }
  },
  restoreClient: async () => {
    try {
      const info = await FileSystem.getInfoAsync(CACHE_FILE);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(CACHE_FILE);
        return JSON.parse(content);
      }
    } catch (e) { }
    return undefined;
  },
  removeClient: async () => {
    try {
      await FileSystem.deleteAsync(CACHE_FILE, { idempotent: true });
    } catch (e) { }
  },
};

export default function App() {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const prepare = useCallback(async () => {
    try {
      const token = await authAPI.getToken();
      if (token) {
        try {
          // Check session with a short timeout
          await Promise.race([
            authAPI.validateToken(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
          ]);
          setIsAuthenticated(true);
        } catch (error: any) {
          if (error.response?.status === 401) {
            await authAPI.logout();
            setIsAuthenticated(false);
          } else {
            console.log('App: Proceeding in offline mode');
            setIsAuthenticated(true);
          }
        }
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    deactivateKeepAwake();
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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: legacyPersister,
            maxAge: 1000 * 60 * 60 * 24,
          }}
          onSuccess={() => setIsHydrated(true)}
        >
          {!isHydrated ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
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
          )}
        </PersistQueryClientProvider>
      </GestureHandlerRootView>
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
