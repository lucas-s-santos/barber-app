import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
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

  const fetchAgendaDoDia = useCallback(async (barbeiroId, data) => {
    setLoading(true);
    const { data: agendaData, error } = await supabase.rpc('get_agenda_barbeiro', {
      p_barbeiro_id: barbeiroId,
      p_data: data,
    });
    if (error) showAlert('Erro', `Não foi possível buscar a agenda do dia: ${error.message}`);
    else setAgenda(agendaData || []);
    setLoading(false);
  }, [showAlert]);

  const fetchResumoMensal = useCallback(async (barbeiroId, mes, ano) => {
    const { data: resumoData, error } = await supabase.rpc('get_resumo_mensal_agenda', {
      p_barbeiro_id: barbeiroId,
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
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // =================================================================
          // <<< A CORREÇÃO DEFINITIVA ESTÁ AQUI >>>
          // Corrigido o erro de digitação de 'fetchResumoMensal' para 'fetchResumoMensal'
          // =================================================================
          fetchResumoMensal(user.id, currentMonth.month, currentMonth.year);
          fetchAgendaDoDia(user.id, dataSelecionada);
        } else {
          setLoading(false);
        }
      };
      getBarbeiroEcarregarDados();
    }, [dataSelecionada, currentMonth, fetchAgendaDoDia, fetchResumoMensal])
  );

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

  const AgendaSlotItem = ({ item }) => {
    const getSlotStyle = () => {
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
          {item.status === 'agendado' && (<><Text style={styles.servicoNome}>{item.servico_nome}</Text><Text style={styles.clienteNome}>Cliente: {item.cliente_nome}</Text></>)}
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
        theme={{
            backgroundColor: '#121212',
            calendarBackground: '#121212',
            textSectionTitleColor: '#b6c1cd',
            selectedDayBackgroundColor: '#E50914',
            selectedDayTextColor: '#ffffff',
            todayTextColor: '#E50914',
            dayTextColor: '#d9e1e8',
            textDisabledColor: '#2d4150',
            arrowColor: '#E50914',
            monthTextColor: 'white',
            indicatorColor: 'blue',
            dotColor: '#E50914',
            textDayFontWeight: '300',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '300',
            textDayFontSize: 16,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 14
        }}
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
});
