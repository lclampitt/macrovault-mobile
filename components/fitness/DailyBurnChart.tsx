import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Font, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import { alphaize } from '../../lib/tokens';
import type { DailyBurnDay } from '../../lib/healthkit-types';

type Props = {
  days: DailyBurnDay[];
  /** Reset key — toggling re-runs the wipe-in animation. */
  resetKey: string;
};

/**
 * Daily-burn bar chart. Today gets a solid emerald gradient + glow + value
 * label; workout days get bright emerald gradient; rest days fade to barely
 * visible. A dashed line marks the average; bars stagger in left-to-right.
 */
export default function DailyBurnChart({ days, resetKey }: Props) {
  const t = useTokens();
  const max = useMemo(
    () => Math.max(1, ...days.map((d) => d.cal)),
    [days],
  );
  const avg = useMemo(() => {
    if (days.length === 0) return 0;
    const total = days.reduce((sum, d) => sum + d.cal, 0);
    return Math.round(total / days.length);
  }, [days]);
  const avgTop = max > 0 ? 100 - (avg / max) * 100 : 100;

  return (
    <View style={styles.outer}>
      {/* Chart area */}
      <View style={styles.chartArea}>
        {/* Dashed average line + label */}
        {avg > 0 ? (
          <>
            <View
              pointerEvents="none"
              style={[
                styles.avgLine,
                { top: `${avgTop}%`, borderColor: t.primaryTintBorder },
              ]}
            />
            <View
              pointerEvents="none"
              style={[
                styles.avgLabelWrap,
                { top: `${avgTop}%`, backgroundColor: t.bgCard },
              ]}
            >
              <Text
                style={[styles.avgLabel, { color: t.primary }, Tabular]}
              >
                avg {avg.toLocaleString()}
              </Text>
            </View>
          </>
        ) : null}

        <View style={styles.barsRow}>
          {days.map((d, i) => (
            <Bar key={`${resetKey}-${i}`} day={d} max={max} index={i} />
          ))}
        </View>
      </View>

      {/* Date axis */}
      <View style={styles.axisRow}>
        <Text style={[styles.axisLabel, { color: t.chartAxisLabel }]}>
          {days[0]?.label ?? ''}
        </Text>
        {days.length > 14 ? (
          <Text style={[styles.axisLabel, { color: t.chartAxisLabel }]}>
            {days[Math.floor(days.length / 2)]?.label ?? ''}
          </Text>
        ) : null}
        <Text style={[styles.axisLabel, { color: t.primary }]}>Today</Text>
      </View>
    </View>
  );
}

function Bar({
  day,
  max,
  index,
}: {
  day: DailyBurnDay;
  max: number;
  index: number;
}) {
  const t = useTokens();
  const height = useRef(new Animated.Value(0)).current;
  const targetPct = Math.max(0.04, day.cal / max);

  useEffect(() => {
    Animated.timing(height, {
      toValue: targetPct,
      duration: 700,
      delay: index * 25,
      useNativeDriver: false,
    }).start();
  }, [height, targetPct, index]);

  const heightStyle = height.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.barColumn}>
      <Animated.View
        style={[
          styles.barInner,
          {
            height: heightStyle,
            minHeight: day.cal > 0 ? 4 : 0,
          },
          day.isToday && {
            shadowColor: t.primary,
            shadowOpacity: 0.5,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 8,
          },
        ]}
      >
        <LinearGradient
          // Bar fills derive from t.primary so they swap to rose in
          // Sakura. Today uses the full gradient stops; workout days are
          // a 0.8→0.5 alpha wash; rest days a 0.25→0.10 wash. Same
          // intensity ramp in either theme.
          colors={
            day.isToday
              ? [t.primaryGradientStart, t.primaryGradientEnd]
              : day.isWorkout
                ? [alphaize(t.primary, 0.8), alphaize(t.primary, 0.5)]
                : [alphaize(t.primary, 0.25), alphaize(t.primary, 0.1)]
          }
          style={styles.gradientFill}
        />
        {day.isToday ? (
          <View style={styles.todayLabelWrap}>
            <Text style={[styles.todayLabel, { color: t.primary }, Tabular]}>
              {day.cal}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {},
  chartArea: {
    height: 88,
    position: 'relative',
    marginBottom: 8,
  },
  avgLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  avgLabelWrap: {
    position: 'absolute',
    right: 0,
    marginTop: -10,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  avgLabel: {
    fontFamily: Font.bold,
    fontSize: 8,
  },
  barsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barInner: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    overflow: 'visible',
    position: 'relative',
  },
  gradientFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  todayLabelWrap: {
    position: 'absolute',
    top: -14,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  todayLabel: {
    fontFamily: Font.bold,
    fontSize: 8,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontFamily: Font.bold,
    fontSize: 8,
  },
});
