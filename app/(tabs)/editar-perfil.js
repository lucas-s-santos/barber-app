import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAlert } from '../../contexts/AlertContext';
import { supabase } from '../../supabaseClient';

export default function EditarPerfilScreen() {
  const router = useRouter();
  const showAlert = useAlert();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  const [nomeCompleto, setNomeCompleto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [fotoPerfilBase64, setFotoPerfilBase64] = useState(null);

  const [portfolio, setPortfolio] = useState([]);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.replace('/(auth)/login');
      return;
    }
    setUser(authUser);

    const { data: profileData } = await supabase
      .from('perfis')
      .select('nome_completo, telefone, foto_base64')
      .eq('id', authUser.id)
      .single();
      
    if (profileData) {
      setNomeCompleto(profileData.nome_completo || '');
      setTelefone(profileData.telefone || '');
      setFotoPerfilBase64(profileData.foto_base64);
    }

    const { data: portfolioData, error: portfolioError } = await supabase
      .from('portfolio_barbeiro')
      .select('id, foto_base64')
      .eq('barbeiro_id', authUser.id)
      .order('created_at', { ascending: false });

    if (portfolioError) {
      console.error("Erro ao buscar portfólio:", portfolioError);
      showAlert('Erro', `Não foi possível carregar as fotos do portfólio: ${portfolioError.message}`);
    } else {
      setPortfolio(portfolioData);
    }

    setLoading(false);
  }, [showAlert, router]);

  useFocusEffect(fetchProfileData);

  const handleChooseProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permissão Negada', 'Precisamos de acesso à sua galeria para você poder escolher uma foto.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true,
    });
    if (!result.canceled) {
      setFotoPerfilBase64(result.assets[0].base64);
    }
  };

  // <<< A MUDANÇA ESTÁ AQUI >>>
  const handleUpdateProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('perfis')
      .upsert({ 
        id: user.id,
        email: user.email, 
        nome_completo: nomeCompleto,
        telefone: telefone,
        foto_base64: fotoPerfilBase64,
      });
    setSaving(false);
    if (error) {
      showAlert("Erro ao Salvar", `Ocorreu um problema: ${error.message}.`, [{ text: 'Entendi' }]);
    } else {
      // Agora, ao clicar em OK, ele volta para a tela anterior (perfil)
      showAlert(
        "Sucesso!", 
        "Seu perfil foi atualizado.", 
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  const handleAddPortfolioPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permissão Negada', 'Precisamos de acesso à sua galeria.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.4,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setUploadingPortfolio(true);
      const { error } = await supabase
        .from('portfolio_barbeiro')
        .insert({
          barbeiro_id: user.id,
          foto_base64: result.assets[0].base64,
        });
      setUploadingPortfolio(false);

      if (error) {
        showAlert('Erro no Upload', error.message);
      } else {
        fetchProfileData();
      }
    }
  };

  const handleDeletePortfolioPhoto = (photoId) => {
    showAlert('Confirmar Exclusão', 'Tem certeza que deseja remover esta foto do seu portfólio?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sim, remover',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('portfolio_barbeiro')
            .delete()
            .eq('id', photoId);

          if (error) {
            showAlert('Erro', 'Não foi possível remover a foto.');
          } else {
            setPortfolio(prev => prev.filter(photo => photo.id !== photoId));
          }
        },
      },
    ]);
  };
  
  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E50914" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
      
      <Text style={styles.title}>Editar Perfil</Text>
      
      <View style={styles.formContainer}>
        <TouchableOpacity onPress={handleChooseProfilePhoto} style={styles.avatarContainer}>
          {fotoPerfilBase64 ? (
            <Image source={{ uri: `data:image/jpeg;base64,${fotoPerfilBase64}` }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="camera-outline" size={40} color="#888" />
            </View>
          )}
          <Text style={styles.avatarText}>Alterar Foto de Perfil</Text>
        </TouchableOpacity>
        <Text style={styles.label}>Nome Completo</Text>
        <TextInput style={styles.input} value={nomeCompleto} onChangeText={setNomeCompleto} />
        <Text style={styles.label}>Telefone</Text>
        <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
        <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile} disabled={saving}>
          {saving ? <ActivityIndicator color="black" /> : <Text style={styles.saveButtonText}>Salvar Alterações do Perfil</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.portfolioSection}>
        <Text style={styles.sectionTitle}>Meu Portfólio</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPortfolioPhoto} disabled={uploadingPortfolio}>
          {uploadingPortfolio ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={22} color="black" />
              <Text style={styles.addButtonText}>Adicionar Foto</Text>
            </>
          )}
        </TouchableOpacity>

        {portfolio.length > 0 ? (
          <FlatList
            data={portfolio}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.portfolioImageContainer}>
                <Image source={{ uri: `data:image/jpeg;base64,${item.foto_base64}` }} style={styles.portfolioImage} />
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeletePortfolioPhoto(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={{ paddingVertical: 10 }}
          />
        ) : (
          <Text style={styles.placeholderText}>Seu portfólio está vazio. Adicione fotos dos seus melhores cortes!</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212' },
  scrollContent: { paddingBottom: 40 },
  backButton: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 60, left: 20, zIndex: 1 },
  backButtonText: { color: 'white', fontSize: 16, marginLeft: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', marginTop: 60, marginBottom: 20 },
  formContainer: { width: '100%', alignItems: 'center', paddingHorizontal: 20 },
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#333' },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#34D399', marginTop: 10, fontSize: 16 },
  label: { fontSize: 14, color: 'gray', marginBottom: 5, marginLeft: 5, alignSelf: 'flex-start' },
  input: { backgroundColor: '#1E1E1E', color: 'white', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#333', width: '100%' },
  saveButton: { backgroundColor: '#34D399', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, width: '100%' },
  saveButtonText: { color: 'black', fontWeight: '700', fontSize: 16 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 30, marginHorizontal: 20 },
  portfolioSection: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 15 },
  addButton: { flexDirection: 'row', backgroundColor: '#FBBF24', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  addButtonText: { color: 'black', fontWeight: '700', fontSize: 16, marginLeft: 10 },
  placeholderText: { color: 'gray', textAlign: 'center', marginVertical: 20 },
  portfolioImageContainer: { marginRight: 15, position: 'relative' },
  portfolioImage: { width: 150, height: 150, borderRadius: 10, backgroundColor: '#333' },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
