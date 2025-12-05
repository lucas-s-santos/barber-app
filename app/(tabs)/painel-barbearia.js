import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { getBarbeariaByAdmin, getUser, signOut, supabase } from '../../supabaseClient';

export default function PainelBarbeariaScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const showAlert = useAlert();

  const [barbearia, setBarbearia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalAgendamentos: 0,
    agendamentosHoje: 0,
    totalBarbeiros: 0,
    totalServicos: 0,
  });

  async function loadBarbeariaData() {
    const { user } = await getUser();
    if (!user) {
      router.replace('/(auth)/login-barbearia');
      return;
    }

    const { data: barbeariaData, error } = await getBarbeariaByAdmin(user.id);

    if (error || !barbeariaData) {
      showAlert('Erro', 'Você não possui uma barbearia cadastrada.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login-barbearia') },
      ]);
      return;
    }

    setBarbearia(barbeariaData);

    const { count: agendamentosCount } = await supabase
      .from('agendamentos')
      .select('*', { count: 'exact', head: true })
      .eq('barbearia_id', barbeariaData.id);

    const hoje = new Date().toISOString().split('T')[0];
    const { count: agendamentosHojeCount } = await supabase
      .from('agendamentos')
      .select('*', { count: 'exact', head: true })
      .eq('barbearia_id', barbeariaData.id)
      .gte('data_agendamento', `${hoje}T00:00:00`)
      .lte('data_agendamento', `${hoje}T23:59:59`);

    const { count: barbeirosCount } = await supabase
      .from('barbeiros')
      .select('*', { count: 'exact', head: true })
      .eq('barbearia_id', barbeariaData.id);

    const { count: servicosCount } = await supabase
      .from('servicos')
      .select('*', { count: 'exact', head: true })
      .eq('barbearia_id', barbeariaData.id);

    setStats({
      totalAgendamentos: agendamentosCount || 0,
      agendamentosHoje: agendamentosHojeCount || 0,
      totalBarbeiros: barbeirosCount || 0,
      totalServicos: servicosCount || 0,
    });

    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadBarbeariaData();
    setRefreshing(false);
  }

  async function handleLogout() {
    showAlert('Sair', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login-barbearia');
        },
      },
    ]);
  }

  useEffect(() => {
    loadBarbeariaData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!barbearia) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.subtext }]}>
          Erro ao carregar dados da barbearia
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {barbearia.logo_url ? (
              <Image source={{ uri: barbearia.logo_url }} style={styles.logo} />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: theme.primary }]}>
                <Ionicons name="storefront" size={30} color={theme.background} />
              </View>
            )}
            <View style={styles.headerText}>
              <Text style={[styles.barbeariaName, { color: theme.text }]}>
                {barbearia.nome_barbearia}
              </Text>
              <Text style={[styles.barbeariaEndereco, { color: theme.subtext }]} numberOfLines={1}>
                {barbearia.endereco}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View
            style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="calendar" size={32} color={theme.primary} />
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {stats.totalAgendamentos}
            </Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Total Agendamentos</Text>
          </View>

          <View
            style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="today" size={32} color={theme.primary} />
            <Text style={[styles.statNumber, { color: theme.text }]}>{stats.agendamentosHoje}</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Hoje</Text>
          </View>

          <View
            style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="people" size={32} color={theme.primary} />
            <Text style={[styles.statNumber, { color: theme.text }]}>{stats.totalBarbeiros}</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Barbeiros</Text>
          </View>

          <View
            style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="cut" size={32} color={theme.primary} />
            <Text style={[styles.statNumber, { color: theme.text }]}>{stats.totalServicos}</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Serviços</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Gerenciar</Text>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/(tabs)/gerenciar-servicos')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="cut-outline" size={24} color={theme.primary} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Serviços</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.subtext} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/(tabs)/historico-agendamentos')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="calendar-outline" size={24} color={theme.primary} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Agendamentos</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.subtext} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => showAlert('Em breve', 'Funcionalidade em desenvolvimento')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="people-outline" size={24} color={theme.primary} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Barbeiros</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.subtext} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/(tabs)/configurar-horarios')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="time-outline" size={24} color={theme.primary} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Horários</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.subtext} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => showAlert('Em breve', 'Funcionalidade em desenvolvimento')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="settings-outline" size={24} color={theme.primary} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Configurações</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.subtext} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
    paddingTop: 60,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  headerText: {
    marginLeft: 15,
    flex: 1,
  },
  barbeariaName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  barbeariaEndereco: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    marginRight: '3%',
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 15,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
