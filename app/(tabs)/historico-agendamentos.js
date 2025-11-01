import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAlert } from '../../contexts/AlertContext';
import { supabase } from '../../supabaseClient';

export default function HistoricoAgendamentosScreen() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const showAlert = useAlert();

  // --- NOVOS ESTADOS PARA O MODAL DE AVALIAÇÃO ---
  const [modalVisible, setModalVisible] = useState(false);
  const [agendamentoParaAvaliar, setAgendamentoParaAvaliar] = useState(null);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [saving, setSaving] = useState(false);
  // ----------------------------------------------

  const fetchHistorico = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // A consulta agora também busca as avaliações existentes para cada agendamento
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        id,
        data_agendamento,
        status,
        barbeiro_id,
        servicos ( nome ),
        perfis:barbeiro_id ( nome_completo ),
        avaliacoes ( id ) 
      `)
      .eq('cliente_id', user.id)
      .or(`status.eq.confirmado,data_agendamento.lt.${new Date().toISOString()},status.eq.cancelado`);

    if (error) {
      showAlert("Erro ao buscar histórico", error.message, [{ text: 'OK' }]);
      setAgendamentos([]);
    } else {
      const historicoCompleto = (data || []).filter(ag => {
        const isConcluido = ag.status === 'confirmado' && new Date(ag.data_agendamento) < new Date();
        const isCancelado = ag.status === 'cancelado';
        return isConcluido || isCancelado;
      });
      historicoCompleto.sort((a, b) => new Date(b.data_agendamento) - new Date(a.data_agendamento));
      setAgendamentos(historicoCompleto);
    }
    setLoading(false);
  }, [showAlert]);

  useFocusEffect(fetchHistorico);

  // --- NOVAS FUNÇÕES PARA A AVALIAÇÃO ---
  const handleOpenModal = (agendamento) => {
    setAgendamentoParaAvaliar(agendamento);
    setNota(0);
    setComentario('');
    setModalVisible(true);
  };

  const handleSaveAvaliacao = async () => {
    if (nota === 0) {
      showAlert("Atenção", "Por favor, selecione pelo menos uma estrela.", [{ text: 'OK' }]);
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('avaliacoes').insert({
      agendamento_id: agendamentoParaAvaliar.id,
      cliente_id: user.id,
      barbeiro_id: agendamentoParaAvaliar.barbeiro_id,
      nota: nota,
      comentario: comentario,
    });

    setSaving(false);
    if (error) {
      showAlert("Erro", `Não foi possível salvar sua avaliação: ${error.message}`, [{ text: 'OK' }]);
    } else {
      showAlert("Obrigado!", "Sua avaliação foi enviada com sucesso.", [{ text: 'OK' }]);
      setModalVisible(false);
      fetchHistorico(); // Recarrega o histórico para o botão "Avaliar" sumir
    }
  };
  // ---------------------------------------

  const AgendamentoItem = ({ item }) => {
    const data = new Date(item.data_agendamento);
    const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    const nomeBarbeiro = item.perfis?.nome_completo || 'Barbeiro';
    
    const isCancelado = item.status === 'cancelado';
    const isConcluido = item.status === 'confirmado' && new Date(item.data_agendamento) < new Date();
    const jaAvaliado = item.avaliacoes.length > 0;

    const textoStatus = isCancelado ? 'Cancelado em:' : 'Realizado em:';
    const estiloContainer = isCancelado ? styles.itemCancelado : styles.itemConcluido;

    return (
      <View style={[styles.itemContainer, estiloContainer]}>
        <View style={styles.itemDetails}>
          <Text style={styles.itemServico}>{item.servicos.nome}</Text>
          <Text style={styles.itemBarbeiro}>com {nomeBarbeiro}</Text>
          <Text style={styles.itemData}>
            {textoStatus} {dataFormatada} às {horaFormatada}
          </Text>
          {/* --- NOVO BOTÃO DE AVALIAR --- */}
          {isConcluido && !jaAvaliado && (
            <TouchableOpacity style={styles.avaliarButton} onPress={() => handleOpenModal(item)}>
              <Ionicons name="star-outline" size={16} color="#FBBF24" />
              <Text style={styles.avaliarButtonText}>Avaliar Serviço</Text>
            </TouchableOpacity>
          )}
          {isConcluido && jaAvaliado && (
             <View style={styles.avaliadoContainer}>
              <Ionicons name="star" size={16} color="#34D399" />
              <Text style={styles.avaliadoText}>Você já avaliou este serviço</Text>
            </View>
          )}
          {/* ----------------------------- */}
        </View>
        {isCancelado && (
          <Ionicons name="close-circle" size={24} color="#E50914" />
        )}
      </View>
    );
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E50914" /></View>;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.replace('/(tabs)/perfil')} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
        <Text style={styles.backButtonText}>Voltar ao Perfil</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Histórico de Agendamentos</Text>
      <FlatList
        data={agendamentos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={AgendamentoItem}
        contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 80, paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.placeholderText}>Você ainda não possui agendamentos passados.</Text>}
      />

      {/* --- NOVO MODAL DE AVALIAÇÃO --- */}
      <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Avalie o Serviço</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setNota(star)}>
                  <Ionicons 
                    name={star <= nota ? 'star' : 'star-outline'} 
                    size={40} 
                    color="#FBBF24" 
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.inputComentario}
              placeholder="Deixe um comentário (opcional)"
              placeholderTextColor="#888"
              value={comentario}
              onChangeText={setComentario}
              multiline
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelModalButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelModalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveModalButton]} onPress={handleSaveAvaliacao} disabled={saving}>
                {saving ? <ActivityIndicator color="black" /> : <Text style={styles.saveModalButtonText}>Enviar Avaliação</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* --------------------------------- */}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212' },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginVertical: 20, position: 'absolute', top: 40, width: '100%' },
  itemContainer: { backgroundColor: '#1E1E1E', padding: 20, marginVertical: 8, borderRadius: 10 },
  itemConcluido: { borderColor: '#333', borderWidth: 1 },
  itemCancelado: { borderColor: '#555', borderWidth: 1, opacity: 0.7, backgroundColor: '#3a1e1e', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemDetails: { flex: 1 },
  itemServico: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  itemBarbeiro: { color: '#A0A0A0', fontSize: 14, fontStyle: 'italic', marginVertical: 4 },
  itemData: { color: 'gray', fontSize: 14, marginTop: 5 },
  placeholderText: { color: 'gray', textAlign: 'center', marginTop: 50, fontSize: 16 },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, position: 'absolute', top: 40, left: 0, zIndex: 1 },
  backButtonText: { color: 'white', fontSize: 16, marginLeft: 10 },
  
  // --- NOVOS ESTILOS ---
  avaliarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderColor: '#FBBF24',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 15,
    alignSelf: 'flex-start',
  },
  avaliarButtonText: {
    color: '#FBBF24',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  avaliadoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    opacity: 0.7,
  },
  avaliadoText: {
    color: '#34D399',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '90%',
    backgroundColor: '#2C2C2C',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 25,
  },
  inputComentario: {
    backgroundColor: '#1E1E1E',
    color: 'white',
    width: '100%',
    height: 100,
    borderRadius: 10,
    padding: 15,
    textAlignVertical: 'top',
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#555',
    marginRight: 10,
  },
  cancelModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  saveModalButton: {
    backgroundColor: '#34D399',
  },
  saveModalButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  // --------------------
});
