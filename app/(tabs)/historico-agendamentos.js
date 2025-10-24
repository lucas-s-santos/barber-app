// Arquivo: app/(tabs)/historico-agendamentos.js

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function HistoricoAgendamentosScreen() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchHistorico = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const hoje = new Date().toISOString();

    // A MUDANÇA ESTÁ AQUI: usamos .lt() para pegar agendamentos MENORES que a data atual
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`id, data_agendamento, servicos ( nome )`)
      .eq('user_id', user.id)
      .lt('data_agendamento', hoje) // .lt = less than (menor que)
      .order('data_agendamento', { ascending: false }); // Mostra os mais recentes primeiro

    if (error) {
      Alert.alert("Erro ao buscar histórico", error.message);
    } else {
      setAgendamentos(data);
    }
    setLoading(false);
  }, []);

  useFocusEffect(fetchHistorico);

  const AgendamentoItem = ({ item }) => {
    const data = new Date(item.data_agendamento);
    const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.itemContainer}>
        <Text style={styles.itemServico}>{item.servicos.nome}</Text>
        <Text style={styles.itemData}>Realizado em: {dataFormatada} às {horaFormatada}</Text>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#E50914" /></View>;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
        <Text style={styles.backButtonText}>Voltar para o Perfil</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Histórico de Agendamentos</Text>
      <FlatList
        data={agendamentos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={AgendamentoItem}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        ListEmptyComponent={<Text style={styles.placeholderText}>Você não possui agendamentos passados.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginVertical: 20 },
  itemContainer: { backgroundColor: '#1E1E1E', padding: 20, marginVertical: 8, borderRadius: 10 },
  itemServico: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  itemData: { color: 'gray', fontSize: 14, marginTop: 5 },
  placeholderText: { color: 'gray', textAlign: 'center', marginTop: 50, fontSize: 16 },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10 },
  backButtonText: { color: 'white', fontSize: 16, marginLeft: 10 },
});
