import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Eye, EyeOff, User, Wrench } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { extractErrorMessage } from '@/api/errors';
import type { RegisterRequest } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ds/button';
import { Divider } from '@/components/ds/divider';
import { TextField } from '@/components/ds/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

type SelectableRole = RegisterRequest['role'];

function passwordStrength(password: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (!password) return { score: 0, label: '' };
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasDigitOrSymbol = /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password);
  if (password.length < 8) return { score: 1, label: 'Weak' };
  if (password.length >= 12 && hasMixedCase && hasDigitOrSymbol) {
    return { score: 3, label: 'Strong — 12+ characters, mixed case' };
  }
  if (password.length >= 8 && hasMixedCase) return { score: 2, label: 'Medium' };
  return { score: 1, label: 'Weak' };
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { register } = useAuth();
  const params = useLocalSearchParams<{ role?: string }>();

  const [role, setRole] = useState<SelectableRole>(params.role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const canSubmit =
    fullName.trim().length > 0 && email.trim().length > 0 && password.length >= 8 && agreedToTerms;

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        role,
      });
      // No explicit navigation here: (auth)/_layout redirects to /(app) once authenticated,
      // and (app)/index.tsx routes on to profile-completion when justRegistered is set - a
      // single authoritative redirect chain instead of racing it with a manual one.
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
        <ThemedText style={styles.headerTitle}>CREATE ACCOUNT</ThemedText>
      </View>
      <Divider style={styles.headerDivider} />

      <View style={styles.form}>
        <ThemedText type="smallBold" style={styles.sectionLabel}>
          I am a
        </ThemedText>
        <View style={[styles.roleGrid, { backgroundColor: theme.divider }]}>
          <Pressable
            style={[styles.roleTile, { backgroundColor: role === 'CUSTOMER' ? theme.accent : theme.bg }]}
            onPress={() => setRole('CUSTOMER')}>
            <User size={20} color={role === 'CUSTOMER' ? theme.bg : theme.accent} />
            <View>
              <ThemedText style={[styles.roleTitle, { color: role === 'CUSTOMER' ? theme.bg : theme.text }]}>
                Customer
              </ThemedText>
              <ThemedText style={[styles.roleSubtitle, { color: role === 'CUSTOMER' ? theme.bg : theme.textSecondary }]}>
                Book services
              </ThemedText>
            </View>
          </Pressable>
          <Pressable
            style={[styles.roleTile, { backgroundColor: role === 'PROVIDER' ? theme.accent : theme.bg }]}
            onPress={() => setRole('PROVIDER')}>
            <Wrench size={20} color={role === 'PROVIDER' ? theme.bg : theme.accent} />
            <View>
              <ThemedText style={[styles.roleTitle, { color: role === 'PROVIDER' ? theme.bg : theme.text }]}>
                Provider
              </ThemedText>
              <ThemedText style={[styles.roleSubtitle, { color: role === 'PROVIDER' ? theme.bg : theme.textSecondary }]}>
                Take jobs
              </ThemedText>
            </View>
          </Pressable>
        </View>

        <TextField label="Full name" autoComplete="name" value={fullName} onChangeText={setFullName} style={styles.fieldGap} />
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
          label="Phone"
          autoComplete="tel"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          style={styles.fieldGap}
        />
        <TextField
          label="Password"
          secureTextEntry={!showPassword}
          autoComplete="password-new"
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
        {password.length > 0 && (
          <>
            <View style={styles.strengthBars}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[styles.strengthBar, { backgroundColor: i < strength.score ? theme.accent : theme.neutral300 }]}
                />
              ))}
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.strengthLabel}>
              {strength.label}
            </ThemedText>
          </>
        )}

        {error && (
          <ThemedText type="small" style={[styles.error, { color: theme.accent }]}>
            {error}
          </ThemedText>
        )}
      </View>

      <View style={{ flex: 1 }} />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable style={styles.termsRow} onPress={() => setAgreedToTerms((v) => !v)}>
          <View style={[styles.checkbox, { borderColor: theme.accent, backgroundColor: agreedToTerms ? theme.accent : 'transparent' }]}>
            {agreedToTerms && <Check size={11} color={theme.bg} strokeWidth={3.5} />}
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.termsText}>
            I agree to the Terms of Service and the Privacy Policy.
          </ThemedText>
        </Pressable>
        <Button label="Create account" loading={submitting} disabled={!canSubmit} onPress={onSubmit} block />
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
    paddingTop: 24,
  },
  sectionLabel: {
    marginBottom: 10,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 26,
  },
  roleTile: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  roleTitle: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 14,
  },
  roleSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  fieldGap: {
    marginBottom: 14,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 7,
  },
  strengthBar: {
    height: 3,
    flex: 1,
  },
  strengthLabel: {
    marginTop: 5,
  },
  error: {
    marginTop: 12,
  },
  footer: {
    paddingHorizontal: 24,
  },
  termsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    flex: 1,
    lineHeight: 16,
  },
});
