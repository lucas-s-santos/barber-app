import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useAlert } from '../../contexts/AlertContext';
import { supabase } from '../../supabaseClient';

LocaleConfig.locales['pt-br'] = { monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'], dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'], dayNamesShort: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'], today: 'Hoje' };
LocaleConfig.defaultLocale = 'pt-br';

export default function PainelScreen() {
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSelecionada, setDataSelecionada] = useState(new Date().toISOString().split('T')[0]);
  const showAlert = useAlert();
  const [markedDates, setMarkedDates] = useState({});
  const [currentMonth, setCurrentMonth] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [barbeiroId, setBarbeiroId] = useState(null); // Estado para guardar o ID do barbeiro

  const fetchAgendaDoDia = useCallback(async (id, data) => {
    if (!id || !data) return;
    setLoading(true);
    const { data: agendaData, error } = await supabase.rpc('get_agenda_barbeiro', {
      p_barbeiro_id: id,
      p_data: data,
    });
    if (error) showAlert('Erro', `Não foi possível buscar a agenda do dia: ${error.message}`);
    else setAgenda(agendaData || []);
    setLoading(false);
  }, [showAlert]);

  const fetchResumoMensal = useCallback(async (id, mes, ano) => {
    if (!id) return;
    const { data: resumoData, error } = await supabase.rpc('get_resumo_mensal_agenda', {
      p_barbeiro_id: id,
      p_mes: mes,
      p_ano: ano,
    });

    if (error) {
      showAlert('Erro', `Não foi possível buscar o resumo do mês: ${error.message}`);
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
  }, [showAlert]);

  useFocusEffect(
    useCallback(() => {
      const getBarbeiroEcarregarDados = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setBarbeiroId(user.id); // Guarda o ID do usuário
          fetchResumoMensal(user.id, currentMonth.month, currentMonth.year);
          fetchAgendaDoDia(user.id, dataSelecionada);
        } else {
          setLoading(false);
        }
      };
      getBarbeiroEcarregarDados();
    }, [dataSelecionada, currentMonth, fetchAgendaDoDia, fetchResumoMensal])
  );

  // =================================================================
  // <<< MUDANÇA 1: Função para o barbeiro atualizar o status >>>
  // =================================================================
  const handleUpdateStatus = async (id, novoStatus) => {
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: novoStatus })
      .eq('id', id);
  
    if (error) {
      showAlert('Erro', `Não foi possível atualizar o agendamento: ${error.message}`);
    } else {
      showAlert('Sucesso!', `O agendamento foi ${novoStatus === 'confirmado' ? 'confirmado' : 'recusado'}.`);
      // Recarrega a agenda do dia para mostrar a mudança
      fetchAgendaDoDia(barbeiroId, dataSelecionada);
    }
  };

  const onDayPress = (day) => {
    setDataSelecionada(day.dateString);
  };

  const onMonthChange = (month) => {
    setCurrentMonth({ month: month.month, year: month.year });
  };
  
  const finalMarkedDates = useMemo(() => {
    return {
      ...markedDates,
      [dataSelecionada]: {
        ...markedDates[dataSelecionada],
        selected: true,
        selectedColor: '#E50914',
      }
    };
  }, [markedDates, dataSelecionada]);

  // =================================================================
  // <<< MUDANÇA 2: Componente de item atualizado com os botões de ação >>>
  // =================================================================
  const AgendaSlotItem = ({ item }) => {
    const getSlotStyle = () => {
      if (item.agendamento_status === 'pendente') return styles.slotPendente;
      switch (item.status) {
        case 'agendado': return styles.slotAgendado;
        case 'almoco': return styles.slotAlmoco;
        default: return styles.slotDisponivel;
      }
    };
    const getIconName = () => {
        switch (item.status) {
          case 'agendado': return 'cut-outline';
          case 'almoco': return 'restaurant-outline';
          default: return 'ellipse-outline';
        }
    };
    return (
      <View style={[styles.slotContainer, getSlotStyle()]}>
        <View style={styles.slotTimeContainer}>
          <Ionicons name={getIconName()} size={18} color={item.status === 'disponivel' ? 'gray' : 'white'} />
          <Text style={[styles.slotTime, item.status !== 'disponivel' && {color: 'white'}]}>{item.horario_inicio.substring(0, 5)}</Text>
        </View>
        <View style={styles.slotDetails}>
          {item.status === 'agendado' && (
            <>
              <Text style={styles.servicoNome}>{item.servico_nome}</Text>
              <Text style={styles.clienteNome}>Cliente: {item.cliente_nome}</Text>
              
              {/* Botões de Ação para agendamentos pendentes */}
              {item.agendamento_status === 'pendente' && (
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.confirmButton]}
                    onPress={() => handleUpdateStatus(item.agendamento_id, 'confirmado')}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Confirmar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleUpdateStatus(item.agendamento_id, 'cancelado')}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Recusar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
          {item.status === 'almoco' && <Text style={styles.statusText}>Horário de Almoço</Text>}
          {item.status === 'disponivel' && <Text style={styles.statusTextDisponivel}>Disponível</Text>}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Calendar
        current={dataSelecionada}
        onDayPress={onDayPress}
        onMonthChange={onMonthChange}
        markedDates={finalMarkedDates}
        theme={{ backgroundColor: '#121212', calendarBackground: '#121212', textSectionTitleColor: '#b6c1cd', selectedDayBackgroundColor: '#E50914', selectedDayTextColor: '#ffffff', todayTextColor: '#E50914', dayTextColor: '#d9e1e8', textDisabledColor: '#2d4150', arrowColor: '#E50914', monthTextColor: 'white', indicatorColor: 'blue', dotColor: '#E50914', textDayFontWeight: '300', textMonthFontWeight: 'bold', textDayHeaderFontWeight: '300', textDayFontSize: 16, textMonthFontSize: 16, textDayHeaderFontSize: 14 }}
      />
      
      <Text style={styles.title}>Detalhes do Dia</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#E50914" style={{marginTop: 20}} />
      ) : (
        <FlatList
          data={agenda}
          keyExtractor={(item) => item.horario_inicio}
          renderItem={AgendaSlotItem}
          ListEmptyComponent={<Text style={styles.placeholderText}>Nenhuma configuração de horário encontrada para este dia.</Text>}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

// =================================================================
// <<< MUDANÇA 3: Adicionar os novos estilos para os botões e slots pendentes >>>
// =================================================================
const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
    container: { flex: 1, backgroundColor: '#121212', paddingTop: 40 },
    title: { fontSize: 20, fontWeight: 'bold', color: 'white', textAlign: 'center', marginVertical: 15 },
    placeholderText: { color: 'gray', textAlign: 'center', marginTop: 50, fontSize: 16 },
    slotContainer: { padding: 15, marginHorizontal: 10, marginVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 5, },
    slotTimeContainer: { width: 80, flexDirection: 'row', alignItems: 'center', },
    slotTime: { fontSize: 16, fontWeight: 'bold', marginLeft: 8, },
    slotDetails: { flex: 1, marginLeft: 15, borderLeftWidth: 1, borderLeftColor: 'rgba(255, 255, 255, 0.2)', paddingLeft: 15, },
    servicoNome: { color: 'white', fontSize: 16, fontWeight: 'bold', },
    clienteNome: { color: '#E0E0E0', fontSize: 14, marginTop: 4, },
    statusText: { color: 'white', fontSize: 16, fontStyle: 'italic', },
    statusTextDisponivel: { color: 'gray', fontSize: 16, fontStyle: 'italic', },
    slotDisponivel: { backgroundColor: '#1E1E1E', borderColor: '#333', },
    slotAgendado: { backgroundColor: '#4d1a1a', borderColor: '#E50914', },
    slotAlmoco: { backgroundColor: '#544a22', borderColor: '#f59e0b', },
    // Novos Estilos
    slotPendente: {
      backgroundColor: '#544a22', // Laranja escuro
      borderColor: '#f59e0b', // Laranja
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      marginTop: 10,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 5,
      marginRight: 10,
    },
    actionButtonText: {
      color: 'white',
      marginLeft: 5,
      fontSize: 12,
      fontWeight: 'bold',
    },
    confirmButton: {
      backgroundColor: '#2E7D32', // Verde
    },
    cancelButton: {
      backgroundColor: '#C62828', // Vermelho
    },
});
