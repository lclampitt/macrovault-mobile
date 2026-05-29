import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { MoreHorizontal } from 'lucide-react-native';
import { DS, Font, Type } from '../../lib/design-system';
import Card from '../ds/Card';
import EmeraldButton from '../ds/EmeraldButton';
import SecondaryButton from '../ds/SecondaryButton';
import Pill from '../ds/Pill';
import StatusBadge from '../ds/StatusBadge';

type Props = {
  dayN: number;
  dayTotal: number;
  estimatedMinutes: number;
  title: string;
  exerciseCount: number;
  workingSets: number;
  lastLogged: string;
  exercises: string[];
  onStart: () => void;
  onMore?: () => void;
};

export default function NextUpWorkoutCard({
  dayN,
  dayTotal,
  estimatedMinutes,
  title,
  exerciseCount,
  workingSets,
  lastLogged,
  exercises,
  onStart,
  onMore,
}: Props) {
  return (
    <View style={styles.outer}>
      <Card tone="emerald" size="lg" style={styles.card}>
        {/* Top-right radial glow — real SVG radial gradient covering the
            whole card so there are no visible bounding edges. */}
        <View style={styles.glow} pointerEvents="none">
          {/* viewBox + preserveAspectRatio="none" stretches a 100×100 unit
              space to fill the card. Using userSpaceOnUse with explicit
              numeric coords avoids react-native-svg's flaky percentage
              handling on RadialGradient. */}
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <Defs>
              <RadialGradient
                id="nextUpGlow"
                cx={100}
                cy={0}
                r={100}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset={0} stopColor={DS.accent} stopOpacity={0.25} />
                <Stop offset={0.6} stopColor={DS.accent} stopOpacity={0.05} />
                <Stop offset={1} stopColor={DS.accent} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect
              x={0}
              y={0}
              width={100}
              height={100}
              fill="url(#nextUpGlow)"
            />
          </Svg>
        </View>

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.kicker}>NEXT UP</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.dayCount}>
              Day {dayN} of {dayTotal}
            </Text>
          </View>
          <StatusBadge label={`~${estimatedMinutes} min`} tabular />
        </View>

        <Text style={[Type.cardTitle, styles.title]}>{title}</Text>
        <Text style={styles.subtitle}>
          {exerciseCount} exercises · {workingSets} working sets · last logged{' '}
          {lastLogged}
        </Text>

        {/* Exercise pills — horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
          style={styles.pillsScroll}
        >
          {exercises.map((ex) => (
            <Pill key={ex} label={ex} />
          ))}
        </ScrollView>

        {/* CTA row */}
        <View style={styles.ctaRow}>
          <View style={styles.ctaPrimary}>
            <EmeraldButton label="Start session" onPress={onStart} />
          </View>
          <SecondaryButton
            onPress={onMore ?? (() => {})}
            accessibilityLabel="More workout options"
            style={styles.ctaSecondary}
          >
            <MoreHorizontal size={18} color={DS.textSecondary} strokeWidth={2} />
          </SecondaryButton>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 20,
  },
  card: {
    // Card brings padding; nothing here.
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kicker: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: DS.accent,
    letterSpacing: 1,
  },
  dot: {
    color: DS.textDimmest,
    fontSize: 11,
  },
  dayCount: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textSecondary,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textSecondary,
    marginBottom: 16,
  },
  pillsScroll: {
    flexGrow: 0,
    marginHorizontal: -4,
    marginBottom: 16,
  },
  pillsRow: {
    gap: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ctaPrimary: {
    flex: 1,
  },
  ctaSecondary: {
    width: 52,
    paddingHorizontal: 0,
  },
});
