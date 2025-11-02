// Arquivo: app/(auth)/cadastro.js (COM MÁSCARA DE DATA)

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaskedTextInput } from "react-native-mask-text"; // <<< 1. Importa a nova biblioteca

// Hooks personalizados
import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

export default function CadastroScreen() {
  const router = useRouter();
  const showAlert = useAlert();
  const { theme } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);

  // <<< 2. O estado agora guarda a data como texto (ex: "23/12/2005") >>>
  const [dataNascimento, setDataNascimento] = useState('');

  async function handleSignUp() {
    if (!nomeCompleto || !email || !password || !dataNascimento) {
      showAlert("Campos Obrigatórios", "Por favor, preencha nome, data de nascimento, email e senha.");
      return;
    }

    // <<< 3. Converte a data do formato DD/MM/YYYY para YYYY-MM-DD >>>
    const partesData = dataNascimento.split('/');
    if (partesData.length !== 3 || partesData[2].length !== 4) {
      showAlert("Data Inválida", "Por favor, insira uma data de nascimento válida no formato DD/MM/YYYY.");
      return;
    }
    const dataFormatadaParaSupabase = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;
    // -----------------------------------------------------------------

    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      showAlert("Erro no Cadastro", authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      showAlert("Erro no Cadastro", "Não foi possível criar o usuário. Tente novamente.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from('perfis').insert({
      id: authData.user.id,
      email: email,
      nome_completo: nomeCompleto,
      telefone: telefone,
      data_nascimento: dataFormatadaParaSupabase, // Envia a data no formato correto
      papel: 'cliente',
    });

    if (profileError) {
      showAlert("Erro ao Salvar Perfil", `Seu usuário foi criado, mas houve um erro ao salvar seus dados: ${profileError.message}`);
      setLoading(false);
      return;
    }

    showAlert(
      "Cadastro Realizado!",
      "Sua conta foi criada com sucesso. Verifique seu e-mail para confirmar e depois faça o login.",
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
    );
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Crie sua Conta</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>Rápido e fácil, vamos começar!</Text>
        </View>

        <View style={styles.form}>
          <MaskedTextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="Nome Completo" placeholderTextColor={theme.subtext} value={nomeCompleto} onChangeText={setNomeCompleto} />
          
          {/* <<< 4. Substituímos o seletor pelo MaskedTextInput >>> */}
          <MaskedTextInput
            mask="99/99/9999"
            onChangeText={(text) => setDataNascimento(text)}
            value={dataNascimento}
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="Data de Nascimento"
            placeholderTextColor={theme.subtext}
            keyboardType="numeric"
          />
          {/* ---------------------------------------------------- */}

          <MaskedTextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="Telefone (opcional)" placeholderTextColor={theme.subtext} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
          <MaskedTextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="Email" placeholderTextColor={theme.subtext} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <MaskedTextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]} placeholder="Senha (mínimo 6 caracteres)" placeholderTextColor={theme.subtext} value={password} onChangeText={setPassword} secureTextEntry />
          
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleSignUp} disabled={loading}>
            {loading ? <ActivityIndicator color={theme.background} /> : <Text style={[styles.buttonText, { color: theme.background }]}>Finalizar Cadastro</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingTop: 120 },
  backButton: { position: 'absolute', top: 60, left: 20, zIndex: 10, padding: 5 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 40, fontWeight: 'bold' },
  subtitle: { fontSize: 18, marginTop: 5 },
  form: { width: '100%' },
  input: { height: 58, paddingHorizontal: 18, borderRadius: 12, marginBottom: 15, fontSize: 16, borderWidth: 1 },
  button: { padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { fontWeight: '700', fontSize: 16 },
});
