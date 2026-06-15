// Arquivo: app/_layout.js (VERSÃO CORRIGIDA CONTRA LOOP INFINITO)

import { Session } from '@supabase/supabase-js';
import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Header from '../components/header';
import { AlertProvider } from '../contexts/AlertContext';
import { BarbershopProvider } from '../contexts/BarbershopContext';
import { ThemeProvider, useAppTheme } from '../contexts/ThemeContext';
import { supabase } from '../supabaseClient';

function AppContent() {
  // undefined = ainda carregando a sessão; null = sem sessão; Session = logado
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const router = useRouter();
  const segments = useSegments();
  const { theme } = useAppTheme();

  // 1) Assina a sessão UMA única vez (mount). Não depende de segments,
  //    então não recria a assinatura a cada navegação (evita o loop infinito).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      setSession(novaSessao);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2) Redireciona conforme a sessão e a rota atual.
  useEffect(() => {
    if (session === undefined) return; // ainda carregando
    const inAuthGroup = segments[0] === '(auth)';
    if (session && segments[0] !== '(tabs)') {
      router.replace('/(tabs)/perfil');
    } else if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [session, segments, router]);

  if (session === undefined) {
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
          <BarbershopProvider>
            <AppContent />
          </BarbershopProvider>
        </AlertProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
