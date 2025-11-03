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
    setLoading(true); 
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('perfis')
        .select('papel')
        .eq('id', user.id)
        .single();
      setUserRole(profile ? profile.papel as UserRole : 'cliente'); // Fallback para cliente
    } else {
      setUserRole(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAndSetUserRole();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Se o evento for SIGNED_OUT, não precisa refazer o fetch, apenas limpa
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

  if (!userRole) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  return (
    <Tabs 
      screenOptions={screenOptions}
      initialRouteName={userRole === 'barbeiro' ? 'painel' : 'servicos'}
    >
      {/* --- ROTA DO CLIENTE --- */}
      <Tabs.Screen 
        name="servicos" 
        options={{ 
          title: 'Serviços', 
          tabBarIcon: ({ color, size }) => <Ionicons name="cut-outline" color={color} size={size} />,
          href: userRole === 'barbeiro' ? null : '/servicos'
        }} 
      />
      
      {/* --- ROTA DO BARBEIRO --- */}
      <Tabs.Screen 
        name="painel" 
        options={{ 
          title: 'Painel', 
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />, 
          href: userRole === 'cliente' ? null : '/painel'
        }} 
      />

      {/* ================================================================= */}
      {/* <<< CÓDIGO ADICIONADO EXATAMENTE COMO VOCÊ PEDIU >>> */}
      <Tabs.Screen
        name="dashboard" // O nome do seu arquivo
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <TabBarIcon name="stats-chart" color={color} size={size} />,
          // Garante que a aba só apareça para o barbeiro
          href: userRole === 'cliente' ? null : '/dashboard',
        }}
      />
      {/* ================================================================= */}

      {/* --- ROTAS COMPARTILHADAS --- */}
      <Tabs.Screen 
        name="agenda" 
        options={{ 
          title: 'Agendar', 
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />,
          href: '/agenda'
        }} 
      />
      <Tabs.Screen 
        name="perfil" 
        options={{ 
          title: 'Perfil', 
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
          href: '/perfil'
        }} 
      />
      
      {/* --- TELAS OCULTAS (Navegação interna) --- */}
      <Tabs.Screen name="meus-agendamentos" options={{ href: null }} />
      <Tabs.Screen name="historico-agendamentos" options={{ href: null }} />
      <Tabs.Screen name="editar-perfil" options={{ href: null }} />
      <Tabs.Screen name="gerenciar-servicos" options={{ href: null }} />
      <Tabs.Screen name="configurar-horarios" options={{ href: null }} />
      <Tabs.Screen name="detalhes-barbeiro" options={{ href: null }} />
    </Tabs>
  );
}
