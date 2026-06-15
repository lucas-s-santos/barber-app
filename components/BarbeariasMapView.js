// Versão WEB (fallback) do mapa — o Metro usa este arquivo no navegador,
// e o BarbeariasMapView.native.js no Android/iOS. Sem react-native-maps aqui.
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../contexts/ThemeContext';

export default function BarbeariasMapView() {
  const router = useRouter();
  const { theme } = useAppTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}
    >
      <View style={[styles.webMessageContainer, { backgroundColor: theme.card }]}>
        <Ionicons name="map-outline" size={64} color={theme.subtext} />
        <Text style={[styles.webMessageTitle, { color: theme.text }]}>
          Mapa disponível no celular
        </Text>
        <Text style={[styles.webMessageText, { color: theme.subtext }]}>
          O mapa com localização em tempo real aparece no app mobile (Android/iOS). Use a lista para
          ver as barbearias por aqui.
        </Text>
        <TouchableOpacity
          style={[styles.webButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/(tabs)/barbearias-lista')}
        >
          <Text style={[styles.webButtonText, { color: theme.background }]}>
            Ver Lista de Barbearias
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  webMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    margin: 20,
    borderRadius: 16,
    maxWidth: 500,
  },
  webMessageTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 20, textAlign: 'center' },
  webMessageText: { fontSize: 16, marginTop: 10, textAlign: 'center', lineHeight: 24 },
  webButton: { marginTop: 30, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 },
  webButtonText: { fontSize: 16, fontWeight: '600' },
});
