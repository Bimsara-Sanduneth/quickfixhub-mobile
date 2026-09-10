import { router } from 'expo-router';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { extractErrorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ds/button';
import { Divider } from '@/components/ds/divider';
import { TextField } from '@/components/ds/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <ThemedText style={styles.wordmark}>QUICKFIXHUB</ThemedText>
        <Pressable onPress={() => router.push('/(auth)/register')}>
          <ThemedText style={[styles.registerLink, { color: theme.accent }]}>REGISTER</ThemedText>
        </Pressable>
      </View>
      <Divider style={styles.headerDivider} />

      <View style={styles.form}>
        <ThemedText style={styles.title}>Welcome{'\n'}back.</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          Sign in to book and track your jobs.
        </ThemedText>

        <TextField
          label="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.fieldGap}
        />
        <TextField
          label="Password"
          secureTextEntry={!showPassword}
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          rightElement={
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              {showPassword ? (
                <EyeOff size={16} color={theme.neutral600} />
              ) : (
                <Eye size={16} color={theme.neutral600} />
              )}
            </Pressable>
          }
        />

        <Pressable
          onPress={() => router.push({ pathname: '/(auth)/forgot-password', params: email.trim() ? { email: email.trim() } : {} })}
          style={styles.forgotRow}>
          <ThemedText style={[styles.forgotText, { color: theme.accent700 }]}>Forgot password?</ThemedText>
        </Pressable>

        {error && (
          <ThemedText type="small" style={[styles.error, { color: theme.accent }]}>
            {error}
          </ThemedText>
        )}

        <Button
          label="Sign in"
          loading={submitting}
          disabled={!email || !password}
          onPress={onSubmit}
          block
          style={styles.submit}
        />
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.footer}>
        <Divider style={styles.footerDivider} />
        <View style={styles.securityNote}>
          <Lock size={16} color={theme.accent} style={styles.securityIcon} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.securityText}>
            Sessions use short-lived access tokens with a rotating refresh token. Your device is
            registered for push at first sign-in.
          </ThemedText>
        </View>
      </View>
      <View style={[styles.createAccount, { paddingBottom: insets.bottom + 24 }]}>
        <ThemedText type="small" themeColor="textSecondary">
          New here?{' '}
          <ThemedText type="small" onPress={() => router.push('/(auth)/register')} style={styles.createAccountLink}>
            Create an account
          </ThemedText>
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
  },
  registerLink: {
    fontSize: 11,
    fontFamily: 'Archivo_800ExtraBold',
    letterSpacing: 0.5,
  },
  headerDivider: {
    marginTop: 16,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  title: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 40,
    lineHeight: 40,
    marginBottom: 6,
  },
  subtitle: {
    marginBottom: 26,
  },
  fieldGap: {
    marginBottom: 16,
  },
  forgotRow: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 12,
    fontFamily: 'Archivo_800ExtraBold',
  },
  error: {
    marginBottom: 12,
  },
  submit: {
    marginTop: 0,
  },
  footer: {
    paddingHorizontal: 24,
  },
  footerDivider: {
    marginBottom: 16,
  },
  securityNote: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 8,
  },
  securityIcon: {
    marginTop: 2,
  },
  securityText: {
    flex: 1,
    lineHeight: 16,
  },
  createAccount: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  createAccountLink: {
    fontFamily: 'Archivo_800ExtraBold',
  },
});
