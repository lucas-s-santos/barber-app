// Arquivo: app/(tabs)/meus-agendamentos.js (COM A CORREÇÃO DO ALERTA)

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Hooks personalizados
import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

export default function MeusAgendamentosScreen() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const showAlert = useAlert();
  const { theme } = useAppTheme(); // Pega as cores do tema

  const fetchAgendamentos = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    
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
      .in('status', ['confirmado', 'pendente'])
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
              // <<< A CORREÇÃO ESTÁ AQUI >>>
              // Agora passamos o array com o botão "OK"
              showAlert("Sucesso!", "Seu agendamento foi cancelado.", [{ text: 'OK' }]);
              // ---------------------------------
              fetchAgendamentos(); // Atualiza a lista após o sucesso
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
        return { text: 'Confirmado', badgeColor: 'rgba(52, 211, 153, 0.2)', textColor: '#34D399' };
      }
      if (item.status === 'pendente') {
        return { text: 'Pendente', badgeColor: 'rgba(251, 146, 60, 0.2)', textColor: '#FBBF24' };
      }
      return { text: '', badgeColor: 'transparent', textColor: theme.subtext };
    };

    const statusInfo = getStatusStyle();

    return (
      <View style={[styles.itemContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.itemDetails}>
          <View style={styles.headerRow}>
            <Text style={[styles.itemServico, { color: theme.text }]}>{item.servicos.nome}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.badgeColor }]}>
              <Text style={[styles.statusText, { color: statusInfo.textColor }]}>{statusInfo.text}</Text>
            </View>
          </View>
          <Text style={[styles.itemBarbeiro, { color: theme.subtext }]}>com {nomeBarbeiro}</Text>
          <Text style={[styles.itemData, { color: theme.subtext }]}>{dataFormatada} às {horaFormatada}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => handleCancel(item.id, podeCancelar)}
          disabled={!podeCancelar}
        >
          <Ionicons 
            name="trash-outline" 
            size={24} 
            color={podeCancelar ? theme.secondary : theme.subtext} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Meus Próximos Agendamentos</Text>
      </View>
      <FlatList
        data={agendamentos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={AgendamentoItem}
        contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 100, paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color={theme.subtext} />
            <Text style={[styles.placeholderText, { color: theme.subtext }]}>Você não tem agendamentos futuros.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 60,
    paddingBottom: 10,
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  backButton: { position: 'absolute', left: 15, top: 58, padding: 5 },
  itemContainer: { padding: 20, marginVertical: 8, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1 },
  itemDetails: { flex: 1, marginRight: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemServico: { fontSize: 18, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  itemBarbeiro: { fontSize: 14, fontStyle: 'italic', marginVertical: 2 },
  itemData: { fontSize: 14, marginTop: 5 },
  cancelButton: { padding: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  placeholderText: { marginTop: 20, fontSize: 16 },
});
