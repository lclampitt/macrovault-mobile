import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Activity,
  BookOpen,
  Calculator,
  Target,
  type LucideIcon,
} from 'lucide-react-native';
import { Font, Radius } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

type Tool = {
  key: string;
  label: string;
  Icon: LucideIcon;
  onPress?: () => void;
};

const TOOLS: Tool[] = [
  { key: 'plates', label: 'Plates', Icon: Calculator },
  { key: 'timer', label: 'Timer', Icon: Activity },
  { key: 'pr', label: 'PR Log', Icon: Target },
  { key: 'notes', label: 'Notes', Icon: BookOpen },
];

type Props = {
  onToolPress?: (key: string) => void;
};

/**
 * 4-up quick tools strip. Theme-aware via useTokens.
 */
export default function QuickToolsStrip({ onToolPress }: Props) {
  const t = useTokens();
  return (
    <View style={styles.row}>
      {TOOLS.map(({ key, label, Icon }) => (
        <Pressable
          key={key}
          onPress={() => onToolPress?.(key)}
          style={({ pressed }) => [
            styles.tile,
            {
              backgroundColor: t.bgCard,
              borderColor: t.borderDefault,
            },
            pressed && styles.tilePressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <Icon size={16} color={t.primary} strokeWidth={2} />
          <Text style={[styles.label, { color: t.textSecondary }]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
  },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.cardCompact,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  tilePressed: {
    transform: [{ scale: 0.95 }],
  },
  label: {
    fontFamily: Font.semibold,
    fontSize: 11,
  },
});
