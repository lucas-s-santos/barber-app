import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!nomeCompleto || !email || !password || !nomeBarbearia || !endereco) {
      showAlert('Campos Obrigatórios', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      showAlert('Erro no Cadastro', authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      showAlert('Erro no Cadastro', 'Não foi possível criar o usuário. Tente novamente.');
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from('perfis').insert({
      id: authData.user.id,
      email: email,
      nome_completo: nomeCompleto,
      telefone: telefone,
      papel: 'admin',
    });

    if (profileError) {
      showAlert(
        'Erro ao Salvar Perfil',
        `Houve um erro ao salvar seus dados: ${profileError.message}`,
      );
      setLoading(false);
      return;
    }

    const barbeariaData: any = {
      nome_barbearia: nomeBarbearia,
      endereco: endereco,
      admin_id: authData.user.id,
      ativo: true,
    };

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        barbeariaData.latitude = lat;
        barbeariaData.longitude = lng;
      }
    }

    const { error: barbeariaError } = await supabase.from('barbearias').insert(barbeariaData);

    if (barbeariaError) {
      showAlert(
        'Erro ao Cadastrar Barbearia',
        `Houve um erro ao cadastrar a barbearia: ${barbeariaError.message}`,
      );
      setLoading(false);
      return;
    }

    showAlert(
      'Cadastro Realizado!',
      'Sua barbearia foi cadastrada com sucesso. Verifique seu e-mail para confirmar e depois faça o login.',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login-barbearia') }],
    );
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={theme.primary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Cadastre sua Barbearia</Text>
          <Text style={[styles.subtitle, { color: theme.subtext }]}>
            Preencha as informações abaixo
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Dados Pessoais</Text>

          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Nome Completo *"
            placeholderTextColor={theme.subtext}
            value={nomeCompleto}
            onChangeText={setNomeCompleto}
          />

          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Telefone"
            placeholderTextColor={theme.subtext}
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />

          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Email *"
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
            placeholder="Senha *"
            placeholderTextColor={theme.subtext}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>
            Dados da Barbearia
          </Text>

          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Nome da Barbearia *"
            placeholderTextColor={theme.subtext}
            value={nomeBarbearia}
            onChangeText={setNomeBarbearia}
          />

          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Endereço Completo *"
            placeholderTextColor={theme.subtext}
            value={endereco}
            onChangeText={setEndereco}
            multiline
          />

          <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>
            Localização (Opcional)
          </Text>

          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Latitude (ex: -23.5505)"
            placeholderTextColor={theme.subtext}
            value={latitude}
            onChangeText={setLatitude}
            keyboardType="numeric"
          />

          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.card, color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Longitude (ex: -46.6333)"
            placeholderTextColor={theme.subtext}
            value={longitude}
            onChangeText={setLongitude}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <Text style={[styles.buttonText, { color: theme.background }]}>Cadastrar</Text>
            )}
          </TouchableOpacity>
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
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
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
    marginBottom: 40,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
  },
});
