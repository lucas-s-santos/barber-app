// Tela de login para Dono de Barbearia
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

export default function LoginDonoBarbearia() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const showAlert = useAlert();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async () => {
    try {
      setLoading(true);
      if (!email || !senha) {
        showAlert('Campos vazios', 'Digite seu email e senha');
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });
      if (authError) throw authError;

      const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('papel')
        .eq('id', authData.user.id)
        .single();
      if (perfilError) throw perfilError;

      if (perfil.papel !== 'dono_barbearia') {
        await supabase.auth.signOut();
        showAlert(
          'Acesso negado',
          'Esta área é exclusiva para donos de barbearia. Use o login adequado para seu perfil.',
        );
        return;
      }

      router.replace('/(tabs)/painel-barbearia');
    } catch {
      showAlert('Erro no Login', 'Email ou senha inválidos. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.badge, { backgroundColor: theme.goldSoft }]}>
              <Ionicons name="storefront" size={30} color={theme.gold} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Área do Dono</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              Acesse para gerenciar sua barbearia
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              icon="mail-outline"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Senha"
              icon="lock-closed-outline"
              placeholder="••••••••"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />
            <Button
              title="Entrar"
              size="lg"
              loading={loading}
              onPress={handleLogin}
              style={styles.entrar}
            />

            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => router.push('/cadastro-dono-barbearia')}
            >
              <Text style={[styles.linkText, { color: theme.subtext }]}>
                Não tem uma conta?{' '}
                <Text style={[styles.linkHighlight, { color: theme.primary }]}>Cadastre-se</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, paddingTop: 60, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 50, left: 18, padding: 6, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 28 },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 30, fontWeight: 'bold' },
  subtitle: { fontSize: 15, marginTop: 6, textAlign: 'center' },
  form: { width: '100%' },
  entrar: { marginTop: 4 },
  linkContainer: { alignItems: 'center', marginTop: 22 },
  linkText: { fontSize: 15 },
  linkHighlight: { fontWeight: 'bold' },
});
