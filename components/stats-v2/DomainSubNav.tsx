import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Flame,
  Scale,
  Dumbbell,
  type LucideIcon,
} from 'lucide-react-native';
import { DS, Font, Radius } from '../../lib/design-system';

export type StatsDomain = 'body' | 'strength' | 'nutrition';

type Props = {
  active: StatsDomain;
  onChange: (d: StatsDomain) => void;
};

type Tab = { key: StatsDomain; label: string; Icon: LucideIcon };
const TABS: Tab[] = [
  { key: 'body', label: 'Body', Icon: Scale },
  { key: 'strength', label: 'Strength', Icon: Dumbbell },
  { key: 'nutrition', label: 'Nutrition', Icon: Flame },
];

export default function DomainSubNav({ active, onChange }: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {TABS.map(({ key, label, Icon }) => {
        const isActive = key === active;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[styles.tab, isActive && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
          >
            <Icon
              size={14}
              color={isActive ? DS.accent : DS.textTertiary}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.tabText,
                { color: isActive ? DS.accent : DS.textSecondary },
              ]}
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
  wrap: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: Radius.cardCompact - 4, // ~8
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.border,
  },
  tabActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  tabText: {
    fontFamily: Font.semibold,
    fontSize: 12,
  },
});
