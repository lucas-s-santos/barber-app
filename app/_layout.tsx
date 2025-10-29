import { Slot, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AlertProvider } from '../contexts/AlertContext';
import { supabase } from '../supabaseClient';

export default function RootLayout() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

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

    // Se o usuário está logado e NÃO está na área de abas, manda ele para lá.
    // Usamos uma rota genérica como 'perfil' que existe para ambos.
    if (session && segments[0] !== '(tabs)') {
      router.replace('/(tabs)/perfil');
    } 
    // Se não há sessão e o usuário não está na área de autenticação, manda para o login.
    else if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  return (
    <AlertProvider>
      <Slot />
    </AlertProvider>
  );
}
