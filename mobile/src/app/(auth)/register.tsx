import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { extractErrorMessage } from '@/api/errors';
import type { RegisterRequest } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { FormInput } from '@/components/form-input';
import { PrimaryButton } from '@/components/primary-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SelectableRole = RegisterRequest['role'];
const ROLE_OPTIONS: { value: SelectableRole; label: string }[] = [
  { value: 'CUSTOMER', label: "I'm looking for services" },
  { value: 'PROVIDER', label: "I'm offering services" },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const theme = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<SelectableRole>('CUSTOMER');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await register({ email: email.trim(), password, fullName: fullName.trim(), role });
      router.replace('/(app)');
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = fullName.trim().length > 0 && email.trim().length > 0 && password.length >= 8;

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.form}>
        <ThemedText type="title" style={styles.title}>
          Create your account
        </ThemedText>

        <FormInput placeholder="Full name" autoComplete="name" value={fullName} onChangeText={setFullName} />
        <FormInput
          placeholder="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <FormInput
          placeholder="Password (min. 8 characters)"
          secureTextEntry
          autoComplete="password-new"
          value={password}
          onChangeText={setPassword}
        />

        <ThemedView style={styles.roleGroup}>
          {ROLE_OPTIONS.map((option) => {
            const selected = option.value === role;
            return (
              <Pressable
                key={option.value}
                onPress={() => setRole(option.value)}
                style={[
                  styles.roleOption,
                  { borderColor: theme.backgroundSelected },
                  selected && { backgroundColor: theme.backgroundSelected },
                ]}>
                <ThemedText type="small">{option.label}</ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>

        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <PrimaryButton
          label="Create account"
          loading={submitting}
          disabled={!canSubmit}
          onPress={onSubmit}
          style={styles.submit}
        />

        <Link href="/(auth)/login" style={styles.link}>
          <ThemedText type="link">Already have an account? Log in</ThemedText>
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
  roleGroup: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  roleOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
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
