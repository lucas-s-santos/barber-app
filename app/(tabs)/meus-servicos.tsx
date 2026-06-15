import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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

export default function MeusServicos() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [servicos, setServicos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    nome_servico: '',
    descricao: '',
    preco: '',
    duracao_minutos: '30',
  });

  useEffect(() => {
    loadServicos();
  }, []);

  const loadServicos = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Primeiro encontrar o barbeiro
      const { data: barbeiro } = await supabase
        .from('barbeiros')
        .select('id')
        .eq('perfil_id', userData.user.id)
        .single();

      if (!barbeiro) {
        setLoading(false);
        return;
      }

      // Depois carregar os serviços
      const { data } = await supabase
        .from('servicos_barbeiro')
        .select('*')
        .eq('barbeiro_id', barbeiro.id);

      setServicos(data || []);
    } catch (error) {
      console.log('Erro ao carregar serviços:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const salvarServico = async () => {
    if (!formData.nome_servico.trim() || !formData.preco) {
      Alert.alert('Erro', 'Preencha nome e preço');
      return;
    }

    try {
      setSaving(true);
      const { data: userData } = await supabase.auth.getUser();

      // Encontrar barbeiro_id
      const { data: barbeiro } = await supabase
        .from('barbeiros')
        .select('id')
        .eq('perfil_id', userData.user.id)
        .single();

      if (!barbeiro) {
        Alert.alert('Erro', 'Você não é registrado como barbeiro');
        return;
      }

      const dadosServico = {
        barbeiro_id: barbeiro.id,
        nome_servico: formData.nome_servico,
        descricao: formData.descricao,
        preco: parseFloat(formData.preco),
        duracao_minutos: parseInt(formData.duracao_minutos),
        ativo: true,
      };

      if (editingId) {
        // Atualizar
        const { error } = await supabase
          .from('servicos_barbeiro')
          .update(dadosServico)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Criar
        const { error } = await supabase.from('servicos_barbeiro').insert([dadosServico]);

        if (error) throw error;
      }

      Alert.alert('Sucesso', 'Serviço salvo!');
      setFormData({ nome_servico: '', descricao: '', preco: '', duracao_minutos: '30' });
      setShowForm(false);
      setEditingId(null);
      loadServicos();
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setSaving(false);
    }
  };

  const deletarServico = async (id) => {
    Alert.alert('Confirmar', 'Deseja deletar este serviço?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Deletar',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('servicos_barbeiro').delete().eq('id', id);
            if (error) throw error;
            loadServicos();
          } catch (error) {
            Alert.alert('Erro', error.message);
          }
        },
      },
    ]);
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
        <ThemedText style={styles.title}>Meus Serviços</ThemedText>

        <TouchableOpacity
          style={[styles.horariosButton, { borderColor: theme.primary }]}
          onPress={() => router.push('/(tabs)/configurar-horarios')}
        >
          <Ionicons name="time-outline" size={20} color={theme.primary} />
          <ThemedText style={[styles.horariosButtonText, { color: theme.primary }]}>
            Configurar meus horários
          </ThemedText>
        </TouchableOpacity>

        {!showForm ? (
          <>
            {servicos.length === 0 ? (
              <ThemedText style={styles.emptyText}>Nenhum serviço cadastrado ainda</ThemedText>
            ) : (
              <FlatList
                scrollEnabled={false}
                data={servicos}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={[styles.servicoCard, { borderLeftColor: theme.primary }]}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.servicoNome}>{item.nome_servico}</ThemedText>
                      {item.descricao && (
                        <ThemedText style={styles.servicoDescricao}>{item.descricao}</ThemedText>
                      )}
                      <View style={styles.servicoInfo}>
                        <ThemedText style={styles.servicoPreco}>
                          R$ {parseFloat(item.preco).toFixed(2)}
                        </ThemedText>
                        <ThemedText style={styles.servicoDuracao}>
                          ⏱ {item.duracao_minutos} min
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.servicoActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setFormData({
                            nome_servico: item.nome_servico,
                            descricao: item.descricao || '',
                            preco: item.preco.toString(),
                            duracao_minutos: item.duracao_minutos.toString(),
                          });
                          setEditingId(item.id);
                          setShowForm(true);
                        }}
                      >
                        <Ionicons name="pencil" size={20} color={theme.primary} />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => deletarServico(item.id)}>
                        <Ionicons name="trash" size={20} color="#ff6b6b" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={() => setShowForm(true)}
            >
              <ThemedText style={styles.buttonText}>+ Adicionar Serviço</ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ThemedText style={styles.formTitle}>
              {editingId ? 'Editar Serviço' : 'Novo Serviço'}
            </ThemedText>

            <View style={styles.section}>
              <ThemedText style={styles.label}>Nome do Serviço</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                placeholder="Ex: Corte Simples"
                placeholderTextColor={theme.subtext}
                value={formData.nome_servico}
                onChangeText={(text) => setFormData({ ...formData, nome_servico: text })}
              />
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.label}>Descrição (opcional)</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                placeholder="Descreva o serviço..."
                placeholderTextColor={theme.subtext}
                value={formData.descricao}
                onChangeText={(text) => setFormData({ ...formData, descricao: text })}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
                <ThemedText style={styles.label}>Preço (R$)</ThemedText>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.subtext}
                  keyboardType="decimal-pad"
                  value={formData.preco}
                  onChangeText={(text) => setFormData({ ...formData, preco: text })}
                />
              </View>

              <View style={[styles.section, { flex: 1 }]}>
                <ThemedText style={styles.label}>Duração (min)</ThemedText>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  placeholder="30"
                  placeholderTextColor={theme.subtext}
                  keyboardType="number-pad"
                  value={formData.duracao_minutos}
                  onChangeText={(text) => setFormData({ ...formData, duracao_minutos: text })}
                />
              </View>
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary, flex: 1, marginRight: 8 }]}
                onPress={salvarServico}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonText}>Salvar</ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.border, flex: 1 }]}
                onPress={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({
                    nome_servico: '',
                    descricao: '',
                    preco: '',
                    duracao_minutos: '30',
                  });
                }}
              >
                <ThemedText style={styles.buttonText}>Cancelar</ThemedText>
              </TouchableOpacity>
            </View>
          </>
        )}
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
    marginBottom: 16,
  },
  horariosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 16,
  },
  horariosButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginVertical: 24,
  },
  servicoCard: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderLeftWidth: 4,
  },
  servicoNome: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  servicoDescricao: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 6,
  },
  servicoInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  servicoPreco: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  servicoDuracao: {
    fontSize: 12,
    opacity: 0.6,
  },
  servicoActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  formButtons: {
    flexDirection: 'row',
    marginTop: 16,
  },
});
