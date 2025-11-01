// Arquivo: app/(tabs)/editar-perfil.js (SEM NENHUMA IMAGEM PLACEHOLDER)

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabaseClient';

// <<< REMOVIDO QUALQUER IMPORT DE IMAGEM DAQUI >>>

export default function EditarPerfilScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [userRole, setUserRole] = useState(null);

  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nenhum usuário logado.');

      const { data, error, status } = await supabase
        .from('perfis')
        .select(`nome_completo, telefone, foto_base64, papel`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) throw error;

      if (data) {
        setNomeCompleto(data.nome_completo);
        setTelefone(data.telefone);
        setAvatarUrl(data.foto_base64);
        setUserRole(data.papel);

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
      Alert.alert('Erro ao buscar perfil', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  // ... (O resto das funções continua igual)
  async function updateProfile() {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nenhum usuário logado.');
      const updates = { id: user.id, nome_completo: nomeCompleto, telefone, foto_base64: avatarUrl, updated_at: new Date() };
      const { error } = await supabase.from('perfis').upsert(updates);
      if (error) throw error;
      Alert.alert('Sucesso', 'Perfil atualizado!');
    } catch (error) {
      Alert.alert('Erro ao atualizar perfil', error.message);
    } finally {
      setSaving(false);
    }
  }
  async function pickImage(isAvatar) {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true });
    if (!result.canceled) {
      const base64 = result.assets[0].base64;
      if (isAvatar) { setAvatarUrl(base64); } else { uploadPortfolioPhoto(base64); }
    }
  }
  async function uploadPortfolioPhoto(base64) {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nenhum usuário logado.');
      const { data, error } = await supabase.from('portfolio_barbeiro').insert({ barbeiro_id: user.id, foto_base64: base64 }).select();
      if (error) throw error;
      setPortfolio(prev => [...prev, ...data]);
      Alert.alert('Sucesso', 'Foto adicionada ao portfólio!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar a foto ao portfólio.');
    } finally {
      setSaving(false);
    }
  }
  async function deletePortfolioPhoto(photoId) {
    Alert.alert("Confirmar Exclusão", "Tem certeza que deseja remover esta foto do seu portfólio?",
      [{ text: "Cancelar", style: "cancel" }, { text: "Excluir", style: "destructive", onPress: async () => {
        try {
          setSaving(true);
          const { error } = await supabase.from('portfolio_barbeiro').delete().eq('id', photoId);
          if (error) throw error;
          setPortfolio(prev => prev.filter(p => p.id !== photoId));
          Alert.alert('Sucesso', 'Foto removida.');
        } catch (error) {
          Alert.alert('Erro', 'Não foi possível remover a foto.');
        } finally {
          setSaving(false);
        }
      }}]
    );
  }

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E50914" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.title}>Editar Perfil</Text>

      <View style={styles.avatarContainer}>
        {/* <<< A MUDANÇA FINAL: SÓ RENDERIZA A IMAGEM SE ELA EXISTIR >>> */}
        {avatarUrl ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${avatarUrl}` }}
            style={styles.avatar}
          />
        ) : (
          // Se não houver avatar, mostra um círculo cinza
          <View style={styles.avatar} />
        )}
        <TouchableOpacity onPress={() => pickImage(true)}>
          <Text style={styles.changeAvatarText}>Alterar Foto de Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* O resto do JSX continua igual */}
      <Text style={styles.label}>Nome Completo</Text>
      <TextInput style={styles.input} value={nomeCompleto} onChangeText={setNomeCompleto} placeholder="Seu nome completo" placeholderTextColor="#888" />
      <Text style={styles.label}>Telefone</Text>
      <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} placeholder="Seu telefone" placeholderTextColor="#888" keyboardType="phone-pad" />
      <TouchableOpacity style={styles.saveButton} onPress={updateProfile} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Salvando...' : 'Salvar Alterações do Perfil'}</Text>
      </TouchableOpacity>
      {userRole === 'barbeiro' && (
        <View style={styles.portfolioSection}>
          <Text style={styles.sectionTitle}>Meu Portfólio</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => pickImage(false)}>
            <Ionicons name="add-circle-outline" size={24} color="#333" />
            <Text style={styles.addButtonText}>Adicionar Foto</Text>
          </TouchableOpacity>
          {portfolio.length === 0 ? (
            <Text style={styles.emptyPortfolioText}>Seu portfólio está vazio. Adicione fotos dos seus melhores cortes!</Text>
          ) : (
            <View style={styles.portfolioGrid}>
              {portfolio.map(photo => (
                <View key={photo.id} style={styles.portfolioImageContainer}>
                  <Image source={{ uri: `data:image/jpeg;base64,${photo.foto_base64}` }} style={styles.portfolioImage} />
                  <TouchableOpacity style={styles.deleteButton} onPress={() => deletePortfolioPhoto(photo.id)}>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  backButton: { position: 'absolute', top: 40, left: 20, zIndex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', marginTop: 80, marginBottom: 30 },
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#333' },
  changeAvatarText: { color: '#E50914', marginTop: 10, fontWeight: 'bold' },
  label: { color: 'white', fontSize: 16, marginBottom: 5, marginLeft: 5 },
  input: { backgroundColor: '#333', color: 'white', padding: 15, borderRadius: 5, marginBottom: 20, fontSize: 16 },
  saveButton: { backgroundColor: '#E50914', padding: 15, borderRadius: 5, alignItems: 'center' },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  portfolioSection: { marginTop: 40, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 20 },
  addButton: { flexDirection: 'row', backgroundColor: '#f0c14b', padding: 15, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  addButtonText: { color: '#333', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  emptyPortfolioText: { color: 'gray', textAlign: 'center', fontStyle: 'italic' },
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  portfolioImageContainer: { width: '48%', marginBottom: 10, position: 'relative' },
  portfolioImage: { width: '100%', height: 150, borderRadius: 10, backgroundColor: '#333' },
  deleteButton: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
});
