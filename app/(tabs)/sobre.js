// Arquivo: app/(tabs)/sobre.js

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '../../contexts/ThemeContext';

export default function SobreScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const features = [
    {
      icon: 'calendar-outline',
      title: 'Agendamentos Fáceis',
      desc: 'Agende seus compromissos com poucos toques',
    },
    {
      icon: 'notifications-outline',
      title: 'Lembretes',
      desc: 'Receba notificações sobre seus agendamentos',
    },
    { icon: 'star-outline', title: 'Avaliações', desc: 'Veja avaliações de barbeiros e serviços' },
    {
      icon: 'bar-chart-outline',
      title: 'Histórico',
      desc: 'Acompanhe todo seu histórico de agendamentos',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Sobre o App',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 15 }}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ paddingTop: 100, paddingBottom: 40 }}>
        <View style={styles.logoContainer}>
          <View style={[styles.logoBg, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons name="cut-outline" size={60} color={theme.primary} />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>Barber App</Text>
          <Text style={[styles.version, { color: theme.subtext }]}>Versão 1.0.0</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>O que é?</Text>
          <Text style={[styles.description, { color: theme.subtext }]}>
            Barber App é uma plataforma moderna de agendamento para barbearias. Conecta clientes com
            barbeiros, facilitando a marcação de compromissos e melhorando a experiência de ambos.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Principais Funcionalidades
          </Text>
          {features.map((feature, index) => (
            <View key={index} style={[styles.featureItem, { backgroundColor: theme.card }]}>
              <View style={[styles.featureIcon, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name={feature.icon} size={24} color={theme.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
                <Text style={[styles.featureDesc, { color: theme.subtext }]}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Sobre Nós</Text>
          <View style={[styles.infoBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.infoText, { color: theme.text }]}>
              Desenvolvido com dedicação para revolucionar a forma como você marca seus compromissos
              na barbearia.
            </Text>
            <Text style={[styles.infoSmall, { color: theme.subtext, marginTop: 15 }]}>
              © 2025 Barber App. Todos os direitos reservados.
            </Text>
            <Text style={[styles.infoSmall, { color: theme.subtext }]}>
              Feito com ❤️ para a comunidade de barbearias
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Mais Informações</Text>
          <TouchableOpacity
            style={[styles.linkItem, { backgroundColor: theme.card }]}
            onPress={() => router.push('/(tabs)/politica')}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
            <Text style={[styles.linkText, { color: theme.text }]}>Política de Privacidade</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={theme.subtext} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.linkItem, { backgroundColor: theme.card }]}
            onPress={() => router.push('/(tabs)/termos')}
          >
            <Ionicons name="document-text-outline" size={20} color={theme.primary} />
            <Text style={[styles.linkText, { color: theme.text }]}>Termos de Uso</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={theme.subtext} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  appName: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  version: { fontSize: 14 },
  section: { paddingHorizontal: 15, marginBottom: 30 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  description: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  featureDesc: { fontSize: 12, lineHeight: 16 },
  infoBox: {
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  infoText: { fontSize: 14, lineHeight: 20 },
  infoSmall: { fontSize: 12, lineHeight: 18 },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  linkText: { flex: 1, marginLeft: 15, fontSize: 15, fontWeight: '600' },
});
