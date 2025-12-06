import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../../contexts/ThemeContext';
import { getBarbeariaById, supabase } from '../../supabaseClient';

export default function BarbeariaDetalhesScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [barbearia, setBarbearia] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [barbeiros, setBarbeiros] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadBarbeariaDetalhes() {
    setLoading(true);

    const { data: barbeariaData, error: barbeariaError } = await getBarbeariaById(id);
    if (!barbeariaError && barbeariaData) {
      setBarbearia(barbeariaData);
    }

    const { data: servicosData } = await supabase
      .from('servicos')
      .select('*')
      .eq('barbearia_id', id)
      .eq('ativo', true);
    if (servicosData) {
      setServicos(servicosData);
    }

    const { data: barbeirosData } = await supabase
      .from('barbeiros')
      .select('*, perfis(*)')
      .eq('barbearia_id', id);
    if (barbeirosData) {
      setBarbeiros(barbeirosData);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (id) {
      loadBarbeariaDetalhes();
    }
  }, [id]);

  function handleOpenMaps() {
    if (barbearia?.latitude && barbearia?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${barbearia.latitude},${barbearia.longitude}`;
      Linking.openURL(url);
    }
  }

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={['top', 'bottom']}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!barbearia) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={['top', 'bottom']}
      >
        <Text style={[styles.errorText, { color: theme.subtext }]}>Barbearia não encontrada</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: theme.primary, marginTop: 10 }}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['bottom']}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {barbearia.logo_url ? (
            <Image source={{ uri: barbearia.logo_url }} style={styles.headerImage} />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: theme.card }]}>
              <Ionicons name="storefront" size={80} color={theme.primary} />
            </View>
          )}
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.card, top: insets.top + 10 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={[styles.barbeariaName, { color: theme.text }]}>
            {barbearia.nome_barbearia}
          </Text>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={theme.primary} />
              <Text style={[styles.infoText, { color: theme.text }]}>{barbearia.endereco}</Text>
            </View>
            {barbearia.latitude && barbearia.longitude && (
              <TouchableOpacity
                style={[styles.mapButton, { backgroundColor: theme.primary }]}
                onPress={handleOpenMaps}
              >
                <Ionicons name="navigate" size={16} color={theme.background} />
                <Text style={[styles.mapButtonText, { color: theme.background }]}>Ver no Mapa</Text>
              </TouchableOpacity>
            )}
          </View>

          {servicos.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Serviços</Text>
              {servicos.map((servico) => (
                <View
                  key={servico.id}
                  style={[
                    styles.servicoCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.servicoContent}>
                    <Text style={[styles.servicoName, { color: theme.text }]}>{servico.nome}</Text>
                    {servico.descricao && (
                      <Text style={[styles.servicoDescricao, { color: theme.subtext }]}>
                        {servico.descricao}
                      </Text>
                    )}
                  </View>
                  <View style={styles.servicoInfo}>
                    <Text style={[styles.servicoPreco, { color: theme.primary }]}>
                      R$ {servico.preco}
                    </Text>
                    <Text style={[styles.servicoDuracao, { color: theme.subtext }]}>
                      {servico.duracao_minutos} min
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {barbeiros.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Barbeiros</Text>
              {barbeiros.map((barbeiro) => (
                <View
                  key={barbeiro.id}
                  style={[
                    styles.barbeiroCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  {barbeiro.perfis?.foto_url ? (
                    <Image source={{ uri: barbeiro.perfis.foto_url }} style={styles.barbeiroFoto} />
                  ) : (
                    <View
                      style={[styles.barbeiroFotoPlaceholder, { backgroundColor: theme.primary }]}
                    >
                      <Ionicons name="person" size={24} color={theme.background} />
                    </View>
                  )}
                  <Text style={[styles.barbeiroNome, { color: theme.text }]}>
                    {barbeiro.perfis?.nome_completo || 'Barbeiro'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.agendarButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push(`/(tabs)/agenda?barbearia_id=${id}`)}
          >
            <Ionicons name="calendar" size={20} color={theme.background} />
            <Text style={[styles.agendarButtonText, { color: theme.background }]}>
              Agendar Horário
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    padding: 20,
  },
  barbeariaName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoSection: {
    marginBottom: 25,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  servicoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  servicoContent: {
    flex: 1,
    marginRight: 10,
  },
  servicoName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  servicoDescricao: {
    fontSize: 14,
  },
  servicoInfo: {
    alignItems: 'flex-end',
  },
  servicoPreco: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  servicoDuracao: {
    fontSize: 12,
  },
  barbeiroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  barbeiroFoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  barbeiroFotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barbeiroNome: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 15,
  },
  agendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 30,
  },
  agendarButtonText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
