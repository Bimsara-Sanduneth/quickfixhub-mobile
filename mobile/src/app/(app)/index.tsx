import { StyleSheet } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const { logout } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        You&rsquo;re in
      </ThemedText>
      <ThemedText type="default">The QuickFixHub mobile foundation is wired up.</ThemedText>
      <PrimaryButton label="Log out" onPress={logout} style={styles.button} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.three,
  },
});
