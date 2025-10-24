import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function CadastroScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignUp() {
    if (!email || !password || !nomeCompleto) {
      Alert.alert("Atenção", "Por favor, preencha E-mail, Senha e Nome Completo.");
      return;
    }
    setLoading(true);

    // 1. Cria o usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      Alert.alert("Erro no Cadastro", authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      Alert.alert("Erro no Cadastro", "Não foi possível criar o usuário. Tente novamente.");
      setLoading(false);
      return;
    }

    // 2. Atualiza a tabela 'perfis' com os dados adicionais
    // O papel 'cliente' já é o padrão definido no banco, mas podemos garantir aqui.
    const { error: profileError } = await supabase
      .from('perfis')
      .update({
        nome_completo: nomeCompleto,
        telefone: telefone,
        papel: 'cliente', // Garante que o papel seja 'cliente'
      })
      .eq('id', authData.user.id);

    setLoading(false);

    if (profileError) {
      Alert.alert("Erro ao salvar perfil", `Seu usuário foi criado, mas houve um erro ao salvar seus dados: ${profileError.message}`);
    } else {
      Alert.alert(
        "Cadastro Realizado!",
        "Sua conta foi criada com sucesso. Agora você pode fazer o login.",
        [{ text: "OK", onPress: () => router.push('/(auth)/login') }]
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Crie sua Conta de Cliente</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome Completo"
        placeholderTextColor="#888"
        value={nomeCompleto}
        onChangeText={setNomeCompleto}
      />
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Telefone (Opcional)"
        placeholderTextColor="#888"
        value={telefone}
        onChangeText={setTelefone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha (mínimo 6 caracteres)"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Cadastrando...' : 'Confirmar Cadastro'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={16} color="#FFF" />
        <Text style={styles.linkText}>Já tenho uma conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20, justifyContent: 'center' },
  header: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#1E1E1E', color: 'white', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#E50914', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  linkButton: { marginTop: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  linkText: { color: 'white', fontSize: 14, marginLeft: 8, textDecorationLine: 'underline' },
});
