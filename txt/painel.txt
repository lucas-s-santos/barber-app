// Arquivo: screens/PainelScreen.js

import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function PainelScreen() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(new Date().toISOString().split('T')[0]); // Pega a data de hoje

  const fetchAgendamentos = useCallback(async (dataSelecionada) => {
    setLoading(true);
    const inicioDoDia = `${dataSelecionada}T00:00:00.000Z`;
    const fimDoDia = `${dataSelecionada}T23:59:59.999Z`;

    // Busca agendamentos e também o nome do serviço e o email do usuário
    // Note que para buscar o email, precisamos de uma função no banco ou de um join mais complexo.
    // Por simplicidade, vamos buscar o ID do perfil, que é o ID do usuário.
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        id,
        data_agendamento,
        servicos ( nome ),
        profiles ( id ) 
      `)
      .gte('data_agendamento', inicioDoDia)
      .lte('data_agendamento', fimDoDia)
      .order('data_agendamento', { ascending: true });

    if (error) {
      Alert.alert('Erro ao buscar agendamentos', error.message);
    } else {
      setAgendamentos(data);
    }
    setLoading(false);
  }, []);

  // useFocusEffect é como o useEffect, mas roda toda vez que a tela entra em foco.
  useFocusEffect(
    useCallback(() => {
      fetchAgendamentos(data);

      const channel = supabase.channel('agendamentos_painel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, () => {
          // Re-busca os dados quando algo muda na tabela de agendamentos
          fetchAgendamentos(data);
        })
        .subscribe();

      // Limpa a inscrição ao sair da tela
      return () => {
        supabase.removeChannel(channel);
      };
    }, [data, fetchAgendamentos])
  );

  const AgendamentoItem = ({ item }) => {
    const dataAgendamento = new Date(item.data_agendamento);
    const hora = dataAgendamento.getUTCHours().toString().padStart(2, '0');
    const minuto = dataAgendamento.getUTCMinutes().toString().padStart(2, '0');
    
    // Mostra o ID do usuário como identificação do cliente
    const clienteId = item.profiles ? item.profiles.id.substring(0, 8) + '...' : 'Cliente não identificado';

    return (
      <View style={styles.itemContainer}>
        <Text style={styles.itemHora}>{`${hora}:${minuto}`}</Text>
        <View style={styles.itemDetails}>
          <Text style={styles.itemServico}>{item.servicos ? item.servicos.nome : 'Serviço não encontrado'}</Text>
          <Text style={styles.itemCliente}>ID Cliente: {clienteId}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#E50914" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agendamentos de Hoje</Text>
      <FlatList
        data={agendamentos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={AgendamentoItem}
        ListEmptyComponent={<Text style={styles.placeholderText}>Nenhum agendamento para hoje.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212', 
    paddingHorizontal: 10 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: 'white', 
    textAlign: 'center', 
    marginVertical: 20 
  },
  itemContainer: { 
    backgroundColor: '#1E1E1E', 
    padding: 15, 
    marginVertical: 8, 
    borderRadius: 10, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  itemHora: { 
    color: '#34D399', 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginRight: 15,
    width: 60,
  },
  itemDetails: {
    flex: 1,
  },
  itemServico: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  itemCliente: { 
    color: 'gray', 
    fontSize: 14,
    marginTop: 4,
  },
  placeholderText: { 
    color: 'gray', 
    textAlign: 'center', 
    marginTop: 50, 
    fontSize: 16 
  },
});
