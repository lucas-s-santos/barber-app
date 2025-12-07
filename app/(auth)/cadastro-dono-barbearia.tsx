// Tela de cadastro para Dono de Barbearia
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
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

  const handleCadastro = async () => {
    try {
      setLoading(true);

      // Validações
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

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
      });

      if (authError) throw authError;

      if (!authData.user) {
        showAlert('Erro no Cadastro', 'Não foi possível criar o usuário. Tente novamente.');
        return;
      }

      // Criar perfil como dono_barbearia
      const { error: perfilError } = await supabase.from('perfis').insert([
        {
          id: authData.user.id,
          email: formData.email,
          nome_completo: formData.nomeCompleto,
          telefone: formData.telefone,
          papel: 'dono_barbearia',
        },
      ]);

      if (perfilError) throw perfilError;

      // Criar barbearia inicial
      const { error: barbeariaError } = await supabase.from('barbearias').insert([
        {
          nome_barbearia: formData.nomeBarbearia,
          admin_id: authData.user.id,
          endereco: '', // Será preenchido depois
        },
      ]);

      if (barbeariaError) throw barbeariaError;

      showAlert(
        'Cadastro Realizado!',
        'Sua conta foi criada com sucesso. Faça login para continuar.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login-dono-barbearia'),
          },
        ],
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
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Cadastro de Dono</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>
              Crie sua conta e gerencie sua barbearia
            </Text>
          </View>

          <View style={styles.form}>
            {/* Nome Completo */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Nome Completo *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
                ]}
                value={formData.nomeCompleto}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, nomeCompleto: text }))}
                placeholder="Digite seu nome completo"
                placeholderTextColor={theme.icon}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Email *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
                ]}
                value={formData.email}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
                placeholder="seu@email.com"
                placeholderTextColor={theme.icon}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Telefone */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Telefone</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
                ]}
                value={formData.telefone}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, telefone: text }))}
                placeholder="(00) 00000-0000"
                placeholderTextColor={theme.icon}
                keyboardType="phone-pad"
              />
            </View>

            {/* Nome da Barbearia */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Nome da Barbearia *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
                ]}
                value={formData.nomeBarbearia}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, nomeBarbearia: text }))}
                placeholder="Nome da sua barbearia"
                placeholderTextColor={theme.icon}
              />
            </View>

            {/* Senha */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Senha *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
                ]}
                value={formData.senha}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, senha: text }))}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={theme.icon}
                secureTextEntry
              />
            </View>

            {/* Confirmar Senha */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Confirmar Senha *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
                ]}
                value={formData.confirmarSenha}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, confirmarSenha: text }))}
                placeholder="Digite a senha novamente"
                placeholderTextColor={theme.icon}
                secureTextEntry
              />
            </View>

            {/* Botão Cadastrar */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handleCadastro}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Criar Conta</Text>
              )}
            </TouchableOpacity>

            {/* Link para Login */}
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
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  button: {
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
  },
  linkHighlight: {
    fontWeight: 'bold',
  },
});
