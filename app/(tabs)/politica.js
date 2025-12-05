// Arquivo: app/(tabs)/politica.js

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '../../contexts/ThemeContext';

export default function PoliticaScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Política de Privacidade',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 15 }}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={{ paddingTop: 100, paddingBottom: 40 }}>
        <View style={styles.section}>
          <Text style={[styles.title, { color: theme.text }]}>Política de Privacidade</Text>
          <Text style={[styles.lastUpdated, { color: theme.subtext }]}>
            Última atualização: Dezembro de 2025
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Introdução</Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            A Barber App (&apos;nós&apos;, &apos;nosso&apos; ou &apos;aplicativo&apos;) está
            comprometida em proteger sua privacidade. Esta Política de Privacidade explica como
            coletamos, usamos, divulgamos e salvaguardamos suas informações.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            2. Informações que Coletamos
          </Text>
          <Text style={[styles.subsectionTitle, { color: theme.text }]}>
            Informações Fornecidas por Você:
          </Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            • Nome completo{'\n'}• Email e telefone{'\n'}• Data de nascimento{'\n'}• Foto de perfil
            {'\n'}• Histórico de agendamentos
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            3. Como Usamos Suas Informações
          </Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            • Gerenciar sua conta e facilitar agendamentos{'\n'}• Enviar notificações e lembretes
            {'\n'}• Melhorar nossa plataforma e serviços{'\n'}• Comunicar sobre promoções e
            atualizações{'\n'}• Cumprir obrigações legais
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Segurança de Dados</Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            Implementamos medidas de segurança técnicas e organizacionais para proteger suas
            informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>5. Seus Direitos</Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            Você tem o direito de:{'\n'}• Acessar seus dados pessoais{'\n'}• Corrigir informações
            incorretas{'\n'}• Solicitar a exclusão de seus dados{'\n'}• Optar por não receber
            comunicações de marketing
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            6. Cookies e Rastreamento
          </Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            Nosso aplicativo pode usar cookies e tecnologias similares para melhorar sua
            experiência. Você pode controlar isso através das configurações do seu dispositivo.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            7. Compartilhamento de Dados
          </Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            Não compartilhamos suas informações pessoais com terceiros, exceto:{'\n'}• Com barbeiros
            para processar seus agendamentos{'\n'}• Quando exigido por lei{'\n'}• Com seu
            consentimento explícito
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>8. Contato</Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato:{'\n'}
            📧 Email: privacidade@barbeapp.com{'\n'}
            📱 WhatsApp: (11) 98765-4321
          </Text>
        </View>

        <View style={[styles.footer, { backgroundColor: theme.card }]}>
          <Ionicons name="shield-checkmark-outline" size={32} color={theme.primary} />
          <Text style={[styles.footerText, { color: theme.text }]}>
            Seus dados são importantes para nós. Tratamos com total responsabilidade.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { paddingHorizontal: 15, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  lastUpdated: { fontSize: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  subsectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 10 },
  text: { fontSize: 13, lineHeight: 20 },
  footer: {
    alignItems: 'center',
    marginHorizontal: 15,
    paddingVertical: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  footerText: { fontSize: 14, textAlign: 'center', marginTop: 10, fontWeight: '500' },
});
