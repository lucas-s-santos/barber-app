import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

// Componente para renderizar as estrelas
const Stars = ({ rating, size = 20 }) => {
  const totalStars = 5;
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {[...Array(fullStars)].map((_, i) => (
        <Ionicons key={`full_${i}`} name="star" size={size} color="#FBBF24" />
      ))}
      {halfStar && <Ionicons key="half" name="star-half" size={size} color="#FBBF24" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Ionicons key={`empty_${i}`} name="star-outline" size={size} color="#FBBF24" />
      ))}
    </View>
  );
};

export default function DetalhesBarbeiroScreen() {
  const router = useRouter();
  const { barbeiroId, servicoId, servicoNome, servicoDuracao } = useLocalSearchParams();
  const { theme } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [detalhes, setDetalhes] = useState(null);

  useEffect(() => {
    if (!barbeiroId) {
      router.back();
      return;
    }

    const fetchDetalhes = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_detalhes_barbeiro', {
        p_barbeiro_id: barbeiroId,
      });

      if (error || !data) {
        // Adicionada verificação !data
        console.error('Erro ao buscar detalhes ou dados nulos:', error);
        // Em caso de erro, podemos redirecionar ou mostrar uma mensagem
        router.back();
      } else {
        setDetalhes(data);
      }
      setLoading(false);
    };

    fetchDetalhes();
  }, [barbeiroId, router]);

  const handleSelectBarbeiro = () => {
    // Verificação de segurança
    if (!detalhes || !detalhes.perfil) return;
    router.replace({
      pathname: '/(tabs)/agenda',
      params: {
        servicoId,
        servicoNome,
        servicoDuracao,
        barbeiroId: detalhes.perfil.id,
        barbeiroNome: detalhes.perfil.nome_completo,
      },
    });
  };

  // <<< A VERIFICAÇÃO MAIS ROBUSTA >>>
  // Só tenta renderizar se não estiver carregando E se 'detalhes' e 'detalhes.perfil' existirem.
  if (loading || !detalhes || !detalhes.perfil) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Agora é seguro desestruturar
  const { perfil, estatisticas, avaliacoes, portfolio } = detalhes;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={theme.text} />
        </TouchableOpacity>
        {perfil.foto_base64 ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${perfil.foto_base64}` }}
            style={[styles.avatar, { borderColor: theme.primary }]}
          />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Ionicons name="person" size={60} color={theme.subtext} />
          </View>
        )}
        <Text style={[styles.nome, { color: theme.text }]}>{perfil.nome_completo}</Text>

        {estatisticas && (
          <View style={styles.statsContainer}>
            <Stars rating={estatisticas.media_nota} />
            <Text style={[styles.statsText, { color: theme.subtext }]}>
              {Number(estatisticas.media_nota).toFixed(1)} de 5 ({estatisticas.total_avaliacoes}{' '}
              avaliações)
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.agendarButton, { backgroundColor: theme.primary }]}
        onPress={handleSelectBarbeiro}
      >
        <Text style={[styles.agendarButtonText, { color: theme.background }]}>
          Agendar com {perfil.nome_completo.split(' ')[0]}
        </Text>
      </TouchableOpacity>

      <View style={[styles.section, { borderTopColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Portfólio</Text>
        {portfolio && portfolio.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {portfolio.map((item) => (
              <Image
                key={item.id}
                source={{ uri: `data:image/jpeg;base64,${item.foto_base64}` }}
                style={styles.portfolioImage}
              />
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.placeholderText, { color: theme.subtext }]}>
            Nenhuma foto no portfólio ainda.
          </Text>
        )}
      </View>

      <View style={[styles.section, { borderTopColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Últimas Avaliações</Text>
        {avaliacoes && avaliacoes.length > 0 ? (
          avaliacoes.map((item, index) => (
            <View key={index} style={[styles.avaliacaoCard, { backgroundColor: theme.card }]}>
              <View style={styles.avaliacaoHeader}>
                <Text style={[styles.avaliacaoNome, { color: theme.text }]}>
                  {item.nome_cliente}
                </Text>
                <Stars rating={item.nota} size={16} />
              </View>
              {item.comentario && (
                <Text style={[styles.avaliacaoComentario, { color: theme.subtext }]}>
                  {`"${item.comentario}"`}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={[styles.placeholderText, { color: theme.subtext }]}>
            Nenhuma avaliação recebida ainda.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: { position: 'absolute', top: 60, left: 20, zIndex: 1 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3 },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  nome: { fontSize: 26, fontWeight: 'bold', marginTop: 15 },
  statsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  statsText: { fontSize: 14, marginLeft: 10 },
  agendarButton: {
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  agendarButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  placeholderText: { fontStyle: 'italic' },
  portfolioImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginRight: 10,
  },
  avaliacaoCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  avaliacaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  avaliacaoNome: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  avaliacaoComentario: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
