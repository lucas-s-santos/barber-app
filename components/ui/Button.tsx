import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Radius } from '../../constants/theme';
import { useAppTheme } from '../../contexts/ThemeContext';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

const SIZES: Record<Size, { py: number; fs: number }> = {
  sm: { py: 10, fs: 14 },
  md: { py: 15, fs: 16 },
  lg: { py: 18, fs: 17 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  style,
}: ButtonProps) {
  const { theme } = useAppTheme();

  const palettes: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: theme.primary, fg: '#FFFFFF', border: 'transparent' },
    secondary: { bg: theme.card, fg: theme.text, border: theme.border },
    outline: { bg: 'transparent', fg: theme.primary, border: theme.primary },
    danger: { bg: theme.error, fg: '#FFFFFF', border: 'transparent' },
    ghost: { bg: 'transparent', fg: theme.primary, border: 'transparent' },
  };
  const p = palettes[variant];
  const s = SIZES[size];
  const isDisabled = disabled || loading;
  const hasBorder = p.border !== 'transparent';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        {
          backgroundColor: p.bg,
          borderColor: p.border,
          borderWidth: hasBorder ? 1.5 : 0,
          paddingVertical: s.py,
          opacity: isDisabled ? 0.6 : 1,
        },
        fullWidth && styles.fullWidth,
        variant === 'primary' && styles.shadow,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={s.fs + 4} color={p.fg} style={styles.icon} /> : null}
          <Text style={{ color: p.fg, fontSize: s.fs, fontWeight: '700' }}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: 18,
  },
  fullWidth: { alignSelf: 'stretch' },
  icon: { marginRight: 8 },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
});
