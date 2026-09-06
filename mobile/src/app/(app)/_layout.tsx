import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import { ThemedView } from '@/components/themed-view';

export default function AppLayout() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack />;
}
