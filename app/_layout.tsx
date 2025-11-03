// Arquivo: app/_layout.js (Modificado para incluir o gatilho de atualização)

import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AlertProvider } from '../contexts/AlertContext';
import { ThemeProvider, useAppTheme } from '../contexts/ThemeContext';
import { supabase } from '../supabaseClient';

// Função para rodar a limpeza de agendamentos antigos
const runStatusCleanup = async () => {
  const { error } = await supabase.rpc('atualizar_status_agendamentos_concluidos');
  if (error) {
    // Usamos console.warn para não ser um erro alarmante, apenas um aviso
    console.warn("Aviso: Não foi possível atualizar status de agendamentos antigos.", error.message);
  }
};

function AppContent() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();
  const { theme } = useAppTheme(); 

  useEffect(() => {
    const fetchInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      
      // =================================================================
      // <<< O GATILHO FOI ADICIONADO AQUI >>>
      // Se existe uma sessão inicial (usuário já logado), roda a limpeza.
      if (initialSession) {
        await runStatusCleanup();
      }
      // =================================================================

      setLoading(false);
    };

    fetchInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      
      // =================================================================
      // <<< O GATILHO TAMBÉM FOI ADICIONADO AQUI >>>
      // Se um novo login acontece (newSession não é nulo), roda a limpeza.
      if (newSession) {
        await runStatusCleanup();
      }
      // =================================================================
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
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <AppContent />
      </AlertProvider>
    </ThemeProvider>
  );
}
