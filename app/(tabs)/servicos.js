import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function ServicosScreen() {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // =================================================================
  // <<< MUDANÇA 1: Novo estado para guardar o serviço selecionado
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  // =================================================================

  useEffect(() => {
    fetchServicos();
  }, []);

  async function fetchServicos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .eq('ativo', true)
      .order('preco', { ascending: true });

    if (error) {
      Alert.alert('Erro ao buscar serviços', error.message);
    } else {
      setServicos(data);
    }
    setLoading(false);
  }

  // =================================================================
  // <<< MUDANÇA 2: A função de navegação agora é separada
  const handleProceedToAgenda = () => {
    if (!servicoSelecionado) {
      Alert.alert("Atenção", "Por favor, selecione um serviço para continuar.");
      return;
    }
    router.push({
      pathname: '/(tabs)/agenda',
      params: { 
        servicoId: servicoSelecionado.id, 
        servicoNome: servicoSelecionado.nome,
        servicoDuracao: servicoSelecionado.duracao_minutos
      },
    });
  };
  // =================================================================

  const ServicoItem = ({ item }) => {
    // =================================================================
    // <<< MUDANÇA 3: Verifica se este item é o que está selecionado
    const isSelected = servicoSelecionado?.id === item.id;
    // =================================================================

    return (
      // Aplica um estilo condicional se o item estiver selecionado
      <TouchableOpacity 
        style={[styles.itemContainer, isSelected && styles.itemContainerSelected]} 
        onPress={() => setServicoSelecionado(item)} // Apenas seleciona, não navega
      >
        <View style={styles.itemInfo}>
          <Text style={[styles.itemNome, isSelected && styles.itemTextSelected]}>{item.nome}</Text>
          <Text style={styles.itemDescricao}>{item.descricao}</Text>
          <Text style={styles.itemDuracao}>{item.duracao_minutos} minutos</Text>
        </View>
        <Text style={[styles.itemPreco, isSelected && styles.itemTextSelected]}>
          {Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escolha um Serviço</Text>
      <FlatList
        data={servicos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={ServicoItem}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum serviço disponível no momento.</Text>}
      />

      {/* // ================================================================= */}
      {/* // <<< MUDANÇA 4: Botão "Prosseguir" que só aparece se um serviço for selecionado */}
      {servicoSelecionado && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.proceedButton} onPress={handleProceedToAgenda}>
            <Text style={styles.proceedButtonText}>Prosseguir para Agendamento</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* // ================================================================= */}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212' },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginVertical: 20, paddingTop: 30 },
  list: { width: '100%', paddingHorizontal: 10 },
  itemContainer: { 
    backgroundColor: '#1E1E1E', 
    padding: 20, 
    marginVertical: 8, 
    borderRadius: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderWidth: 2, // Aumenta a espessura da borda
    borderColor: '#333' // Borda padrão
  },
  // =================================================================
  // <<< MUDANÇA 5: Novos estilos para o item selecionado e o botão de prosseguir
  itemContainerSelected: {
    borderColor: '#E50914', // Borda vermelha quando selecionado
    backgroundColor: '#2a1f1f', // Fundo levemente avermelhado
  },
  itemTextSelected: {
    color: 'white', // Garante que o texto fique branco e legível
  },
  // =================================================================
  itemInfo: { flex: 1 },
  itemNome: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  itemDescricao: { color: '#A0A0A0', fontSize: 14, marginTop: 4, maxWidth: '90%' },
  itemDuracao: { color: '#34D399', fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  itemPreco: { color: '#34D399', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  emptyText: { color: 'gray', textAlign: 'center', marginTop: 50, fontSize: 16 },
  // =================================================================
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#121212'
  },
  proceedButton: {
    backgroundColor: '#E50914',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  proceedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // =================================================================
});
