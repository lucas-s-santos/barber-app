import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAlert } from '../contexts/AlertContext';
import { useBarbershop } from '../contexts/BarbershopContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { supabase } from '../supabaseClient';

export default function SelecionarBarbeiroScreen() {
  const { theme } = useAppTheme();
  const showAlert = useAlert();
  const router = useRouter();
  const { selectedBarbershop } = useBarbershop();

  const [barbeiros, setBarbeiros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBarbeiros = async () => {
      if (!selectedBarbershop) {
        router.replace('/selecionar-barbearia');
        return;
      }

      setLoading(true);
      console.log('📍 Buscando barbeiros para barbearia:', selectedBarbershop.id);
      console.log('📍 Tipo do ID:', typeof selectedBarbershop.id);
      console.log('📍 selectedBarbershop completo:', JSON.stringify(selectedBarbershop));

      // Primeiro, vamos buscar TODOS os barbeiros para ver o que existe
      const { data: todosBarbeiros, error: erroTodos } = await supabase
        .from('barbeiros')
        .select('*');

      console.log('🔍 TODOS os barbeiros no banco:', todosBarbeiros);
      console.log('🔍 Erro ao buscar todos:', erroTodos);

      if (todosBarbeiros && todosBarbeiros.length > 0) {
        console.log(
          '🔍 Tipo do barbearia_id do primeiro barbeiro:',
          typeof todosBarbeiros[0].barbearia_id,
        );
        console.log('🔍 Comparação:', {
          barbeiroId: todosBarbeiros[0].barbearia_id,
          selectedId: selectedBarbershop.id,
          igual: todosBarbeiros[0].barbearia_id === selectedBarbershop.id,
        });
      }

      // Agora buscar só os da barbearia selecionada
      const { data, error } = await supabase
        .from('barbeiros')
        .select('id, nome, email, telefone, barbearia_id, ativo')
        .eq('barbearia_id', selectedBarbershop.id);

      console.log('🔍 Barbeiros filtrados por barbearia_id:', data);
      console.log('🔍 Erro na query filtrada:', error);

      if (error) {
        console.error('❌ Erro ao buscar barbeiros:', error);
        showAlert('Erro', 'Não foi possível carregar a lista de barbeiros.');
      } else {
        console.log('✅ Barbeiros encontrados (total):', data?.length || 0);
        console.log('✅ Barbeiros:', data);
        // Filtrar apenas ativos
        const barbeirosAtivos = (data || []).filter((b) => b.ativo === true);
        console.log('✅ Barbeiros ativos:', barbeirosAtivos.length);
        setBarbeiros(barbeirosAtivos);
      }
      setLoading(false);
    };

    fetchBarbeiros();
  }, [selectedBarbershop, showAlert, router]);

  const handleSelectBarbeiro = (barbeiro) => {
    // Salvar o barbeiro selecionado e ir para serviços
    router.push({
      pathname: '/(tabs)/servicos',
      params: {
        barbeiroId: barbeiro.id,
        barbeiroNome: barbeiro.nome,
      },
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => handleSelectBarbeiro(item)}
    >
      <View style={[styles.avatarWrapper, { backgroundColor: theme.primary }]}>
        <Ionicons name="person-circle-outline" size={50} color={theme.card} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.nome, { color: theme.text }]}>{item.nome}</Text>
        <Text style={[styles.email, { color: theme.subtext }]}>{item.email || 'Sem email'}</Text>
        <Text style={[styles.telefone, { color: theme.subtext }]}>
          {item.telefone || 'Sem telefone'}
        </Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={22} color={theme.subtext} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Escolha um Barbeiro</Text>
      <Text style={[styles.subtitle, { color: theme.subtext }]}>{selectedBarbershop?.nome}</Text>

      {barbeiros.length > 0 ? (
        <FlatList
          data={barbeiros}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="information-circle-outline" size={60} color={theme.subtext} />
          <Text style={[styles.emptyText, { color: theme.subtext }]}>
            Nenhum barbeiro disponível nesta barbearia.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', marginHorizontal: 20, marginBottom: 20, fontSize: 14 },
  listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  avatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  email: { fontSize: 12, marginBottom: 2 },
  telefone: { fontSize: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
});
