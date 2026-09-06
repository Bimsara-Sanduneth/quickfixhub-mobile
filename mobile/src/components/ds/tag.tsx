import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';

export type TagVariant = 'accent' | 'neutral' | 'outline' | 'solid';

export type TagProps = ViewProps & {
  label: string;
  variant?: TagVariant;
};

// Matches .tag / .tag-accent / .tag-neutral / .tag-outline. "solid" (filled accent, bg-colored
// text) is the fourth look used throughout the mockups for the loudest status pills (e.g. EN
// ROUTE) that the design system doesn't name as its own class but repeats constantly inline.
export function Tag({ label, variant = 'neutral', style, ...rest }: TagProps) {
  const theme = useTheme();

  const variantStyle =
    variant === 'accent'
      ? { backgroundColor: theme.accent100 }
      : variant === 'outline'
        ? { borderWidth: 1, borderColor: theme.accent }
        : variant === 'solid'
          ? { backgroundColor: theme.accent }
          : { backgroundColor: theme.neutral100 };

  const textColor =
    variant === 'accent' ? theme.accent800 : variant === 'outline' ? theme.accent : variant === 'solid' ? theme.bg : theme.neutral800;

  return (
    <View style={[styles.base, variantStyle, style]} {...rest}>
      <ThemedText style={[styles.label, { color: textColor }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Archivo_800ExtraBold',
    letterSpacing: 0.2,
  },
});
