// Arquivo: app/(tabs)/servicos.js (Com o novo design de cards)

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

import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

export default function ServicosScreen() {
  const router = useRouter();
  const showAlert = useAlert();
  const { theme } = useAppTheme(); // <<< 1. Pegamos as cores do tema

  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);

  useEffect(() => {
    async function fetchServicos() {
      setLoading(true);
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('ativo', true)
        .order('preco', { ascending: true });

      if (error) {
        showAlert('Erro', 'Não foi possível carregar os serviços.');
      } else {
        setServicos(data);
      }
      setLoading(false);
    }
    fetchServicos();
  }, [showAlert]);

  const handleProceedToAgenda = () => {
    if (!servicoSelecionado) {
      showAlert('Atenção', 'Por favor, selecione um serviço para continuar.');
      return;
    }
    router.push({
      pathname: '/(tabs)/agenda',
      params: {
        servicoId: servicoSelecionado.id,
        servicoNome: servicoSelecionado.nome,
        servicoDuracao: servicoSelecionado.duracao_minutos,
      },
    });
  };

  // Componente para o card de serviço individual
  const ServicoCard = ({ item }) => {
    const isSelected = servicoSelecionado?.id === item.id;

    // Função para escolher um ícone com base no nome do serviço
    const getIconName = (nome) => {
      const lowerCaseNome = nome.toLowerCase();
      if (lowerCaseNome.includes('barba')) return 'cut-outline';
      if (lowerCaseNome.includes('cabelo')) return 'happy-outline';
      if (lowerCaseNome.includes('sobrancelha')) return 'eye-outline';
      if (lowerCaseNome.includes('combo')) return 'star-outline';
      return 'square-outline'; // Ícone padrão
    };

    return (
      <TouchableOpacity
        style={[
          styles.cardContainer,
          { backgroundColor: theme.card, borderColor: theme.border },
          isSelected && { borderColor: theme.primary, backgroundColor: theme.card }, // Destaque quando selecionado
        ]}
        onPress={() => setServicoSelecionado(item)}
      >
        <View style={[styles.iconContainer, isSelected && { backgroundColor: theme.primary }]}>
          <Ionicons
            name={getIconName(item.nome)}
            size={32}
            color={isSelected ? theme.card : theme.primary}
          />
        </View>
        <Text style={[styles.cardNome, { color: theme.text }]} numberOfLines={1}>
          {item.nome}
        </Text>
        <Text style={[styles.cardDuracao, { color: theme.subtext }]}>
          {item.duracao_minutos} min
        </Text>
        <Text style={[styles.cardPreco, { color: theme.text }]}>
          {Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={servicos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={ServicoCard}
        numColumns={2} // <<< 2. Transforma a lista em uma grade de 2 colunas
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <Text style={[styles.title, { color: theme.text }]}>Nossos Serviços</Text>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.subtext }]}>
            Nenhum serviço disponível.
          </Text>
        }
      />

      {/* Botão de Prosseguir com o novo design */}
      {servicoSelecionado && (
        <View
          style={[
            styles.footer,
            { backgroundColor: theme.background, borderTopColor: theme.border },
          ]}
        >
          <TouchableOpacity
            style={[styles.proceedButton, { backgroundColor: theme.primary }]}
            onPress={handleProceedToAgenda}
          >
            <Text style={[styles.proceedButtonText, { color: theme.background }]}>
              Agendar Serviço
            </Text>
            <Ionicons name="arrow-forward-outline" size={20} color={theme.background} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Estilos completamente refeitos para o novo design de cards
const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    marginTop: 40,
  },
  listContainer: { paddingHorizontal: 10, paddingBottom: 120 }, // Espaço para o botão flutuante

  cardContainer: {
    flex: 1,
    margin: 8,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(0, 229, 255, 0.1)', // Fundo do ícone com a cor primária e transparência
  },
  cardNome: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardDuracao: {
    fontSize: 14,
    marginTop: 4,
  },
  cardPreco: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 10,
  },

  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30, // Mais espaço na parte inferior
    borderTopWidth: 1,
  },
  proceedButton: {
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
});
