import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabaseClient'; // Verifique o caminho

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Hook para navegação

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    // O redirecionamento para as abas já é feito pelo _layout.tsx principal!
    // Não precisamos fazer nada aqui se o login for bem-sucedido.
    if (error) Alert.alert("Erro no Login", error.message);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo.jpg')} // Verifique o caminho da sua logo
        style={styles.logo}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={signInWithEmail} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
      </TouchableOpacity>

      {/* MUDANÇA AQUI: Link para a tela de cadastro */}
      <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/(auth)/cadastro')}>
        <Text style={styles.linkText}>Não tem uma conta? <Text style={{fontWeight: 'bold'}}>Cadastre-se aqui</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

// Estilos (pode ajustar conforme seu gosto)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
    alignSelf: 'center',
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#E50914',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 30,
    alignItems: 'center',
  },
  linkText: {
    color: 'white',
    fontSize: 14,
  },
});
