import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { forgotPassword, resetPassword } from '@/api/auth';
import { extractErrorMessage } from '@/api/errors';
import { Button } from '@/components/ds/button';
import { Divider } from '@/components/ds/divider';
import { TextField } from '@/components/ds/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendNote, setResendNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const emailFixed = !!params.email;
  const passwordsMatch = password === confirm;
  const canSubmit =
    email.trim().length > 0 && code.length === 6 && password.length >= MIN_PASSWORD_LENGTH && passwordsMatch;

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword({ email: email.trim().toLowerCase(), code, newPassword: password });
      setDone(true);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    setResendNote(null);
    setError(null);
    try {
      await forgotPassword({ email: email.trim().toLowerCase() });
      setResendNote('If that email has an account, a new code is on its way.');
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  }

  if (done) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <ThemedText style={styles.headerTitle}>RESET PASSWORD</ThemedText>
        </View>
        <Divider style={styles.headerDivider} />
        <View style={styles.form}>
          <View style={[styles.doneBadge, { backgroundColor: theme.accent100 }]}>
            <Check size={18} color={theme.accent} strokeWidth={3} />
          </View>
          <ThemedText style={styles.title}>Password{'\n'}reset.</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            Sign in with your new password. Any other devices have been signed out.
          </ThemedText>
          <Button label="Back to sign in" onPress={() => router.replace('/(auth)/login')} block style={styles.submit} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>RESET PASSWORD</ThemedText>
      </View>
      <Divider style={styles.headerDivider} />

      <View style={styles.form}>
        <ThemedText style={styles.title}>Enter your{'\n'}code.</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          {emailFixed
            ? `We sent a 6-digit code to ${params.email}. It expires in 15 minutes.`
            : 'Enter the email you used and the 6-digit code we sent you.'}
        </ThemedText>

        {!emailFixed && (
          <TextField
            label="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.fieldGap}
          />
        )}

        <TextField
          label="6-digit code"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ''))}
          style={styles.fieldGap}
        />
        <TextField
          label="New password"
          secureTextEntry={!showPassword}
          autoComplete="password-new"
          value={password}
          onChangeText={setPassword}
          style={styles.fieldGap}
          rightElement={
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              {showPassword ? <EyeOff size={16} color={theme.neutral600} /> : <Eye size={16} color={theme.neutral600} />}
            </Pressable>
          }
        />
        <TextField
          label="Confirm new password"
          secureTextEntry={!showPassword}
          value={confirm}
          onChangeText={setConfirm}
          error={confirm.length > 0 && !passwordsMatch ? "Passwords don't match" : undefined}
        />

        {password.length > 0 && password.length < MIN_PASSWORD_LENGTH && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            At least {MIN_PASSWORD_LENGTH} characters.
          </ThemedText>
        )}

        {error && (
          <ThemedText type="small" style={[styles.error, { color: theme.accent }]}>
            {error}
          </ThemedText>
        )}
        {resendNote && (
          <ThemedText type="small" style={[styles.error, { color: theme.accent800 }]}>
            {resendNote}
          </ThemedText>
        )}

        <Button
          label="Reset password"
          loading={submitting}
          disabled={!canSubmit}
          onPress={onSubmit}
          block
          style={styles.submit}
        />

        <Pressable onPress={onResend} disabled={!email.trim()} style={styles.resendRow}>
          <ThemedText style={[styles.resendText, { color: email.trim() ? theme.accent700 : theme.textSecondary }]}>
            Resend code
          </ThemedText>
        </Pressable>
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
    gap: 12,
  },
  headerTitle: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
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
    lineHeight: 18,
  },
  fieldGap: {
    marginBottom: 14,
  },
  hint: {
    marginTop: 8,
  },
  error: {
    marginTop: 12,
  },
  submit: {
    marginTop: 20,
  },
  resendRow: {
    alignSelf: 'center',
    marginTop: 20,
  },
  resendText: {
    fontSize: 12,
    fontFamily: 'Archivo_800ExtraBold',
  },
  doneBadge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
});
