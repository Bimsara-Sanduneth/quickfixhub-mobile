import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from '../themed-text';

export type DialogProps = {
  visible: boolean;
  title: string;
  body?: string;
  onRequestClose: () => void;
  children?: ReactNode;
  actions?: ReactNode;
};

// Matches .dialog-backdrop + .dialog: a centered surface at the top elevation over a dimmed
// backdrop, zero radius like everything else in this system.
export function Dialog({ visible, title, body, onRequestClose, children, actions }: DialogProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <Pressable style={styles.backdrop} onPress={onRequestClose}>
        <Pressable style={[styles.dialog, { backgroundColor: theme.surface }]} onPress={(e) => e.stopPropagation()}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          {body && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.body}>
              {body}
            </ThemedText>
          )}
          {children}
          {actions && <View style={styles.actions}>{actions}</View>}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(45,43,43,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 440,
    padding: 16,
    gap: 12,
  },
  title: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 20,
  },
  body: {
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
});
