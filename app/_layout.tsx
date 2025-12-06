// Arquivo: app/_layout.js (VERSÃO CORRIGIDA CONTRA LOOP INFINITO)

import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Header from '../components/header';
import { AlertProvider } from '../contexts/AlertContext';
import { ThemeProvider, useAppTheme } from '../contexts/ThemeContext';
import { supabase } from '../supabaseClient';

function AppContent() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const { theme } = useAppTheme();

  // Usamos useCallback para garantir que a função não seja recriada a cada renderização
  const checkAuth = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const inAuthGroup = segments[0] === '(auth)';

    if (session && segments[0] !== '(tabs)') {
      router.replace('/(tabs)/perfil');
    } else if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    }

    setLoading(false);
  }, [router, segments]);

  useEffect(() => {
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      checkAuth();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuth]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {segments[0] === '(auth)' && <Header />}
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AlertProvider>
          <AppContent />
        </AlertProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
