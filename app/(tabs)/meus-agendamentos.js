import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function MeusAgendamentosScreen() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchAgendamentos = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert("Erro", "Usuário não encontrado. Por favor, faça login novamente.");
      setLoading(false);
      supabase.auth.signOut(); // Desloga se não encontrar o usuário
      return;
    }

    const hoje = new Date().toISOString();

    // Busca os agendamentos futuros do usuário logado
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        id,
        data_agendamento,
        servicos ( nome, preco ),
        barbeiros ( perfis ( nome_completo ) )
      `)
      .eq('cliente_id', user.id) // Filtra pelo ID do cliente
      .gte('data_agendamento', hoje) // Pega apenas agendamentos futuros
      .order('data_agendamento', { ascending: true }); // Mostra os mais próximos primeiro

    if (error) {
      Alert.alert("Erro ao buscar agendamentos", error.message);
    } else {
      setAgendamentos(data);
    }
    setLoading(false);
  }, []);

  // useFocusEffect roda toda vez que a tela ganha foco
  useFocusEffect(fetchAgendamentos);

    const handleCancel = async (agendamentoId) => {
    Alert.alert(
      "Confirmar Cancelamento",
      "Você tem certeza que deseja cancelar este agendamento?",
      [
        { text: "Não", style: 'cancel' },
        { 
          text: "Sim, cancelar", 
          style: 'destructive', 
          onPress: async () => {
            console.log(`[DEBUG] Tentando deletar o agendamento com ID: ${agendamentoId}`);

            // MUDANÇA AQUI: Capturamos o resultado completo da operação
            const { data, error } = await supabase
              .from('agendamentos')
              .delete()
              .eq('id', agendamentoId);

            // Verificação explícita do erro
            if (error) {
              console.error('[DEBUG] Erro retornado pelo Supabase:', error);
              Alert.alert(
                "Erro Detalhado do Supabase",
                `Mensagem: ${error.message}\n\nDetalhes: ${error.details}\n\nCódigo: ${error.code}`,
                [{ text: "OK" }]
              );
            } else {
              console.log('[DEBUG] Operação de delete concluída sem erro. Data retornada:', data);
              Alert.alert("Sucesso", "Seu agendamento foi cancelado.");
              fetchAgendamentos(); // Atualiza a lista
            }
          }
        }
      ]
    );
  };


  const AgendamentoItem = ({ item }) => {
    const data = new Date(item.data_agendamento);
    const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }); // Use UTC para evitar problemas de fuso
    const nomeBarbeiro = item.barbeiros?.perfis?.nome_completo || 'Barbeiro';

    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemDetails}>
          <Text style={styles.itemServico}>{item.servicos.nome}</Text>
          <Text style={styles.itemBarbeiro}>com {nomeBarbeiro}</Text>
          <Text style={styles.itemData}>{dataFormatada} às {horaFormatada}</Text>
        </View>
        <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancel(item.id)}>
          <Ionicons name="trash-outline" size={24} color="#E50914" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E50914" /></View>;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Meus Próximos Agendamentos</Text>
      <FlatList
        data={agendamentos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={AgendamentoItem}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        ListEmptyComponent={<Text style={styles.placeholderText}>Você não tem agendamentos futuros.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginVertical: 20 },
  itemContainer: { backgroundColor: '#1E1E1E', padding: 20, marginVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemDetails: { flex: 1 },
  itemServico: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  itemBarbeiro: { color: '#34D399', fontSize: 14, fontStyle: 'italic', marginVertical: 4 },
  itemData: { color: 'gray', fontSize: 14, marginTop: 5 },
  cancelButton: { padding: 10 },
  placeholderText: { color: 'gray', textAlign: 'center', marginTop: 50, fontSize: 16 },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, position: 'absolute', top: 40, left: 0, zIndex: 1 },
  backButtonText: { color: 'white', fontSize: 16, marginLeft: 10 },
});
