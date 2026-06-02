import { StyleSheet, Text, View } from 'react-native';
import { Font, Radius, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import type { ActiveGoal } from '../../hooks/useActiveGoal';

type Props = {
  goal: ActiveGoal;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatWeight(value: number | null, unit: string | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}${unit ? ` ${unit}` : ''}`;
}

/**
 * 3-milestone goal timeline: Start / Now / Target.
 * Renders a horizontal track with two filled segments — start→now and
 * now→target — and three dot markers above date + weight labels.
 */
export default function GoalTimelineCardV2({ goal }: Props) {
  const t = useTokens();
  const pct = Math.min(Math.max(goal.percentComplete, 0), 100);

  return (
    <View style={[styles.card, { backgroundColor: t.bgCard, borderColor: t.borderDefault }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: t.textTertiary }]}>GOAL TIMELINE</Text>
        <Text style={[styles.weekLabel, { color: t.textPrimary }]}>
          Week {goal.weekNumber}
          <Text style={[styles.weekOf, { color: t.textTertiary }]}> / {goal.totalWeeks}</Text>
        </Text>
      </View>

      {/* Track */}
      <View style={styles.trackWrap}>
        <View style={[styles.trackBg, { backgroundColor: t.borderSubtle }]} />
        <View style={[styles.trackFill, { width: `${pct}%`, backgroundColor: t.primary }]} />
        {/* Dot markers — Start (always at 0), Now (at pct), Target (at 100) */}
        <View
          style={[
            styles.dot,
            { backgroundColor: t.primary, borderColor: t.bgCard },
            { left: 0 },
          ]}
        />
        <View
          style={[
            styles.dot,
            { backgroundColor: t.primary, borderColor: t.bgCard },
            // Anchor center of dot at the % mark
            { left: `${pct}%`, marginLeft: -DOT_SIZE / 2 },
          ]}
        />
        <View
          style={[
            styles.dot,
            { backgroundColor: t.borderSubtle, borderColor: t.bgCard },
            { right: 0 },
          ]}
        />
      </View>

      {/* Milestone labels — three columns */}
      <View style={styles.labelRow}>
        <Milestone
          title="START"
          date={formatDate(goal.startDate ?? goal.createdAt)}
          weight={formatWeight(goal.startWeight, goal.startWeightUnit)}
          align="left"
        />
        <Milestone
          title="NOW"
          date={`Day ${goal.currentDay}`}
          weight={formatWeight(goal.currentWeight, goal.currentWeightUnit)}
          align="center"
          highlight
        />
        <Milestone
          title="TARGET"
          date={formatDate(goal.targetDate)}
          weight={formatWeight(goal.targetWeight, goal.targetWeightUnit)}
          align="right"
        />
      </View>

      <View style={[styles.divider, { backgroundColor: t.borderDefault }]} />
      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: t.textTertiary }]}>
          <Text style={[styles.footerStrong, { color: t.textPrimary }, Tabular]}>
            {goal.daysRemaining}
          </Text>{' '}
          days remaining
        </Text>
        <Text style={[styles.footerText, { color: t.textTertiary }]}>
          <Text style={[styles.footerStrong, { color: t.textPrimary }, Tabular]}>
            {Math.round(pct)}%
          </Text>{' '}
          complete
        </Text>
      </View>
    </View>
  );
}

type MilestoneProps = {
  title: string;
  date: string;
  weight: string;
  align: 'left' | 'center' | 'right';
  highlight?: boolean;
};

function Milestone({ title, date, weight, align, highlight }: MilestoneProps) {
  const t = useTokens();
  const alignItems =
    align === 'center'
      ? 'center'
      : align === 'right'
      ? 'flex-end'
      : 'flex-start';
  return (
    <View style={{ flex: 1, alignItems, gap: 3 }}>
      <Text
        style={[
          styles.milestoneTitle,
          { color: t.textTertiary },
          highlight && { color: t.primary },
        ]}
      >
        {title}
      </Text>
      <Text style={[styles.milestoneDate, { color: t.textPrimary }, Tabular]}>{date}</Text>
      <Text style={[styles.milestoneWeight, { color: t.textSecondary }, Tabular]}>{weight}</Text>
    </View>
  );
}

const DOT_SIZE = 12;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  heading: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  weekLabel: {
    fontFamily: Font.bold,
    fontSize: 12,
  },
  weekOf: {
    fontFamily: Font.medium,
  },
  trackWrap: {
    height: DOT_SIZE,
    justifyContent: 'center',
    marginBottom: 12,
  },
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: -2,
    height: 4,
    borderRadius: 2,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -2,
    height: 4,
    borderRadius: 2,
  },
  dot: {
    position: 'absolute',
    top: 0,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
  },
  labelRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  milestoneTitle: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.7,
  },
  milestoneDate: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  milestoneWeight: {
    fontFamily: Font.medium,
    fontSize: 11,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: Font.medium,
    fontSize: 11,
  },
  footerStrong: {
    fontFamily: Font.bold,
  },
});
