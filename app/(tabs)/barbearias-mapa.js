// Rota única do mapa. O Metro escolhe a implementação por plataforma:
//   web   -> components/BarbeariasMapView.js (fallback, sem mapa nativo)
//   nativo-> components/BarbeariasMapView.native.js (react-native-maps)
import BarbeariasMapView from '../../components/BarbeariasMapView';

export default function BarbeariasMapaScreen() {
  return <BarbeariasMapView />;
}
