import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

export default function LoginScreen() {
  const router = useRouter();
  const showAlert = useAlert();
  const { theme } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    if (!email || !password) {
      showAlert('Atenção', 'Por favor, preencha seu email e senha.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      showAlert('Erro no Login', 'Email ou senha inválidos. Por favor, tente novamente.', [
        { text: 'OK' },
      ]);
    }
    // Sucesso: o onAuthStateChange no _layout cuida do redirecionamento.
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
        <Text style={[styles.subtitle, { color: theme.subtext }]}>Bem-vindo de volta!</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          placeholder="seu@email.com"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <Input
          label="Senha"
          placeholder="••••••••"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button
          title="Entrar"
          size="lg"
          loading={loading}
          onPress={signInWithEmail}
          style={styles.entrar}
        />
      </View>

      <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/(auth)/cadastro')}>
        <Text style={[styles.linkText, { color: theme.subtext }]}>
          Não tem uma conta?{' '}
          <Text style={{ fontWeight: 'bold', color: theme.primary }}>Cadastre-se</Text>
        </Text>
      </TouchableOpacity>

      <Button
        title="Sou uma Barbearia"
        variant="outline"
        size="lg"
        onPress={() => router.push('/(auth)/login-barbearia')}
        style={styles.barbeariaBtn}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 36 },
  subtitle: { fontSize: 18, marginTop: 10 },
  form: { width: '100%' },
  loginLogo: { width: 220, height: 88 },
  entrar: { marginTop: 4 },
  linkButton: { marginTop: 28, alignItems: 'center' },
  linkText: { fontSize: 16 },
  barbeariaBtn: { marginTop: 16 },
});
