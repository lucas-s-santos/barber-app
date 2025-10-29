import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAlert } from '../../contexts/AlertContext';
import { supabase } from '../../supabaseClient';

export default function MeusAgendamentosScreen() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const showAlert = useAlert();

  const fetchAgendamentos = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showAlert("Erro de Autenticação", "Usuário não encontrado. Por favor, faça login novamente.", [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]);
      setLoading(false);
      return;
    }
    const hoje = new Date().toISOString();

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
      // =================================================================
      // <<< MUDANÇA 1: Buscar agendamentos pendentes E confirmados >>>
      // =================================================================
      .in('status', ['confirmado', 'pendente'])
      .gte('data_agendamento', hoje)
      .order('data_agendamento', { ascending: true });

    if (error) {
      showAlert("Erro", `Não foi possível buscar seus agendamentos: ${error.message}`, [{ text: 'Tentar Novamente', onPress: fetchAgendamentos }]);
    } else {
      setAgendamentos(data);
    }
    setLoading(false);
  }, [showAlert, router]);

  useFocusEffect(fetchAgendamentos);

  const handleCancel = (agendamentoId) => {
    showAlert(
      "Confirmar Cancelamento",
      "Você tem certeza que deseja cancelar este agendamento?",
      [
        { text: "Não", style: 'cancel' },
        {
          text: "Sim, cancelar",
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('agendamentos')
              .update({ status: 'cancelado' })
              .eq('id', agendamentoId);

            if (error) {
              showAlert("Erro", `Não foi possível cancelar o agendamento: ${error.message}`);
            } else {
              showAlert("Sucesso!", "Seu agendamento foi cancelado.");
              fetchAgendamentos();
            }
          }
        }
      ]
    );
  };

  // =================================================================
  // <<< MUDANÇA 2: Componente de item atualizado para mostrar o status >>>
  // =================================================================
  const AgendamentoItem = ({ item }) => {
    const data = new Date(item.data_agendamento);
    const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    const nomeBarbeiro = item.barbeiro?.nome_completo || 'Barbeiro';

    // Define o estilo e o texto do status baseado no valor
    const statusInfo = {
      pendente: { texto: 'Pendente', cor: '#f59e0b' }, // Laranja
      confirmado: { texto: 'Confirmado', cor: '#34D399' }, // Verde
    };
    const statusAtual = statusInfo[item.status] || { texto: item.status, cor: 'gray' };

    return (
      // O container agora tem um estilo de 'overflow: hidden' vindo do StyleSheet
      <View style={styles.itemContainer}>
        {/* Selo de Status */}
        <View style={[styles.statusBadge, { backgroundColor: statusAtual.cor }]}>
          <Text style={styles.statusBadgeText}>{statusAtual.texto}</Text>
        </View>

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
      <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Meus Próximos Agendamentos</Text>
      <FlatList
        data={agendamentos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={AgendamentoItem}
        contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 80 }}
        ListEmptyComponent={<Text style={styles.placeholderText}>Você não tem agendamentos futuros.</Text>}
      />
    </View>
  );
}

// =================================================================
// <<< MUDANÇA 3: Adicionar os novos estilos para o selo de status >>>
// =================================================================
const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
    container: { flex: 1, backgroundColor: '#121212', paddingTop: 40 },
    title: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginVertical: 20, position: 'absolute', top: 40, width: '100%' },
    itemContainer: { 
      backgroundColor: '#1E1E1E', 
      padding: 20, 
      marginVertical: 8, 
      borderRadius: 10, 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      overflow: 'hidden', // Adicionado para o badge não vazar do card
    },
    itemDetails: { flex: 1 },
    itemServico: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    itemBarbeiro: { color: '#34D399', fontSize: 14, fontStyle: 'italic', marginVertical: 4 },
    itemData: { color: 'gray', fontSize: 14, marginTop: 5 },
    cancelButton: { padding: 10 },
    placeholderText: { color: 'gray', textAlign: 'center', marginTop: 50, fontSize: 16 },
    backButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, position: 'absolute', top: 40, left: 0, zIndex: 1 },
    backButtonText: { color: 'white', fontSize: 16, marginLeft: 10 },
    // Novos estilos para o selo de status
    statusBadge: {
      position: 'absolute',
      top: 0, // Alterado para 0 para alinhar com o topo
      right: 0, // Alterado para 0 para alinhar com a direita
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderBottomLeftRadius: 10,
      borderTopRightRadius: 10, // Corrigido para alinhar com o canto do card
    },
    statusBadgeText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 12,
    },
});
