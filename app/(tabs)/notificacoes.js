// Arquivo: app/(tabs)/notificacoes.js

import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '../../contexts/ThemeContext';

export default function NotificacoesScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [notificacoes, setNotificacoes] = useState({
    agendamentos: true,
    cancelamentos: true,
    lembretes: true,
    promocoes: false,
    atualizacoes: true,
  });

  const handleToggle = (key) => {
    setNotificacoes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const NotificationItem = ({ icon, title, subtitle, value, onToggle }) => (
    <View style={[styles.itemContainer, { backgroundColor: theme.card }]}>
      <View style={styles.itemContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color={theme.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.itemTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.itemSubtitle, { color: theme.subtext }]}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.border, true: theme.primary + '80' }}
        thumbColor={value ? theme.primary : theme.subtext}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Notificações',
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
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Agendamentos</Text>
          <NotificationItem
            icon="calendar-outline"
            title="Confirmação de Agendamento"
            subtitle="Receba notificações quando um agendamento for confirmado"
            value={notificacoes.agendamentos}
            onToggle={() => handleToggle('agendamentos')}
          />
          <NotificationItem
            icon="close-circle-outline"
            title="Cancelamento"
            subtitle="Notificações sobre cancelamentos"
            value={notificacoes.cancelamentos}
            onToggle={() => handleToggle('cancelamentos')}
          />
          <NotificationItem
            icon="alarm-outline"
            title="Lembretes"
            subtitle="Receba lembretes antes de seus agendamentos"
            value={notificacoes.lembretes}
            onToggle={() => handleToggle('lembretes')}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Geral</Text>
          <NotificationItem
            icon="gift-outline"
            title="Promoções"
            subtitle="Ofertas e promoções especiais"
            value={notificacoes.promocoes}
            onToggle={() => handleToggle('promocoes')}
          />
          <NotificationItem
            icon="refresh-outline"
            title="Atualizações"
            subtitle="Novidades e atualizações do app"
            value={notificacoes.atualizacoes}
            onToggle={() => handleToggle('atualizacoes')}
          />
        </View>

        <View
          style={[
            styles.infoBox,
            { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 },
          ]}
        >
          <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.subtext }]}>
            As preferências de notificação serão salvas automaticamente.
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
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  itemContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  iconContainer: { marginRight: 15, width: 40, alignItems: 'center' },
  textContainer: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  itemSubtitle: { fontSize: 13, lineHeight: 18 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    padding: 12,
    borderRadius: 8,
  },
  infoText: { marginLeft: 12, flex: 1, fontSize: 13, lineHeight: 18 },
});
