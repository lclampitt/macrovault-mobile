import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';

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

export default function SwapMealTabs({ active, onChange, aiDisabled }: Props) {
  return (
    <View style={styles.row}>
      {TABS.map(({ key, label }) => {
        const isActive = active === key;
        const dimmed = key === 'ai' && aiDisabled;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[styles.tab, isActive && styles.tabActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.text,
                isActive && styles.textActive,
                dimmed && !isActive && styles.textDimmed,
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
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  textActive: {
    color: '#fff',
  },
  textDimmed: {
    color: Colors.textHint,
  },
});
