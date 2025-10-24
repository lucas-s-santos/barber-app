import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabaseClient';

// Verifique se este ID está correto
const ID_DA_BARBEARIA_PRINCIPAL = '9fa53483-b3ef-4460-b5cb-2593c439733d'; 

export default function ServicosScreen() {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // <--- O 'r' provavelmente vinha da falta desta linha ou de um erro nela.

  useEffect(() => {
    fetchServicos();
  }, []);

  async function fetchServicos() {
    setLoading(true);

    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .eq('barbearia_id', ID_DA_BARBEARIA_PRINCIPAL)
      .eq('ativo', true)
      .order('preco', { ascending: true });

    if (error) {
      Alert.alert('Erro ao buscar serviços', error.message);
    } else {
      setServicos(data);
    }
    setLoading(false);
  }

  const handleSelectService = (servico) => {
    router.push({
      pathname: '/(tabs)/agenda',
      params: { 
        servicoId: servico.id, 
        servicoNome: servico.nome,
        servicoDuracao: servico.duracao_minutos
      },
    });
  };

  const ServicoItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelectService(item)}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemNome}>{item.nome}</Text>
        <Text style={styles.itemDescricao}>{item.descricao}</Text>
        <Text style={styles.itemDuracao}>{item.duracao_minutos} minutos</Text>
      </View>
      <Text style={styles.itemPreco}>
        {Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nossos Serviços</Text>
      <FlatList
        data={servicos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={ServicoItem}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum serviço disponível no momento.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212' },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginVertical: 20 },
  list: { width: '100%', paddingHorizontal: 10 },
  itemContainer: { backgroundColor: '#1E1E1E', padding: 20, marginVertical: 8, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  itemInfo: { flex: 1 },
  itemNome: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  itemDescricao: { color: '#A0A0A0', fontSize: 14, marginTop: 4, maxWidth: '90%' },
  itemDuracao: { color: '#34D399', fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  itemPreco: { color: '#34D399', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  emptyText: { color: 'gray', textAlign: 'center', marginTop: 50, fontSize: 16 },
});
