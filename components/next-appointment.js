// Ionicons not used here
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';
import { getNextAppointment } from '../services/appointments';
import { supabase } from '../supabaseClient';

export default function NextAppointment() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) setAppointment(null);
        setLoading(false);
        return;
      }
      const { data, error } = await getNextAppointment(user.id);
      if (!mounted) return;
      if (error) {
        console.error('Erro ao buscar próximo agendamento', error);
        setAppointment(null);
      } else {
        setAppointment(data);
      }
      setLoading(false);
    };

    load();
    // opcional: atualizar a cada 5 minutos
    const iv = setInterval(load, 5 * 60 * 1000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, []);

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } catch (_e) {
      return iso;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={[styles.container, { backgroundColor: theme.card }]}>
        <Text style={[styles.title, { color: theme.text }]}>Próximo Agendamento</Text>
        <Text style={[styles.emptyText, { color: theme.subtext }]}>
          Você não possui agendamentos pendentes.
        </Text>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/(tabs)/servicos')}
        >
          <Text style={{ color: theme.background, fontWeight: '700' }}>Agendar agora</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <Text style={[styles.title, { color: theme.text }]}>Próximo Agendamento</Text>
      <Text style={[styles.service, { color: theme.text }]}>{appointment.servico?.nome}</Text>
      {appointment.servico?.preco != null && (
        <Text style={[styles.price, { color: theme.subtext }]}>
          {Number(appointment.servico.preco).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </Text>
      )}
      <Text style={[styles.barber, { color: theme.subtext }]}>
        com {appointment.barbeiro?.nome_completo}
      </Text>
      <Text style={[styles.date, { color: theme.text }]}>
        {formatDate(appointment.data_agendamento)}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: 'rgba(0,0,0,0.05)' }]}
          onPress={() => router.push('/(tabs)/meus-agendamentos')}
        >
          <Text style={{ color: theme.text }}>Meus agendamentos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/(tabs)/meus-agendamentos')}
        >
          <Text style={{ color: theme.background, fontWeight: '700' }}>Ver detalhes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, padding: 15, marginBottom: 15 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  service: { fontSize: 18, fontWeight: '800' },
  price: { fontSize: 14, marginTop: 4 },
  barber: { fontSize: 14, marginTop: 4 },
  date: { fontSize: 14, marginTop: 8, fontWeight: '600' },
  emptyText: { marginTop: 6, marginBottom: 10 },
  ctaButton: { padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  actions: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
  actionButton: { padding: 10, borderRadius: 10, minWidth: 120, alignItems: 'center' },
});
