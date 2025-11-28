// Arquivo: app/(tabs)/editar-perfil.js (VERSÃO COM BOTÃO DE VOLTAR CORRIGIDO)

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router'; // Importe o Stack
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';

import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

export default function EditarPerfilScreen() {
  const router = useRouter();
  const showAlert = useAlert();
  const { theme } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [dataNascimento, setDataNascimento] = useState('');

  // ... (toda a sua lógica de getProfile, updateProfile, pickImage, etc. permanece a mesma)
  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Nenhum usuário logado.');

      const { data, error, status } = await supabase
        .from('perfis')
        .select(`nome_completo, telefone, foto_base64, papel, data_nascimento`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) throw error;

      if (data) {
        setNomeCompleto(data.nome_completo);
        setTelefone(data.telefone);
        setAvatarUrl(data.foto_base64);
        setUserRole(data.papel);

        if (data.data_nascimento) {
          const [ano, mes, dia] = data.data_nascimento.split('-');
          setDataNascimento(`${dia}/${mes}/${ano}`);
        }

        if (data.papel === 'barbeiro') {
          const { data: portfolioData, error: portfolioError } = await supabase
            .from('portfolio_barbeiro')
            .select('id, foto_base64')
            .eq('barbeiro_id', user.id);

          if (portfolioError) throw portfolioError;
          setPortfolio(portfolioData || []);
        }
      }
    } catch (error) {
      showAlert('Erro ao buscar perfil', error.message);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  async function updateProfile() {
    try {
      setSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Nenhum usuário logado.');

      let dataFormatadaParaSupabase = null;
      if (dataNascimento) {
        const partesData = dataNascimento.split('/');
        if (partesData.length !== 3 || partesData[2].length !== 4) {
          showAlert(
            'Data Inválida',
            'Por favor, insira uma data de nascimento válida no formato DD/MM/YYYY.',
          );
          setSaving(false);
          return;
        }
        dataFormatadaParaSupabase = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;
      }

      const updates = {
        id: user.id,
        email: user.email,
        nome_completo: nomeCompleto,
        telefone,
        foto_base64: avatarUrl,
        data_nascimento: dataFormatadaParaSupabase,
      };

      const { error } = await supabase.from('perfis').upsert(updates);
      if (error) throw error;
      showAlert('Sucesso', 'Perfil atualizado!', [{ text: 'OK' }]);
    } catch (error) {
      showAlert('Erro ao atualizar perfil', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function pickImage(isAvatar) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      const base64 = result.assets[0].base64;
      if (isAvatar) {
        setAvatarUrl(base64);
      } else {
        uploadPortfolioPhoto(base64);
      }
    }
  }
  async function uploadPortfolioPhoto(base64) {
    try {
      setSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Nenhum usuário logado.');
      const { data, error } = await supabase
        .from('portfolio_barbeiro')
        .insert({ barbeiro_id: user.id, foto_base64: base64 })
        .select();
      if (error) throw error;
      setPortfolio((prev) => [...prev, ...data]);
      showAlert('Sucesso', 'Foto adicionada ao portfólio!');
    } catch (_error) {
      showAlert('Erro', 'Não foi possível adicionar a foto ao portfólio.');
    } finally {
      setSaving(false);
    }
  }
  async function deletePortfolioPhoto(photoId) {
    showAlert('Confirmar Exclusão', 'Tem certeza que deseja remover esta foto do seu portfólio?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            const { error } = await supabase.from('portfolio_barbeiro').delete().eq('id', photoId);
            if (error) throw error;
            setPortfolio((prev) => prev.filter((p) => p.id !== photoId));
            showAlert('Sucesso', 'Foto removida.');
          } catch (_error) {
            showAlert('Erro', 'Não foi possível remover a foto.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* ======================================================================== */}
      {/* <<< A CORREÇÃO ESTÁ AQUI: USANDO STACK.SCREEN E router.push >>> */}
      {/* ======================================================================== */}
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Editar Perfil</Text>
      </View>

      {/* O resto do seu código JSX permanece o mesmo */}
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={() => pickImage(true)}>
          {avatarUrl ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${avatarUrl}` }}
              style={[styles.avatar, { borderColor: theme.primary }]}
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Ionicons name="camera-outline" size={40} color={theme.subtext} />
            </View>
          )}
          <Text style={[styles.changeAvatarText, { color: theme.primary }]}>
            Alterar Foto de Perfil
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: theme.subtext }]}>Nome Completo</Text>
        <MaskedTextInput
          style={[
            styles.input,
            { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
          ]}
          value={nomeCompleto}
          onChangeText={setNomeCompleto}
        />

        <Text style={[styles.label, { color: theme.subtext }]}>Data de Nascimento</Text>
        <MaskedTextInput
          mask="99/99/9999"
          onChangeText={(text) => setDataNascimento(text)}
          value={dataNascimento}
          style={[
            styles.input,
            { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
          ]}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: theme.subtext }]}>Telefone</Text>
        <MaskedTextInput
          style={[
            styles.input,
            { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
          ]}
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.primary }]}
        onPress={updateProfile}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={theme.background} />
        ) : (
          <Text style={[styles.saveButtonText, { color: theme.background }]}>
            Salvar Alterações
          </Text>
        )}
      </TouchableOpacity>

      {userRole === 'barbeiro' && (
        <View style={styles.portfolioSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Meu Portfólio</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => pickImage(false)}
          >
            <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
            <Text style={[styles.addButtonText, { color: theme.primary }]}>Adicionar Foto</Text>
          </TouchableOpacity>
          {portfolio.length === 0 ? (
            <Text style={[styles.emptyPortfolioText, { color: theme.subtext }]}>
              Seu portfólio está vazio.
            </Text>
          ) : (
            <View style={styles.portfolioGrid}>
              {portfolio.map((photo) => (
                <View key={photo.id} style={styles.portfolioImageContainer}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${photo.foto_base64}` }}
                    style={styles.portfolioImage}
                  />
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deletePortfolioPhoto(photo.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 50, paddingHorizontal: 20 },
  header: {
    paddingTop: 60,
    paddingBottom: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  backButton: { position: 'absolute', left: 15, top: 58, padding: 5, zIndex: 1 },
  avatarContainer: { alignItems: 'center', marginVertical: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3 },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeAvatarText: { marginTop: 10, fontWeight: 'bold', fontSize: 16 },
  form: { marginBottom: 30 },
  label: { fontSize: 14, marginBottom: 8, marginLeft: 5 },
  input: {
    height: 58,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
  },
  saveButton: { padding: 18, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { fontWeight: '700', fontSize: 16 },
  portfolioSection: { marginTop: 40, borderTopWidth: 1, borderTopColor: '#30363D', paddingTop: 30 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  addButton: {
    flexDirection: 'row',
    borderWidth: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  addButtonText: { fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  emptyPortfolioText: { textAlign: 'center', fontStyle: 'italic' },
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 10 },
  portfolioImageContainer: { width: '31%', aspectRatio: 1, position: 'relative' },
  portfolioImage: { width: '100%', height: '100%', borderRadius: 10 },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
