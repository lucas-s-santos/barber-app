// Arquivo: app/(tabs)/_layout.js (VERSÃO FINAL COM TELA DE HISTÓRICO OCULTA)

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

type UserRole = 'cliente' | 'barbeiro' | null;

const TabBarIcon = ({
  name,
  color,
  size,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  size: number;
}) => {
  return <Ionicons size={size} name={name} color={color} />;
};

export default function TabsLayout() {
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const { theme } = useAppTheme();

  const fetchAndSetUserRole = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('perfis')
        .select('papel')
        .eq('id', user.id)
        .single();
      setUserRole(profile ? (profile.papel as UserRole) : 'cliente');
    } else {
      setUserRole(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAndSetUserRole();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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
      backgroundColor: theme.card,
      borderTopColor: theme.border,
      height: 60,
      paddingBottom: 5,
    },
    tabBarActiveTintColor: theme.primary,
    tabBarInactiveTintColor: theme.icon,
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  if (userRole === 'barbeiro') {
    return (
      <Tabs screenOptions={screenOptions} initialRouteName="painel">
        <Tabs.Screen
          name="painel"
          options={{
            title: 'Painel',
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="grid-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="stats-chart" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="person-outline" color={color} size={size} />
            ),
          }}
        />

        {/* Telas ocultas */}
        <Tabs.Screen name="servicos" options={{ href: null }} />
        <Tabs.Screen name="agenda" options={{ href: null }} />
        <Tabs.Screen name="meus-agendamentos" options={{ href: null }} />
        <Tabs.Screen name="agendamentos" options={{ href: null }} />
        <Tabs.Screen name="editar-perfil" options={{ href: null }} />
        <Tabs.Screen name="gerenciar-servicos" options={{ href: null }} />
        <Tabs.Screen name="configurar-horarios" options={{ href: null }} />
        <Tabs.Screen name="detalhes-barbeiro" options={{ href: null }} />
        {/* ======================================================================== */}
        {/* <<< A LINHA QUE FALTAVA ESTÁ AQUI >>> */}
        {/* ======================================================================== */}
        <Tabs.Screen name="historico-agendamentos" options={{ href: null }} />
        <Tabs.Screen name="notificacoes" options={{ href: null }} />
        <Tabs.Screen name="ajuda" options={{ href: null }} />
        <Tabs.Screen name="sobre" options={{ href: null }} />
        <Tabs.Screen name="politica" options={{ href: null }} />
        <Tabs.Screen name="termos" options={{ href: null }} />
      </Tabs>
    );
  }

  // Layout padrão para CLIENTE
  return (
    <Tabs screenOptions={screenOptions} initialRouteName="servicos">
      <Tabs.Screen
        name="servicos"
        options={{
          title: 'Serviços',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="cut-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agendar',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="agendamentos"
        options={{
          title: 'Agendamentos',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="list-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="person-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Telas ocultas */}
      <Tabs.Screen name="painel" options={{ href: null }} />
      <Tabs.Screen name="dashboard" options={{ href: null }} />
      <Tabs.Screen name="meus-agendamentos" options={{ href: null }} />
      <Tabs.Screen name="historico-agendamentos" options={{ href: null }} />
      <Tabs.Screen name="editar-perfil" options={{ href: null }} />
      <Tabs.Screen name="gerenciar-servicos" options={{ href: null }} />
      <Tabs.Screen name="configurar-horarios" options={{ href: null }} />
      <Tabs.Screen name="detalhes-barbeiro" options={{ href: null }} />
      <Tabs.Screen name="notificacoes" options={{ href: null }} />
      <Tabs.Screen name="ajuda" options={{ href: null }} />
      <Tabs.Screen name="sobre" options={{ href: null }} />
      <Tabs.Screen name="politica" options={{ href: null }} />
      <Tabs.Screen name="termos" options={{ href: null }} />
    </Tabs>
  );
}
