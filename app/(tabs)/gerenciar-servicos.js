// Arquivo: app/(tabs)/gerenciar-servicos.js (VERSÃO COM BOTÃO DE VOLTAR CORRIGIDO)

import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router'; // Importe o Stack
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext'; // Importe o useAppTheme
import { supabase } from '../../supabaseClient';

export default function GerenciarServicosScreen() {
  const router = useRouter();
  const showAlert = useAlert();
  const { theme } = useAppTheme(); // Use o hook do tema
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [servicoAtual, setServicoAtual] = useState(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('');
  const [saving, setSaving] = useState(false);

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

  const handleAddNew = () => {
    setServicoAtual(null);
    setNome('');
    setDescricao('');
    setPreco('');
    setDuracao('');
    setModalVisible(true);
  };

  const handleEdit = (servico) => {
    setServicoAtual(servico);
    setNome(servico.nome);
    setDescricao(servico.descricao);
    setPreco(String(servico.preco));
    setDuracao(String(servico.duracao_minutos));
    setModalVisible(true);
  };

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
      const { error: updateError } = await supabase
        .from('servicos')
        .update(servicoData)
        .eq('id', servicoAtual.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('servicos').insert(servicoData);
      error = insertError;
    }

    setSaving(false);
    if (error) {
      showAlert('Erro ao Salvar', error.message);
    } else {
      setModalVisible(false);
      fetchServicos();
    }
  };

  const handleToggleAtivo = async (servico) => {
    const novoStatus = !servico.ativo;
    const { error } = await supabase
      .from('servicos')
      .update({ ativo: novoStatus })
      .eq('id', servico.id);

    if (error) {
      showAlert('Erro', `Não foi possível alterar o status do serviço: ${error.message}`);
    } else {
      fetchServicos();
    }
  };

  const ServicoItem = ({ item }) => (
    <View
      style={[
        styles.itemContainer,
        { backgroundColor: theme.card },
        !item.ativo && styles.itemInativo,
      ]}
    >
      <View style={styles.itemInfo}>
        <Text style={[styles.itemNome, { color: theme.text }]}>{item.nome}</Text>
        <Text style={[styles.itemDescricao, { color: theme.subtext }]}>
          {item.duracao_minutos} min - R$ {item.preco}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <Switch
          trackColor={{ false: '#767577', true: theme.success }}
          thumbColor={item.ativo ? theme.success : '#f4f3f4'}
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
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ======================================================================== */}
      {/* <<< A CORREÇÃO ESTÁ AQUI: USANDO STACK.SCREEN E router.push >>> */}
      {/* ======================================================================== */}
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Gerenciar Serviços</Text>
      </View>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={handleAddNew}
      >
        <Ionicons name="add-circle-outline" size={22} color={theme.background} />
        <Text style={[styles.addButtonText, { color: theme.background }]}>
          Adicionar Novo Serviço
        </Text>
      </TouchableOpacity>

      <FlatList
        data={servicos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={ServicoItem}
        ListEmptyComponent={
          <Text style={[styles.placeholderText, { color: theme.subtext }]}>
            Nenhum serviço cadastrado.
          </Text>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalView, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {servicoAtual ? 'Editar Serviço' : 'Novo Serviço'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Nome do Serviço"
              placeholderTextColor={theme.subtext}
              value={nome}
              onChangeText={setNome}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Descrição (opcional)"
              placeholderTextColor={theme.subtext}
              value={descricao}
              onChangeText={setDescricao}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Preço (ex: 40.00)"
              placeholderTextColor={theme.subtext}
              value={preco}
              onChangeText={setPreco}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
              placeholder="Duração em minutos (ex: 30)"
              placeholderTextColor={theme.subtext}
              value={duracao}
              onChangeText={setDuracao}
              keyboardType="numeric"
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.subtext }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleSaveServico}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: theme.background }]}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  backButton: { position: 'absolute', left: 20, top: 58, zIndex: 1 },
  addButton: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  addButtonText: { fontWeight: '700', fontSize: 16, marginLeft: 10 },
  itemContainer: {
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  itemInativo: { opacity: 0.5 },
  itemInfo: { flex: 1 },
  itemNome: { fontSize: 16, fontWeight: 'bold' },
  itemDescricao: { fontSize: 14, marginTop: 4 },
  itemActions: { flexDirection: 'row', alignItems: 'center' },
  editButton: { marginLeft: 15, padding: 5 },
  placeholderText: { textAlign: 'center', marginTop: 50 },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalView: { width: '90%', borderRadius: 20, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, width: '100%' },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButton: { borderRadius: 10, padding: 15, flex: 1, alignItems: 'center' },
  modalButtonText: { fontWeight: 'bold' },
});
