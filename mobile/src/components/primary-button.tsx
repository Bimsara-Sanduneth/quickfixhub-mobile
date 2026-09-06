import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from './themed-text';

export type PrimaryButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, loading, disabled, style, ...rest }: PrimaryButtonProps) {
  return (
    <Pressable
      style={[styles.button, (disabled || loading) && styles.buttonDisabled, style]}
      disabled={disabled || loading}
      {...rest}>
      {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.label}>{label}</ThemedText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#3c87f7',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  label: {
    color: '#fff',
    fontWeight: '600',
  },
});
