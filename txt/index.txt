// Arquivo: app/index.js
import { ActivityIndicator, View } from 'react-native';

// Esta é uma tela "fantasma".
// Sua única função é existir para que o Expo Router tenha um ponto de partida.
// A lógica no `app/_layout.js` vai redirecionar o usuário
// para a tela de login ou para as abas imediatamente.
export default function StartPage() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#121212' }}>
      <ActivityIndicator size="large" color="#E50914" />
    </View>
  );
}
