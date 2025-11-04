// Arquivo: app/(tabs)/meus-agendamentos.js (VERSÃO COM LIXEIRA 100% FUNCIONAL)

import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

const AgendamentoItem = ({ item, theme, onCancel, onEvaluate }) => {
  const isPast = ['concluido', 'cancelado', 'ausente'].includes(item.status);

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
      timeZone: 'UTC'
    }).replace(',', ' às');
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmado': return { text: 'Confirmado', color: '#FBBF24', icon: 'checkmark-circle-outline' };
      case 'pendente': return { text: 'Pendente', color: '#FBBF24', icon: 'time-outline' };
      case 'concluido': return { text: 'Concluído', color: '#10B981', icon: 'checkmark-done-circle-outline' };
      case 'cancelado': return { text: 'Cancelado', color: '#EF4444', icon: 'close-circle-outline' };
      case 'ausente': return { text: 'Ausente', color: '#9CA3AF', icon: 'person-remove-outline' };
      default: return { text: status, color: theme.subtext, icon: 'help-circle-outline' };
    }
  };

  const statusStyle = getStatusStyle(item.status);
  const jaAvaliado = item.avaliacoes && item.avaliacoes.length > 0;
  const podeTentarCancelar = ['pendente', 'confirmado'].includes(item.status);

  return (
    <View style={[styles.itemCard, { backgroundColor: theme.card, borderLeftColor: statusStyle.color, opacity: isPast ? 0.9 : 1 }]}>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemService, { color: theme.text }]}>{item.servico.nome}</Text>
        <Text style={[styles.itemBarber, { color: theme.subtext }]}>com {item.barbeiro.nome_completo}</Text>
        <Text style={[styles.itemDate, { color: theme.text }]}>{formatarData(item.data_agendamento)}</Text>
        
        {item.status === 'concluido' && !jaAvaliado && (
          <TouchableOpacity style={styles.avaliarButton} onPress={() => onEvaluate(item)}>
            <Ionicons name="star-outline" size={16} color="#FBBF24" />
            <Text style={styles.avaliarButtonText}>Avaliar Serviço</Text>
          </TouchableOpacity>
        )}
        {item.status === 'concluido' && jaAvaliado && (
           <View style={styles.avaliadoContainer}>
            <Ionicons name="star" size={16} color="#10B981" />
            <Text style={[styles.avaliadoText, {color: "#10B981"}]}>Serviço avaliado</Text>
          </View>
        )}
      </View>
      
      <View style={styles.itemActions}>
        <View style={styles.statusBadge}>
          <Ionicons name={statusStyle.icon} size={14} color={statusStyle.color} />
          <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.text}</Text>
        </View>
        {podeTentarCancelar && (
          <TouchableOpacity onPress={() => onCancel(item.id, item.data_agendamento)} style={styles.cancelButton}>
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const AvaliacaoModal = ({ visible, onClose, onSave, agendamento }) => {
    const { theme } = useAppTheme();
    const [nota, setNota] = useState(0);
    const [comentario, setComentario] = useState('');
    const [saving, setSaving] = useState(false);
  
    useFocusEffect(
      useCallback(() => {
        if (visible) {
          setNota(0);
          setComentario('');
        }
      }, [visible])
    );
  
    const handleSave = async () => {
      setSaving(true);
      await onSave(nota, comentario);
      setSaving(false);
    };
  
    if (!agendamento) return null;
  
    return (
      <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalView, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Avalie o Serviço</Text>
            <Text style={[styles.modalSubtext, { color: theme.subtext }]}>Serviço de {agendamento.servico.nome} com {agendamento.barbeiro.nome_completo}</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setNota(star)}>
                  <Ionicons name={star <= nota ? 'star' : 'star-outline'} size={40} color="#FBBF24" />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.inputComentario, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Deixe um comentário (opcional)"
              placeholderTextColor={theme.subtext}
              value={comentario}
              onChangeText={setComentario}
              multiline
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.subtext }]} onPress={onClose}>
                <Text style={{ color: theme.text, fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#10B981' }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color={theme.background} /> : <Text style={{ color: theme.background, fontWeight: 'bold' }}>Enviar Avaliação</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
};

export default function MeusAgendamentosScreen() {
  const { theme } = useAppTheme();
  const showAlert = useAlert();

  const [loading, setLoading] = useState(true);
  const [agendamentos, setAgendamentos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [agendamentoParaAvaliar, setAgendamentoParaAvaliar] = useState(null);
  
  const [activeHistoryTab, setActiveHistoryTab] = useState('concluido');

  const fetchAgendamentos = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('agendamentos')
      .select(`id, data_agendamento, status, barbeiro_id, servico:servico_id(nome), barbeiro:barbeiro_id(nome_completo), avaliacoes(id)`)
      .eq('cliente_id', user.id)
      .order('data_agendamento', { ascending: false });

    if (error) {
      showAlert('Erro', 'Não foi possível carregar seus agendamentos.');
    } else {
      setAgendamentos(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  }, [showAlert]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAgendamentos();
    }, [fetchAgendamentos])
  );

  const { proximos, historico } = useMemo(() => {
    const agora = new Date();
    const p = agendamentos.filter(a => ['pendente', 'confirmado'].includes(a.status) && new Date(a.data_agendamento) >= agora);
    const h = agendamentos.filter(a => !p.includes(a));
    
    p.sort((a, b) => new Date(a.data_agendamento) - new Date(b.data_agendamento));
    h.sort((a, b) => new Date(b.data_agendamento) - new Date(a.data_agendamento));
    return { proximos: p, historico: h };
  }, [agendamentos]);

  const historicoFiltrado = useMemo(() => {
    if (activeHistoryTab === 'concluido') {
      return historico.filter(a => a.status === 'concluido' || a.status === 'ausente');
    }
    return historico.filter(a => a.status === 'cancelado');
  }, [historico, activeHistoryTab]);

  const handleCancel = (agendamentoId, dataAgendamento) => {
    const agora = new Date();
    const dataDoAgendamento = new Date(dataAgendamento);
    const diffEmHoras = (dataDoAgendamento - agora) / (1000 * 60 * 60);

    if (diffEmHoras <= 24) {
      Alert.alert(
        "Cancelamento Fora do Prazo",
        "Não é possível cancelar agendamentos com menos de 24 horas de antecedência. Por favor, entre em contato com a barbearia.",
        [{ text: "Entendi" }]
      );
      return;
    }

    Alert.alert(
      "Cancelar Agendamento", "Tem certeza que deseja cancelar? Esta ação não pode ser desfeita.",
      [
        { text: "Não", style: "cancel" },
        { text: "Sim, cancelar", style: "destructive", onPress: async () => {
            const { error } = await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', agendamentoId);
            if (error) showAlert('Erro', 'Não foi possível cancelar o agendamento.');
            else {
              showAlert('Sucesso', 'Agendamento cancelado.');
              fetchAgendamentos();
            }
        }}
      ]
    );
  };

  const handleOpenModal = (agendamento) => {
    setAgendamentoParaAvaliar(agendamento);
    setModalVisible(true);
  };

  const handleSaveAvaliacao = async (nota, comentario) => {
    if (nota === 0) {
        showAlert("Atenção", "Por favor, selecione pelo menos uma estrela.", [{ text: 'OK' }]);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('avaliacoes').insert({
        agendamento_id: agendamentoParaAvaliar.id,
        cliente_id: user.id,
        barbeiro_id: agendamentoParaAvaliar.barbeiro_id,
        nota: nota,
        comentario: comentario,
      });
  
      if (error) {
        showAlert("Erro", `Não foi possível salvar sua avaliação: ${error.message}`, [{ text: 'OK' }]);
      } else {
        showAlert("Obrigado!", "Sua avaliação foi enviada com sucesso.", [{ text: 'OK' }]);
        setModalVisible(false);
        fetchAgendamentos();
      }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgendamentos();
  };

  const renderListHeader = () => (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Próximos Agendamentos</Text>
      {proximos.length === 0 && !loading && <Text style={[styles.emptyText, { color: theme.subtext }]}>Você não tem agendamentos futuros.</Text>}
    </>
  );

  const renderListFooter = () => (
    <>
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: proximos.length > 0 ? 30 : 0 }]}>Histórico</Text>
      <View style={styles.historyTabContainer}>
        <TouchableOpacity
          style={[styles.historyTabButton, activeHistoryTab === 'concluido' && { backgroundColor: theme.card }]}
          onPress={() => setActiveHistoryTab('concluido')}
        >
          <Text style={[styles.historyTabText, { color: activeHistoryTab === 'concluido' ? theme.text : theme.subtext }]}>Concluídos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.historyTabButton, activeHistoryTab === 'cancelado' && { backgroundColor: theme.card }]}
          onPress={() => setActiveHistoryTab('cancelado')}
        >
          <Text style={[styles.historyTabText, { color: activeHistoryTab === 'cancelado' ? theme.text : theme.subtext }]}>Cancelados</Text>
        </TouchableOpacity>
      </View>

      {historicoFiltrado.map(item => (
        <AgendamentoItem key={item.id} item={item} theme={theme} onCancel={handleCancel} onEvaluate={handleOpenModal} />
      ))}
      {historicoFiltrado.length === 0 && !loading && (
        <Text style={[styles.emptyText, { color: theme.subtext, marginVertical: 20 }]}>
          {activeHistoryTab === 'concluido' ? 'Nenhum serviço concluído.' : 'Nenhum serviço cancelado.'}
        </Text>
      )}
    </>
  );

  if (loading && agendamentos.length === 0) {
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Meus Agendamentos', headerStyle: { backgroundColor: theme.card }, headerTintColor: theme.text, headerTitleStyle: { color: theme.text } }} />
      <AvaliacaoModal visible={modalVisible} onClose={() => setModalVisible(false)} onSave={handleSaveAvaliacao} agendamento={agendamentoParaAvaliar} />
      
      <FlatList
        data={proximos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <AgendamentoItem item={item} theme={theme} onCancel={(id, data) => handleCancel(id, data)} onEvaluate={handleOpenModal} />}
        contentContainerStyle={{ padding: 15 }}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={() => (
          !loading && proximos.length === 0 && historico.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={60} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.subtext, marginTop: 20 }]}>
                Você ainda não tem nenhum agendamento.
              </Text>
            </View>
          )
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  itemCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  itemInfo: { flex: 1 },
  itemService: { fontSize: 16, fontWeight: 'bold' },
  itemBarber: { fontSize: 14, marginTop: 2 },
  itemDate: { fontSize: 14, marginTop: 8, fontWeight: '500' },
  itemActions: { alignItems: 'flex-end', justifyContent: 'space-between', height: '100%' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 15,
  },
  statusText: { fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
  cancelButton: { padding: 5 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  emptyText: { fontSize: 16, textAlign: 'center', paddingHorizontal: 30, lineHeight: 24 },
  
  historyTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  historyTabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  historyTabText: {
    fontWeight: 'bold',
  },

  avaliarButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: '#FBBF24', borderWidth: 1, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, marginTop: 15, alignSelf: 'flex-start' },
  avaliarButtonText: { color: '#FBBF24', fontWeight: 'bold', marginLeft: 8 },
  avaliadoContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 15, opacity: 0.8 },
  avaliadoText: { fontStyle: 'italic', marginLeft: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '90%', borderRadius: 20, padding: 25, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  modalSubtext: { fontSize: 14, marginBottom: 20, textAlign: 'center' },
  starsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 25 },
  inputComentario: { width: '100%', height: 100, borderRadius: 10, padding: 15, textAlignVertical: 'top', fontSize: 16, marginBottom: 20 },
  modalButtonContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  modalButton: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
});
