import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '../../contexts/ThemeContext';
import { getAllBarbearias } from '../../supabaseClient';

const { width, height } = Dimensions.get('window');

export default function BarbeariasMapaScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();

  const [barbearias, setBarbearias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [region, setRegion] = useState(null);

  async function requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      } else {
        // Se não der permissão, usa localização padrão (São Paulo)
        setRegion({
          latitude: -23.5505,
          longitude: -46.6333,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      }
    } catch (error) {
      console.log('Erro ao obter localização:', error);
      // Em caso de erro, usa localização padrão
      setRegion({
        latitude: -23.5505,
        longitude: -46.6333,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    }
  }

  async function loadBarbearias() {
    const { data, error } = await getAllBarbearias();
    if (!error && data) {
      const barbeariasFiltradas = data.filter((b) => b.latitude != null && b.longitude != null);
      setBarbearias(barbeariasFiltradas);
    }
    setLoading(false);
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      await requestLocationPermission();
      await loadBarbearias();
    }
    init();
  }, []);

  function centerOnUser() {
    if (userLocation) {
      setRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } else {
      Alert.alert('Localização', 'Não foi possível obter sua localização');
    }
  }

  if (loading || !region) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={['top', 'bottom']}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {barbearias.map((barbearia) => (
          <Marker
            key={barbearia.id}
            coordinate={{
              latitude: barbearia.latitude,
              longitude: barbearia.longitude,
            }}
            title={barbearia.nome_barbearia}
            description={barbearia.endereco}
            onCalloutPress={() => router.push(`/(tabs)/barbearia-detalhes?id=${barbearia.id}`)}
          >
            <View style={[styles.markerContainer, { backgroundColor: theme.primary }]}>
              <Ionicons name="cut" size={20} color={theme.background} />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={[styles.headerOverlay, { top: 10 }]}>
        <TouchableOpacity
          style={[styles.listButton, { backgroundColor: theme.card }]}
          onPress={() => router.push('/(tabs)/barbearias-lista')}
        >
          <Ionicons name="list" size={24} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.locationButton, { backgroundColor: theme.card }]}
          onPress={centerOnUser}
        >
          <Ionicons name="locate" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {barbearias.length === 0 && (
        <View style={[styles.emptyOverlay, { backgroundColor: theme.card }]}>
          <Ionicons name="location-outline" size={48} color={theme.subtext} />
          <Text style={[styles.emptyText, { color: theme.subtext }]}>
            Nenhuma barbearia com localização disponível
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width: width,
    height: height,
  },
  headerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  listButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  emptyOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});
