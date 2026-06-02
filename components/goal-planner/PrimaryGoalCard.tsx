import { StyleSheet, Text, View } from 'react-native';
import { Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react-native';
import { Font, Radius, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import type { ActiveGoal, PhaseType } from '../../hooks/useActiveGoal';

type Props = {
  goal: ActiveGoal;
};

const PHASE_META: Record<
  PhaseType,
  { label: string; tagline: string; Icon: LucideIcon }
> = {
  cutting: {
    label: 'Cutting Phase',
    tagline: 'Sustained calorie deficit',
    Icon: TrendingDown,
  },
  maintenance: {
    label: 'Maintenance',
    tagline: 'Hold the line',
    Icon: Minus,
  },
  bulking: {
    label: 'Bulking Phase',
    tagline: 'Calorie surplus',
    Icon: TrendingUp,
  },
};

/**
 * Hero card at the top of the Goal Planner — shows the primary goal type,
 * its adaptive icon, and the daily calorie target with the +/- delta
 * relative to maintenance.
 */
export default function PrimaryGoalCard({ goal }: Props) {
  const t = useTokens();
  const meta = PHASE_META[goal.phaseType] ?? PHASE_META.maintenance;
  const Icon = meta.Icon;

  const delta = goal.calorieDelta;
  const deltaLabel =
    delta == null || delta === 0
      ? null
      : `${delta > 0 ? '+' : ''}${delta.toLocaleString()} kcal/day`;

  return (
    <View style={[styles.card, { backgroundColor: t.bgCard, borderColor: t.primaryTintBorder }]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: t.primaryTintBg, borderColor: t.primaryTintBorder }]}>
          <Icon size={20} color={t.primary} strokeWidth={2.25} />
        </View>
        <View style={styles.titleWrap}>
          <Text style={[styles.label, { color: t.textTertiary }]}>PRIMARY GOAL</Text>
          <Text style={[styles.title, { color: t.textPrimary }]}>{meta.label}</Text>
        </View>
      </View>

      <View style={[styles.statRow, { backgroundColor: t.bgPage, borderColor: t.borderDefault }]}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: t.textPrimary }, Tabular]}>
            {goal.calories.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: t.textTertiary }]}>DAILY KCAL</Text>
        </View>
        {deltaLabel ? (
          <>
            <View style={[styles.statDivider, { backgroundColor: t.borderDefault }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: t.textPrimary }, Tabular]}>{deltaLabel}</Text>
              <Text style={[styles.statLabel, { color: t.textTertiary }]}>VS MAINTENANCE</Text>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.statDivider, { backgroundColor: t.borderDefault }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: t.textPrimary }, Tabular]}>{meta.tagline}</Text>
              <Text style={[styles.statLabel, { color: t.textTertiary }]}>STRATEGY</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: 18,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: { flex: 1, gap: 3 },
  label: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.9,
  },
  title: {
    fontFamily: Font.extrabold,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  statRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: {
    width: 1,
  },
  statValue: {
    fontFamily: Font.bold,
    fontSize: 15,
    textAlign: 'center',
  },
  statLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.6,
  },
});
