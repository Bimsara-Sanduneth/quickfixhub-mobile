import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { extractErrorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthContext';
import { FormInput } from '@/components/form-input';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      router.replace('/(app)');
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.form}>
        <ThemedText type="title" style={styles.title}>
          Welcome back
        </ThemedText>

        <FormInput
          placeholder="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <FormInput
          placeholder="Password"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />

        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <PrimaryButton
          label="Log in"
          loading={submitting}
          disabled={!email || !password}
          onPress={onSubmit}
          style={styles.submit}
        />

        <Link href="/(auth)/register" style={styles.link}>
          <ThemedText type="link">Don&rsquo;t have an account? Register</ThemedText>
        </Link>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  form: {
    width: '100%',
    maxWidth: MaxContentWidth / 2,
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  error: {
    color: '#d33',
    textAlign: 'center',
  },
  submit: {
    marginTop: Spacing.two,
  },
  link: {
    alignSelf: 'center',
    marginTop: Spacing.two,
  },
});
