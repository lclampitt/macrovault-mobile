import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';

export type LogTab = 'manual' | 'food';

type Props = {
  active: LogTab;
  onChange: (tab: LogTab) => void;
};

const TABS: { key: LogTab; label: string }[] = [
  { key: 'manual', label: 'Manual Entry' },
  { key: 'food', label: 'Food Search' },
];

export default function LogNutritionTabs({ active, onChange }: Props) {
  return (
    <View style={styles.row}>
      {TABS.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[styles.tab, isActive && styles.tabActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
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
    gap: 8,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 999,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
});
