import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { ArrowLeft, MessageSquare } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { extractErrorMessage } from '@/api/errors';
import { listConversations } from '@/api/messages';
import type { Conversation } from '@/api/types';
import { Divider } from '@/components/ds/divider';
import { Tag } from '@/components/ds/tag';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { STATUS_LABEL, STATUS_TAG_VARIANT } from '@/utils/booking';

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ConversationsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['conversations'],
    queryFn: listConversations,
  });

  function openChat(conversation: Conversation) {
    router.push({
      pathname: '/(app)/chat/[bookingId]',
      params: { bookingId: conversation.bookingId, otherPartyName: conversation.otherPartyName },
    });
  }

  function renderConversation({ item }: { item: Conversation }) {
    return (
      <Pressable style={[styles.row, { borderColor: theme.divider }]} onPress={() => openChat(item)}>
        <View style={styles.rowTop}>
          <ThemedText style={styles.name}>{item.otherPartyName}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatTime(item.lastMessageAt)}
          </ThemedText>
        </View>
        <View style={styles.rowMeta}>
          <ThemedText type="small" themeColor="textSecondary">
            {item.serviceName}
          </ThemedText>
          <Tag label={STATUS_LABEL[item.status]} variant={STATUS_TAG_VARIANT[item.status]} />
        </View>
        <ThemedText
          type="small"
          themeColor={item.lastMessage ? undefined : 'textSecondary'}
          style={item.lastMessage ? undefined : styles.noMessages}
          numberOfLines={1}>
          {item.lastMessage ?? 'No messages yet - say hello.'}
        </ThemedText>
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
        <ThemedText style={styles.headerTitle}>CHAT</ThemedText>
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
          keyExtractor={(item) => item.bookingId}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MessageSquare size={28} color={theme.neutral400} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                Book a service to start a conversation with a provider.
              </ThemedText>
            </View>
          }
          renderItem={renderConversation}
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
    gap: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 18,
  },
  row: {
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noMessages: {
    fontStyle: 'italic',
  },
});
