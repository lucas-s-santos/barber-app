// Arquivo: app/(tabs)/_layout.js (VERSÃO CORRIGIDA E SIMPLIFICADA)

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../../supabaseClient';

type UserRole = 'cliente' | 'barbeiro' | null;

// Componente de ícone para simplificar
const TabBarIcon = ({ name, color, size }: { name: React.ComponentProps<typeof Ionicons>['name']; color: string; size: number }) => {
  return <Ionicons size={size} name={name} color={color} />;
};


export default function TabsLayout() {
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<UserRole>(null);

  const fetchAndSetUserRole = useCallback(async () => {
    // Não precisa do setLoading(true) aqui, pois já é setado no início do useEffect
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('perfis')
        .select('papel')
        .eq('id', user.id)
        .single();
      setUserRole(profile ? profile.papel as UserRole : 'cliente');
    } else {
      setUserRole(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true); // Garante que o loading apareça ao re-autenticar
    fetchAndSetUserRole();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUserRole(null);
      } else {
        fetchAndSetUserRole();
      }
    });
    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchAndSetUserRole]);

  const screenOptions = {
    headerShown: false,
    tabBarStyle: { 
      backgroundColor: '#1E1E1E', 
      borderTopColor: '#333',
      height: 60,
      paddingBottom: 5,
    },
    tabBarActiveTintColor: '#E50914',
    tabBarInactiveTintColor: 'gray',
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  // Renderiza um layout de abas diferente para cada tipo de usuário
  // Isso é mais robusto e evita condicionais 'href' complexas.
  if (userRole === 'barbeiro') {
    return (
      <Tabs screenOptions={screenOptions} initialRouteName="painel">
        <Tabs.Screen 
          name="painel" 
          options={{ 
            title: 'Painel', 
            tabBarIcon: ({ color, size }) => <TabBarIcon name="grid-outline" color={color} size={size} />, 
          }} 
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <TabBarIcon name="stats-chart" color={color} size={size} />,
          }}
        />
        <Tabs.Screen 
          name="perfil" 
          options={{ 
            title: 'Perfil', 
            tabBarIcon: ({ color, size }) => <TabBarIcon name="person-outline" color={color} size={size} />,
          }} 
        />
        {/* Telas ocultas ainda funcionam normalmente */}
        <Tabs.Screen name="servicos" options={{ href: null }} />
        <Tabs.Screen name="agenda" options={{ href: null }} />
        <Tabs.Screen name="meus-agendamentos" options={{ href: null }} />
        <Tabs.Screen name="editar-perfil" options={{ href: null }} />
        <Tabs.Screen name="gerenciar-servicos" options={{ href: null }} />
        <Tabs.Screen name="configurar-horarios" options={{ href: null }} />
        <Tabs.Screen name="detalhes-barbeiro" options={{ href: null }} />
        {/* A linha do historico-agendamentos foi removida */}
      </Tabs>
    );
  }

  // Layout padrão para CLIENTE (ou se não estiver logado, será redirecionado)
  return (
    <Tabs screenOptions={screenOptions} initialRouteName="servicos">
      <Tabs.Screen 
        name="servicos" 
        options={{ 
          title: 'Serviços', 
          tabBarIcon: ({ color, size }) => <TabBarIcon name="cut-outline" color={color} size={size} />,
        }} 
      />
      <Tabs.Screen 
        name="agenda" 
        options={{ 
          title: 'Agendar', 
          tabBarIcon: ({ color, size }) => <TabBarIcon name="calendar-outline" color={color} size={size} />,
        }} 
      />
      <Tabs.Screen 
        name="perfil" 
        options={{ 
          title: 'Perfil', 
          tabBarIcon: ({ color, size }) => <TabBarIcon name="person-outline" color={color} size={size} />,
        }} 
      />
      {/* Telas ocultas */}
      <Tabs.Screen name="painel" options={{ href: null }} />
      <Tabs.Screen name="dashboard" options={{ href: null }} />
      <Tabs.Screen name="meus-agendamentos" options={{ href: null }} />
      <Tabs.Screen name="editar-perfil" options={{ href: null }} />
      <Tabs.Screen name="gerenciar-servicos" options={{ href: null }} />
      <Tabs.Screen name="configurar-horarios" options={{ href: null }} />
      <Tabs.Screen name="detalhes-barbeiro" options={{ href: null }} />
      {/* A linha do historico-agendamentos foi removida */}
    </Tabs>
  );
}
