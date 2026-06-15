import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

const AdminDashboard = () => {
  const { theme } = useAppTheme();
  const [activeTab, setActiveTab] = useState('usuarios');
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [barbearias, setBarbearias] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar usuários
      const { data: usuariosData } = await supabase
        .from('perfis')
        .select('*')
        .order('created_at', { ascending: false });

      // Carregar barbearias
      const { data: barbeariaData } = await supabase
        .from('barbearias')
        .select('*')
        .order('created_at', { ascending: false });

      setUsuarios(usuariosData || []);
      setBarbearias(barbeariaData || []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (papel) => {
    switch (papel) {
      case 'admin_master':
        return '#C8102E';
      case 'dono_barbearia':
        return '#0047BB';
      case 'barbeiro':
        return '#FF9500';
      case 'cliente':
        return '#34C759';
      default:
        return '#999999';
    }
  };

  const alterarPapel = async (usuarioId, novoPapel) => {
    try {
      const { error } = await supabase
        .from('perfis')
        .update({ papel: novoPapel })
        .eq('id', usuarioId);

      if (error) throw error;
      Alert.alert('Sucesso', `Papel alterado para ${novoPapel}`);
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar: ' + error.message);
    }
  };

  const renderUsuarios = () => (
    <ScrollView style={{ flex: 1 }}>
      <ThemedView style={styles.section}>
        <ThemedText style={styles.title}>Total: {usuarios.length} usuários</ThemedText>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            scrollEnabled={false}
            data={usuarios}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.card,
                  {
                    borderLeftColor: getRoleColor(item.papel),
                    borderLeftWidth: 4,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.cardTitle}>
                    {item.nome_completo || 'Sem nome'}
                  </ThemedText>
                  <ThemedText style={styles.cardSubtitle}>{item.email}</ThemedText>
                  <View style={styles.badge}>
                    <ThemedText style={[styles.badgeText, { color: getRoleColor(item.papel) }]}>
                      {item.papel}
                    </ThemedText>
                  </View>

                  {/* Botões para alterar papel */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.smallButton, { backgroundColor: '#C8102E' }]}
                      onPress={() => alterarPapel(item.id, 'admin_master')}
                    >
                      <ThemedText style={styles.smallButtonText}>Admin</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.smallButton, { backgroundColor: '#0047BB' }]}
                      onPress={() => alterarPapel(item.id, 'dono_barbearia')}
                    >
                      <ThemedText style={styles.smallButtonText}>Dono</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.smallButton, { backgroundColor: '#FF9500' }]}
                      onPress={() => alterarPapel(item.id, 'barbeiro')}
                    >
                      <ThemedText style={styles.smallButtonText}>Barbeiro</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.smallButton, { backgroundColor: '#34C759' }]}
                      onPress={() => alterarPapel(item.id, 'cliente')}
                    >
                      <ThemedText style={styles.smallButtonText}>Cliente</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </ThemedView>
    </ScrollView>
  );

  const renderBarbearias = () => (
    <ScrollView style={{ flex: 1 }}>
      <ThemedView style={styles.section}>
        <ThemedText style={styles.title}>Total: {barbearias.length} barbearias</ThemedText>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            scrollEnabled={false}
            data={barbearias}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <ThemedText style={styles.cardTitle}>
                  {item.nome_barbearia || 'Sem nome'}
                </ThemedText>
                <ThemedText style={styles.cardSubtitle}>
                  {item.endereco || 'Endereço não informado'}
                </ThemedText>
                {item.telefone && (
                  <ThemedText style={styles.cardSubtitle}>📱 {item.telefone}</ThemedText>
                )}
              </View>
            )}
          />
        )}
      </ThemedView>
    </ScrollView>
  );

  const renderEstatisticas = () => (
    <ScrollView style={{ flex: 1 }}>
      <ThemedView style={styles.section}>
        <ThemedText style={styles.title}>Estatísticas</ThemedText>

        <View style={[styles.stat, { borderTopColor: theme.primary, borderTopWidth: 2 }]}>
          <Ionicons name="people" size={24} color={theme.primary} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <ThemedText style={styles.statValue}>{usuarios.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Usuários Total</ThemedText>
          </View>
        </View>

        <View style={[styles.stat, { borderTopColor: '#C8102E', borderTopWidth: 2 }]}>
          <Ionicons name="shield" size={24} color="#C8102E" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <ThemedText style={styles.statValue}>
              {usuarios.filter((u) => u.papel === 'admin_master').length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Admins</ThemedText>
          </View>
        </View>

        <View style={[styles.stat, { borderTopColor: '#0047BB', borderTopWidth: 2 }]}>
          <Ionicons name="business" size={24} color="#0047BB" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <ThemedText style={styles.statValue}>
              {usuarios.filter((u) => u.papel === 'dono_barbearia').length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Donos de Barbearia</ThemedText>
          </View>
        </View>

        <View style={[styles.stat, { borderTopColor: '#FF9500', borderTopWidth: 2 }]}>
          <Ionicons name="cut" size={24} color="#FF9500" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <ThemedText style={styles.statValue}>
              {usuarios.filter((u) => u.papel === 'barbeiro').length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Barbeiros</ThemedText>
          </View>
        </View>

        <View style={[styles.stat, { borderTopColor: '#34C759', borderTopWidth: 2 }]}>
          <Ionicons name="person" size={24} color="#34C759" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <ThemedText style={styles.statValue}>
              {usuarios.filter((u) => u.papel === 'cliente').length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Clientes</ThemedText>
          </View>
        </View>

        <View style={[styles.stat, { borderTopColor: theme.accent, borderTopWidth: 2 }]}>
          <Ionicons name="storefront" size={24} color={theme.accent} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <ThemedText style={styles.statValue}>{barbearias.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Barbearias Cadastradas</ThemedText>
          </View>
        </View>
      </ThemedView>
    </ScrollView>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
      >
        <ThemedText style={styles.headerTitle}>Admin Dashboard</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Painel de Controle</ThemedText>
      </View>

      {/* Tabs */}
      <View
        style={[
          styles.tabsContainer,
          { backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'usuarios' && {
              borderBottomColor: theme.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('usuarios')}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'usuarios' && { color: theme.primary, fontWeight: 'bold' },
            ]}
          >
            Usuários
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'barbearias' && {
              borderBottomColor: theme.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('barbearias')}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'barbearias' && { color: theme.primary, fontWeight: 'bold' },
            ]}
          >
            Barbearias
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'estatisticas' && {
              borderBottomColor: theme.primary,
              borderBottomWidth: 2,
            },
          ]}
          onPress={() => setActiveTab('estatisticas')}
        >
          <ThemedText
            style={[
              styles.tabText,
              activeTab === 'estatisticas' && { color: theme.primary, fontWeight: 'bold' },
            ]}
          >
            Estatísticas
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'usuarios' && renderUsuarios()}
      {activeTab === 'barbearias' && renderBarbearias()}
      {activeTab === 'estatisticas' && renderEstatisticas()}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  smallButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AdminDashboard;
