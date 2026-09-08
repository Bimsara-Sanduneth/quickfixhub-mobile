import { Star } from 'lucide-react-native';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export type StarRatingProps = {
  rating: number;
  size?: number;
  /** Present -> interactive (a tappable 1-5 picker); absent -> read-only display. */
  onChange?: (value: number) => void;
  style?: StyleProp<ViewStyle>;
};

export function StarRating({ rating, size = 14, onChange, style }: StarRatingProps) {
  const theme = useTheme();
  const rounded = Math.round(rating);

  return (
    <View style={[{ flexDirection: 'row', gap: 2 }, style]}>
      {[1, 2, 3, 4, 5].map((value) => {
        const filled = value <= rounded;
        const star = <Star size={size} color={theme.accent} fill={filled ? theme.accent : 'transparent'} />;
        return onChange ? (
          <Pressable key={value} onPress={() => onChange(value)} hitSlop={4}>
            {star}
          </Pressable>
        ) : (
          <View key={value}>{star}</View>
        );
      })}
    </View>
  );
}
