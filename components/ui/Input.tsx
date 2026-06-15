import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Radius } from '../../constants/theme';
import { useAppTheme } from '../../contexts/ThemeContext';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  icon?: IconName;
};

export function Input({ label, error, icon, style, ...props }: InputProps) {
  const { theme } = useAppTheme();
  // Borda estática: mudar elevação/sombra no foco recria a view no Android
  // (nova arquitetura) e faz o campo PERDER o foco ao tocar. Por isso, sem
  // efeito de foco que altere layout — só a cor da borda muda quando há erro.
  const borderColor = error ? theme.error : theme.border;

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: theme.subtext }]}>{label}</Text> : null}
      <View style={[styles.field, { backgroundColor: theme.card, borderColor }]}>
        {icon ? <Ionicons name={icon} size={20} color={theme.subtext} style={styles.icon} /> : null}
        <TextInput
          placeholderTextColor={theme.subtext}
          style={[styles.input, { color: theme.text }, style]}
          {...props}
        />
      </View>
      {error ? <Text style={[styles.error, { color: theme.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, height: '100%' },
  error: { fontSize: 12, marginTop: 4, marginLeft: 2 },
});
