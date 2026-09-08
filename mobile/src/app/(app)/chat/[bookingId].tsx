import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCurrentUser } from '@/api/me';
import { listMessages, sendMessage } from '@/api/messages';
import type { Message } from '@/api/types';
import { Divider } from '@/components/ds/divider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

// No push/WebSocket transport yet - polls on an interval instead, same "not real-time" shape as
// the rest of the app. Fine at this scale; revisit if messaging ever needs to feel instant.
const POLL_INTERVAL_MS = 4000;

export default function ChatScreen() {
  const { bookingId, otherPartyName } = useLocalSearchParams<{ bookingId: string; otherPartyName?: string }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getCurrentUser });
  const { data: messages, isPending } = useQuery({
    queryKey: ['messages', bookingId],
    queryFn: () => listMessages(bookingId),
    enabled: !!bookingId,
    refetchInterval: POLL_INTERVAL_MS,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendMessage(bookingId, { body: draft.trim() }),
    onSuccess: (message) => {
      queryClient.setQueryData<Message[]>(['messages', bookingId], (prev) => [...(prev ?? []), message]);
      setDraft('');
    },
  });

  function renderMessage({ item }: { item: Message }) {
    const mine = item.senderId === me?.id;
    return (
      <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
        <View style={[styles.bubble, { backgroundColor: mine ? theme.accent : theme.surface }]}>
          <ThemedText style={{ color: mine ? theme.bg : theme.text }}>{item.body}</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ArrowLeft size={20} color={theme.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>{(otherPartyName ?? 'Chat').toUpperCase()}</ThemedText>
        </View>
        <Divider style={styles.headerDivider} />

        {isPending ? (
          <ActivityIndicator style={styles.loading} />
        ) : (
          <FlatList
            data={[...(messages ?? [])].reverse()}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                No messages yet. Say hello.
              </ThemedText>
            }
            renderItem={renderMessage}
          />
        )}

        <View style={[styles.inputRow, { borderTopColor: theme.divider, paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message..."
            placeholderTextColor={theme.neutral600}
            style={[styles.input, { color: theme.text, backgroundColor: theme.surface }]}
            multiline
          />
          <Pressable
            style={[styles.sendButton, { backgroundColor: theme.accent, opacity: draft.trim() ? 1 : 0.4 }]}
            disabled={!draft.trim() || sendMutation.isPending}
            onPress={() => sendMutation.mutate()}>
            <Send size={16} color={theme.bg} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  listContent: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 32,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 2,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
