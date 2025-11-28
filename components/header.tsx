import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

// Carrega o logo transparente que você adicionou em assets/images/logo.jpg
const logo = require('../assets/images/logo.jpg');

export default function Header() {
  const background = useThemeColor({}, 'card');
  const tint = useThemeColor({}, 'tint');

  return (
    <View style={[styles.container, { backgroundColor: background, borderBottomColor: tint }]}>
      <View style={styles.brand}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 44,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 12,
  },
});
