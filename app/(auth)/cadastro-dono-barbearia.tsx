// Tela de cadastro para Dono de Barbearia
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

export default function CadastroDonoBarbearia() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const showAlert = useAlert();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    senha: '',
    confirmarSenha: '',
    nomeCompleto: '',
    telefone: '',
    nomeBarbearia: '',
  });
  const set = (campo: string, valor: string) => setFormData((p) => ({ ...p, [campo]: valor }));

  const handleCadastro = async () => {
    try {
      setLoading(true);
      if (!formData.email || !formData.senha || !formData.nomeCompleto || !formData.nomeBarbearia) {
        showAlert('Campos obrigatórios', 'Preencha todos os campos obrigatórios');
        return;
      }
      if (!formData.email.includes('@')) {
        showAlert('Email inválido', 'Digite um email válido');
        return;
      }
      if (formData.senha.length < 6) {
        showAlert('Senha curta', 'A senha deve ter no mínimo 6 caracteres');
        return;
      }
      if (formData.senha !== formData.confirmarSenha) {
        showAlert('Senhas diferentes', 'As senhas não coincidem');
        return;
      }

      // O gatilho handle_new_user cria o perfil (dono) e a barbearia via options.data.
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          data: {
            nome_completo: formData.nomeCompleto,
            telefone: formData.telefone,
            papel: 'dono_barbearia',
            nome_barbearia: formData.nomeBarbearia,
          },
        },
      });
      if (authError) throw authError;

      showAlert(
        'Cadastro Realizado!',
        'Sua conta foi criada com sucesso. Faça login para continuar.',
        [{ text: 'OK', onPress: () => router.replace('/login-dono-barbearia') }],
      );
    } catch (error: any) {
      showAlert('Erro no Cadastro', error.message);
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.badge, { backgroundColor: theme.goldSoft }]}>
              <Ionicons name="storefront" size={30} color={theme.gold} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Cadastro de Dono</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              Crie sua conta e gerencie sua barbearia
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Nome completo *"
              icon="person-outline"
              placeholder="Seu nome"
              value={formData.nomeCompleto}
              onChangeText={(t) => set('nomeCompleto', t)}
              autoCapitalize="words"
            />
            <Input
              label="Email *"
              icon="mail-outline"
              placeholder="seu@email.com"
              value={formData.email}
              onChangeText={(t) => set('email', t)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Telefone"
              icon="call-outline"
              placeholder="(00) 00000-0000"
              value={formData.telefone}
              onChangeText={(t) => set('telefone', t)}
              keyboardType="phone-pad"
            />
            <Input
              label="Nome da barbearia *"
              icon="cut-outline"
              placeholder="Nome da sua barbearia"
              value={formData.nomeBarbearia}
              onChangeText={(t) => set('nomeBarbearia', t)}
            />
            <Input
              label="Senha *"
              icon="lock-closed-outline"
              placeholder="Mínimo 6 caracteres"
              value={formData.senha}
              onChangeText={(t) => set('senha', t)}
              secureTextEntry
            />
            <Input
              label="Confirmar senha *"
              icon="lock-closed-outline"
              placeholder="Digite a senha novamente"
              value={formData.confirmarSenha}
              onChangeText={(t) => set('confirmarSenha', t)}
              secureTextEntry
            />

            <Button
              title="Criar Conta"
              size="lg"
              loading={loading}
              onPress={handleCadastro}
              style={styles.submit}
            />

            <TouchableOpacity
              style={styles.linkContainer}
              onPress={() => router.push('/login-dono-barbearia')}
            >
              <Text style={[styles.linkText, { color: theme.subtext }]}>
                Já tem uma conta?{' '}
                <Text style={[styles.linkHighlight, { color: theme.primary }]}>Faça login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 90, justifyContent: 'center' },
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
  submit: { marginTop: 8 },
  linkContainer: { alignItems: 'center', marginTop: 22 },
  linkText: { fontSize: 15 },
  linkHighlight: { fontWeight: 'bold' },
});
