// Arquivo: app/(tabs)/meus-agendamentos.js (VERSÃO DE TESTE DO BOTÃO)

import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

export default function MeusAgendamentosScreen() {
  const { theme } = useAppTheme();
  const showAlert = useAlert();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [agendamentos, setAgendamentos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAgendamentos = useCallback(async () => {
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
      .in('status', ['pendente', 'confirmado'])
      .order('data_agendamento', { ascending: true });

    if (error) showAlert('Erro', 'Não foi possível carregar seus agendamentos.');
    else setAgendamentos(data || []);

    setLoading(false);
    setRefreshing(false);
  }, [showAlert]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAgendamentos();
    }, [fetchAgendamentos]),
  );

  // ========================================================================
  // <<< O TESTE MAIS SIMPLES POSSÍVEL >>>
  // ========================================================================
  const handleCancel = (agendamentoId) => {
    // A única coisa que essa função faz é mostrar um alerta.
    // Se isso não funcionar, o problema é o botão em si.
    Alert.alert('TESTE', `O botão para o agendamento ID: ${agendamentoId} foi pressionado.`);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgendamentos();
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Próximos Agendamentos</Text>
      </View>

      <FlatList
        data={agendamentos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <AgendamentoItem item={item} theme={theme} onCancel={handleCancel} />
        )}
        contentContainerStyle={{ padding: 15, flexGrow: 1 }}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={60} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.subtext, marginTop: 20 }]}>
                Você não tem agendamentos futuros.
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

const AgendamentoItem = ({ item, theme, onCancel }) => {
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
      case 'confirmado':
        return { text: 'Confirmado', color: '#34D399', icon: 'checkmark-circle-outline' };
      case 'pendente':
        return { text: 'Pendente', color: '#FBBF24', icon: 'time-outline' };
      default:
        return { text: status, color: theme.subtext, icon: 'help-circle-outline' };
    }
  };

  const statusStyle = getStatusStyle(item.status);

  const podeCancelar = () => {
    const agora = new Date();
    const dataDoAgendamento = new Date(item.data_agendamento);
    const diffEmHoras = (dataDoAgendamento.getTime() - agora.getTime()) / (1000 * 60 * 60);
    return diffEmHoras > 24;
  };

  return (
    <View
      style={[styles.itemCard, { backgroundColor: theme.card, borderLeftColor: statusStyle.color }]}
    >
      <View style={styles.itemInfo}>
        <Text style={[styles.itemService, { color: theme.text }]}>
          {item.servico?.nome || 'Serviço não encontrado'}
        </Text>
        <Text style={[styles.itemBarber, { color: theme.subtext }]}>
          com {item.barbeiro?.nome_completo || 'Barbeiro não encontrado'}
        </Text>
        <Text style={[styles.itemDate, { color: theme.text }]}>
          {formatarData(item.data_agendamento)}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <View style={[styles.statusBadge, { backgroundColor: `${statusStyle.color}20` }]}>
          <Ionicons name={statusStyle.icon} size={14} color={statusStyle.color} />
          <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.text}</Text>
        </View>

        {podeCancelar() && (
          <TouchableOpacity onPress={() => onCancel(item.id)} style={styles.cancelButton}>
            <Ionicons name="close-circle-outline" size={28} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  backButton: { position: 'absolute', left: 20, top: 60, padding: 5 },
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
  },
  itemInfo: { flex: 1 },
  itemService: { fontSize: 16, fontWeight: 'bold' },
  itemBarber: { fontSize: 14, marginTop: 2 },
  itemDate: { fontSize: 14, marginTop: 8, fontWeight: '500' },
  itemActions: { alignItems: 'flex-end', justifyContent: 'space-between', minHeight: 60 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginBottom: 15,
  },
  statusText: { fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
  cancelButton: { padding: 5, zIndex: 10 }, // Adicionei zIndex como uma tentativa desesperada
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, textAlign: 'center', paddingHorizontal: 30, lineHeight: 24 },
});
