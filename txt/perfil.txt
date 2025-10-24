// Arquivo: app/(tabs)/perfil.js (COM BOTÃO DE HISTÓRICO)

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function PerfilScreen() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data) {
        setUser(data.user);
      }
    };
    fetchUser();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meu Perfil</Text>
      
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.email}>{user ? user.email : 'Carregando...'}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={() => router.push('/(tabs)/meus-agendamentos')}
      >
        <Ionicons name="list-outline" size={24} color="white" />
        <Text style={styles.menuButtonText}>Meus Próximos Agendamentos</Text>
      </TouchableOpacity>

      {/* MUDANÇA APLICADA AQUI: Adicionado o botão de Histórico */}
      <TouchableOpacity 
        style={[styles.menuButton, {marginTop: 15}]} 
        onPress={() => router.push('/(tabs)/historico-agendamentos')}
      >
        <Ionicons name="time-outline" size={24} color="white" />
        <Text style={styles.menuButtonText}>Histórico de Agendamentos</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.menuButton, {marginTop: 30}]} // Aumentei a margem para separar do botão de sair
        onPress={() => supabase.auth.signOut()}
      >
        <Ionicons name="log-out-outline" size={24} color="#E50914" />
        <Text style={[styles.menuButtonText, {color: '#E50914'}]}>Sair da Conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 40, textAlign: 'center' },
  infoContainer: { width: '100%', marginBottom: 40, alignItems: 'center' },
  label: { fontSize: 16, color: 'gray' },
  email: { fontSize: 20, color: 'white', fontWeight: '500', marginTop: 5 },
  menuButton: {
    backgroundColor: '#1E1E1E',
    width: '100%',
    padding: 20,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 15,
  },
});
