// Arquivo: app/(tabs)/termos.js

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '../../contexts/ThemeContext';

export default function TermosScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Termos de Uso',
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
          <Text style={[styles.title, { color: theme.text }]}>Termos de Uso</Text>
          <Text style={[styles.lastUpdated, { color: theme.subtext }]}>
            Última atualização: Dezembro de 2025
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>1. Aceitação dos Termos</Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            Ao acessar e usar a Barber App, você aceita estes Termos de Uso. Se não concordar com
            qualquer parte, não use o aplicativo.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>2. Uso Autorizado</Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            Você concorda em usar este aplicativo apenas para fins legais e de uma forma que não
            infrinja os direitos de terceiros ou restrinja seu uso e gozo.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>3. Conta do Usuário</Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            • Você é responsável por manter a confidencialidade de sua senha{'\n'}• Você é
            responsável por todas as atividades em sua conta{'\n'}• Você concorda em notificar-nos
            sobre qualquer uso não autorizado
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>4. Agendamentos</Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            • Os agendamentos devem ser cancelados com 24 horas de antecedência{'\n'}• Cancelamentos
            tardios podem estar sujeitos a taxas{'\n'}• A Barber App não é responsável por atrasos
            dos barbeiros
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            5. Isenção de Responsabilidade
          </Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            O aplicativo é fornecido &apos;como está&apos;. Não garantimos que será sem erros ou que
            atenderá suas expectativas. Não nos responsabilizamos por danos diretos, indiretos ou
            consequentes.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            6. Limitação de Responsabilidade
          </Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            Qualquer responsabilidade da Barber App está limitada ao valor total pago por você nos
            últimos 12 meses.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>7. Modificações</Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            Reservamos o direito de modificar estes Termos a qualquer momento. As alterações serão
            efetivas imediatamente após a publicação no aplicativo.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>8. Rescisão</Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            Podemos rescindir sua conta e acesso ao aplicativo sem aviso prévio, por qualquer razão,
            incluindo violação destes Termos.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>9. Lei Aplicável</Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            Estes Termos serão regidos e interpretados de acordo com as leis do Brasil.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>10. Contato</Text>
          <Text style={[styles.text, { color: theme.subtext }]}>
            Para questões sobre estes Termos, entre em contato:{'\n'}
            📧 Email: legal@barbeapp.com{'\n'}
            📱 WhatsApp: (11) 98765-4321
          </Text>
        </View>

        <View style={[styles.footer, { backgroundColor: theme.card }]}>
          <Ionicons name="document-text-outline" size={32} color={theme.primary} />
          <Text style={[styles.footerText, { color: theme.text }]}>
            Ao usar nosso app, você concorda com estes termos.
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
