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

export default function CadastroBarbeariaScreen() {
  const router = useRouter();
  const showAlert = useAlert();
  const { theme } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nomeBarbearia, setNomeBarbearia] = useState('');
  const [endereco, setEndereco] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!nomeCompleto || !email || !password || !nomeBarbearia || !endereco) {
      showAlert('Campos Obrigatórios', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    setLoading(true);
    // O gatilho handle_new_user cria o perfil (dono) e a barbearia via options.data.
    // A localização (mapa) pode ser ajustada depois em "Gerenciar Barbearia".
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome_completo: nomeCompleto,
          telefone,
          papel: 'dono_barbearia',
          nome_barbearia: nomeBarbearia,
          endereco,
        },
      },
    });

    if (authError) {
      showAlert('Erro no Cadastro', authError.message);
      setLoading(false);
      return;
    }

    showAlert('Cadastro Realizado!', 'Sua barbearia foi cadastrada. Faça login para continuar.', [
      { text: 'OK', onPress: () => router.replace('/(auth)/login-barbearia') },
    ]);
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: theme.goldSoft }]}>
            <Ionicons name="storefront" size={30} color={theme.gold} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Cadastre sua Barbearia</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            Preencha as informações abaixo
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.sectionTitle, { color: theme.gold }]}>SEUS DADOS</Text>
          <Input
            label="Nome completo *"
            icon="person-outline"
            placeholder="Seu nome"
            value={nomeCompleto}
            onChangeText={setNomeCompleto}
          />
          <Input
            label="Telefone"
            icon="call-outline"
            placeholder="(00) 00000-0000"
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />
          <Input
            label="Email *"
            icon="mail-outline"
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <Input
            label="Senha *"
            icon="lock-closed-outline"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={[styles.sectionTitle, { color: theme.gold, marginTop: 8 }]}>
            SUA BARBEARIA
          </Text>
          <Input
            label="Nome da barbearia *"
            icon="cut-outline"
            placeholder="Nome da sua barbearia"
            value={nomeBarbearia}
            onChangeText={setNomeBarbearia}
          />
          <Input
            label="Endereço *"
            icon="location-outline"
            placeholder="Rua, número - bairro"
            value={endereco}
            onChangeText={setEndereco}
          />

          <Button
            title="Cadastrar"
            size="lg"
            loading={loading}
            onPress={handleSignUp}
            style={styles.submit}
          />
        </View>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/(auth)/login-barbearia')}
        >
          <Text style={[styles.linkText, { color: theme.subtext }]}>
            Já tem uma conta?{' '}
            <Text style={{ fontWeight: 'bold', color: theme.primary }}>Faça Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 90 },
  backButton: { position: 'absolute', top: 50, left: 18, padding: 6, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 24 },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 15, marginTop: 6 },
  form: { width: '100%' },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  submit: { marginTop: 8 },
  linkButton: { marginTop: 24, marginBottom: 20, alignItems: 'center' },
  linkText: { fontSize: 15 },
});
