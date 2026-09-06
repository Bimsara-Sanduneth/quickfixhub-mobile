import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

// The design system's `.hr` — a strong 2px rule, not a hairline. Used between major sections
// throughout, never softened.
export function Divider(props: ViewProps) {
  const theme = useTheme();
  return <View {...props} style={[{ height: 2, backgroundColor: theme.divider }, props.style]} />;
}
