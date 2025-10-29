import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function TabsLayout() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  const fetchUserRole = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('perfis')
        .select('papel')
        .eq('id', user.id)
        .single();
      setUserRole(profile?.papel || 'cliente');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUserRole();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });
    return () => subscription.unsubscribe();
  }, [fetchUserRole]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  // =================================================================
  // <<< CORREÇÃO FINAL E DEFINITIVA >>>
  // =================================================================
  return (
    <Tabs
      // Define a tela inicial baseada no papel do usuário
      initialRouteName={userRole === 'barbeiro' ? 'painel' : 'servicos'}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1E1E1E', borderTopColor: '#333' },
        tabBarActiveTintColor: '#E50914',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      {/* Aba "Painel": SOMENTE para o barbeiro */}
      <Tabs.Screen
        name="painel"
        options={{
          title: 'Painel',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
          href: userRole === 'barbeiro' ? '/(tabs)/painel' : null,
        }}
      />
      {/* Aba "Serviços": SOMENTE para o cliente */}
      <Tabs.Screen
        name="servicos"
        options={{
          title: 'Serviços',
          tabBarIcon: ({ color, size }) => <Ionicons name="cut-outline" color={color} size={size} />,
          href: userRole === 'cliente' ? '/(tabs)/servicos' : null,
        }}
      />
      {/* Aba "Agendar": SOMENTE para o cliente */}
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agendar',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />,
          href: userRole === 'cliente' ? '/(tabs)/agenda' : null,
        }}
      />
      {/* Aba "Perfil": Para AMBOS os usuários */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
      
      {/* Telas internas que NUNCA aparecem nas abas */}
      <Tabs.Screen name="meus-agendamentos" options={{ href: null }} />
      <Tabs.Screen name="historico-agendamentos" options={{ href: null }} />
      <Tabs.Screen name="editar-perfil" options={{ href: null }} />
      <Tabs.Screen name="gerenciar-servicos" options={{ href: null }} />
      <Tabs.Screen name="configurar-horarios" options={{ href: null }} />
    </Tabs>
  );
}
