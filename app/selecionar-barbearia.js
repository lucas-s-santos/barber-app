import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAlert } from '../contexts/AlertContext';
import { useBarbershop } from '../contexts/BarbershopContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { supabase } from '../supabaseClient';

export default function SelecionarBarbeariaScreen() {
  const { theme } = useAppTheme();
  const showAlert = useAlert();
  const router = useRouter();
  const { selectBarbershop } = useBarbershop();

  const [barbearias, setBarbearias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const fetchBarbearias = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('barbearias')
        .select('id, nome_barbearia, endereco, logo_url');

      if (!isMounted.current) return;

      if (error) {
        console.error('Erro ao buscar barbearias', error);
        showAlert('Erro', 'Não foi possível carregar as barbearias.');
      } else {
        setBarbearias(data || []);
      }
      setLoading(false);
      setCheckingSession(false);
    };

    const ensureSessionAndLoad = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/(auth)/login');
        return;
      }

      await fetchBarbearias();
    };

    ensureSessionAndLoad();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/(auth)/login');
        return;
      }
      fetchBarbearias();
    });

    return () => {
      isMounted.current = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, [router, showAlert]);

  const handleSelect = async (barbearia) => {
    await selectBarbershop({
      id: barbearia.id,
      nome: barbearia.nome_barbearia,
      endereco: barbearia.endereco,
      logo_url: barbearia.logo_url,
    });
    router.replace('/(tabs)/servicos');
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={() => handleSelect(item)}
    >
      <View style={styles.logoWrapper}>
        {item.logo_url ? (
          <Image source={{ uri: item.logo_url }} style={styles.logo} />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: theme.border }]}>
            <Ionicons name="storefront-outline" size={28} color={theme.subtext} />
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.nome, { color: theme.text }]} numberOfLines={1}>
          {item.nome_barbearia}
        </Text>
        <Text style={[styles.endereco, { color: theme.subtext }]} numberOfLines={2}>
          {item.endereco || 'Endereço não informado'}
        </Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={22} color={theme.subtext} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Escolha uma barbearia</Text>
      <Text style={[styles.subtitle, { color: theme.subtext }]}>
        Selecione a unidade para ver serviços, barbeiros e horários.
      </Text>

      {loading || checkingSession ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={barbearias}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              Nenhuma barbearia cadastrada ainda.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginTop: 30 },
  subtitle: { textAlign: 'center', marginHorizontal: 20, marginTop: 8 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  logoWrapper: { width: 56, height: 56 },
  logo: { width: 56, height: 56, borderRadius: 12 },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: { fontSize: 16, fontWeight: '700' },
  endereco: { fontSize: 13, marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
});
