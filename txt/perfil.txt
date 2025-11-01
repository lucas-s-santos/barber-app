import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function PerfilScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    const { data, error } = await supabase
      .from('perfis')
      .select('nome_completo, foto_base64')
      .eq('id', user.id)
      .single();
      
    if (error) {
      console.log("Erro ao buscar perfil:", error.message);
    }
    setProfile({ ...user, ...data });
    setLoading(false);
  }, []);

  useFocusEffect(fetchProfile);

  if (loading || !profile) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E50914" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {profile.foto_base64 ? (
          <Image source={{ uri: `data:image/jpeg;base64,${profile.foto_base64}` }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={60} color="#555" />
          </View>
        )}
        <Text style={styles.nome}>{profile.nome_completo || 'Usuário'}</Text>
        <Text style={styles.email}>{profile.email}</Text>
      </View>

      {/* Botão para Editar Perfil */}
      <TouchableOpacity style={styles.editButton} onPress={() => router.push('/(tabs)/editar-perfil')}>
        <Ionicons name="pencil-outline" size={20} color="white" />
        <Text style={styles.editButtonText}>Editar Perfil</Text>
      </TouchableOpacity>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/(tabs)/meus-agendamentos')}>
          <Ionicons name="list-outline" size={24} color="white" />
          <Text style={styles.menuButtonText}>Meus Próximos Agendamentos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={() => router.push('/(tabs)/historico-agendamentos')}>
          <Ionicons name="time-outline" size={24} color="white" />
          <Text style={styles.menuButtonText}>Histórico de Agendamentos</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={() => supabase.auth.signOut()}>
        <Ionicons name="log-out-outline" size={24} color="#E50914" />
        <Text style={styles.signOutButtonText}>Sair da Conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212', padding: 20, justifyContent: 'space-between' },
  header: { alignItems: 'center', marginTop: 40 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' },
  nome: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 15 },
  email: { color: 'gray', fontSize: 16, marginTop: 5 },
  editButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#333', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, alignSelf: 'center', marginTop: 20 },
  editButtonText: { color: 'white', fontSize: 16, marginLeft: 8 },
  menuContainer: { width: '100%', marginTop: 20 },
  menuButton: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  menuButtonText: { color: 'white', fontWeight: '600', fontSize: 16, marginLeft: 15 },
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 10, borderWidth: 2, borderColor: '#E50914', marginBottom: 20 },
  signOutButtonText: { color: '#E50914', fontWeight: '700', fontSize: 16, marginLeft: 10 },
});
