import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

// Máscara de data DD/MM/AAAA feita na mão (sem biblioteca, evita loop de render)
function formatarData(text: string): string {
  const d = text.replace(/\D/g, '').slice(0, 8);
  if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return d;
}

export default function CadastroScreen() {
  const router = useRouter();
  const showAlert = useAlert();
  const { theme } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataNascimento, setDataNascimento] = useState('');

  async function handleSignUp() {
    if (!nomeCompleto || !email || !password || !dataNascimento) {
      showAlert('Campos Obrigatórios', 'Preencha nome, data de nascimento, email e senha.');
      return;
    }
    const partesData = dataNascimento.split('/');
    if (partesData.length !== 3 || partesData[2].length !== 4) {
      showAlert('Data Inválida', 'Use o formato DD/MM/AAAA.');
      return;
    }
    const dataFormatadaParaSupabase = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;

    setLoading(true);
    // O perfil é criado pelo gatilho handle_new_user a partir de options.data.
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome_completo: nomeCompleto,
          telefone,
          data_nascimento: dataFormatadaParaSupabase,
          papel: 'cliente',
        },
      },
    });

    if (authError) {
      showAlert('Erro no Cadastro', authError.message);
      setLoading(false);
      return;
    }

    showAlert(
      'Cadastro Realizado!',
      'Sua conta foi criada com sucesso. Faça login para continuar.',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
    );
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: theme.goldSoft }]}>
            <Ionicons name="cut" size={30} color={theme.gold} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Crie sua Conta</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            Rápido e fácil — bora começar!
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Nome completo"
            icon="person-outline"
            placeholder="Seu nome"
            value={nomeCompleto}
            onChangeText={setNomeCompleto}
          />
          <Input
            label="Data de nascimento"
            icon="calendar-outline"
            placeholder="DD/MM/AAAA"
            keyboardType="numeric"
            maxLength={10}
            value={dataNascimento}
            onChangeText={(t) => setDataNascimento(formatarData(t))}
          />
          <Input
            label="Telefone (opcional)"
            icon="call-outline"
            placeholder="(00) 00000-0000"
            keyboardType="phone-pad"
            value={telefone}
            onChangeText={setTelefone}
          />
          <Input
            label="Email"
            icon="mail-outline"
            placeholder="seu@email.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Senha"
            icon="lock-closed-outline"
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button
            title="Finalizar Cadastro"
            size="lg"
            loading={loading}
            onPress={handleSignUp}
            style={styles.submit}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 90 },
  backButton: { position: 'absolute', top: 50, left: 18, zIndex: 10, padding: 6 },
  header: { alignItems: 'center', marginBottom: 28 },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 6 },
  form: { width: '100%' },
  submit: { marginTop: 8 },
});
