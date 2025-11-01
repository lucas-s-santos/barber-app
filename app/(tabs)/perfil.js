// Arquivo: app/(tabs)/perfil.js (COM A CORREÇÃO DEFINITIVA DO LOOP)

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

export default function PerfilScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const { theme, themeMode, toggleTheme } = useAppTheme();

  const getProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nenhum usuário logado.');

      const { data, error, status } = await supabase
        .from('perfis')
        .select(`nome_completo, email, foto_base64, papel`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) throw error;
      setProfile(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o perfil.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getProfile();
    }, []) // <<< A CORREÇÃO ESTÁ AQUI: A lista de dependências está VAZIA.
  );

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Erro', 'Não foi possível fazer logout.');
    } else {
      router.replace('/(auth)/login');
    }
  };

  if (loading || !profile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const isDarkModeActive = themeMode === 'dark' || (themeMode === 'system' && theme.isDark);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Image
          source={profile.foto_base64 ? { uri: `data:image/jpeg;base64,${profile.foto_base64}` } : require('../../assets/images/avatar-placeholder.png')}
          style={[styles.avatar, { borderColor: theme.primary }]}
        />
        <Text style={[styles.nome, { color: theme.text }]}>{profile.nome_completo}</Text>
        <Text style={[styles.email, { color: theme.subtext }]}>{profile.email}</Text>
      </View>

      <View style={[styles.themeSwitcher, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => toggleTheme('light')} style={[styles.themeButton, !isDarkModeActive && { backgroundColor: theme.primary }]}>
          <Ionicons name="sunny-outline" size={22} color={!isDarkModeActive ? '#0D1117' : theme.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleTheme('dark')} style={[styles.themeButton, isDarkModeActive && { backgroundColor: theme.primary }]}>
          <Ionicons name="moon-outline" size={22} color={isDarkModeActive ? '#0D1117' : theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.menu}>
        <MenuItem icon="person-outline" text="Editar Perfil" onPress={() => router.push('/(tabs)/editar-perfil')} />
        <MenuItem icon="calendar-outline" text="Meus Agendamentos" onPress={() => router.push('/(tabs)/meus-agendamentos')} />
        
        {profile.papel === 'barbeiro' && (
          <>
            <MenuItem icon="stats-chart-outline" text="Painel do Barbeiro" onPress={() => router.push('/(tabs)/painel')} />
            <MenuItem icon="cut-outline" text="Gerenciar Serviços" onPress={() => router.push('/(tabs)/gerenciar-servicos')} />
            <MenuItem icon="time-outline" text="Configurar Horários" onPress={() => router.push('/(tabs)/configurar-horarios')} />
          </>
        )}

        <MenuItem icon="log-out-outline" text="Sair" onPress={handleLogout} isLogout />
      </View>
    </View>
  );
}

const MenuItem = ({ icon, text, onPress, isLogout = false }) => {
  const { theme } = useAppTheme();

  return (
    <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={onPress}>
      <Ionicons name={icon} size={24} color={isLogout ? theme.secondary : theme.text} />
      <Text style={[styles.menuItemText, { color: isLogout ? theme.secondary : theme.text }]}>{text}</Text>
      <Ionicons name="chevron-forward-outline" size={22} color={theme.subtext} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, paddingTop: 80 },
  header: { alignItems: 'center', marginBottom: 30, paddingHorizontal: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, marginBottom: 15 },
  nome: { fontSize: 24, fontWeight: 'bold' },
  email: { fontSize: 16 },
  themeSwitcher: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: 25, padding: 5, marginHorizontal: 60, marginBottom: 30 },
  themeButton: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 20 },
  menu: { paddingHorizontal: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 15, marginBottom: 10 },
  menuItemText: { flex: 1, marginLeft: 20, fontSize: 16, fontWeight: '600' },
});
