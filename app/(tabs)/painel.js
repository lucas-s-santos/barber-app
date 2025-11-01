import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useAlert } from '../../contexts/AlertContext';
import { supabase } from '../../supabaseClient';

// Configuração de idioma do calendário
LocaleConfig.locales['pt-br'] = { monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'], dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'], dayNamesShort: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'], today: 'Hoje' };
LocaleConfig.defaultLocale = 'pt-br';

export default function PainelScreen() {
  const [loading, setLoading] = useState(true);
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const showAlert = useAlert();
  const [barbeiroId, setBarbeiroId] = useState(null);

  const [solicitacoes, setSolicitacoes] = useState([]);
  const [agendaDoDia, setAgendaDoDia] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [currentMonth, setCurrentMonth] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

  const fetchSolicitacoes = useCallback(async (id) => {
    if (!id) return;
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        id,
        data_agendamento,
        servicos ( nome ),
        perfis:cliente_id ( nome_completo )
      `)
      .eq('barbeiro_id', id)
      .eq('status', 'pendente')
      .order('data_agendamento', { ascending: true });
    
    if (error) {
      console.error("Erro ao buscar solicitações:", error);
      showAlert('Erro', 'Não foi possível buscar as solicitações pendentes.');
    } else {
      const agora = new Date();
      const solicitacoesValidas = (data || []).filter(item => {
        const dataAgendamento = new Date(item.data_agendamento);
        return dataAgendamento > agora;
      });
      setSolicitacoes(solicitacoesValidas);
    }
  }, [showAlert]);

  const fetchAgendaDoDia = useCallback(async (id, data) => {
    if (!id) return;

    const inicioDoDia = new Date(data);
    inicioDoDia.setUTCHours(0, 0, 0, 0);

    const fimDoDia = new Date(data);
    fimDoDia.setUTCHours(23, 59, 59, 999);
    
    const { data: agendamentosConfirmados, error } = await supabase
      .from('agendamentos')
      .select(`*, servicos(nome, duracao_minutos), perfis:cliente_id(nome_completo)`)
      .eq('barbeiro_id', id)
      .eq('status', 'confirmado')
      .gte('data_agendamento', inicioDoDia.toISOString())
      .lt('data_agendamento', fimDoDia.toISOString())
      .order('data_agendamento');
      
    if (error) {
      showAlert('Erro', 'Não foi possível carregar a agenda do dia.');
      setAgendaDoDia([]);
      return;
    }
    
    const itemsFormatados = agendamentosConfirmados.map(ag => ({
      horario_inicio: new Date(ag.data_agendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }),
      status: 'agendado',
      servico_nome: ag.servicos.nome,
      cliente_nome: ag.perfis.nome_completo
    }));

    setAgendaDoDia(itemsFormatados);
  }, [showAlert]);

  const fetchResumoMensal = useCallback(async (id, mes, ano) => {
    if (!id) return;
    const { data: resumoData, error } = await supabase.rpc('get_resumo_mensal_agenda', {
      p_barbeiro_id: id,
      p_mes: mes,
      p_ano: ano,
    });

    if (error) {
      console.error("Erro ao buscar resumo mensal:", error);
    } else {
      const markers = {};
      (resumoData || []).forEach(dia => {
        let color = 'gray';
        if (dia.status === 'livre') color = 'green';
        if (dia.status === 'parcial') color = 'orange';
        if (dia.status === 'lotado') color = 'red';
        
        markers[dia.dia] = {
          marked: dia.status !== 'folga',
          dotColor: color,
        };
      });
      setMarkedDates(markers);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const getBarbeiroEcarregarDados = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setBarbeiroId(user.id);
          await Promise.all([
            fetchSolicitacoes(user.id),
            fetchAgendaDoDia(user.id, dataSelecionada),
            fetchResumoMensal(user.id, currentMonth.month, currentMonth.year)
          ]);
        }
        setLoading(false);
      };
      getBarbeiroEcarregarDados();
    }, [dataSelecionada, currentMonth, fetchSolicitacoes, fetchAgendaDoDia, fetchResumoMensal])
  );

  // <<< A CORREÇÃO ESTÁ AQUI DENTRO >>>
  const handleUpdateStatus = async (agendamentoId, novoStatus) => {
    if (!agendamentoId || !barbeiroId) return;

    // O parâmetro 'novoStatus' virá como 'confirmado' ou 'cancelado' dos botões
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: novoStatus }) // Usa diretamente o novoStatus
      .eq('id', agendamentoId);

    if (error) {
      showAlert('Erro', `Não foi possível atualizar o agendamento: ${error.message}`, [{ text: 'OK' }]);
    } else {
      // Ajusta a mensagem de sucesso para ser genérica
      const mensagemSucesso = novoStatus === 'confirmado' ? 'Agendamento confirmado.' : 'Agendamento cancelado.';
      showAlert(
        'Sucesso!', 
        mensagemSucesso,
        [{ text: 'OK' }]
      );
      // Recarrega os dados para atualizar a interface
      fetchSolicitacoes(barbeiroId);
      fetchAgendaDoDia(barbeiroId, dataSelecionada);
    }
  };

  const onDayPress = (day) => setDataSelecionada(day.dateString);
  const onMonthChange = (month) => setCurrentMonth({ month: month.month, year: month.year });
  const finalMarkedDates = useMemo(() => ({
    ...markedDates,
    [dataSelecionada]: { ...markedDates[dataSelecionada], selected: true, selectedColor: '#E50914' }
  }), [markedDates, dataSelecionada]);

  const SolicitacaoItem = ({ item }) => {
    const data = new Date(item.data_agendamento);
    const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

    return (
      <View style={styles.solicitacaoContainer}>
        <View style={styles.solicitacaoInfo}>
          <Text style={styles.solicitacaoCliente}>{item.perfis.nome_completo}</Text>
          <Text style={styles.solicitacaoServico}>{item.servicos.nome}</Text>
          <Text style={styles.solicitacaoData}>{dataFormatada} às {horaFormatada}</Text>
        </View>
        <View style={styles.actionButtonsContainer}>
          {/* <<< E A CORREÇÃO ESTÁ AQUI TAMBÉM >>> */}
          {/* Agora o botão de recusar passa o status 'cancelado' */}
          <TouchableOpacity style={[styles.actionButton, styles.recusarButton]} onPress={() => handleUpdateStatus(item.id, 'cancelado')}>
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.confirmarButton]} onPress={() => handleUpdateStatus(item.id, 'confirmado')}>
            <Ionicons name="checkmark" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const AgendaSlotItem = ({ item }) => (
    <View style={[styles.slotContainer, styles.slotAgendado]}>
      <View style={styles.slotTimeContainer}>
        <Ionicons name="cut-outline" size={18} color="white" />
        <Text style={styles.slotTime}>{item.horario_inicio}</Text>
      </View>
      <View style={styles.slotDetails}>
        <Text style={styles.servicoNome}>{item.servico_nome}</Text>
        <Text style={styles.clienteNome}>Cliente: {item.cliente_nome}</Text>
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E50914" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Solicitações Pendentes ({solicitacoes.length})</Text>
        {solicitacoes.length > 0 ? (
          <FlatList
            data={solicitacoes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={SolicitacaoItem}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.placeholderText}>Nenhuma nova solicitação.</Text>
        )}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Minha Agenda</Text>
        <Calendar
          current={dataSelecionada}
          onDayPress={onDayPress}
          onMonthChange={onMonthChange}
          markedDates={finalMarkedDates}
          theme={calendarTheme}
        />
        <Text style={styles.title}>Detalhes do Dia</Text>
        {agendaDoDia.length > 0 ? (
          <FlatList
            data={agendaDoDia}
            keyExtractor={(item) => item.horario_inicio}
            renderItem={AgendaSlotItem}
            ListEmptyComponent={<Text style={styles.placeholderText}>Nenhum agendamento confirmado para hoje.</Text>}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.placeholderText}>Nenhum agendamento confirmado para este dia.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const calendarTheme = {
  backgroundColor: '#121212', calendarBackground: '#1E1E1E', textSectionTitleColor: '#b6c1cd',
  selectedDayBackgroundColor: '#E50914', selectedDayTextColor: '#ffffff', todayTextColor: '#E50914',
  dayTextColor: '#d9e1e8', textDisabledColor: '#2d4150', arrowColor: '#E50914', monthTextColor: 'white',
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212' },
  sectionContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    margin: 10,
    padding: 15,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: 'white', textAlign: 'center', marginVertical: 15 },
  placeholderText: { color: 'gray', textAlign: 'center', marginVertical: 20, fontSize: 14 },
  solicitacaoContainer: {
    backgroundColor: '#2C2C2C',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  solicitacaoInfo: { flex: 1 },
  solicitacaoCliente: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  solicitacaoServico: { color: '#A0A0A0', fontSize: 14, marginVertical: 2 },
  solicitacaoData: { color: '#34D399', fontSize: 14, fontWeight: 'bold' },
  actionButtonsContainer: { flexDirection: 'row' },
  actionButton: {
    padding: 10,
    borderRadius: 50,
    marginLeft: 10,
  },
  recusarButton: { backgroundColor: '#991b1b' },
  confirmarButton: { backgroundColor: '#166534' },
  slotContainer: { padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 5, marginTop: 8 },
  slotTimeContainer: { width: 70, flexDirection: 'row', alignItems: 'center' },
  slotTime: { fontSize: 16, fontWeight: 'bold', marginLeft: 8, color: 'white' },
  slotDetails: { flex: 1, marginLeft: 10, paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: 'rgba(255, 255, 255, 0.2)' },
  servicoNome: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  clienteNome: { color: '#E0E0E0', fontSize: 14, marginTop: 4 },
  slotAgendado: { backgroundColor: '#4d1a1a', borderColor: '#E50914' },
});
