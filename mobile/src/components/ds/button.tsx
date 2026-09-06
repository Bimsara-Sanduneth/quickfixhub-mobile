import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  block?: boolean;
  /** Trailing icon (e.g. an ArrowRight) — pushes the label flush left, icon flush right. */
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

// Matches the design system's .btn / .btn-primary / .btn-secondary / .btn-block: zero radius,
// Archivo 800 label, flush-left text (never centered) with an optional trailing icon.
export function Button({ label, variant = 'primary', loading, block, icon, disabled, style, ...rest }: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const variantStyle: StyleProp<ViewStyle> =
    variant === 'primary'
      ? { backgroundColor: theme.accent }
      : variant === 'secondary'
        ? { borderWidth: 1, borderColor: theme.divider, backgroundColor: 'transparent' }
        : { backgroundColor: 'transparent', paddingHorizontal: 4 };

  const labelColor = variant === 'primary' ? theme.bg : variant === 'ghost' ? theme.accent : theme.text;

  return (
    <Pressable
      style={[
        styles.base,
        variantStyle,
        block && styles.block,
        icon ? styles.withIcon : undefined,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <>
          <ThemedText style={[styles.label, { color: labelColor }]}>{label}</ThemedText>
          {icon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  block: {
    width: '100%',
  },
  withIcon: {
    justifyContent: 'space-between',
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
  },
});
