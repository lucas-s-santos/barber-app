import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

export default function GerenciarBarbearia() {
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [barbearia, setBarbearia] = useState(null);

  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    telefone: '',
    descricao: '',
  });

  useEffect(() => {
    loadBarbearia();
  }, []);

  const loadBarbearia = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data } = await supabase
        .from('barbearias')
        .select('*')
        .eq('admin_id', userData.user.id)
        .single();

      if (data) {
        setBarbearia(data);
        setFormData({
          nome: data.nome_barbearia || '',
          endereco: data.endereco || '',
          telefone: data.telefone || '',
          descricao: data.descricao || '',
        });
      }
    } catch (error) {
      console.log('Sem barbearia ainda');
    } finally {
      setLoading(false);
    }
  };

  const salvarBarbearia = async () => {
    if (!formData.nome.trim()) {
      Alert.alert('Erro', 'Digite o nome da barbearia');
      return;
    }

    try {
      setSaving(true);
      const { data: userData } = await supabase.auth.getUser();

      // A coluna no banco é nome_barbearia (não "nome")
      const payload = {
        nome_barbearia: formData.nome.trim(),
        endereco: formData.endereco,
        telefone: formData.telefone,
        descricao: formData.descricao,
      };

      if (barbearia) {
        // Atualizar
        const { error } = await supabase.from('barbearias').update(payload).eq('id', barbearia.id);

        if (error) throw error;
        Alert.alert('Sucesso', 'Barbearia atualizada!');
      } else {
        // Criar
        const { error } = await supabase.from('barbearias').insert({
          ...payload,
          admin_id: userData.user.id,
          criada_por: userData.user.id,
          ativo: true,
        });

        if (error) throw error;
        Alert.alert('Sucesso', 'Barbearia criada!');
        loadBarbearia();
      }
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <ThemedText style={styles.title}>
          {barbearia ? 'Editar Barbearia' : 'Criar Barbearia'}
        </ThemedText>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Nome</ThemedText>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="Nome da barbearia"
            placeholderTextColor={theme.subtext}
            value={formData.nome}
            onChangeText={(text) => setFormData({ ...formData, nome: text })}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Endereço</ThemedText>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="Rua, número..."
            placeholderTextColor={theme.subtext}
            value={formData.endereco}
            onChangeText={(text) => setFormData({ ...formData, endereco: text })}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Telefone</ThemedText>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            placeholder="(11) 99999-9999"
            placeholderTextColor={theme.subtext}
            value={formData.telefone}
            onChangeText={(text) => setFormData({ ...formData, telefone: text })}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Descrição</ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { color: theme.text, borderColor: theme.border },
            ]}
            placeholder="Descreva sua barbearia..."
            placeholderTextColor={theme.subtext}
            multiline
            numberOfLines={4}
            value={formData.descricao}
            onChangeText={(text) => setFormData({ ...formData, descricao: text })}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={salvarBarbearia}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.buttonText}>
              {barbearia ? 'Atualizar' : 'Criar'} Barbearia
            </ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
