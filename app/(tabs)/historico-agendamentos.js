// Arquivo: app/(tabs)/historico-agendamentos.js (VERSÃO COM BOTÃO DE VOLTAR CORRIGIDO)

import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

export default function HistoricoAgendamentosScreen() {
  const { theme } = useAppTheme();
  const showAlert = useAlert();
  const router = useRouter(); // <<< O router que vamos usar
  const [loading, setLoading] = useState(true);
  const [agendamentos, setAgendamentos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('concluido');

  const fetchHistorico = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('agendamentos')
      .select(
        `id, data_agendamento, status, servico:servico_id(nome), barbeiro:barbeiro_id(nome_completo)`,
      )
      .eq('cliente_id', user.id)
      .in('status', ['concluido', 'cancelado', 'ausente'])
      .order('data_agendamento', { ascending: false });

    if (error) showAlert('Erro', 'Não foi possível carregar seu histórico.');
    else setAgendamentos(data || []);

    setLoading(false);
    setRefreshing(false);
  }, [showAlert]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchHistorico();
    }, [fetchHistorico]),
  );

  const historicoFiltrado = useMemo(() => {
    return agendamentos.filter((a) => {
      if (activeTab === 'concluido') return ['concluido', 'ausente'].includes(a.status);
      if (activeTab === 'cancelado') return a.status === 'cancelado';
      return false;
    });
  }, [agendamentos, activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistorico();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        {/* ======================================================================== */}
        {/* <<< A CORREÇÃO ESTÁ AQUI: USANDO router.push EM VEZ DE router.back >>> */}
        {/* ======================================================================== */}
        <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Histórico de Agendamentos</Text>
      </View>

      <FlatList
        data={historicoFiltrado}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <HistoricoItem item={item} theme={theme} />}
        contentContainerStyle={{ padding: 15 }}
        ListHeaderComponent={
          <View style={styles.historyTabContainer}>
            <TouchableOpacity
              style={[
                styles.historyTabButton,
                activeTab === 'concluido' && { backgroundColor: theme.card },
              ]}
              onPress={() => setActiveTab('concluido')}
            >
              <Text
                style={[
                  styles.historyTabText,
                  { color: activeTab === 'concluido' ? theme.text : theme.subtext },
                ]}
              >
                Concluídos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.historyTabButton,
                activeTab === 'cancelado' && { backgroundColor: theme.card },
              ]}
              onPress={() => setActiveTab('cancelado')}
            >
              <Text
                style={[
                  styles.historyTabText,
                  { color: activeTab === 'cancelado' ? theme.text : theme.subtext },
                ]}
              >
                Cancelados
              </Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="archive-outline" size={60} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.subtext, marginTop: 20 }]}>
                {activeTab === 'concluido'
                  ? 'Nenhum serviço concluído.'
                  : 'Nenhum serviço cancelado.'}
              </Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      />
    </View>
  );
}

const HistoricoItem = ({ item, theme }) => {
  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data
      .toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC',
      })
      .replace(',', ' às');
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'concluido':
        return { text: 'Concluído', color: '#10B981', icon: 'checkmark-done-circle-outline' };
      case 'cancelado':
        return { text: 'Cancelado', color: '#EF4444', icon: 'close-circle-outline' };
      case 'ausente':
        return { text: 'Ausente', color: '#9CA3AF', icon: 'person-remove-outline' };
      default:
        return { text: status, color: theme.subtext, icon: 'help-circle-outline' };
    }
  };

  const statusStyle = getStatusStyle(item.status);

  return (
    <View
      style={[styles.itemCard, { backgroundColor: theme.card, borderLeftColor: statusStyle.color }]}
    >
      <View style={styles.itemInfo}>
        <Text style={[styles.itemService, { color: theme.text }]}>{item.servico.nome}</Text>
        <Text style={[styles.itemBarber, { color: theme.subtext }]}>
          com {item.barbeiro.nome_completo}
        </Text>
        <Text style={[styles.itemDate, { color: theme.text }]}>
          {formatarData(item.data_agendamento)}
        </Text>
      </View>
      <View style={styles.statusBadge}>
        <Ionicons name={statusStyle.icon} size={14} color={statusStyle.color} />
        <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: { position: 'absolute', left: 20, top: 60 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
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
    justifyContent: 'space-between',
  },
  itemInfo: { flex: 1 },
  itemService: { fontSize: 16, fontWeight: 'bold' },
  itemBarber: { fontSize: 14, marginTop: 2 },
  itemDate: { fontSize: 14, marginTop: 8, fontWeight: '500' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: { fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, textAlign: 'center', paddingHorizontal: 30, lineHeight: 24 },
  historyTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  historyTabButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  historyTabText: { fontWeight: 'bold' },
});
