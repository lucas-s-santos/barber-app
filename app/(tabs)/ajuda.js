// Arquivo: app/(tabs)/ajuda.js

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppTheme } from '../../contexts/ThemeContext';

export default function AjudaScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      pergunta: 'Como agendar um compromisso?',
      resposta:
        'Acesse a aba "Agendar", escolha o serviço desejado, selecione a data e horário, e clique em "Confirmar".',
    },
    {
      id: 2,
      pergunta: 'Como cancelar um agendamento?',
      resposta:
        'Vá para "Agendamentos", abra o agendamento que deseja cancelar e clique em "Cancelar".',
    },
    {
      id: 3,
      pergunta: 'Posso remanejar meu agendamento?',
      resposta:
        'No momento, você pode cancelar e criar um novo agendamento. Em breve adicionaremos a função de remarcação.',
    },
    {
      id: 4,
      pergunta: 'Como editar meu perfil?',
      resposta: 'Acesse a aba "Perfil", clique em "Editar Perfil" e faça as alterações desejadas.',
    },
  ];

  const contactos = [
    {
      icon: 'call-outline',
      label: 'Telefone',
      value: '(11) 98765-4321',
      action: () => Linking.openURL('tel:(11)987654321'),
    },
    {
      icon: 'mail-outline',
      label: 'Email',
      value: 'suporte@barbeapp.com',
      action: () => Linking.openURL('mailto:suporte@barbeapp.com'),
    },
    {
      icon: 'logo-whatsapp',
      label: 'WhatsApp',
      value: '(11) 98765-4321',
      action: () => Linking.openURL('https://wa.me/5511987654321'),
    },
  ];

  const FaqItem = ({ item }) => (
    <View style={[styles.faqContainer, { backgroundColor: theme.card }]}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
      >
        <Text style={[styles.pergunta, { color: theme.text }]}>{item.pergunta}</Text>
        <Ionicons
          name={expandedFaq === item.id ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.primary}
        />
      </TouchableOpacity>
      {expandedFaq === item.id && (
        <View style={[styles.faqContent, { borderTopColor: theme.border }]}>
          <Text style={[styles.resposta, { color: theme.subtext }]}>{item.resposta}</Text>
        </View>
      )}
    </View>
  );

  const ContactItem = ({ icon, label, value, action }) => (
    <TouchableOpacity
      style={[styles.contactItem, { backgroundColor: theme.card }]}
      onPress={action}
    >
      <View style={[styles.contactIcon, { backgroundColor: theme.primary + '15' }]}>
        <Ionicons name={icon} size={24} color={theme.primary} />
      </View>
      <View style={styles.contactInfo}>
        <Text style={[styles.contactLabel, { color: theme.subtext }]}>{label}</Text>
        <Text style={[styles.contactValue, { color: theme.text }]}>{value}</Text>
      </View>
      <Ionicons name="open-outline" size={20} color={theme.primary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Ajuda e Suporte',
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
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Fale Conosco</Text>
          {contactos.map((contact) => (
            <ContactItem
              key={contact.label}
              icon={contact.icon}
              label={contact.label}
              value={contact.value}
              action={contact.action}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Perguntas Frequentes</Text>
          <FlatList
            data={faqs}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <FaqItem item={item} />}
            scrollEnabled={false}
            nestedScrollEnabled={false}
          />
        </View>

        <View style={styles.supportBox}>
          <Ionicons name="help-circle-outline" size={32} color={theme.primary} />
          <Text style={[styles.supportText, { color: theme.text }]}>
            Não encontrou o que procurava?
          </Text>
          <Text style={[styles.supportSubtext, { color: theme.subtext }]}>
            Entre em contato conosco através de um dos canais acima. Responderemos em breve!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { paddingHorizontal: 15, marginBottom: 30 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactInfo: { flex: 1 },
  contactLabel: { fontSize: 12, marginBottom: 4 },
  contactValue: { fontSize: 15, fontWeight: '600' },
  faqContainer: {
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  pergunta: { fontSize: 14, fontWeight: '600', flex: 1, marginRight: 10 },
  faqContent: { borderTopWidth: 1, paddingHorizontal: 15, paddingVertical: 12 },
  resposta: { fontSize: 13, lineHeight: 20 },
  supportBox: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 30,
    marginHorizontal: 15,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  supportText: { fontSize: 16, fontWeight: '600', marginTop: 15, textAlign: 'center' },
  supportSubtext: { fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 18 },
});
