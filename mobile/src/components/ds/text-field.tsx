import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';

export type TextFieldProps = TextInputProps & {
  label?: string;
  /** e.g. a show/hide-password eye icon, rendered inside the field on the right. */
  rightElement?: ReactNode;
  error?: string;
};

// Matches .field + .input: label above in small caps-weight text, a bordered box with a 44px
// touch target (the design's own .input is 36px for desktop forms; mobile screens throughout
// the mockups use 44px explicitly), and an accent border on focus.
export function TextField({ label, rightElement, error, style, onFocus, onBlur, ...rest }: TextFieldProps) {
  const theme = useTheme();

  return (
    <View>
      {label && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
      )}
      <View style={[styles.box, { backgroundColor: theme.surface, borderColor: error ? theme.accent : theme.divider }]}>
        <TextInput
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }, style]}
          {...rest}
        />
        {rightElement}
      </View>
      {error && (
        <ThemedText type="small" style={[styles.error, { color: theme.accent }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 5,
  },
  box: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  error: {
    marginTop: 5,
  },
});
