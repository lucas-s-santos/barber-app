// Tela para dono gerenciar seus barbeiros (adicionar e remover)
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

export default function GerenciarBarbeiros() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const showAlert = useAlert();
  const [loading, setLoading] = useState(true);
  const [barbearia, setBarbearia] = useState(null);
  const [barbeiros, setBarbeiros] = useState([]);
  const [convites, setConvites] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [emailConvite, setEmailConvite] = useState('');
  const [enviandoConvite, setEnviandoConvite] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        showAlert('Erro', 'Usuário não autenticado');
        return;
      }

      // Buscar barbearia do dono
      const { data: barbeariaData, error: barbeariaError } = await supabase
        .from('barbearias')
        .select('*')
        .eq('admin_id', user.id)
        .single();

      if (barbeariaError) {
        if (barbeariaError.code === 'PGRST116') {
          showAlert('Barbearia não encontrada', 'Você precisa criar uma barbearia primeiro', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        } else {
          throw barbeariaError;
        }
        return;
      }

      setBarbearia(barbeariaData);

      // Buscar barbeiros vinculados
      const { data: barbeirosData, error: barbeirosError } = await supabase
        .from('barbeiros')
        .select(
          `
          *,
          perfil:perfil_id (
            id,
            nome_completo,
            email,
            foto_url,
            telefone
          )
        `,
        )
        .eq('barbearia_id', barbeariaData.id);

      if (barbeirosError) throw barbeirosError;
      setBarbeiros(barbeirosData || []);

      // Buscar convites pendentes
      const { data: convitesData, error: convitesError } = await supabase
        .from('convites_barbeiros')
        .select('*')
        .eq('barbearia_id', barbeariaData.id)
        .eq('status', 'pendente');

      if (convitesError) throw convitesError;
      setConvites(convitesData || []);
    } catch (error) {
      showAlert('Erro', `Não foi possível carregar os dados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const enviarConvite = async () => {
    try {
      setEnviandoConvite(true);

      if (!emailConvite.trim()) {
        showAlert('Campo vazio', 'Digite o email do barbeiro');
        return;
      }
      if (!emailConvite.includes('@')) {
        showAlert('Email inválido', 'Digite um email válido');
        return;
      }

      // Adiciona direto: a função no banco promove o usuário a barbeiro
      // e cria o vínculo com a barbearia (a pessoa precisa já ter conta).
      const { error } = await supabase.rpc('vincular_barbeiro_por_email', {
        p_email: emailConvite.trim().toLowerCase(),
        p_barbearia_id: barbearia.id,
      });

      if (error) throw error;

      showAlert(
        'Barbeiro adicionado!',
        'Ele já faz parte da sua barbearia. Peça para ele entrar no app e configurar os horários de atendimento.',
      );
      setEmailConvite('');
      setModalVisible(false);
      carregarDados();
    } catch (error) {
      showAlert('Erro ao adicionar barbeiro', error.message);
    } finally {
      setEnviandoConvite(false);
    }
  };

  const removerBarbeiro = async (barbeiroId, nomeCompleto) => {
    showAlert('Confirmar Remoção', `Deseja remover ${nomeCompleto} da sua barbearia?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('barbeiros').delete().eq('id', barbeiroId);

            if (error) throw error;

            showAlert('Sucesso', 'Barbeiro removido com sucesso');
            carregarDados();
          } catch (error) {
            showAlert('Erro', `Não foi possível remover o barbeiro: ${error.message}`);
          }
        },
      },
    ]);
  };

  const cancelarConvite = async (conviteId) => {
    try {
      const { error } = await supabase
        .from('convites_barbeiros')
        .update({ status: 'cancelado' })
        .eq('id', conviteId);

      if (error) throw error;

      showAlert('Convite cancelado', 'O convite foi cancelado');
      carregarDados();
    } catch (error) {
      showAlert('Erro', `Não foi possível cancelar o convite: ${error.message}`);
    }
  };

  const renderBarbeiro = ({ item }) => {
    const perfil = item.perfil;
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.barbeiroInfo}>
          {perfil.foto_url ? (
            <Image source={{ uri: perfil.foto_url }} style={styles.foto} />
          ) : (
            <View style={[styles.fotoPlaceholder, { backgroundColor: theme.border }]}>
              <Ionicons name="person" size={30} color={theme.icon} />
            </View>
          )}
          <View style={styles.barbeiroDetalhes}>
            <Text style={[styles.nome, { color: theme.text }]}>{perfil.nome_completo}</Text>
            <Text style={[styles.email, { color: theme.textSecondary }]}>{perfil.email}</Text>
            {perfil.telefone && (
              <Text style={[styles.telefone, { color: theme.textSecondary }]}>
                {perfil.telefone}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.removerButton}
          onPress={() => removerBarbeiro(item.id, perfil.nome_completo)}
        >
          <Ionicons name="trash-outline" size={20} color="#E50914" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderConvite = ({ item }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.conviteInfo}>
        <Ionicons name="mail-outline" size={24} color={theme.primary} />
        <View style={styles.conviteDetalhes}>
          <Text style={[styles.conviteEmail, { color: theme.text }]}>{item.barbeiro_email}</Text>
          <Text style={[styles.conviteStatus, { color: theme.textSecondary }]}>
            Convite pendente
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.cancelarButton} onPress={() => cancelarConvite(item.id)}>
        <Ionicons name="close-circle-outline" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Gerenciar Barbeiros</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={28} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Barbeiros Ativos */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Barbeiros Ativos ({barbeiros.length})
          </Text>
          {barbeiros.length === 0 ? (
            <View
              style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <Ionicons name="people-outline" size={48} color={theme.icon} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Nenhum barbeiro vinculado
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Toque no + para adicionar barbeiros
              </Text>
            </View>
          ) : (
            <FlatList
              data={barbeiros}
              renderItem={renderBarbeiro}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Convites Pendentes */}
        {convites.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Convites Pendentes ({convites.length})
            </Text>
            <FlatList
              data={convites}
              renderItem={renderConvite}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Adicionar Barbeiro */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Adicionar Barbeiro</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>
              Digite o e-mail de um usuário já cadastrado no app. Ele será adicionado como barbeiro
              da sua barbearia:
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
              ]}
              value={emailConvite}
              onChangeText={setEmailConvite}
              placeholder="email@exemplo.com"
              placeholderTextColor={theme.icon}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={enviarConvite}
                disabled={enviandoConvite}
              >
                {enviandoConvite ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>Adicionar</Text>
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  barbeiroInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  foto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  fotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barbeiroDetalhes: {
    flex: 1,
  },
  nome: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    marginBottom: 2,
  },
  telefone: {
    fontSize: 13,
  },
  removerButton: {
    padding: 8,
  },
  conviteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  conviteDetalhes: {
    marginLeft: 12,
    flex: 1,
  },
  conviteEmail: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  conviteStatus: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  cancelarButton: {
    padding: 8,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 15,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
