import { Pressable, StyleSheet, Text, View } from 'react-native';
import { History, Layers, type LucideIcon } from 'lucide-react-native';
import { Font, Radius } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

export type HubTab = 'templates' | 'recent';

type Props = {
  active: HubTab;
  onChange: (t: HubTab) => void;
};

const TABS: { key: HubTab; label: string; Icon: LucideIcon }[] = [
  { key: 'templates', label: 'Templates', Icon: Layers },
  { key: 'recent', label: 'Recent', Icon: History },
];

export default function HubSubNav({ active, onChange }: Props) {
  const t = useTokens();
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {TABS.map(({ key, label, Icon }) => {
        const isActive = key === active;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[
              styles.tab,
              { backgroundColor: t.bgCard, borderColor: t.borderDefault },
              isActive && {
                backgroundColor: t.primaryTintBg,
                borderColor: t.primaryBorderStrong,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={label}
          >
            <Icon
              size={14}
              color={isActive ? t.primary : t.textTertiary}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.text,
                { color: isActive ? t.primary : t.textSecondary },
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
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.cardCompact - 4,
    borderWidth: 1,
  },
  text: {
    fontFamily: Font.semibold,
    fontSize: 12,
  },
});
