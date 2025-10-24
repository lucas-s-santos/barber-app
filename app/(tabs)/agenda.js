// Arquivo: app/(tabs)/agenda.js (MODIFICADO COM FUNÇÃO RPC)

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { supabase } from '../../supabaseClient';

// <-- MUDANÇA 1: Cole o ID da sua barbearia aqui
const ID_DA_BARBEARIA_PRINCIPAL = '9fa53483-b3ef-4460-b5cb-2593c439733d';

const Notificacao = ({ mensagem }) => {
  if (!mensagem) return null;
  return (
    <View style={styles.notificacaoContainer}>
      <Text style={styles.notificacaoTexto}>{mensagem}</Text>
    </View>
  );
};

export default function AgendaScreen() {
  useEffect(() => {
    LocaleConfig.locales['pt-br'] = {
      monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
      monthNamesShort: ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'],
      dayNames: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
      dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
      today: 'Hoje'
    };
    LocaleConfig.defaultLocale = 'pt-br';
  }, []);

  const hoje = new Date().toISOString().split('T')[0];
  const params = useLocalSearchParams();
  const router = useRouter();

  const [servico, setServico] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [mensagemNotificacao, setMensagemNotificacao] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [horarioParaConfirmar, setHorarioParaConfirmar] = useState(null);
  const [barbeiroIdParaAgendar, setBarbeiroIdParaAgendar] = useState(null); // <-- MUDANÇA 2: Estado para o barbeiro

  useFocusEffect(
    useCallback(() => {
      // <-- MUDANÇA 3: Captura a duração do serviço vinda dos parâmetros
      if (params.servicoId && params.servicoNome && params.servicoDuracao) {
        setServico({ 
          id: params.servicoId, 
          nome: params.servicoNome,
          duracao: parseInt(params.servicoDuracao, 10) // Converte para número
        });
      }
    }, [params])
  );
  
  // <-- MUDANÇA 4: A antiga função 'gerarHorarios' foi substituída por esta
  const buscarHorariosDisponiveis = useCallback(async (dataSelecionada) => {
    if (!dataSelecionada || !servico) return;

    setLoadingHorarios(true);
    setHorariosDisponiveis([]);

    // Chama a função RPC no Supabase
    const { data, error } = await supabase.rpc('get_horarios_disponiveis', {
      p_barbearia_id: ID_DA_BARBEARIA_PRINCIPAL,
      p_data_selecionada: dataSelecionada,
      p_duracao_servico: servico.duracao
    });

    if (error) {
      Alert.alert('Erro ao buscar horários', `Ocorreu um erro no servidor: ${error.message}`);
    } else {
      // Formata os horários recebidos do banco (ex: "09:00:00" -> "09:00")
      const horariosFormatados = data.map(h => h.horario_disponivel.substring(0, 5));
      setHorariosDisponiveis(horariosFormatados);
    }
    setLoadingHorarios(false);
  }, [servico]); // A busca depende do serviço (por causa da duração)

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    // <-- MUDANÇA 5: Chama a nova função de busca
    buscarHorariosDisponiveis(day.dateString);
  };

  // <-- MUDANÇA 6: Este useEffect agora chama a nova função quando a data muda
  useEffect(() => {
    if (selectedDate) {
      buscarHorariosDisponiveis(selectedDate);
    }
  }, [selectedDate, buscarHorariosDisponiveis]);

  const abrirModalConfirmacao = (horario) => {
    setHorarioParaConfirmar(horario);
    setModalVisible(true);
  };

  const agendarHorario = async () => {
    // <-- MUDANÇA 7: Lógica de agendamento atualizada
    if (!horarioParaConfirmar || !servico || !selectedDate) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert("Erro", "Você precisa estar logado para agendar.");
      return;
    }

    // Por enquanto, vamos pegar o PRIMEIRO barbeiro disponível da barbearia.
    // No futuro, podemos deixar o cliente escolher.
    const { data: barbeiroData, error: barbeiroError } = await supabase
        .from('barbeiros')
        .select('id')
        .eq('barbearia_id', ID_DA_BARBEARIA_PRINCIPAL)
        .limit(1)
        .single();
    
    if (barbeiroError || !barbeiroData) {
        Alert.alert("Erro", "Nenhum barbeiro encontrado para esta barbearia.");
        return;
    }

    const dataHoraAgendamento = `${selectedDate}T${horarioParaConfirmar}:00Z`;
    
    const { error } = await supabase.from('agendamentos').insert({
      cliente_id: user.id, // Nome da coluna corrigido
      servico_id: servico.id, 
      barbeiro_id: barbeiroData.id, // ID do barbeiro obtido
      data_agendamento: dataHoraAgendamento,
    });

    setModalVisible(false);
    if (error) {
      Alert.alert("Erro ao agendar", error.message);
    } else {
      const mensagem = `Agendamento para '${servico.nome}' confirmado!`;
      setMensagemNotificacao(mensagem);
      setTimeout(() => setMensagemNotificacao(''), 3000);
      buscarHorariosDisponiveis(selectedDate); // Atualiza a lista de horários
    }
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
      <Notificacao mensagem={mensagemNotificacao} />
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Confirmar Agendamento</Text>
            <Text style={styles.modalText}>
              Serviço: <Text style={{fontWeight: 'bold'}}>{servico.nome}</Text>{'\n'}
              Data: <Text style={{fontWeight: 'bold'}}>{selectedDate}</Text> às <Text style={{fontWeight: 'bold'}}>{horarioParaConfirmar}</Text>
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={agendarHorario}>
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Text style={styles.servicoInfo}>Agendando: {servico.nome} ({servico.duracao} min)</Text>
      <Calendar
        onDayPress={onDayPress}
        markedDates={{ [selectedDate]: { selected: true, selectedColor: '#E50914' } }}
        minDate={hoje}
        theme={{
          backgroundColor: '#121212', calendarBackground: '#121212', textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#E50914', selectedDayTextColor: '#ffffff', todayTextColor: '#E50914',
          dayTextColor: '#d9e1e8', textDisabledColor: '#2d4150', arrowColor: '#E50914', monthTextColor: 'white',
        }}
        style={{ borderWidth: 1, borderColor: 'gray', height: 350 }}
      />
      
      {selectedDate ? (
        <View style={styles.horariosContainer}>
          <Text style={styles.horariosTitle}>Horários disponíveis para {selectedDate}</Text>
          {loadingHorarios ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <FlatList
              data={horariosDisponiveis}
              keyExtractor={(item) => item}
              numColumns={4}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.horarioButton} onPress={() => abrirModalConfirmacao(item)}>
                  <Text style={styles.horarioText}>{item}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.placeholderText}>Nenhum horário disponível para este dia.</Text>}
            />
          )}
        </View>
      ) : (
        <Text style={styles.placeholderText}>Selecione uma data no calendário para ver os horários</Text>
      )}
    </View>
  );
}

// Mantenha todos os seus estilos aqui...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  containerCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212', padding: 20 },
  placeholderText: { color: 'gray', textAlign: 'center', marginTop: 50, fontSize: 16 },
  horariosContainer: { flex: 1, padding: 10 },
  horariosTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginVertical: 15, textAlign: 'center' },
  horarioButton: { backgroundColor: '#333', padding: 10, borderRadius: 5, margin: 5, flex: 1, alignItems: 'center' },
  horarioText: { color: 'white', fontSize: 16 },
  notificacaoContainer: { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: '#34D399', padding: 15, borderRadius: 10, zIndex: 1000, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  notificacaoTexto: { color: 'white', fontWeight: 'bold', fontSize: 16 },
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
  servicoInfo: { color: 'white', fontSize: 18, fontWeight: 'bold', textAlign: 'center', padding: 15, backgroundColor: '#1E1E1E' },
});
