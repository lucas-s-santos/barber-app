// Arquivo: app/(tabs)/painel.js (VERSÃO ANTIGA, ESTÁVEL E FUNCIONAL)

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
  monthNamesShort: [
    'Jan.',
    'Fev.',
    'Mar.',
    'Abr.',
    'Mai.',
    'Jun.',
    'Jul.',
    'Ago.',
    'Set.',
    'Out.',
    'Nov.',
    'Dez.',
  ],
  dayNames: [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje',
};
LocaleConfig.defaultLocale = 'pt-br';

export default function PainelScreen() {
  const { theme } = useAppTheme();
  const showAlert = useAlert();
  const hoje = new Date().toISOString().split('T')[0];

  const [loading, setLoading] = useState(true);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [agendamentosDoDia, setAgendamentosDoDia] = useState([]);
  const [clientesAtendidos, setClientesAtendidos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(hoje);
  const [user, setUser] = useState(null);

  const fetchData = useCallback(
    async (barbeiroId, dataSelecionada) => {
      if (!barbeiroId) return;
      setLoading(true);

      // --- CONSULTA 1: BUSCA SOLICITAÇÕES PENDENTES ---
      const solicitacoesPromise = supabase
        .from('agendamentos')
        .select(
          `id, data_agendamento, status, cliente:cliente_id ( nome_completo ), servico:servico_id ( nome )`,
        )
        .eq('barbeiro_id', barbeiroId)
        .eq('status', 'pendente')
        .order('data_agendamento', { ascending: true });

      // --- CONSULTA 2: BUSCA AGENDAMENTOS CONFIRMADOS PARA O DIA (SEM RPC) ---
      // Esta é a forma mais simples e confiável de buscar os dados do dia.
      const inicioDoDia = `${dataSelecionada}T00:00:00.000Z`;
      const fimDoDia = `${dataSelecionada}T23:59:59.999Z`;

      const agendamentosDiaPromise = supabase
        .from('agendamentos')
        .select(
          `id, data_agendamento, status, cliente:cliente_id ( nome_completo ), servico:servico_id ( nome )`,
        )
        .eq('barbeiro_id', barbeiroId)
        .eq('status', 'confirmado')
        .gte('data_agendamento', inicioDoDia)
        .lte('data_agendamento', fimDoDia)
        .order('data_agendamento', { ascending: true });

      // --- CONSULTA 3: BUSCA CLIENTES ATENDIDOS (CONCLUÍDOS) DO DIA ---
      const clientesAtendidosPromise = supabase
        .from('agendamentos')
        .select(
          `id, data_agendamento, status, cliente:cliente_id ( nome_completo ), servico:servico_id ( nome, preco )`,
        )
        .eq('barbeiro_id', barbeiroId)
        .eq('status', 'concluido')
        .gte('data_agendamento', inicioDoDia)
        .lte('data_agendamento', fimDoDia)
        .order('data_agendamento', { ascending: false });

      // Executa as três consultas em paralelo
      const [solicitacoesResult, agendamentosDiaResult, clientesAtendidosResult] =
        await Promise.all([solicitacoesPromise, agendamentosDiaPromise, clientesAtendidosPromise]);

      if (
        solicitacoesResult.error ||
        agendamentosDiaResult.error ||
        clientesAtendidosResult.error
      ) {
        console.error(
          'Erro ao buscar dados:',
          solicitacoesResult.error || agendamentosDiaResult.error || clientesAtendidosResult.error,
        );
        showAlert('Erro', 'Não foi possível carregar os dados da agenda.');
      } else {
        setSolicitacoes(solicitacoesResult.data || []);
        setAgendamentosDoDia(agendamentosDiaResult.data || []);
        setClientesAtendidos(clientesAtendidosResult.data || []);
      }
      setLoading(false);
    },
    [showAlert],
  );

  useFocusEffect(
    useCallback(() => {
      const getUserAndFetchData = async () => {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (currentUser) {
          setUser(currentUser);
          fetchData(currentUser.id, selectedDate);
        } else {
          setLoading(false);
        }
      };
      getUserAndFetchData();
    }, [fetchData, selectedDate]),
  );

  const handleUpdateStatus = async (agendamentoId, novoStatus, mensagemSucesso) => {
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: novoStatus })
      .eq('id', agendamentoId);
    if (error) {
      showAlert('Erro', `Não foi possível atualizar o agendamento.`);
    } else {
      showAlert('Sucesso', mensagemSucesso, [{ text: 'OK' }]);
      if (user) {
        fetchData(user.id, selectedDate);
      }
    }
  };

  const formatarHora = (data) =>
    new Date(data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  const formatarDataHora = (data) => {
    const dataObj = new Date(data);
    const dia = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', timeZone: 'UTC' });
    const mes = dataObj.toLocaleDateString('pt-BR', { month: '2-digit', timeZone: 'UTC' });
    return `${dia}/${mes} às ${formatarHora(data)}`;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 50 }}
    >
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Solicitações Pendentes ({solicitacoes.length})
        </Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          {loading ? (
            <ActivityIndicator color={theme.primary} />
          ) : solicitacoes.length > 0 ? (
            solicitacoes.map((item) => (
              <View
                key={item.id}
                style={[styles.itemContainer, { borderBottomColor: theme.border }]}
              >
                <View style={styles.itemTextContainer}>
                  <Text style={[styles.itemText, { color: theme.text }]}>
                    {formatarDataHora(item.data_agendamento)} - {item.cliente?.nome_completo}
                  </Text>
                  <Text style={[styles.itemSubText, { color: theme.subtext }]}>
                    {item.servico?.nome}
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    onPress={() =>
                      handleUpdateStatus(item.id, 'cancelado', 'Agendamento recusado.')
                    }
                    style={[styles.actionButton, { backgroundColor: theme.errorBackground }]}
                  >
                    <Ionicons name="close-outline" size={24} color={theme.error} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      handleUpdateStatus(item.id, 'confirmado', 'Agendamento confirmado!')
                    }
                    style={[styles.actionButton, { backgroundColor: theme.successBackground }]}
                  >
                    <Ionicons name="checkmark-outline" size={24} color={theme.success} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.placeholderText, { color: theme.subtext }]}>
              Nenhuma nova solicitação.
            </Text>
          )}
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Minha Agenda</Text>
        <Calendar
          style={[styles.calendario, { backgroundColor: theme.card }]}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{ [selectedDate]: { selected: true, selectedColor: theme.primary } }}
          current={hoje}
          theme={{
            backgroundColor: theme.card,
            calendarBackground: theme.card,
            textSectionTitleColor: theme.primary,
            selectedDayBackgroundColor: theme.primary,
            selectedDayTextColor: theme.background,
            todayTextColor: theme.primary,
            dayTextColor: theme.text,
            textDisabledColor: theme.subtext,
            arrowColor: theme.primary,
            monthTextColor: theme.text,
          }}
        />
      </View>

      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Agendamentos do Dia</Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          {loading ? (
            <ActivityIndicator color={theme.primary} />
          ) : agendamentosDoDia.length > 0 ? (
            agendamentosDoDia.map((item) => (
              <View
                key={item.id}
                style={[styles.itemContainer, { borderBottomColor: theme.border }]}
              >
                <View style={styles.itemTextContainer}>
                  <Text style={[styles.itemText, { color: theme.text }]}>
                    {formatarHora(item.data_agendamento)} - {item.cliente.nome_completo}
                  </Text>
                  <Text style={[styles.itemSubText, { color: theme.subtext }]}>
                    {item.servico.nome}
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    onPress={() =>
                      handleUpdateStatus(item.id, 'ausente', 'Cliente marcado como ausente.')
                    }
                    style={[styles.actionButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                  >
                    <Ionicons name="person-remove-outline" size={22} color={theme.subtext} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleUpdateStatus(item.id, 'concluido', 'Serviço concluído!')}
                    style={[styles.actionButton, { backgroundColor: theme.successBackground }]}
                  >
                    <Ionicons name="checkmark-done-outline" size={24} color={theme.success} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.placeholderText, { color: theme.subtext }]}>
              Nenhum agendamento confirmado para este dia.
            </Text>
          )}
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Clientes Atendidos Hoje ({clientesAtendidos.length})
        </Text>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          {loading ? (
            <ActivityIndicator color={theme.primary} />
          ) : clientesAtendidos.length > 0 ? (
            <>
              {clientesAtendidos.map((item) => (
                <View
                  key={item.id}
                  style={[styles.itemContainer, { borderBottomColor: theme.border }]}
                >
                  <View style={styles.itemTextContainer}>
                    <Text style={[styles.itemText, { color: theme.text }]}>
                      {formatarHora(item.data_agendamento)} - {item.cliente.nome_completo}
                    </Text>
                    <Text style={[styles.itemSubText, { color: theme.subtext }]}>
                      {item.servico.nome}
                      {item.servico.preco ? ` • R$ ${item.servico.preco.toFixed(2)}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: theme.successBackground }]}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                  </View>
                </View>
              ))}
              <View style={styles.totalContainer}>
                <Text style={[styles.totalLabel, { color: theme.subtext }]}>
                  Total de atendimentos:
                </Text>
                <Text style={[styles.totalValue, { color: theme.primary }]}>
                  {clientesAtendidos.length}
                </Text>
              </View>
              {clientesAtendidos.some((item) => item.servico.preco) && (
                <View style={styles.totalContainer}>
                  <Text style={[styles.totalLabel, { color: theme.subtext }]}>
                    Receita estimada:
                  </Text>
                  <Text style={[styles.totalValue, { color: theme.success }]}>
                    R${' '}
                    {clientesAtendidos
                      .reduce((sum, item) => sum + (item.servico.preco || 0), 0)
                      .toFixed(2)}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text style={[styles.placeholderText, { color: theme.subtext }]}>
              Nenhum cliente atendido neste dia.
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20 },
  sectionContainer: { marginBottom: 25, paddingHorizontal: 15 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  card: { borderRadius: 15, padding: 15, elevation: 3, shadowOpacity: 0.1, shadowRadius: 5 },
  placeholderText: { textAlign: 'center', paddingVertical: 20, fontSize: 16 },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  itemTextContainer: { flex: 1 },
  itemText: { fontSize: 16, fontWeight: '600' },
  itemSubText: { fontSize: 14, marginTop: 4 },
  itemActions: { flexDirection: 'row' },
  actionButton: { padding: 8, borderRadius: 50, marginLeft: 10 },
  calendario: { borderRadius: 15, elevation: 2, shadowOpacity: 0.05, shadowRadius: 5 },
  badge: { padding: 6, borderRadius: 20 },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: 'bold' },
});
