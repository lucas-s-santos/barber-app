import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// 1. Importar o hook useAlert
import { useAlert } from '../../contexts/AlertContext';
import { supabase } from '../../supabaseClient';

export default function CadastroScreen() {
  const router = useRouter();
  // 2. Inicializar o hook
  const showAlert = useAlert();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!nomeCompleto || !email || !password) {
      showAlert("Campos Obrigatórios", "Por favor, preencha nome, email e senha.", [{ text: 'OK' }]);
      return;
    }
    setLoading(true);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          nome_completo: nomeCompleto,
          telefone: telefone,
        }
      }
    });

    if (signUpError) {
      // 3. Substituir o Alert.alert
      showAlert("Erro no Cadastro", signUpError.message, [{ text: 'OK' }]);
      setLoading(false);
      return;
    }

    if (signUpData.user) {
      // 4. Substituir o Alert.alert de sucesso
      showAlert(
        "Cadastro Realizado!",
        "Sua conta foi criada com sucesso. Verifique seu e-mail para confirmar e depois faça o login.",
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Image source={require('../../assets/images/logo.jpg')} style={styles.logo} />
        <Text style={styles.title}>Crie sua Conta</Text>
        <TextInput style={styles.input} placeholder="Nome Completo" placeholderTextColor="#888" value={nomeCompleto} onChangeText={setNomeCompleto} />
        <TextInput style={styles.input} placeholder="Telefone (opcional)" placeholderTextColor="#888" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="Senha (mínimo 6 caracteres)" placeholderTextColor="#888" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Cadastrar</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#121212', padding: 20, justifyContent: 'center' },
  logo: { width: 100, height: 100, resizeMode: 'contain', alignSelf: 'center', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#1E1E1E', color: 'white', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#E50914', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  backButton: { position: 'absolute', top: 60, left: 20, zIndex: 1 },
});
