import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/auth/AuthContext';

export default function AuthLayout() {
  const { status } = useAuth();

  if (status === 'authenticated') {
    return <Redirect href="/(app)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
