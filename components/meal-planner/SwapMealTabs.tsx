import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Font } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

export type SwapTab = 'ai' | 'saved' | 'search' | 'manual';

type Props = {
  active: SwapTab;
  onChange: (tab: SwapTab) => void;
  aiDisabled?: boolean;
};

const TABS: { key: SwapTab; label: string }[] = [
  { key: 'ai', label: 'AI Suggest' },
  { key: 'saved', label: 'Saved Meals' },
  { key: 'search', label: 'Food Search' },
  { key: 'manual', label: 'Manual Entry' },
];

/**
 * Segmented toggle for the swap meal flow. Same pattern as the segmented
 * toggles used elsewhere (e.g. Stats Body/Strength/Nutrition, Appearance
 * Dark/Light): the container paints `bgCardElevated`, the active pill
 * paints `primary` with `textOnPrimary` text. Token-driven so it adapts
 * to dark / light / sakura without any per-theme branching here.
 */
export default function SwapMealTabs({ active, onChange, aiDisabled }: Props) {
  const t = useTokens();
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
      ]}
    >
      {TABS.map(({ key, label }) => {
        const isActive = active === key;
        const dimmed = key === 'ai' && aiDisabled;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[
              styles.tab,
              isActive && { backgroundColor: t.primary },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.text,
                {
                  color: isActive
                    ? t.textOnPrimary
                    : dimmed
                      ? t.textQuaternary
                      : t.textSecondary,
                },
              ]}
              numberOfLines={2}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  text: {
    fontFamily: Font.bold,
    fontSize: 11,
    textAlign: 'center',
  },
});
