import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../../contexts/ThemeContext';
import { getAllBarbearias } from '../../supabaseClient';

export default function BarbeariasListaScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [barbearias, setBarbearias] = useState([]);
  const [filteredBarbearias, setFilteredBarbearias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  async function loadBarbearias() {
    setLoading(true);
    const { data, error } = await getAllBarbearias();
    if (!error && data) {
      setBarbearias(data);
      setFilteredBarbearias(data);
    }
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadBarbearias();
    setRefreshing(false);
  }

  useEffect(() => {
    loadBarbearias();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBarbearias(barbearias);
    } else {
      const filtered = barbearias.filter(
        (b) =>
          b.nome_barbearia?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.endereco?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredBarbearias(filtered);
    }
  }, [searchQuery, barbearias]);

  function renderBarbearia({ item }) {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.push(`/(tabs)/barbearia-detalhes?id=${item.id}`)}
      >
        {item.logo_url ? (
          <Image source={{ uri: item.logo_url }} style={styles.logo} />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: theme.primary }]}>
            <Ionicons name="storefront" size={40} color={theme.background} />
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={[styles.barbeariaName, { color: theme.text }]}>{item.nome_barbearia}</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={16} color={theme.subtext} />
            <Text style={[styles.address, { color: theme.subtext }]} numberOfLines={2}>
              {item.endereco}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color={theme.subtext} />
      </TouchableOpacity>
    );
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Barbearias</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/barbearias-mapa')}>
          <Ionicons name="map-outline" size={28} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View
        style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <Ionicons name="search-outline" size={20} color={theme.subtext} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Buscar barbearias..."
          placeholderTextColor={theme.subtext}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredBarbearias}
        renderItem={renderBarbearia}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color={theme.subtext} />
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              Nenhuma barbearia encontrada
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 15,
  },
  barbeariaName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 14,
    marginLeft: 5,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 15,
  },
});
