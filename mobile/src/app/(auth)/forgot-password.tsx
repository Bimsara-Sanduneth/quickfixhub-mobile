import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { forgotPassword } from '@/api/auth';
import { extractErrorMessage } from '@/api/errors';
import { Button } from '@/components/ds/button';
import { Divider } from '@/components/ds/divider';
import { TextField } from '@/components/ds/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    const trimmed = email.trim().toLowerCase();
    try {
      await forgotPassword({ email: trimmed });
      // The response is 204 whether or not the account exists - move straight to the code screen
      // and let the user find out there whether a code actually arrived.
      router.replace({ pathname: '/(auth)/reset-password', params: { email: trimmed } });
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
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
        <ThemedText style={styles.title}>Forgot your{'\n'}password?</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          Enter your email and we&rsquo;ll send a 6-digit code to reset it.
        </ThemedText>

        <TextField
          label="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {error && (
          <ThemedText type="small" style={[styles.error, { color: theme.accent }]}>
            {error}
          </ThemedText>
        )}

        <Button
          label="Send reset code"
          loading={submitting}
          disabled={!email.trim()}
          onPress={onSubmit}
          block
          style={styles.submit}
        />

        <Pressable onPress={() => router.replace('/(auth)/reset-password')} style={styles.haveCodeRow}>
          <ThemedText style={[styles.haveCodeText, { color: theme.accent700 }]}>I already have a code</ThemedText>
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
  error: {
    marginTop: 12,
  },
  submit: {
    marginTop: 20,
  },
  haveCodeRow: {
    alignSelf: 'center',
    marginTop: 20,
  },
  haveCodeText: {
    fontSize: 12,
    fontFamily: 'Archivo_800ExtraBold',
  },
});
