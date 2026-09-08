import { Pressable, StyleSheet, View } from 'react-native';

import type { ProviderSummary } from '@/api/types';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/currency';

import { Tag } from './ds/tag';
import { StarRating } from './star-rating';
import { ThemedText } from './themed-text';

export type ProviderListItemProps = {
  provider: ProviderSummary;
  onPress: () => void;
};

// Shared between the Home "Recommended" list and the Search results list - kept as its own
// component (rather than duplicated inline styles) so the two stay visually identical.
export function ProviderListItem({ provider, onPress }: ProviderListItemProps) {
  const theme = useTheme();

  return (
    <Pressable style={[styles.row, { borderColor: theme.divider }]} onPress={onPress}>
      <View style={[styles.photo, { backgroundColor: theme.neutral200 }]} />
      <View style={{ flex: 1 }}>
        <ThemedText style={styles.name}>{provider.businessName}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
          {[provider.city, provider.yearsExperience != null ? `${provider.yearsExperience} yrs` : null]
            .filter(Boolean)
            .join(' · ')}
        </ThemedText>
        {provider.averageRating != null && (
          <View style={styles.ratingRow}>
            <StarRating rating={provider.averageRating} size={12} />
            <ThemedText type="small" themeColor="textSecondary">
              {provider.averageRating.toFixed(1)} ({provider.reviewCount})
            </ThemedText>
          </View>
        )}
        <View style={styles.tags}>
          {provider.verified && <Tag label="VERIFIED" variant="accent" />}
          {provider.fromPrice != null && <Tag label={`FROM ${formatCurrency(provider.fromPrice)}`} variant="neutral" />}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    marginBottom: 14,
  },
  photo: {
    width: 72,
    height: 72,
  },
  name: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 16,
  },
  meta: {
    marginVertical: 2,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
  },
});
