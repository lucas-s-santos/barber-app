// Arquivo: app/(tabs)/agenda.js (COM A CORREÇÃO FINAL DO STATUS DO AGENDAMENTO)

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Hooks personalizados
import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

// Configuração do calendário para o português
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

// ========================================================================
// COMPONENTE PRINCIPAL
// ========================================================================
export default function AgendaScreen() {
  // --- Hooks de Navegação e Contexto ---
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useAppTheme();
  const showAlert = useAlert();
  const hoje = new Date().toISOString().split('T')[0];

  // --- Estados do Componente ---
  const [servico, setServico] = useState(null);
  const [barbeiros, setBarbeiros] = useState([]);
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState(null);
  const [selectedDate, setSelectedDate] = useState(hoje);
  const [availabilityByDate, setAvailabilityByDate] = useState({});
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [horarioParaConfirmar, setHorarioParaConfirmar] = useState(null);

  const [loadingBarbeiros, setLoadingBarbeiros] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // ========================================================================
  // EFEITOS (LÓGICA DE DADOS)
  // ========================================================================

  useFocusEffect(
    useCallback(() => {
      if (params.servicoId && params.servicoNome && params.servicoDuracao) {
        setServico({
          id: params.servicoId,
          nome: params.servicoNome,
          duracao: parseInt(params.servicoDuracao, 10),
        });
      }
    }, [params]),
  );

  useEffect(() => {
    const fetchBarbeiros = async () => {
      setLoadingBarbeiros(true);
      const { data, error } = await supabase
        .from('perfis')
        .select('id, nome_completo')
        .eq('papel', 'barbeiro');
      if (error) showAlert('Erro', 'Não foi possível carregar a lista de barbeiros.');
      else {
        setBarbeiros(data || []);
        if (data && data.length > 0) {
          setBarbeiroSelecionado(data[0]);
        }
      }
      setLoadingBarbeiros(false);
    };
    fetchBarbeiros();
  }, [showAlert]);

  useEffect(() => {
    const gerarHorarios = async () => {
      if (!selectedDate || !servico || !barbeiroSelecionado) return;
      setLoadingHorarios(true);
      setHorariosDisponiveis([]);

      const { data, error } = await supabase.rpc('get_horarios_disponiveis', {
        p_barbeiro_id: barbeiroSelecionado.id,
        p_data: selectedDate,
        p_duracao_servico_param: servico.duracao,
      });

      if (error) showAlert('Erro', `Não foi possível buscar os horários: ${error.message}`);
      else setHorariosDisponiveis(data || []);
      setLoadingHorarios(false);
    };

    gerarHorarios();
  }, [selectedDate, barbeiroSelecionado, servico, showAlert]);

  const gerarRangeDatas = (inicio, dias = 14) => {
    const datas = [];
    const base = new Date(inicio);
    for (let i = 0; i <= dias; i++) {
      const dt = new Date(base);
      dt.setDate(base.getDate() + i);
      datas.push(dt.toISOString().split('T')[0]);
    }
    return datas;
  };

  const carregarDisponibilidade = useCallback(async () => {
    if (!servico || !barbeiroSelecionado) return;
    setLoadingAvailability(true);
    const datas = gerarRangeDatas(hoje, 14);

    const entradas = await Promise.all(
      datas.map(async (dataStr) => {
        const { data, error } = await supabase.rpc('get_horarios_disponiveis', {
          p_barbeiro_id: barbeiroSelecionado.id,
          p_data: dataStr,
          p_duracao_servico_param: servico.duracao,
        });

        if (error) {
          console.error('Erro ao carregar disponibilidade:', error.message);
          return [dataStr, 0];
        }
        return [dataStr, data?.length || 0];
      }),
    );

    setAvailabilityByDate(Object.fromEntries(entradas));
    setLoadingAvailability(false);
  }, [barbeiroSelecionado, hoje, servico]);

  useEffect(() => {
    setSelectedDate(hoje);
    carregarDisponibilidade();
  }, [carregarDisponibilidade, hoje, servico, barbeiroSelecionado]);

  // ========================================================================
  // FUNÇÕES DE MANIPULAÇÃO DE EVENTOS
  // ========================================================================

  const handleAgendar = async () => {
    if (!horarioParaConfirmar || !servico || !barbeiroSelecionado) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      showAlert('Erro', 'Você precisa estar logado para agendar.');
      return;
    }
    const dataHoraAgendamento = `${selectedDate}T${horarioParaConfirmar}`;

    // =================================================================
    // <<< A CORREÇÃO FINAL E DEFINITIVA ESTÁ AQUI >>>
    // Criamos um objeto com todos os dados para garantir que o status 'pendente' seja enviado.
    const novoAgendamento = {
      cliente_id: user.id,
      barbeiro_id: barbeiroSelecionado.id,
      servico_id: servico.id,
      data_agendamento: dataHoraAgendamento,
      status: 'pendente', // Forçando o status correto
    };

    const { error } = await supabase.from('agendamentos').insert(novoAgendamento);
    // =================================================================

    setModalVisible(false);
    if (error) {
      showAlert('Erro ao Agendar', error.message);
    } else {
      showAlert(
        'Solicitação Enviada!',
        `Seu pedido de horário para ${servico.nome} com ${barbeiroSelecionado.nome_completo} foi enviado. Aguarde a confirmação do barbeiro.`,
        [{ text: 'OK', onPress: () => router.push('/(tabs)/agendamentos') }],
      );
    }
  };

  const abrirModalConfirmacao = (horario) => {
    setHorarioParaConfirmar(horario);
    setModalVisible(true);
  };

  const handleDayPress = (day) => {
    const disponibilidade = availabilityByDate[day.dateString] ?? 0;
    setSelectedDate(day.dateString);
    if (disponibilidade === 0) {
      showAlert('Sem horários', 'Não há horários disponíveis para este dia.', [{ text: 'OK' }]);
    }
  };

  const isQuaseCheio = (count) => count > 0 && count <= 2;

  const verDetalhesBarbeiro = (barbeiro) => {
    if (!servico) {
      showAlert('Aguarde', 'Carregando informações do serviço...');
      return;
    }
    router.push({
      pathname: '/(tabs)/detalhes-barbeiro',
      params: {
        barbeiroId: barbeiro.id,
        servicoId: servico.id,
        servicoNome: servico.nome,
        servicoDuracao: servico.duracao,
      },
    });
  };
  const markedDates = useMemo(() => {
    const marks = {};
    Object.entries(availabilityByDate).forEach(([dataStr, count]) => {
      const isSelected = dataStr === selectedDate;
      const hasSlots = count > 0;
      marks[dataStr] = {
        selected: isSelected,
        selectedColor: hasSlots ? theme.primary : theme.border,
        selectedTextColor: hasSlots ? theme.background : theme.text,
        marked: true,
        dotColor: hasSlots ? theme.success || theme.primary : theme.subtext,
      };
    });

    if (!marks[selectedDate]) {
      marks[selectedDate] = {
        selected: true,
        selectedColor: theme.primary,
        selectedTextColor: theme.background,
      };
    }

    return marks;
  }, [availabilityByDate, selectedDate, theme]);

  // (O resto do seu código permanece exatamente o mesmo)
  // ...
  // ========================================================================
  // RENDERIZAÇÃO
  // ========================================================================

  if (!servico) {
    return (
      <View style={[styles.containerCenter, { backgroundColor: theme.background }]}>
        <Ionicons name="cut-outline" size={60} color={theme.subtext} />
        <Text style={[styles.placeholderText, { color: theme.subtext }]}>
          Escolha um serviço para começar.
        </Text>
        <TouchableOpacity
          style={[styles.placeholderButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/(tabs)/servicos')}
        >
          <Text style={[styles.placeholderButtonText, { color: theme.background }]}>
            Ver Serviços
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const disponibilidadeSelecionada = availabilityByDate[selectedDate];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalView, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Confirmar Solicitação</Text>
            <Text style={[styles.modalText, { color: theme.subtext }]}>
              Serviço: <Text style={{ fontWeight: 'bold', color: theme.text }}>{servico.nome}</Text>
              {'\n'}
              Barbeiro:{' '}
              <Text style={{ fontWeight: 'bold', color: theme.text }}>
                {barbeiroSelecionado?.nome_completo}
              </Text>
              {'\n'}
              Data: <Text style={{ fontWeight: 'bold', color: theme.text }}>
                {selectedDate}
              </Text> às{' '}
              <Text style={{ fontWeight: 'bold', color: theme.text }}>{horarioParaConfirmar}</Text>
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.subtext }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleAgendar}
              >
                <Text style={[styles.modalButtonText, { color: theme.background }]}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View
        style={[
          styles.servicoInfoContainer,
          { backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        <Text style={[styles.servicoInfo, { color: theme.text }]}>Agendando: {servico.nome}</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/servicos')}>
          <Text style={[styles.trocarButtonText, { color: theme.primary }]}>(Trocar)</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Escolha o Barbeiro</Text>
          {loadingBarbeiros ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <FlatList
              data={barbeiros}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 15 }}
              renderItem={({ item }) => {
                const isSelected = barbeiroSelecionado?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.barbeiroCard,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      isSelected && { borderColor: theme.primary },
                    ]}
                    onPress={() => setBarbeiroSelecionado(item)}
                  >
                    <Ionicons
                      name="person-circle-outline"
                      size={40}
                      color={isSelected ? theme.primary : theme.subtext}
                    />
                    <Text
                      style={[styles.barbeiroButtonText, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {item.nome_completo.split(' ')[0]}
                    </Text>

                    <TouchableOpacity
                      style={styles.detailsButton}
                      onPress={() => verDetalhesBarbeiro(item)}
                    >
                      <Text style={[styles.detailsButtonText, { color: theme.primary }]}>
                        Detalhes
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={[styles.placeholderText, { color: theme.subtext }]}>
                  Nenhum barbeiro encontrado.
                </Text>
              }
            />
          )}
        </View>

        {barbeiroSelecionado && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Escolha a Data</Text>
            <View style={styles.availabilityRow}>
              {loadingAvailability ? (
                <View style={styles.badgeInfo}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.badgeText, { color: theme.subtext }]}>Carregando...</Text>
                </View>
              ) : (
                <View style={styles.badgeInfo}>
                  <View style={[styles.dot, { backgroundColor: theme.success || theme.primary }]} />
                  <Text style={[styles.badgeText, { color: theme.text }]}>
                    {disponibilidadeSelecionada > 0
                      ? `${disponibilidadeSelecionada} horário(s) disponível(is)`
                      : 'Sem horários neste dia'}
                  </Text>
                  {isQuaseCheio(disponibilidadeSelecionada || 0) && (
                    <View style={[styles.pill, { backgroundColor: theme.warning || '#f5a524' }]}>
                      <Text style={[styles.pillText, { color: theme.background }]}>
                        Quase cheio
                      </Text>
                    </View>
                  )}
                </View>
              )}
              <View style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: theme.success || theme.primary }]} />
                <Text style={[styles.legendText, { color: theme.subtext }]}>Disponível</Text>
                <View style={[styles.dot, { backgroundColor: theme.subtext }]} />
                <Text style={[styles.legendText, { color: theme.subtext }]}>Indisponível</Text>
              </View>
            </View>
            <Calendar
              style={[styles.calendario, { backgroundColor: theme.card }]}
              onDayPress={handleDayPress}
              markedDates={markedDates}
              minDate={hoje}
              markingType="dot"
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
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: 'bold',
              }}
            />
          </View>
        )}

        {selectedDate && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text, textAlign: 'center' }]}>
              3. Escolha o Horário
            </Text>
            {loadingHorarios ? (
              <View style={styles.horariosGrid}>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <View
                    key={`skeleton-${idx}`}
                    style={[styles.horarioButton, styles.horarioSkeleton]}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.horariosGrid}>
                {horariosDisponiveis.length > 0 ? (
                  horariosDisponiveis.map((horario, index) => (
                    <TouchableOpacity
                      key={`${horario.horario_disponivel}-${index}`}
                      style={[
                        styles.horarioButton,
                        { backgroundColor: theme.card, borderColor: theme.border },
                      ]}
                      onPress={() => abrirModalConfirmacao(horario.horario_disponivel)}
                    >
                      <Text style={[styles.horarioText, { color: theme.text }]}>
                        {`${horario.horario_disponivel} • ${servico?.duracao || ''}min`}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={[styles.placeholderText, { color: theme.subtext }]}>
                    Nenhum horário disponível para este dia.
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ========================================================================
// ESTILOS
// ========================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  containerCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  placeholderText: { color: 'gray', textAlign: 'center', marginTop: 20, fontSize: 16 },
  placeholderButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 15,
    marginTop: 10,
  },
  placeholderButtonText: { fontSize: 16, fontWeight: 'bold' },

  servicoInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  servicoInfo: { fontSize: 18, fontWeight: 'bold' },
  trocarButtonText: { fontSize: 16, fontWeight: 'bold', marginLeft: 10 },

  sectionContainer: { marginBottom: 10, marginTop: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, marginBottom: 15 },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 10,
    gap: 10,
  },
  badgeInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgeText: { fontSize: 14, fontWeight: '600' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },

  barbeiroCard: {
    borderRadius: 15,
    marginHorizontal: 5,
    borderWidth: 1.5,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    width: 120,
    justifyContent: 'space-between',
  },
  barbeiroButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
    marginBottom: 10,
  },
  detailsButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
  },
  detailsButtonText: { fontSize: 12, fontWeight: 'bold' },

  calendario: {
    marginHorizontal: 10,
    borderRadius: 15,
    elevation: 2,
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },

  horariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  horarioButton: {
    width: '22%',
    margin: '1.5%',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  horarioSkeleton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  horarioText: { fontSize: 16, fontWeight: '600' },
  pill: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: { fontSize: 12, fontWeight: '700' },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 5,
    width: '90%',
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  modalText: { marginBottom: 25, textAlign: 'center', fontSize: 16, lineHeight: 24 },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: {
    borderRadius: 15,
    paddingVertical: 12,
    elevation: 2,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  modalButtonText: { fontWeight: 'bold', fontSize: 16 },
});
