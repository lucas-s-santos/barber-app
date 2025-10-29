import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAlert } from '../../contexts/AlertContext';
import { supabase } from '../../supabaseClient';

export default function HistoricoAgendamentosScreen() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const showAlert = useAlert();

  const fetchHistorico = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      router.replace('/(auth)/login');
      return;
    }

    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        id,
        data_agendamento,
        status,
        servicos ( nome ),
        barbeiro:perfis!barbeiro_id ( nome_completo )
      `)
      .eq('cliente_id', user.id)
      .in('status', ['concluido', 'cancelado'])
      .order('data_agendamento', { ascending: false });

    if (error) {
      showAlert("Erro ao buscar histórico", error.message, [{ text: 'OK' }]);
    } else {
      setAgendamentos(data);
    }
    setLoading(false);
  }, [showAlert, router]);

  useFocusEffect(fetchHistorico);

  const AgendamentoItem = ({ item }) => {
    const data = new Date(item.data_agendamento);
    const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    const nomeBarbeiro = item.barbeiro?.nome_completo || 'Barbeiro';
    const isCancelado = item.status === 'cancelado';

    return (
      <View style={[styles.itemContainer, isCancelado && styles.itemCancelado]}>
        <View style={styles.itemDetails}>
          <Text style={styles.itemServico}>{item.servicos.nome}</Text>
          <Text style={styles.itemBarbeiro}>com {nomeBarbeiro}</Text>
          <Text style={styles.itemData}>
            {isCancelado ? 'Cancelado em: ' : 'Realizado em: '}
            {dataFormatada} às {horaFormatada}
          </Text>
        </View>
        {isCancelado && (
          <Ionicons name="close-circle" size={24} color="#E50914" />
        )}
      </View>
    );
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E50914" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* ================================================================= */}
      {/* <<< A CORREÇÃO ESTÁ AQUI TAMBÉM >>> */}
      {/* Trocamos router.back() por uma navegação explícita para a tela de perfil. */}
      {/* ================================================================= */}
      <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Histórico de Agendamentos</Text>
      <FlatList
        data={agendamentos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={AgendamentoItem}
        contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 80 }}
        ListEmptyComponent={<Text style={styles.placeholderText}>Você ainda não possui agendamentos passados.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginVertical: 20, position: 'absolute', top: 40, width: '100%' },
  itemContainer: { backgroundColor: '#1E1E1E', padding: 20, marginVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemCancelado: {
    borderColor: '#555',
    borderWidth: 1,
    opacity: 0.7
  },
  itemDetails: { flex: 1 },
  itemServico: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  itemBarbeiro: { color: '#34D399', fontSize: 14, fontStyle: 'italic', marginVertical: 4 },
  itemData: { color: 'gray', fontSize: 14, marginTop: 5 },
  placeholderText: { color: 'gray', textAlign: 'center', marginTop: 50, fontSize: 16 },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, position: 'absolute', top: 40, left: 0, zIndex: 1 },
  backButtonText: { color: 'white', fontSize: 16, marginLeft: 10 },
});
