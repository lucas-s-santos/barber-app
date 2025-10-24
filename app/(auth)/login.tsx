import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAlert } from '../../contexts/AlertContext'; // 1. Importar
import { supabase } from '../../supabaseClient';

export default function LoginScreen() {
  const router = useRouter();
  const showAlert = useAlert(); // 2. Inicializar
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) {
      // 3. Substituir
      showAlert("Erro no Login", error.message, [{ text: 'Tentar Novamente' }]);
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/logo.jpg')} style={styles.logo} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#888" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={signInWithEmail} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Entrar</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/(auth)/cadastro')}>
        <Text style={styles.linkText}>Não tem uma conta? <Text style={{ fontWeight: 'bold' }}>Cadastre-se</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20, justifyContent: 'center' },
  logo: { width: 150, height: 150, resizeMode: 'contain', marginBottom: 20, alignSelf: 'center' },
  input: { backgroundColor: '#1E1E1E', color: 'white', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#E50914', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  linkButton: { marginTop: 25, alignItems: 'center' },
  linkText: { color: 'gray', fontSize: 16 },
});
