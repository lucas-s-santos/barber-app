// Arquivo: app/(tabs)/agendamentos.js - Tela unificada de agendamentos do cliente

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

export default function AgendamentosScreen() {
  const { theme } = useAppTheme();
  const showAlert = useAlert();
  const [loading, setLoading] = useState(true);
  const [proximos, setProximos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('proximos');

  const fetchAgendamentos = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Buscar próximos agendamentos (pendentes e confirmados)
    const { data: proximosData, error: proximosError } = await supabase
      .from('agendamentos')
      .select(
        `id, data_agendamento, status, servico:servico_id(nome), barbeiro:barbeiro_id(nome_completo)`,
      )
      .eq('cliente_id', user.id)
      .in('status', ['pendente', 'confirmado'])
      .order('data_agendamento', { ascending: true });

    // Buscar histórico (concluídos, cancelados, ausentes)
    const { data: historicoData, error: historicoError } = await supabase
      .from('agendamentos')
      .select(
        `id, data_agendamento, status, servico:servico_id(nome), barbeiro:barbeiro_id(nome_completo)`,
      )
      .eq('cliente_id', user.id)
      .in('status', ['concluido', 'cancelado', 'ausente'])
      .order('data_agendamento', { ascending: false });

    if (proximosError || historicoError) {
      showAlert('Erro', 'Não foi possível carregar seus agendamentos.');
    } else {
      setProximos(proximosData || []);
      setHistorico(historicoData || []);
    }

    setLoading(false);
    setRefreshing(false);
  }, [showAlert]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAgendamentos();
    }, [fetchAgendamentos]),
  );

  const handleCancelar = (id) => {
    showAlert('Cancelar Agendamento', 'Tem certeza de que deseja cancelar este agendamento?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim',
        onPress: async () => {
          const { error } = await supabase
            .from('agendamentos')
            .update({ status: 'cancelado' })
            .eq('id', id);

          if (error) {
            showAlert('Erro', 'Não foi possível cancelar o agendamento.');
          } else {
            fetchAgendamentos();
            showAlert('Sucesso', 'Agendamento cancelado com sucesso.', [
              { text: 'OK', onPress: () => {} },
            ]);
          }
        },
      },
    ]);
  };

  const formatarDataHora = (data) => {
    const dataObj = new Date(data);
    return dataObj.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pendente':
        return { label: 'Pendente', icon: 'time-outline', color: theme.warning || '#FFA500' };
      case 'confirmado':
        return { label: 'Confirmado', icon: 'checkmark-circle', color: theme.success };
      case 'concluido':
        return { label: 'Concluído', icon: 'checkmark-done', color: theme.success };
      case 'cancelado':
        return { label: 'Cancelado', icon: 'close-circle', color: theme.error };
      case 'ausente':
        return { label: 'Ausente', icon: 'person-remove', color: theme.subtext };
      default:
        return { label: status, icon: 'help-circle', color: theme.subtext };
    }
  };

  const renderAgendamento = ({ item }) => {
    const statusInfo = getStatusInfo(item.status);
    const podeSerCancelado = ['pendente', 'confirmado'].includes(item.status);

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.statusContainer}>
            <Ionicons name={statusInfo.icon} size={20} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
          <Text style={[styles.dateText, { color: theme.text }]}>
            {formatarDataHora(item.data_agendamento)}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="cut-outline" size={18} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>{item.servico?.nome}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={18} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              {item.barbeiro?.nome_completo}
            </Text>
          </View>
        </View>

        {podeSerCancelado && (
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.errorBackground }]}
            onPress={() => handleCancelar(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color={theme.error} />
            <Text style={[styles.cancelButtonText, { color: theme.error }]}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const dataToShow = activeTab === 'proximos' ? proximos : historico;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>Meus Agendamentos</Text>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'proximos' && { borderBottomColor: theme.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => setActiveTab('proximos')}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={activeTab === 'proximos' ? theme.primary : theme.subtext}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'proximos' ? theme.primary : theme.subtext },
            ]}
          >
            Próximos ({proximos.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'historico' && { borderBottomColor: theme.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => setActiveTab('historico')}
        >
          <Ionicons
            name="time-outline"
            size={20}
            color={activeTab === 'historico' ? theme.primary : theme.subtext}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'historico' ? theme.primary : theme.subtext },
            ]}
          >
            Histórico ({historico.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={dataToShow}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAgendamento}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchAgendamentos();
              }}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'proximos' ? 'calendar-outline' : 'time-outline'}
                size={64}
                color={theme.subtext}
              />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>
                {activeTab === 'proximos'
                  ? 'Nenhum agendamento próximo.'
                  : 'Nenhum agendamento no histórico.'}
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
                {activeTab === 'proximos'
                  ? 'Acesse a aba "Agendar" para marcar um horário.'
                  : 'Seus agendamentos finalizados aparecerão aqui.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  tabText: { fontSize: 16, fontWeight: '600' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 15, paddingBottom: 30 },
  card: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 14, fontWeight: '600' },
  dateText: { fontSize: 14, fontWeight: '500' },
  cardBody: { gap: 8, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 15, flex: 1 },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  cancelButtonText: { fontSize: 15, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 15, textAlign: 'center' },
  emptySubtext: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
});
