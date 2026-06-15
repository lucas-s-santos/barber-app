import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius } from '../../constants/theme';
import { useAppTheme } from '../../contexts/ThemeContext';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Cor da barra lateral esquerda (status, destaque). */
  accent?: string;
};

export function Card({ children, style, accent }: CardProps) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        accent ? { borderLeftColor: accent, borderLeftWidth: 4 } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
