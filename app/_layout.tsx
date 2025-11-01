// Arquivo: app/_layout.js (Modificado para incluir o ThemeProvider)

import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AlertProvider } from '../contexts/AlertContext';
import { ThemeProvider, useAppTheme } from '../contexts/ThemeContext'; // <<< 1. IMPORTAMOS O GERENCIADOR DE TEMA
import { supabase } from '../supabaseClient';

// Componente interno para que possamos usar o hook 'useAppTheme'
function AppContent() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();
  
  // <<< 2. USAMOS O HOOK PARA PEGAR AS CORES DO TEMA ATIVO >>>
  const { theme } = useAppTheme(); 

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (session && segments[0] !== '(tabs)') {
      router.replace('/(tabs)/perfil');
    } 
    else if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      // <<< 3. APLICAMOS AS CORES DO TEMA NA TELA DE LOADING >>>
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return <Slot />;
}


export default function RootLayout() {
  return (
    // <<< 4. O THEMEPROVIDER "ABRAÇA" TUDO >>>
    // Ele precisa estar por fora para que o AppContent possa usar o hook useAppTheme.
    <ThemeProvider>
      <AlertProvider>
        <AppContent />
      </AlertProvider>
    </ThemeProvider>
  );
}
