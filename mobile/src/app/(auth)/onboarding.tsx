import { ArrowRight } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ds/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { markOnboardingSeen, hasSeenOnboarding } from '@/onboarding/onboardingStorage';

// The design only drew slide 1 of "01/03" in full; slides 2-3 are written here in the same
// voice/tone, drawing on the rest of the product documentation (live tracking, reviews).
const SLIDES = [
  {
    heading: 'Every trade,\none tap\naway.',
    body: 'Verified plumbers, electricians and technicians near you. Book, track and pay in one place.',
  },
  {
    heading: 'Book in\nseconds,\ntrack live.',
    body: "See real availability, confirm a time slot, and watch your pro's ETA update as they head your way.",
  },
  {
    heading: 'Rated by real\ncustomers.',
    body: "Every provider is verified and reviewed after each job, so you know who you're letting in before you book.",
  },
] as const;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [slide, setSlide] = useState(0);
  const [checking, setChecking] = useState(true);
  const colors = Colors.dark; // this screen is always shown on the accent field, not theme-dependent

  useEffect(() => {
    hasSeenOnboarding().then((seen) => {
      if (seen) {
        router.replace('/(auth)/login');
      } else {
        setChecking(false);
      }
    });
  }, []);

  function onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setSlide(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  async function goToLogin() {
    await markOnboardingSeen();
    router.replace('/(auth)/login');
  }

  async function goToRegister(role: 'CUSTOMER' | 'PROVIDER') {
    await markOnboardingSeen();
    router.push({ pathname: '/(auth)/register', params: { role } });
  }

  if (checking) {
    return <ThemedView style={[styles.container, { backgroundColor: Colors.light.accent }]} />;
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.accent }]}>
      <View style={{ paddingTop: insets.top + 10 }}>
        <ThemedText style={[styles.wordmark, { color: colors.bg }]}>QUICKFIXHUB</ThemedText>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={styles.pager}>
        {SLIDES.map((s, index) => (
          <View key={index} style={[styles.slide, { width }]}>
            <ThemedText style={[styles.counter, { color: colors.bg }]}>
              {String(index + 1).padStart(2, '0')} / 03
            </ThemedText>
            <ThemedText style={[styles.heading, { color: colors.bg }]}>{s.heading}</ThemedText>
            <ThemedText style={[styles.body, { color: colors.bg }]}>{s.body}</ThemedText>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, { backgroundColor: index === slide ? colors.bg : `${colors.bg}66` }]}
          />
        ))}
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 24 }]}>
        <Button
          label="Get started"
          block
          icon={<ArrowRight size={18} color={colors.text} />}
          style={{ backgroundColor: colors.bg }}
          onPress={() => goToRegister('CUSTOMER')}
        />
        <Pressable
          style={[styles.secondaryButton, { borderColor: `${colors.bg}80` }]}
          onPress={() => goToRegister('PROVIDER')}>
          <ThemedText style={[styles.secondaryLabel, { color: colors.bg }]}>I work as a service provider</ThemedText>
        </Pressable>
        <Pressable onPress={goToLogin} style={styles.signInRow}>
          <ThemedText style={{ color: colors.bg, opacity: 0.85, fontSize: 13 }}>
            Already registered? <ThemedText style={styles.signInLink}>Sign in</ThemedText>
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
  wordmark: {
    paddingHorizontal: 24,
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  pager: {
    flex: 1,
  },
  slide: {
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 22,
  },
  counter: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.8,
    marginBottom: 14,
  },
  heading: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 52,
    lineHeight: 50,
    marginBottom: 18,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.9,
    maxWidth: 320,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  dot: {
    width: 26,
    height: 3,
  },
  actions: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 10,
  },
  secondaryButton: {
    width: '100%',
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  secondaryLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
  },
  signInRow: {
    paddingTop: 6,
  },
  signInLink: {
    fontFamily: 'Archivo_800ExtraBold',
    textDecorationLine: 'underline',
  },
});
