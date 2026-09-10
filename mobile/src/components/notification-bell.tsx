import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { getUnreadNotificationCount } from '@/api/notifications';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './themed-text';

// Polled like the rest of this app (see MyNotificationController's comment) - a longer interval
// than the in-conversation chat poll (4s) since this badge is mounted on every screen that shows
// it, not just one open screen.
const POLL_INTERVAL_MS = 20_000;

export type NotificationBellProps = {
  /** Bell icon color - override when it sits on a colored surface (e.g. the Home hero). */
  iconColor?: string;
  /**
   * Badge fill/text/ring colors - override together when the bell sits on a colored surface
   * (e.g. theme.accent's own hero), where the default accent-on-accent badge would be invisible.
   * `ringColor` is the cutout-ring color, same convention as the avatar/cover-photo edit badges
   * (profile.tsx) - it should match whatever surface the bell sits on.
   */
  badgeColor?: string;
  badgeTextColor?: string;
  ringColor?: string;
  size?: number;
};

// Shows the actual unread count (not just a presence dot) so it reads clearly at a glance - still
// a plain rectangle, no border radius, matching this design system's zero-radius rule throughout
// (see constants/theme.ts) rather than the rounded pill a count badge usually gets.
export function NotificationBell({ iconColor, badgeColor, badgeTextColor, ringColor, size = 20 }: NotificationBellProps) {
  const theme = useTheme();

  const { data: unreadCount } = useQuery({
    queryKey: ['me', 'notifications', 'unread-count'],
    queryFn: getUnreadNotificationCount,
    refetchInterval: POLL_INTERVAL_MS,
  });

  return (
    <Pressable onPress={() => router.push('/(app)/notifications')} hitSlop={10} style={styles.wrapper}>
      <Bell size={size} color={iconColor ?? theme.text} />
      {!!unreadCount && (
        <View
          style={[
            styles.badge,
            { backgroundColor: badgeColor ?? theme.accent, borderColor: ringColor ?? theme.bg },
          ]}>
          <ThemedText style={[styles.badgeText, { color: badgeTextColor ?? theme.bg }]}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9.5,
    lineHeight: 11,
    fontFamily: 'Archivo_800ExtraBold',
  },
});
