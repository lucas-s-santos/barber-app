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
      setLoading(false);
      return;
    }
    
    // <<< MUDANÇA PRINCIPAL: A consulta agora usa a hora atual para buscar apenas o que é futuro >>>
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        id,
        data_agendamento,
        status,
        servicos ( nome ),
        perfis:barbeiro_id ( nome_completo )
      `)
      .eq('cliente_id', user.id)
      .in('status', ['confirmado', 'pendente']) // Busca agendamentos confirmados OU pendentes
      // A condição chave: busca apenas agendamentos cuja data/hora seja maior ou igual a AGORA.
      // Isso move automaticamente os agendamentos passados para fora desta lista.
      .gte('data_agendamento', new Date().toISOString()) 
      .order('data_agendamento', { ascending: true });

    if (error) {
      showAlert("Erro", `Não foi possível buscar seus agendamentos: ${error.message}`, [{ text: 'Tentar Novamente', onPress: fetchAgendamentos }]);
    } else {
      setAgendamentos(data);
    }
    setLoading(false);
  }, [showAlert]);

  useFocusEffect(fetchAgendamentos);

  const handleCancel = (agendamentoId, podeCancelar) => {
    if (!podeCancelar) {
      showAlert("Atenção", "Não é possível cancelar agendamentos com menos de 2 horas de antecedência.", [{ text: 'Entendi' }]);
      return;
    }

    showAlert(
      "Confirmar Cancelamento",
      "Você tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.",
      [
        { text: "Não", style: 'cancel' },
        { 
          text: "Sim, cancelar", 
          style: 'destructive', 
          onPress: async () => {
            const { error } = await supabase
              .from('agendamentos')
              .delete()
              .eq('id', agendamentoId);

            if (error) {
              showAlert("Erro", `Não foi possível cancelar o agendamento: ${error.message}`, [{ text: 'OK' }]);
            } else {
              showAlert("Sucesso!", "Seu agendamento foi cancelado.", [{ text: 'OK' }]);
              fetchAgendamentos();
            }
          }
        }
      ]
    );
  };

  const AgendamentoItem = ({ item }) => {
    const dataAgendamento = new Date(item.data_agendamento);
    const agora = new Date();
    const diffMs = dataAgendamento.getTime() - agora.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);
    const podeCancelar = diffHoras > 2;

    const dataFormatada = dataAgendamento.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaFormatada = dataAgendamento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    const nomeBarbeiro = item.perfis?.nome_completo || 'Barbeiro';

    const getStatusStyle = () => {
      if (item.status === 'confirmado') {
        return { text: 'Confirmado', style: styles.statusConfirmado };
      }
      if (item.status === 'pendente') {
        return { text: 'Pendente', style: styles.statusPendente };
      }
      return { text: '', style: {} };
    };

    const statusInfo = getStatusStyle();

    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemDetails}>
          <View style={styles.headerRow}>
            <Text style={styles.itemServico}>{item.servicos.nome}</Text>
            <View style={[styles.statusBadge, statusInfo.style]}>
              <Text style={styles.statusText}>{statusInfo.text}</Text>
            </View>
          </View>
          <Text style={styles.itemBarbeiro}>com {nomeBarbeiro}</Text>
          <Text style={styles.itemData}>{dataFormatada} às {horaFormatada}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.cancelButton, !podeCancelar && styles.cancelButtonDisabled]} 
          onPress={() => handleCancel(item.id, podeCancelar)}
        >
          <Ionicons 
            name="trash-outline" 
            size={24} 
            color={podeCancelar ? "#E50914" : "#555"} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E50914" /></View>;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.replace('/(tabs)/perfil')} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
        <Text style={styles.backButtonText}>Voltar ao Perfil</Text>
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

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginVertical: 20, position: 'absolute', top: 40, width: '100%' },
  itemContainer: { backgroundColor: '#1E1E1E', padding: 20, marginVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemDetails: { flex: 1, marginRight: 10 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemServico: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusConfirmado: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderColor: '#34D399',
    borderWidth: 1,
  },
  statusPendente: {
    backgroundColor: 'rgba(251, 146, 60, 0.2)',
    borderColor: '#FBBF24',
    borderWidth: 1,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemBarbeiro: { color: '#A0A0A0', fontSize: 14, fontStyle: 'italic', marginVertical: 2 },
  itemData: { color: 'gray', fontSize: 14, marginTop: 5 },
  cancelButton: { padding: 10 },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  placeholderText: { color: 'gray', textAlign: 'center', marginTop: 50, fontSize: 16 },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, position: 'absolute', top: 40, left: 0, zIndex: 1 },
  backButtonText: { color: 'white', fontSize: 16, marginLeft: 10 },
});
