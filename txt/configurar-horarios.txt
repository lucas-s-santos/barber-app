import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
// <<< MUDANÇA 1: Importar o campo de texto com máscara
import { MaskedTextInput } from "react-native-mask-text";
import { useAlert } from '../../contexts/AlertContext';
import { supabase } from '../../supabaseClient';

const DIAS_SEMANA = [
  { id: 1, nome: 'Segunda-feira' }, { id: 2, nome: 'Terça-feira' },
  { id: 3, nome: 'Quarta-feira' }, { id: 4, nome: 'Quinta-feira' },
  { id: 5, nome: 'Sexta-feira' }, { id: 6, nome: 'Sábado' },
  { id: 0, nome: 'Domingo' },
];

export default function ConfigurarHorariosScreen() {
  const router = useRouter();
  const showAlert = useAlert();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [barbeiroId, setBarbeiroId] = useState(null);
  const [configuracoes, setConfiguracoes] = useState({});

  const fetchConfiguracoes = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from('configuracoes_horarios').select('*').eq('barbeiro_id', id);

    if (error) {
      showAlert('Erro', 'Não foi possível carregar suas configurações.', [{ text: 'OK' }]);
    } else {
      const configsPorDia = data.reduce((acc, config) => {
        acc[config.dia_semana] = {
          ...config,
          // Garante que os horários sejam strings formatadas para a máscara
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
  }, [showAlert]);

  useFocusEffect(
    useCallback(() => {
      const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setBarbeiroId(user.id);
          fetchConfiguracoes(user.id);
        }
      };
      getUser();
    }, [fetchConfiguracoes])
  );

  const handleInputChange = (diaId, campo, valor) => {
    setConfiguracoes(prev => ({
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
    const dadosParaSalvar = Object.values(configuracoes).map(config => ({
      barbeiro_id: barbeiroId,
      dia_semana: config.dia_semana,
      // <<< MUDANÇA 2: Garante que o formato enviado para o banco seja HH:MM:SS
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
      showAlert('Sucesso!', 'Seus horários foram salvos.', [{ text: 'OK', onPress: () => router.back() }]);
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#E50914" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Meus Horários</Text>

      {DIAS_SEMANA.map(dia => {
        const config = configuracoes[dia.id] || {};
        const isAtivo = config.ativo || false;
        return (
          <View key={dia.id} style={[styles.dayContainer, !isAtivo && { opacity: 0.5 }]}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayTitle}>{dia.nome}</Text>
              <Switch
                value={isAtivo}
                onValueChange={() => handleToggleAtivo(dia.id)}
                trackColor={{ false: '#767577', true: '#2E7D32' }}
                thumbColor={isAtivo ? '#66BB6A' : '#f4f3f4'}
              />
            </View>
            {isAtivo && (
              <View style={styles.inputsRow}>
                {/* <<< MUDANÇA 3: Usando o MaskedTextInput */}
                <HorarioInput label="Início" valor={config.hora_inicio} onChange={text => handleInputChange(dia.id, 'hora_inicio', text)} />
                <HorarioInput label="Fim" valor={config.hora_fim} onChange={text => handleInputChange(dia.id, 'hora_fim', text)} />
                <HorarioInput label="Início Almoço" valor={config.inicio_almoco} onChange={text => handleInputChange(dia.id, 'inicio_almoco', text)} />
                <HorarioInput label="Fim Almoço" valor={config.fim_almoco} onChange={text => handleInputChange(dia.id, 'fim_almoco', text)} />
              </View>
            )}
          </View>
        );
      })}
      
      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="black" /> : <Text style={styles.saveButtonText}>Salvar Horários</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// <<< MUDANÇA 4: Componente reutilizável para o input com máscara
const HorarioInput = ({ label, valor, onChange }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <MaskedTextInput
      mask="99:99"
      onChangeText={onChange}
      value={valor}
      style={styles.input}
      keyboardType="numeric"
      placeholder="HH:MM"
      placeholderTextColor="#555"
    />
  </View>
);

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212', paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 60, left: 20, zIndex: 1 },
  backButtonText: { color: 'white', fontSize: 16, marginLeft: 10 },
  dayContainer: { backgroundColor: '#1E1E1E', borderRadius: 10, padding: 15, marginHorizontal: 15, marginBottom: 15 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  inputsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 15 },
  inputGroup: { width: '48%', marginBottom: 10 },
  label: { color: 'gray', fontSize: 12, marginBottom: 5 },
  // Estilo para o input de texto
  input: { backgroundColor: '#333', color: 'white', padding: 12, borderRadius: 5, fontSize: 16, textAlign: 'center' },
  saveButton: { backgroundColor: '#34D399', padding: 15, borderRadius: 10, alignItems: 'center', margin: 20, marginTop: 10 },
  saveButtonText: { color: 'black', fontWeight: '700', fontSize: 16 },
});
