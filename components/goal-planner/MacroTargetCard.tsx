import { StyleSheet, Text, View } from 'react-native';
import { Beef, Droplet, Flame, Wheat, type LucideIcon } from 'lucide-react-native';
import { Font, Radius, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import type { ActiveGoal } from '../../hooks/useActiveGoal';

type Props = {
  goal: ActiveGoal;
};

/**
 * 2×2 grid of macro target cards — Calories / Protein / Carbs / Fat.
 * Each tile uses its own icon and shows the user's daily target.
 */
export default function MacroTargetCard({ goal }: Props) {
  const t = useTokens();
  return (
    <View>
      <Text style={[styles.heading, { color: t.textTertiary }]}>DAILY TARGETS</Text>
      <View style={styles.grid}>
        <Tile
          Icon={Flame}
          label="Calories"
          value={goal.calories.toLocaleString()}
          unit="kcal"
        />
        <Tile
          Icon={Beef}
          label="Protein"
          value={goal.protein.toString()}
          unit="g"
        />
        <Tile
          Icon={Wheat}
          label="Carbs"
          value={goal.carbs.toString()}
          unit="g"
        />
        <Tile
          Icon={Droplet}
          label="Fat"
          value={goal.fat.toString()}
          unit="g"
        />
      </View>
    </View>
  );
}

type TileProps = {
  Icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
};

function Tile({ Icon, label, value, unit }: TileProps) {
  const t = useTokens();
  return (
    <View style={[styles.tile, { backgroundColor: t.bgCard, borderColor: t.borderDefault }]}>
      <View style={styles.tileHeader}>
        <View style={[styles.tileIcon, { backgroundColor: t.primaryTintBg }]}>
          <Icon size={13} color={t.primary} strokeWidth={2.25} />
        </View>
        <Text style={[styles.tileLabel, { color: t.textSecondary }]}>{label}</Text>
      </View>
      <View style={styles.tileValueRow}>
        <Text style={[styles.tileValue, { color: t.textPrimary }, Tabular]}>{value}</Text>
        <Text style={[styles.tileUnit, { color: t.textTertiary }]}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: Radius.cardCompact,
    padding: 14,
    gap: 10,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tileIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontFamily: Font.semibold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  tileValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  tileValue: {
    fontFamily: Font.extrabold,
    fontSize: 22,
    letterSpacing: -0.5,
  },
  tileUnit: {
    fontFamily: Font.medium,
    fontSize: 11,
  },
});
