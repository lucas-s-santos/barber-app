import { ActivityIndicator, View } from 'react-native';

// Esta é a tela de ponto de partida.
// Ela simplesmente existe para dar ao Expo Router um local inicial.
// A lógica no _layout.js fará o redirecionamento a partir daqui.
export default function StartPage() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#121212' }}>
      <ActivityIndicator size="large" color="#E50914" />
    </View>
  );
}
