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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

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
        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          Acesso exclusivo para administradores
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          icon="mail-outline"
          placeholder="seu@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <Input
          label="Senha"
          icon="lock-closed-outline"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button
          title="Entrar"
          size="lg"
          loading={loading}
          onPress={signInWithEmailBarbearia}
          style={styles.entrar}
        />
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
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 30, fontWeight: 'bold', marginTop: 10 },
  subtitle: { fontSize: 15, marginTop: 6, textAlign: 'center' },
  form: { width: '100%' },
  loginLogo: { width: 200, height: 80 },
  entrar: { marginTop: 4 },
  backButton: { marginTop: 28, alignItems: 'center' },
  backButtonText: { fontSize: 15 },
});
