import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useAlert } from '../../contexts/AlertContext';
import { supabase } from '../../supabaseClient';

export default function AgendaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const showAlert = useAlert();
  const hoje = new Date().toISOString().split('T')[0];

  const [servico, setServico] = useState(null);
  const [barbeiros, setBarbeiros] = useState([]);
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [horarioParaConfirmar, setHorarioParaConfirmar] = useState(null);

  useEffect(() => {
    LocaleConfig.locales['pt-br'] = { monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'], monthNamesShort: ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'], dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'], dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], today: 'Hoje' };
    LocaleConfig.defaultLocale = 'pt-br';

    const fetchBarbeiros = async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('id, nome_completo')
        .eq('papel', 'barbeiro');

      if (error) {
        showAlert('Erro', 'Não foi possível carregar a lista de barbeiros.');
      } else {
        setBarbeiros(data);
      }
    };

    fetchBarbeiros();
  }, [showAlert]);

  useFocusEffect(useCallback(() => {
    if (params.servicoId && params.servicoNome && params.servicoDuracao) {
      setServico({ id: params.servicoId, nome: params.servicoNome, duracao: parseInt(params.servicoDuracao, 10) });
    }
  }, [params]));

  const gerarHorarios = useCallback(async (dataSelecionada) => {
    if (!dataSelecionada || !servico || !barbeiroSelecionado) return;
    setLoadingHorarios(true);
    setHorariosDisponiveis([]);

    const { data, error } = await supabase.rpc('get_horarios_disponiveis', {
      p_barbeiro_id: barbeiroSelecionado.id,
      p_data: dataSelecionada,
      p_duracao_servico: servico.duracao,
    });
    
    if (error) {
      showAlert("Erro", `Não foi possível buscar os horários: ${error.message}`);
    } else {
      const horarios = (data || []).map(item => item.horario_inicio.substring(0, 5));
      setHorariosDisponiveis(horarios);
    }
    setLoadingHorarios(false);
  }, [servico, barbeiroSelecionado, showAlert]);

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };
  
  useEffect(() => {
    if (selectedDate && barbeiroSelecionado) {
      gerarHorarios(selectedDate);
    }
  }, [selectedDate, barbeiroSelecionado, gerarHorarios]);

  const handleAgendar = async () => {
    if (!horarioParaConfirmar || !servico || !barbeiroSelecionado) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showAlert("Erro", "Você precisa estar logado para agendar.");
      return;
    }

    const dataHoraAgendamento = `${selectedDate}T${horarioParaConfirmar}:00`;
    
    // =================================================================
    // <<< ESTA É A ÚNICA MUDANÇA NESTE ARQUIVO >>>
    // Todo novo agendamento agora é criado como 'pendente'.
    // =================================================================
    const { error } = await supabase.from('agendamentos').insert({
      cliente_id: user.id,
      barbeiro_id: barbeiroSelecionado.id,
      servico_id: servico.id,
      data_agendamento: dataHoraAgendamento,
      status: 'pendente' 
    });

    setModalVisible(false);
    if (error) {
      showAlert("Erro ao Agendar", error.message);
    } else {
      showAlert("Solicitação Enviada!", `Seu pedido de agendamento foi enviado com sucesso. Aguarde a confirmação do barbeiro.`, [
        { text: 'OK', onPress: () => router.push('/(tabs)/meus-agendamentos') }
      ]);
      gerarHorarios(selectedDate);
    }
  };

  const abrirModalConfirmacao = (horario) => {
    setHorarioParaConfirmar(horario);
    setModalVisible(true);
  };

  if (!servico) {
    return (
      <View style={styles.containerCenter}>
        <Text style={styles.placeholderText}>Por favor, escolha um serviço primeiro.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/servicos')}>
          <Text style={styles.buttonText}>Ir para Serviços</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Confirmar Solicitação</Text>
            <Text style={styles.modalText}>
              Serviço: <Text style={{ fontWeight: 'bold' }}>{servico.nome}</Text>{'\n'}
              Barbeiro: <Text style={{ fontWeight: 'bold' }}>{barbeiroSelecionado?.nome_completo}</Text>{'\n'}
              Data: <Text style={{ fontWeight: 'bold' }}>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}</Text> às <Text style={{ fontWeight: 'bold' }}>{horarioParaConfirmar}</Text>
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleAgendar}>
                <Text style={styles.confirmButtonText}>Solicitar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.servicoInfoContainer}>
        <Text style={styles.servicoInfo}>Agendando: {servico.nome}</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/servicos')}>
          <Text style={styles.trocarButtonText}>(Trocar)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.selectorContainer}>
        <Text style={styles.selectorTitle}>1. Escolha o Barbeiro</Text>
        <FlatList
          data={barbeiros}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.selectorButton,
                barbeiroSelecionado?.id === item.id && styles.selectorButtonSelected
              ]}
              onPress={() => setBarbeiroSelecionado(item)}
            >
              <Text style={styles.selectorButtonText}>{item.nome_completo}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.placeholderText}>Nenhum barbeiro encontrado.</Text>}
        />
      </View>

      {barbeiroSelecionado && (
        <>
          <Text style={styles.selectorTitle}>2. Escolha a Data</Text>
          <Calendar onDayPress={onDayPress} markedDates={{ [selectedDate]: { selected: true, selectedColor: '#E50914' } }} minDate={hoje} theme={{ backgroundColor: '#121212', calendarBackground: '#121212', textSectionTitleColor: '#b6c1cd', selectedDayBackgroundColor: '#E50914', selectedDayTextColor: '#ffffff', todayTextColor: '#E50914', dayTextColor: '#d9e1e8', textDisabledColor: '#2d4150', arrowColor: '#E50914', monthTextColor: 'white' }} style={{ borderWidth: 1, borderColor: 'gray', height: 350, marginHorizontal: 10 }} />
        </>
      )}
      
      {selectedDate && (
        <View style={styles.horariosContainer}>
          <Text style={styles.horariosTitle}>3. Escolha o Horário</Text>
          {loadingHorarios ? <ActivityIndicator color="#FFF" /> : (
            <FlatList data={horariosDisponiveis} keyExtractor={(item) => item} numColumns={4} renderItem={({ item }) => (
              <TouchableOpacity style={styles.horarioButton} onPress={() => abrirModalConfirmacao(item)}>
                <Text style={styles.horarioText}>{item}</Text>
              </TouchableOpacity>
            )} ListEmptyComponent={<Text style={styles.placeholderText}>Nenhum horário disponível para este dia.</Text>} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  containerCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', padding: 20 },
  placeholderText: { color: 'gray', textAlign: 'center', marginTop: 20, fontSize: 16 },
  selectorContainer: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
  selectorTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 15, marginBottom: 10, marginTop: 10 },
  selectorButton: { backgroundColor: '#333', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, marginHorizontal: 5 },
  selectorButtonSelected: { backgroundColor: '#E50914' },
  selectorButtonText: { color: 'white', fontSize: 14 },
  horariosContainer: { flex: 1, padding: 10 },
  horariosTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginVertical: 15, textAlign: 'center' },
  horarioButton: { backgroundColor: '#333', padding: 10, borderRadius: 5, margin: 5, flex: 1, alignItems: 'center' },
  horarioText: { color: 'white', fontSize: 16 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  modalView: { margin: 20, backgroundColor: '#2C2C2C', borderRadius: 20, padding: 35, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 15 },
  modalText: { marginBottom: 25, textAlign: 'center', color: '#E0E0E0', fontSize: 16, lineHeight: 24 },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, elevation: 2, flex: 1, marginHorizontal: 5 },
  cancelButton: { backgroundColor: '#555' },
  cancelButtonText: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  confirmButton: { backgroundColor: '#E50914' },
  confirmButtonText: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  button: { backgroundColor: '#E50914', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20, width: '80%' },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  servicoInfoContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, backgroundColor: '#1E1E1E' },
  servicoInfo: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  trocarButtonText: { color: '#E50914', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
});
