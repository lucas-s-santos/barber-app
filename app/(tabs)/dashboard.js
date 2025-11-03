// Arquivo: app/(tabs)/dashboard.js (VERSÃO FINAL COM GRÁFICO E DICAS)

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

// Hooks e Configs
import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

// --- COMPONENTES DO DASHBOARD ---

const periodos = [
  { id: 'semana', label: 'Esta Semana' },
  { id: 'mes', label: 'Este Mês' },
  { id: 'ano', label: 'Este Ano' },
];

const FiltroPeriodo = ({ periodoAtivo, onPeriodoChange }) => {
  const { theme } = useAppTheme();
  return (
    <View style={styles.filtroContainer}>
      {periodos.map((p) => (
        <TouchableOpacity
          key={p.id}
          style={[ styles.filtroBotao, { backgroundColor: periodoAtivo === p.id ? theme.primary : theme.card }]}
          onPress={() => onPeriodoChange(p.id)}
        >
          <Text style={[ styles.filtroTexto, { color: periodoAtivo === p.id ? 'white' : theme.subtext }]}>
            {p.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// =================================================================
// <<< ETAPA 1: CARD COM ÍCONE DE DICA >>>
// =================================================================
const StatCard = ({ icon, label, value, color, tooltip }) => {
  const showAlert = useAlert();
  return (
    <View style={[styles.statCard, { backgroundColor: color }]}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={24} color="white" />
        <TouchableOpacity onPress={() => showAlert(label, tooltip, [{ text: 'Entendi' }])}>
          <Ionicons name="information-circle-outline" size={22} color="rgba(255, 255, 255, 0.7)" />
        </TouchableOpacity>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

// --- TELA PRINCIPAL ---

export default function DashboardScreen() {
  const { theme } = useAppTheme();
  const showAlert = useAlert();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [servicoData, setServicoData] = useState([]);
  const [periodo, setPeriodo] = useState('mes');

  const fetchDashboardData = useCallback(async (periodoSelecionado) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const hoje = new Date();
      const endDate = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
      let startDate;

      if (periodoSelecionado === 'semana') {
        const diaDaSemana = hoje.getDay();
        startDate = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - diaDaSemana, 0, 0, 0);
      } else if (periodoSelecionado === 'mes') {
        startDate = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0);
      } else if (periodoSelecionado === 'ano') {
        startDate = new Date(hoje.getFullYear(), 0, 1, 0, 0, 0);
      }

      const { data: statsData, error: statsError } = await supabase.rpc('get_dashboard_stats', {
        p_barbeiro_id: user.id, p_start_date: startDate.toISOString(), p_end_date: endDate.toISOString(),
      });
      if (statsError) throw statsError;
      setStats(statsData[0]);

      const { data: servicosData, error: servicosError } = await supabase.rpc('get_servicos_distribution', {
        p_barbeiro_id: user.id, p_start_date: startDate.toISOString(), p_end_date: endDate.toISOString(),
      });
      if (servicosError) throw servicosError;
      
      // Prepara os dados para o gráfico de pizza
      const chartColors = ['#10B981', '#3B82F6', '#F97316', '#8B5CF6', '#EAB308'];
      const pieData = servicosData.map((item, index) => ({
        value: item.quantidade,
        label: item.servico_nome,
        color: chartColors[index % chartColors.length],
        text: `${item.quantidade}`, // Mostra a quantidade no gráfico
      }));
      setServicoData(pieData);

    } catch (error) {
      showAlert('Erro ao Carregar Dashboard', error.message);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useFocusEffect(useCallback(() => { fetchDashboardData(periodo); }, [fetchDashboardData, periodo]));

  const getSubtitulo = () => periodos.find(p => p.id === periodo)?.label || '';

  if (loading && !stats) {
    return <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Meu Desempenho</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>{getSubtitulo()}</Text>
      </View>

      <FiltroPeriodo periodoAtivo={periodo} onPeriodoChange={setPeriodo} />

      {loading && <ActivityIndicator style={{ marginVertical: 20 }} color={theme.primary} />}

      {!loading && stats && (
        <>
          <View style={styles.statsGrid}>
            <StatCard icon="cash-outline" label="Faturamento" value={Number(stats.total_faturamento || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} color="#10B981" tooltip="Soma total do valor de todos os serviços concluídos no período selecionado." />
            <StatCard icon="calendar-outline" label="Agendamentos" value={stats.total_agendamentos || 0} color="#3B82F6" tooltip="Número total de agendamentos com status 'concluído' no período." />
            <StatCard icon="pricetag-outline" label="Ticket Médio" value={Number(stats.ticket_medio || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} color="#F97316" tooltip="Valor médio que cada cliente gastou. Calculado dividindo o Faturamento pelo número de Agendamentos." />
            <StatCard icon="star-outline" label="Serviço Popular" value={stats.servico_mais_popular?.nome || '-'} color="#8B5CF6" tooltip="O serviço que foi agendado mais vezes no período selecionado." />
          </View>

          {/* ================================================================= */}
          {/* <<< ETAPA 2: O GRÁFICO DE PIZZA REAL >>> */}
          {/* ================================================================= */}
          <View style={[styles.chartSection, { backgroundColor: theme.card }]}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>Distribuição de Serviços</Text>
            {servicoData.length > 0 ? (
              <View style={styles.pieChartContainer}>
                <PieChart
                  data={servicoData}
                  donut
                  showText
                  textColor="white"
                  radius={90}
                  innerRadius={45}
                  textSize={16}
                  focusOnPress
                />
                <View style={styles.legendContainer}>
                  {servicoData.map(item => (
                    <View key={item.label} style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                      <Text style={[styles.legendText, { color: theme.subtext }]}>{item.label} ({item.value})</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="pie-chart-outline" size={40} color={theme.subtext} />
                <Text style={{ color: theme.subtext, marginTop: 10 }}>Sem dados de serviços para exibir.</Text>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 80, paddingBottom: 10 },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 18, marginTop: 4 },
  filtroContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginVertical: 20 },
  filtroBotao: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  filtroTexto: { fontWeight: 'bold', fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  statCard: { width: '48%', padding: 15, borderRadius: 15, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statValue: { color: 'white', fontSize: 26, fontWeight: 'bold', marginTop: 8 },
  statLabel: { color: 'white', fontSize: 14, opacity: 0.8, marginTop: 2 },
  chartSection: { marginHorizontal: 20, borderRadius: 15, padding: 20, marginBottom: 20 },
  chartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  pieChartContainer: { alignItems: 'center', paddingVertical: 20 },
  legendContainer: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 30 },
  legendItem: { flexDirection: 'row', alignItems: 'center', margin: 5 },
  legendColor: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText: { fontSize: 14 },
  placeholder: { height: 250, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
});
