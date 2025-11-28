// Arquivo: app/(tabs)/configurar-horarios.js (VERSÃO COM BOTÃO DE VOLTAR CORRIGIDO)

import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router'; // Importe o Stack
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaskedTextInput } from 'react-native-mask-text';

import { useAlert } from '../../contexts/AlertContext';
import { useAppTheme } from '../../contexts/ThemeContext'; // Importe o useAppTheme
import { supabase } from '../../supabaseClient';

const DIAS_SEMANA = [
  { id: 1, nome: 'Segunda-feira' },
  { id: 2, nome: 'Terça-feira' },
  { id: 3, nome: 'Quarta-feira' },
  { id: 4, nome: 'Quinta-feira' },
  { id: 5, nome: 'Sexta-feira' },
  { id: 6, nome: 'Sábado' },
  { id: 0, nome: 'Domingo' },
];

export default function ConfigurarHorariosScreen() {
  const router = useRouter();
  const showAlert = useAlert();
  const { theme } = useAppTheme(); // Use o hook do tema
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [barbeiroId, setBarbeiroId] = useState(null);
  const [configuracoes, setConfiguracoes] = useState({});

  // ... (toda a sua lógica de fetchConfiguracoes, handleInputChange, handleSave, etc. permanece a mesma)
  const fetchConfiguracoes = useCallback(
    async (id) => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('configuracoes_horarios')
        .select('*')
        .eq('barbeiro_id', id);

      if (error) {
        showAlert('Erro', 'Não foi possível carregar suas configurações.', [{ text: 'OK' }]);
      } else {
        const configsPorDia = data.reduce((acc, config) => {
          acc[config.dia_semana] = {
            ...config,
            hora_inicio: config.hora_inicio ? config.hora_inicio.substring(0, 5) : '',
            hora_fim: config.hora_fim ? config.hora_fim.substring(0, 5) : '',
            inicio_almoco: config.inicio_almoco ? config.inicio_almoco.substring(0, 5) : '',
            fim_almoco: config.fim_almoco ? config.fim_almoco.substring(0, 5) : '',
          };
          return acc;
        }, {});
        setConfiguracoes(configsPorDia);
      }
      setLoading(false);
    },
    [showAlert],
  );

  useFocusEffect(
    useCallback(() => {
      const getUser = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setBarbeiroId(user.id);
          fetchConfiguracoes(user.id);
        }
      };
      getUser();
    }, [fetchConfiguracoes]),
  );

  const handleInputChange = (diaId, campo, valor) => {
    setConfiguracoes((prev) => ({
      ...prev,
      [diaId]: {
        ...prev[diaId],
        dia_semana: diaId,
        [campo]: valor,
      },
    }));
  };

  const handleToggleAtivo = (diaId) => {
    const configAtual = configuracoes[diaId] || {};
    const novoStatus = !configAtual.ativo;
    handleInputChange(diaId, 'ativo', novoStatus);
  };

  const handleSave = async () => {
    if (!barbeiroId) return;
    setSaving(true);
    const dadosParaSalvar = Object.values(configuracoes).map((config) => ({
      barbeiro_id: barbeiroId,
      dia_semana: config.dia_semana,
      hora_inicio: config.hora_inicio ? `${config.hora_inicio}:00` : '00:00:00',
      hora_fim: config.hora_fim ? `${config.hora_fim}:00` : '00:00:00',
      inicio_almoco: config.inicio_almoco ? `${config.inicio_almoco}:00` : '00:00:00',
      fim_almoco: config.fim_almoco ? `${config.fim_almoco}:00` : '00:00:00',
      ativo: config.ativo || false,
    }));

    const { error } = await supabase.from('configuracoes_horarios').upsert(dadosParaSalvar, {
      onConflict: 'barbeiro_id, dia_semana',
    });

    setSaving(false);
    if (error) {
      showAlert('Erro ao Salvar', error.message, [{ text: 'OK' }]);
    } else {
      showAlert('Sucesso!', 'Seus horários foram salvos.', [
        { text: 'OK', onPress: () => router.push('/(tabs)/perfil') },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* ======================================================================== */}
      {/* <<< A CORREÇÃO ESTÁ AQUI: USANDO STACK.SCREEN E router.push >>> */}
      {/* ======================================================================== */}
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Meus Horários</Text>
      </View>

      {/* O resto do seu código JSX permanece o mesmo */}
      {DIAS_SEMANA.map((dia) => {
        const config = configuracoes[dia.id] || {};
        const isAtivo = config.ativo || false;
        return (
          <View
            key={dia.id}
            style={[
              styles.dayContainer,
              { backgroundColor: theme.card },
              !isAtivo && { opacity: 0.5 },
            ]}
          >
            <View style={styles.dayHeader}>
              <Text style={[styles.dayTitle, { color: theme.text }]}>{dia.nome}</Text>
              <Switch
                value={isAtivo}
                onValueChange={() => handleToggleAtivo(dia.id)}
                trackColor={{ false: '#767577', true: theme.success }}
                thumbColor={isAtivo ? theme.success : '#f4f3f4'}
              />
            </View>
            {isAtivo && (
              <View style={styles.inputsRow}>
                <HorarioInput
                  theme={theme}
                  label="Início"
                  valor={config.hora_inicio}
                  onChange={(text) => handleInputChange(dia.id, 'hora_inicio', text)}
                />
                <HorarioInput
                  theme={theme}
                  label="Fim"
                  valor={config.hora_fim}
                  onChange={(text) => handleInputChange(dia.id, 'hora_fim', text)}
                />
                <HorarioInput
                  theme={theme}
                  label="Início Almoço"
                  valor={config.inicio_almoco}
                  onChange={(text) => handleInputChange(dia.id, 'inicio_almoco', text)}
                />
                <HorarioInput
                  theme={theme}
                  label="Fim Almoço"
                  valor={config.fim_almoco}
                  onChange={(text) => handleInputChange(dia.id, 'fim_almoco', text)}
                />
              </View>
            )}
          </View>
        );
      })}

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.primary }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={theme.background} />
        ) : (
          <Text style={[styles.saveButtonText, { color: theme.background }]}>Salvar Horários</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const HorarioInput = ({ label, valor, onChange, theme }) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.label, { color: theme.subtext }]}>{label}</Text>
    <MaskedTextInput
      mask="99:99"
      onChangeText={onChange}
      value={valor}
      style={[
        styles.input,
        { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
      ]}
      keyboardType="numeric"
      placeholder="HH:MM"
      placeholderTextColor="#555"
    />
  </View>
);

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  backButton: { position: 'absolute', left: 20, top: 58, zIndex: 1 },
  dayContainer: { borderRadius: 10, padding: 15, marginHorizontal: 15, marginBottom: 15 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayTitle: { fontSize: 18, fontWeight: 'bold' },
  inputsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  inputGroup: { width: '48%', marginBottom: 10 },
  label: { fontSize: 12, marginBottom: 5 },
  input: { padding: 12, borderRadius: 5, fontSize: 16, textAlign: 'center', borderWidth: 1 },
  saveButton: { padding: 15, borderRadius: 10, alignItems: 'center', margin: 20, marginTop: 10 },
  saveButtonText: { fontWeight: '700', fontSize: 16 },
});
