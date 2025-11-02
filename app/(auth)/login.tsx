// Arquivo: app/(auth)/login.js (Com o novo design "Neon Blade" / "Cyber Sky")

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

export default function LoginScreen() {
  const router = useRouter();
  const showAlert = useAlert();
  const { theme } = useAppTheme(); // <<< 1. Pegamos as cores do tema ativo

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    if (!email || !password) {
      showAlert("Atenção", "Por favor, preencha seu email e senha.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) {
      showAlert("Erro no Login", "Email ou senha inválidos. Por favor, tente novamente.");
    }
    // Se o login for bem-sucedido, o onAuthStateChange no _layout.js cuidará do redirecionamento.
    setLoading(false);
  }

  return (
    // KeyboardAvoidingView ajuda a tela a não ser coberta pelo teclado
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]} // <<< 2. Aplicamos a cor de fundo do tema
    >
      <View style={styles.header}>
        <Ionicons name="cut-outline" size={60} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>BarberApp</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>Bem-vindo de volta!</Text>
      </View>

      <View style={styles.form}>
        <TextInput 
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
          placeholder="Email" 
          placeholderTextColor={theme.subtext} 
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none" 
          keyboardType="email-address" 
        />
        <TextInput 
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} 
          placeholder="Senha" 
          placeholderTextColor={theme.subtext} 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
        />
        
        {/* Botão Principal com o novo estilo */}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.primary }]} 
          onPress={signInWithEmail} 
          disabled={loading}
        >
          {loading 
            ? <ActivityIndicator color={theme.background} /> 
            : <Text style={[styles.buttonText, { color: theme.background }]}>Entrar</Text>
          }
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/(auth)/cadastro')}>
        <Text style={[styles.linkText, { color: theme.subtext }]}>
          Não tem uma conta? <Text style={{ fontWeight: 'bold', color: theme.primary }}>Cadastre-se</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

// Estilos completamente refeitos para o novo design
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 5,
  },
  form: {
    width: '100%',
  },
  input: {
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 30,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
  },
});
