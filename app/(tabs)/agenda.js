// Arquivo: app/(tabs)/agenda.js
// Fluxo de agendamento ISOLADO POR BARBEARIA (multi-tenant):
// 1) Escolhe o serviço (do catálogo daquela barbearia)
// 2) Escolhe o barbeiro (que trabalha naquela barbearia)
// 3) Escolhe a data
// 4) Escolhe o horário (calculado pela RPC get_horarios_disponiveis)
// Recebe ?barbearia_id=... vindo da tela de detalhes da barbearia.

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

// Configuração do calendário para português
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

export default function AgendaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useAppTheme();
  const showAlert = useAlert();
  const hoje = new Date().toISOString().split('T')[0];

  const barbeariaId = params.barbearia_id || params.barbeariaId || null;

  // Dados da barbearia
  const [servicos, setServicos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [loadingInit, setLoadingInit] = useState(true);

  // Seleções do usuário
  const [servicoSel, setServicoSel] = useState(null);
  const [barbeiroSel, setBarbeiroSel] = useState(null);
  const [selectedDate, setSelectedDate] = useState(hoje);
  const [horarios, setHorarios] = useState([]);
  const [horarioParaConfirmar, setHorarioParaConfirmar] = useState(null);

  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Carrega serviços e barbeiros DAQUELA barbearia
  useEffect(() => {
    if (!barbeariaId) {
      setLoadingInit(false);
      return;
    }
    let ativo = true;
    (async () => {
      setLoadingInit(true);
      const [servResp, barbResp] = await Promise.all([
        supabase
          .from('servicos')
          .select('*')
          .eq('barbearia_id', barbeariaId)
          .eq('ativo', true)
          .order('preco', { ascending: true }),
        supabase
          .from('barbeiros')
          .select('id, perfis!perfil_id(nome_completo, foto_url)')
          .eq('barbearia_id', barbeariaId),
      ]);
      if (!ativo) return;
      if (servResp.error) showAlert('Erro', 'Não foi possível carregar os serviços.');
      if (barbResp.error) showAlert('Erro', 'Não foi possível carregar os barbeiros.');
      const listaServ = servResp.data || [];
      const listaBarb = barbResp.data || [];
      setServicos(listaServ);
      setBarbeiros(listaBarb);
      if (listaServ.length > 0) setServicoSel(listaServ[0]);
      if (listaBarb.length > 0) setBarbeiroSel(listaBarb[0]);
      setLoadingInit(false);
    })();
    return () => {
      ativo = false;
    };
  }, [barbeariaId, showAlert]);

  // Busca horários disponíveis sempre que data/serviço/barbeiro mudam
  useEffect(() => {
    const gerarHorarios = async () => {
      if (!selectedDate || !servicoSel || !barbeiroSel) return;
      setLoadingHorarios(true);
      setHorarios([]);
      const { data, error } = await supabase.rpc('get_horarios_disponiveis', {
        p_barbeiro_id: barbeiroSel.id, // barbeiros.id
        p_data: selectedDate,
        p_duracao_servico_param: servicoSel.duracao_minutos || 30,
      });
      if (error) showAlert('Erro', `Não foi possível buscar os horários: ${error.message}`);
      else setHorarios(data || []);
      setLoadingHorarios(false);
    };
    gerarHorarios();
  }, [selectedDate, barbeiroSel, servicoSel, showAlert]);

  const handleAgendar = async () => {
    if (!horarioParaConfirmar || !servicoSel || !barbeiroSel) return;
    setSalvando(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSalvando(false);
      showAlert('Erro', 'Você precisa estar logado para agendar.');
      return;
    }
    const dataHoraAgendamento = `${selectedDate}T${horarioParaConfirmar}`;
    const { error } = await supabase.from('agendamentos').insert({
      cliente_id: user.id,
      barbeiro_id: barbeiroSel.id, // barbeiros.id
      servico_id: servicoSel.id,
      data_agendamento: dataHoraAgendamento,
      status: 'pendente',
    });
    setSalvando(false);
    setModalVisible(false);
    if (error) {
      showAlert('Erro ao Agendar', error.message);
    } else {
      showAlert(
        'Solicitação Enviada!',
        `Seu pedido para ${servicoSel.nome} com ${nomeBarbeiro(
          barbeiroSel,
        )} foi enviado. Aguarde a confirmação.`,
        [{ text: 'OK', onPress: () => router.push('/(tabs)/agendamentos') }],
      );
    }
  };

  const abrirModalConfirmacao = (horario) => {
    setHorarioParaConfirmar(horario);
    setModalVisible(true);
  };

  const nomeBarbeiro = (b) => b?.perfis?.nome_completo || 'Barbeiro';

  // --- Estados de erro / vazio ---
  if (!barbeariaId) {
    return (
      <View style={[styles.containerCenter, { backgroundColor: theme.background }]}>
        <Ionicons name="storefront-outline" size={60} color={theme.subtext} />
        <Text style={[styles.placeholderText, { color: theme.subtext }]}>
          Escolha uma barbearia para agendar.
        </Text>
        <TouchableOpacity
          style={[styles.placeholderButton, { backgroundColor: theme.primary }]}
          onPress={() => router.replace('/(tabs)/barbearias-lista')}
        >
          <Text style={[styles.placeholderButtonText, { color: theme.background }]}>
            Ver Barbearias
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loadingInit) {
    return (
      <View style={[styles.containerCenter, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (servicos.length === 0 || barbeiros.length === 0) {
    return (
      <View style={[styles.containerCenter, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color={theme.subtext} />
        <Text style={[styles.placeholderText, { color: theme.subtext }]}>
          {servicos.length === 0
            ? 'Esta barbearia ainda não cadastrou serviços.'
            : 'Esta barbearia ainda não tem barbeiros disponíveis.'}
        </Text>
        <TouchableOpacity
          style={[styles.placeholderButton, { backgroundColor: theme.primary }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.placeholderButtonText, { color: theme.background }]}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalView, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Confirmar Solicitação</Text>
            <Text style={[styles.modalText, { color: theme.subtext }]}>
              Serviço:{' '}
              <Text style={{ fontWeight: 'bold', color: theme.text }}>{servicoSel?.nome}</Text>
              {'\n'}
              Barbeiro:{' '}
              <Text style={{ fontWeight: 'bold', color: theme.text }}>
                {nomeBarbeiro(barbeiroSel)}
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
                disabled={salvando}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleAgendar}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: theme.background }]}>
                    Confirmar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        {/* 1. Serviço */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Escolha o Serviço</Text>
          <FlatList
            data={servicos}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 15 }}
            renderItem={({ item }) => {
              const isSelected = servicoSel?.id === item.id;
              return (
                <TouchableOpacity
                  style={[
                    styles.servicoCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isSelected && { borderColor: theme.primary },
                  ]}
                  onPress={() => setServicoSel(item)}
                >
                  <Text style={[styles.servicoNome, { color: theme.text }]} numberOfLines={1}>
                    {item.nome}
                  </Text>
                  <Text style={[styles.servicoDuracao, { color: theme.subtext }]}>
                    {item.duracao_minutos} min
                  </Text>
                  <Text style={[styles.servicoPreco, { color: theme.primary }]}>
                    {Number(item.preco).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* 2. Barbeiro */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Escolha o Barbeiro</Text>
          <FlatList
            data={barbeiros}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 15 }}
            renderItem={({ item }) => {
              const isSelected = barbeiroSel?.id === item.id;
              return (
                <TouchableOpacity
                  style={[
                    styles.barbeiroCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isSelected && { borderColor: theme.primary },
                  ]}
                  onPress={() => setBarbeiroSel(item)}
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
                    {nomeBarbeiro(item).split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* 3. Data */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Escolha a Data</Text>
          <Calendar
            style={[styles.calendario, { backgroundColor: theme.card }]}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={{ [selectedDate]: { selected: true, selectedColor: theme.primary } }}
            minDate={hoje}
            theme={{
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

        {/* 4. Horário */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text, textAlign: 'center' }]}>
            4. Escolha o Horário
          </Text>
          {loadingHorarios ? (
            <ActivityIndicator color={theme.primary} />
          ) : (
            <View style={styles.horariosGrid}>
              {horarios.length > 0 ? (
                horarios.map((horario, index) => (
                  <TouchableOpacity
                    key={`${horario.horario_disponivel}-${index}`}
                    style={[
                      styles.horarioButton,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                    onPress={() => abrirModalConfirmacao(horario.horario_disponivel)}
                  >
                    <Text style={[styles.horarioText, { color: theme.text }]}>
                      {horario.horario_disponivel}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  placeholderText: { textAlign: 'center', marginTop: 20, fontSize: 16 },
  placeholderButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 15,
    marginTop: 20,
  },
  placeholderButtonText: { fontSize: 16, fontWeight: 'bold' },

  sectionContainer: { marginBottom: 10, marginTop: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, marginBottom: 15 },

  servicoCard: {
    borderRadius: 15,
    marginHorizontal: 5,
    borderWidth: 1.5,
    paddingVertical: 15,
    paddingHorizontal: 15,
    alignItems: 'center',
    width: 140,
    justifyContent: 'center',
  },
  servicoNome: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  servicoDuracao: { fontSize: 13, marginTop: 4 },
  servicoPreco: { fontSize: 16, fontWeight: '700', marginTop: 8 },

  barbeiroCard: {
    borderRadius: 15,
    marginHorizontal: 5,
    borderWidth: 1.5,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    width: 100,
    justifyContent: 'center',
  },
  barbeiroButtonText: { fontSize: 14, fontWeight: '600', marginTop: 5 },

  calendario: { marginHorizontal: 10, borderRadius: 15, elevation: 2 },

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
  horarioText: { fontSize: 16, fontWeight: '600' },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalView: { margin: 20, borderRadius: 20, padding: 25, alignItems: 'center', width: '90%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  modalText: { marginBottom: 25, textAlign: 'center', fontSize: 16, lineHeight: 24 },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: {
    borderRadius: 15,
    paddingVertical: 12,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  modalButtonText: { fontWeight: 'bold', fontSize: 16 },
});
