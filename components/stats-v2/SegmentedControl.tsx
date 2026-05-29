import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { DS, Font } from '../../lib/design-system';

type Props<T extends string> = {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  size?: 'sm' | 'md';
  style?: ViewStyle;
};

/**
 * Matches the dashboard's "Burned" range toggle: #0F0F0F background with
 * #1A1A1A border, active segment is solid emerald with black text.
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  style,
}: Props<T>) {
  const padY = size === 'sm' ? 4 : 6;
  return (
    <View style={[styles.wrap, style]}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              styles.segment,
              { paddingVertical: padY },
              active && styles.segmentActive,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
          >
            <Text
              style={[
                styles.segmentText,
                size === 'sm' && styles.segmentTextSm,
                active && styles.segmentTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 2,
    padding: 2,
    borderRadius: 8,
    backgroundColor: DS.surfaceFlat,
    borderWidth: 1,
    borderColor: DS.border,
  },
  segment: {
    flex: 1,
    paddingHorizontal: 8,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: DS.accent,
  },
  segmentText: {
    fontFamily: Font.semibold,
    fontSize: 11,
    color: DS.textTertiary,
  },
  segmentTextSm: {
    fontSize: 10,
  },
  segmentTextActive: {
    color: '#000',
  },
});
