// Arquivo: app/_layout.js (VERSÃO CORRIGIDA CONTRA LOOP INFINITO)

import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AlertProvider } from '../contexts/AlertContext';
import { ThemeProvider, useAppTheme } from '../contexts/ThemeContext';
import { supabase } from '../supabaseClient';

// Componente interno para usar os hooks de contexto
function AppContent() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const { theme } = useAppTheme();

  // Usamos useCallback para garantir que a função não seja recriada a cada renderização
  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    const inAuthGroup = segments[0] === '(auth)';

    // Se o usuário tem sessão e NÃO está no grupo de abas, redireciona para dentro.
    if (session && segments[0] !== '(tabs)') {
      router.replace('/(tabs)/perfil'); 
    } 
    // Se o usuário NÃO tem sessão e NÃO está no grupo de autenticação, redireciona para o login.
    else if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
    
    // Só para de carregar DEPOIS de toda a lógica de verificação e redirecionamento.
    setLoading(false);
  }, [router, segments]);


  useEffect(() => {
    // Verifica a autenticação assim que o componente monta
    checkAuth();

    // Adiciona o "ouvinte" para mudanças de estado (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Se o usuário fez login ou logout, a rota precisa ser reavaliada.
      // O redirecionamento já é cuidado pelo RootLayout, mas podemos forçar uma re-verificação se necessário.
      // Simplesmente trocando a sessão, o useEffect principal será re-acionado.
      // Para este caso, vamos simplificar e chamar o checkAuth de novo.
      checkAuth();
    });

    // Limpa o "ouvinte" quando o componente desmonta para evitar vazamento de memória
    return () => {
      subscription.unsubscribe();
    };
  }, [checkAuth]); // A dependência agora é a função 'checkAuth'

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
