import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { isBarbeariaAdmin, supabase } from '../../supabaseClient';

export default function LoginBarbeariaScreen() {
  const router = useRouter();
  const showAlert = useAlert();
  const { theme } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmailBarbearia() {
    if (!email || !password) {
      showAlert('Atenção', 'Por favor, preencha seu email e senha.');
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      showAlert('Erro no Login', 'Email ou senha inválidos. Por favor, tente novamente.', [
        { text: 'OK' },
      ]);
      setLoading(false);
      return;
    }

    if (data.user) {
      const isAdmin = await isBarbeariaAdmin(data.user.id);
      if (!isAdmin) {
        await supabase.auth.signOut();
        showAlert('Acesso Negado', 'Este login é exclusivo para administradores de barbearia.', [
          { text: 'OK' },
        ]);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.jpg')}
          style={styles.loginLogo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: theme.text }]}>Login Barbearia</Text>
        <Text style={[styles.subtitle, { color: theme.subtext, marginTop: 8 }]}>
          Acesso exclusivo para administradores
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
          ]}
          placeholder="Email"
          placeholderTextColor={theme.subtext}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
          ]}
          placeholder="Senha"
          placeholderTextColor={theme.subtext}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={signInWithEmailBarbearia}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <Text style={[styles.buttonText, { color: theme.background }]}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={[styles.backButtonText, { color: theme.subtext }]}>
          Voltar para Login Cliente
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

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
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 5,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  loginLogo: {
    width: 220,
    height: 88,
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
  backButton: {
    marginTop: 30,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
  },
});
