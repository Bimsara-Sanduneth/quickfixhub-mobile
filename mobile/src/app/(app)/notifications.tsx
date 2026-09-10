import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { ArrowLeft, CheckCheck } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { extractErrorMessage } from '@/api/errors';
import { getCurrentUser } from '@/api/me';
import { listMyNotifications, markAllNotificationsRead, markNotificationRead } from '@/api/notifications';
import type { AppNotification } from '@/api/types';
import { Divider } from '@/components/ds/divider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

const POLL_INTERVAL_MS = 10_000;

const VERIFICATION_TYPES: AppNotification['type'][] = ['VERIFICATION_APPROVED', 'VERIFICATION_REJECTED', 'VERIFICATION_DOCS_REQUESTED'];

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getCurrentUser });
  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['me', 'notifications'],
    queryFn: listMyNotifications,
    refetchInterval: POLL_INTERVAL_MS,
  });

  function invalidateUnreadCount() {
    queryClient.invalidateQueries({ queryKey: ['me', 'notifications', 'unread-count'] });
  }

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (updated) => {
      queryClient.setQueryData<AppNotification[]>(['me', 'notifications'], (prev) =>
        prev?.map((n) => (n.id === updated.id ? updated : n)),
      );
      invalidateUnreadCount();
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.setQueryData<AppNotification[]>(['me', 'notifications'], (prev) => prev?.map((n) => ({ ...n, read: true })));
      invalidateUnreadCount();
    },
  });

  function openNotification(notification: AppNotification) {
    if (!notification.read) {
      markReadMutation.mutate(notification.id);
    }

    if (VERIFICATION_TYPES.includes(notification.type)) {
      router.push('/(app)/provider-verification');
      return;
    }
    if (!notification.bookingId) return;

    if (notification.type === 'NEW_MESSAGE') {
      router.push({ pathname: '/(app)/chat/[bookingId]', params: { bookingId: notification.bookingId } });
      return;
    }
    router.push(
      me?.role === 'PROVIDER'
        ? { pathname: '/(app)/provider-bookings/[bookingId]', params: { bookingId: notification.bookingId } }
        : { pathname: '/(app)/bookings/[bookingId]', params: { bookingId: notification.bookingId } },
    );
  }

  const hasUnread = !!data?.some((n) => !n.read);

  function renderNotification({ item }: { item: AppNotification }) {
    return (
      <Pressable style={[styles.row, { borderColor: theme.divider }]} onPress={() => openNotification(item)}>
        {!item.read && <View style={[styles.unreadBar, { backgroundColor: theme.accent }]} />}
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <ThemedText type="smallBold" style={styles.title}>
              {item.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.time}>
              {timeAgo(item.createdAt)}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.body}>
            {item.body}
          </ThemedText>
        </View>
      </Pressable>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>NOTIFICATIONS</ThemedText>
        {hasUnread ? (
          <Pressable onPress={() => markAllReadMutation.mutate()} hitSlop={8} disabled={markAllReadMutation.isPending}>
            <CheckCheck size={20} color={theme.text} />
          </Pressable>
        ) : (
          <View style={{ width: 20 }} />
        )}
      </View>
      <Divider style={styles.headerDivider} />

      {isPending ? (
        <ActivityIndicator style={styles.loading} />
      ) : isError ? (
        <View style={styles.centered}>
          <ThemedText type="small" style={{ color: theme.accent }}>
            {extractErrorMessage(error)}
          </ThemedText>
          <Pressable onPress={() => refetch()}>
            <ThemedText type="link">Try again</ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              Nothing yet - booking updates, new messages and verification decisions will show up here.
            </ThemedText>
          }
          renderItem={renderNotification}
        />
      )}
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
    gap: 12,
  },
  headerTitle: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
  },
  headerDivider: {
    marginTop: 16,
  },
  loading: {
    marginTop: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  listContent: {
    flexGrow: 1,
    padding: 20,
    gap: 10,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 18,
    paddingVertical: 32,
  },
  row: {
    flexDirection: 'row',
    borderWidth: 1,
  },
  unreadBar: {
    width: 3,
  },
  rowContent: {
    flex: 1,
    padding: 12,
    gap: 3,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
  },
  time: {
    flexShrink: 0,
  },
  body: {
    lineHeight: 17,
  },
});
