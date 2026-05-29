import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DS, Font, Tabular } from '../../lib/design-system';
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
              style={[styles.avgLine, { top: `${avgTop}%` }]}
            />
            <View
              pointerEvents="none"
              style={[styles.avgLabelWrap, { top: `${avgTop}%` }]}
            >
              <Text style={[styles.avgLabel, Tabular]}>
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
        <Text style={styles.axisLabel}>{days[0]?.label ?? ''}</Text>
        {days.length > 14 ? (
          <Text style={styles.axisLabel}>
            {days[Math.floor(days.length / 2)]?.label ?? ''}
          </Text>
        ) : null}
        <Text style={[styles.axisLabel, styles.axisLabelAccent]}>Today</Text>
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
          day.isToday && styles.barToday,
        ]}
      >
        <LinearGradient
          colors={
            day.isToday
              ? [DS.accent, '#059669']
              : day.isWorkout
                ? ['rgba(16, 185, 129, 0.8)', 'rgba(16, 185, 129, 0.5)']
                : ['rgba(16, 185, 129, 0.25)', 'rgba(16, 185, 129, 0.1)']
          }
          style={styles.gradientFill}
        />
        {day.isToday ? (
          <View style={styles.todayLabelWrap}>
            <Text style={[styles.todayLabel, Tabular]}>{day.cal}</Text>
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
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  avgLabelWrap: {
    position: 'absolute',
    right: 0,
    marginTop: -10,
    paddingHorizontal: 4,
    backgroundColor: DS.surface,
    borderRadius: 4,
  },
  avgLabel: {
    fontFamily: Font.bold,
    fontSize: 8,
    color: DS.accent,
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
  barToday: {
    shadowColor: DS.accent,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
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
    color: DS.accent,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontFamily: Font.bold,
    fontSize: 8,
    color: DS.textQuaternary,
  },
  axisLabelAccent: {
    color: DS.accent,
  },
});
