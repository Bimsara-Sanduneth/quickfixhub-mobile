import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { AlertTriangle, ChevronRight, LogOut } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAdminOverview } from '@/api/admin';
import { useAuth } from '@/auth/AuthContext';
import { Divider } from '@/components/ds/divider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/currency';

export default function AdminOverviewScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { logout } = useAuth();

  const { data, isPending } = useQuery({ queryKey: ['admin', 'overview'], queryFn: getAdminOverview });

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <ThemedText style={styles.headerTitle}>ADMIN</ThemedText>
        <Pressable onPress={logout} hitSlop={8}>
          <LogOut size={20} color={theme.text} />
        </Pressable>
      </View>
      <Divider style={styles.headerDivider} />

      {isPending || !data ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={[styles.statsGrid, { backgroundColor: theme.divider }]}>
            <StatTile value={data.totalCustomers} label="Customers" />
            <StatTile value={data.totalProviders} label="Providers" />
            <StatTile value={data.verifiedProviders} label="Verified" />
            <StatTile value={data.pendingVerification} label="Pending verification" />
            <StatTile value={data.totalBookings} label="Bookings" />
            <StatTile value={data.completedBookings} label="Completed" />
            <StatTile value={formatCurrency(data.totalRevenue)} label="Total revenue" />
            <StatTile value={formatCurrency(data.totalRefunded)} label="Total refunded" />
          </View>

          {data.pendingVerification > 0 && (
            <Pressable
              style={[styles.attentionRow, { borderColor: theme.accent, backgroundColor: theme.accent100 }]}
              onPress={() => router.push('/(app)/admin/verification')}>
              <AlertTriangle size={16} color={theme.accent} />
              <ThemedText type="small" style={{ color: theme.accent800, flex: 1 }}>
                {data.pendingVerification} provider{data.pendingVerification === 1 ? '' : 's'} awaiting document review
              </ThemedText>
              <ChevronRight size={16} color={theme.accent} />
            </Pressable>
          )}

          <Pressable style={[styles.navRow, { borderColor: theme.divider }]} onPress={() => router.push('/(app)/admin/verification')}>
            <View>
              <ThemedText type="smallBold">Verification queue</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {data.pendingVerification} provider{data.pendingVerification === 1 ? '' : 's'} waiting
              </ThemedText>
            </View>
            <ChevronRight size={18} color={theme.neutral500} />
          </Pressable>

          <Pressable style={[styles.navRow, { borderColor: theme.divider }]} onPress={() => router.push('/(app)/admin/payments')}>
            <View>
              <ThemedText type="smallBold">Payments &amp; refunds</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Browse paid bookings, issue a refund
              </ThemedText>
            </View>
            <ChevronRight size={18} color={theme.neutral500} />
          </Pressable>
        </ScrollView>
      )}
    </ThemedView>
  );
}

function StatTile({ value, label }: { value: string | number; label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.statTile, { backgroundColor: theme.bg }]}>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
        {label}
      </ThemedText>
    </View>
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
  body: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginBottom: 24,
  },
  statTile: {
    width: '49.3%',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  statValue: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 18,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
});
