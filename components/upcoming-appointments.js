import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';
import { getUpcomingAppointments } from '../services/appointments';
import { supabase } from '../supabaseClient';

export default function UpcomingAppointments({ limit = 5 }) {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setItems([]);
        setLoading(false);
        return;
      }
      const { data, error } = await getUpcomingAppointments(user.id, limit);
      if (!mounted) return;
      if (error) {
        console.error('Erro ao buscar próximos agendamentos', error);
        setItems([]);
      } else setItems(data || []);
      setLoading(false);
    };

    load();
    return () => (mounted = false);
  }, [limit]);

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch (_e) {
      return iso;
    }
  };

  if (loading)
    return (
      <View style={[styles.container, { backgroundColor: theme.card }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );

  if (!items.length)
    return (
      <View style={[styles.container, { backgroundColor: theme.card }]}>
        <Text style={[styles.title, { color: theme.text }]}>Próximos Agendamentos</Text>
        <Text style={[styles.empty, { color: theme.subtext }]}>
          Nenhum agendamento futuro encontrado.
        </Text>
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <Text style={[styles.title, { color: theme.text }]}>Próximos Agendamentos</Text>
      {items.map((it) => (
        <TouchableOpacity
          key={it.id}
          style={styles.item}
          onPress={() => router.push('/(tabs)/meus-agendamentos')}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.service, { color: theme.text }]}>{it.servico?.nome}</Text>
            <Text style={[styles.meta, { color: theme.subtext }]}>
              {it.barbeiro?.nome_completo} • {formatDate(it.data_agendamento)}
            </Text>
          </View>
          {it.servico?.preco != null && (
            <Text style={[styles.price, { color: theme.subtext }]}>
              {Number(it.servico.preco).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </Text>
          )}
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={[styles.viewAll, { backgroundColor: theme.primary }]}
        onPress={() => router.push('/(tabs)/meus-agendamentos')}
      >
        <Text style={{ color: theme.background, fontWeight: '700' }}>Ver todos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, padding: 12, marginBottom: 15 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  empty: { fontSize: 14 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  service: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 13, marginTop: 4 },
  price: { marginLeft: 12, fontWeight: '700' },
  viewAll: { marginTop: 10, padding: 10, borderRadius: 10, alignItems: 'center' },
});
