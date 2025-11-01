import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAlert } from '../../contexts/AlertContext';
import { supabase } from '../../supabaseClient';

export default function GerenciarServicosScreen() {
  const router = useRouter();
  const showAlert = useAlert();
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para o modal de formulário
  const [modalVisible, setModalVisible] = useState(false);
  const [servicoAtual, setServicoAtual] = useState(null); // Guarda o serviço sendo editado
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('');
  const [saving, setSaving] = useState(false);

  // Busca todos os serviços, incluindo ativos e inativos
  const fetchServicos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      showAlert('Erro', `Não foi possível carregar os serviços: ${error.message}`);
    } else {
      setServicos(data);
    }
    setLoading(false);
  }, [showAlert]);

  useFocusEffect(fetchServicos);

  // Abre o modal para criar um novo serviço
  const handleAddNew = () => {
    setServicoAtual(null);
    setNome('');
    setDescricao('');
    setPreco('');
    setDuracao('');
    setModalVisible(true);
  };

  // Abre o modal para editar um serviço existente
  const handleEdit = (servico) => {
    setServicoAtual(servico);
    setNome(servico.nome);
    setDescricao(servico.descricao);
    setPreco(String(servico.preco));
    setDuracao(String(servico.duracao_minutos));
    setModalVisible(true);
  };

  // Salva (cria ou atualiza) um serviço
  const handleSaveServico = async () => {
    if (!nome || !preco || !duracao) {
      showAlert('Campos Obrigatórios', 'Nome, preço e duração são necessários.');
      return;
    }
    setSaving(true);

    const servicoData = {
      nome,
      descricao,
      preco: parseFloat(preco.replace(',', '.')),
      duracao_minutos: parseInt(duracao, 10),
    };

    let error;
    if (servicoAtual) {
      // Atualiza serviço existente
      const { error: updateError } = await supabase
        .from('servicos')
        .update(servicoData)
        .eq('id', servicoAtual.id);
      error = updateError;
    } else {
      // Cria novo serviço (por padrão, ele já será 'ativo' = true no DB)
      const { error: insertError } = await supabase
        .from('servicos')
        .insert(servicoData);
      error = insertError;
    }

    setSaving(false);
    if (error) {
      showAlert('Erro ao Salvar', error.message);
    } else {
      setModalVisible(false);
      fetchServicos(); // Atualiza a lista
    }
  };

  // Ativa ou desativa um serviço
  const handleToggleAtivo = async (servico) => {
    const novoStatus = !servico.ativo;
    const { error } = await supabase
      .from('servicos')
      .update({ ativo: novoStatus })
      .eq('id', servico.id);

    if (error) {
      showAlert('Erro', `Não foi possível alterar o status do serviço: ${error.message}`);
    } else {
      fetchServicos(); // Atualiza a lista para refletir a mudança
    }
  };

  const ServicoItem = ({ item }) => (
    <View style={[styles.itemContainer, !item.ativo && styles.itemInativo]}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNome}>{item.nome}</Text>
        <Text style={styles.itemDescricao}>{item.duracao_minutos} min - R$ {item.preco}</Text>
      </View>
      <View style={styles.itemActions}>
        <Switch
          trackColor={{ false: '#767577', true: '#2E7D32' }}
          thumbColor={item.ativo ? '#66BB6A' : '#f4f3f4'}
          onValueChange={() => handleToggleAtivo(item)}
          value={item.ativo}
        />
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editButton}>
          <Ionicons name="pencil-outline" size={24} color="#90CAF9" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E50914" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Botão de Voltar */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
        <Text style={styles.backButtonText}>Voltar ao Painel</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Gerenciar Serviços</Text>

      {/* Botão para Adicionar Novo Serviço */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
        <Ionicons name="add-circle-outline" size={22} color="black" />
        <Text style={styles.addButtonText}>Adicionar Novo Serviço</Text>
      </TouchableOpacity>

      <FlatList
        data={servicos}
        keyExtractor={(item) => item.id}
        renderItem={ServicoItem}
        ListEmptyComponent={<Text style={styles.placeholderText}>Nenhum serviço cadastrado.</Text>}
      />

      {/* Modal de Formulário */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{servicoAtual ? 'Editar Serviço' : 'Novo Serviço'}</Text>
            <TextInput style={styles.input} placeholder="Nome do Serviço" placeholderTextColor="#888" value={nome} onChangeText={setNome} />
            <TextInput style={styles.input} placeholder="Descrição (opcional)" placeholderTextColor="#888" value={descricao} onChangeText={setDescricao} />
            <TextInput style={styles.input} placeholder="Preço (ex: 40.00)" placeholderTextColor="#888" value={preco} onChangeText={setPreco} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Duração em minutos (ex: 30)" placeholderTextColor="#888" value={duracao} onChangeText={setDuracao} keyboardType="numeric" />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveServico} disabled={saving}>
                {saving ? <ActivityIndicator color="black" /> : <Text style={styles.modalButtonText}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Estilos (uma combinação de estilos que já usamos)
const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 60, left: 20, zIndex: 1 },
  backButtonText: { color: 'white', fontSize: 16, marginLeft: 10 },
  addButton: { flexDirection: 'row', backgroundColor: '#34D399', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginBottom: 20 },
  addButtonText: { color: 'black', fontWeight: '700', fontSize: 16, marginLeft: 10 },
  itemContainer: { backgroundColor: '#1E1E1E', padding: 15, marginVertical: 8, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20 },
  itemInativo: { opacity: 0.5 },
  itemInfo: { flex: 1 },
  itemNome: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  itemDescricao: { color: 'gray', fontSize: 14, marginTop: 4 },
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  editButton: { marginLeft: 15, padding: 5 },
  placeholderText: { color: 'gray', textAlign: 'center', marginTop: 50 },
  // Estilos do Modal
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
  modalView: { width: '90%', backgroundColor: '#2C2C2C', borderRadius: 20, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 20 },
  input: { backgroundColor: '#1E1E1E', color: 'white', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, width: '100%' },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 },
  modalButton: { borderRadius: 10, padding: 15, flex: 1, alignItems: 'center' },
  cancelButton: { backgroundColor: '#555', marginRight: 10 },
  saveButton: { backgroundColor: '#34D399' },
  modalButtonText: { color: 'black', fontWeight: 'bold' },
});
