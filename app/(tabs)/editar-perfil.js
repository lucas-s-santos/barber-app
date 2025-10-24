import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabaseClient';

// =================================================================
// 1. IMPORTE O HOOK 'useAlert' DO SEU CONTEXTO
import { useAlert } from '../../contexts/AlertContext';
// =================================================================

export default function EditarPerfilScreen() {
  const router = useRouter();
  // =================================================================
  // 2. INICIALIZE O HOOK PARA PODER CHAMAR OS ALERTAS
  const showAlert = useAlert();
  // =================================================================

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [nomeCompleto, setNomeCompleto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [fotoBase64, setFotoBase64] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
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
      setFotoBase64(profileData.foto_base64);
    }
    setLoading(false);
  }, []);

  useFocusEffect(fetchProfile);

  const handleChoosePhoto = async () => {
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
      setFotoBase64(result.assets[0].base64);
    }
  };

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
        foto_base64: fotoBase64,
      });

    setSaving(false);

    if (error) {
      console.error("Erro do Supabase:", error);
      // =================================================================
      // 3. SUBSTITUA O ALERTA DE ERRO ANTIGO PELO NOVO
      showAlert("Erro ao Salvar", `Ocorreu um problema: ${error.message}.`, [{ text: 'Entendi' }]);
      // =================================================================
    } else {
      // =================================================================
      // 4. SUBSTITUA O ALERTA DE SUCESSO ANTIGO PELO NOVO
      showAlert(
        "Sucesso!", 
        "Seu perfil foi atualizado.",
        [{ text: 'OK', onPress: () => router.back() }]
      );
      // =================================================================
    }
  };
  
  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E50914" /></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Editar Perfil</Text>
        <View style={styles.formContainer}>
          <TouchableOpacity onPress={handleChoosePhoto} style={styles.avatarContainer}>
            {fotoBase64 ? (
              <Image source={{ uri: `data:image/jpeg;base64,${fotoBase64}` }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera-outline" size={40} color="#888" />
              </View>
            )}
            <Text style={styles.avatarText}>Alterar Foto</Text>
          </TouchableOpacity>
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput style={styles.input} value={nomeCompleto} onChangeText={setNomeCompleto} />
          <Text style={styles.label}>Telefone</Text>
          <TextInput style={styles.input} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
          <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="black" /> : <Text style={styles.saveButtonText}>Salvar Alterações</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', marginTop: 60, marginBottom: 20 },
  formContainer: { width: '100%', alignItems: 'center' },
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#333' },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1E1E1E', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#34D399', marginTop: 10, fontSize: 16 },
  label: { fontSize: 14, color: 'gray', marginBottom: 5, marginLeft: 5, alignSelf: 'flex-start' },
  input: { backgroundColor: '#1E1E1E', color: 'white', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#333', width: '100%' },
  saveButton: { backgroundColor: '#34D399', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, width: '100%' },
  saveButtonText: { color: 'black', fontWeight: '700', fontSize: 16 },
  backButton: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 60, left: 20, zIndex: 1 },
  backButtonText: { color: 'white', fontSize: 16, marginLeft: 10 },
});
