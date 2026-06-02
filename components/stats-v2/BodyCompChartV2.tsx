import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Font } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import { fmtShortMonthDay } from '../../lib/date';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type ChartMetric = 'weight' | 'bodyfat';

type Props = {
  /** Ascending chronological entries — already filtered to the active range. */
  entries: Array<{ date: string; value: number }>;
  metric: ChartMetric;
};

const CHART_W = 340;
const CHART_H = 140;
const PAD_L = 28;
const PAD_R = 12;
const PAD_T = 16;
const PAD_B = 28;
const INNER_W = CHART_W - PAD_L - PAD_R;
const INNER_H = CHART_H - PAD_T - PAD_B;

const fmtShortDate = fmtShortMonthDay;

export default function BodyCompChartV2({ entries, metric }: Props) {
  const t = useTokens();
  const minVal = Math.min(...entries.map((e) => e.value));
  const maxVal = Math.max(...entries.map((e) => e.value));
  const valRange = maxVal - minVal || 1;
  const yPad = valRange * 0.15;
  const yMin = minVal - yPad;
  const yMax = maxVal + yPad;
  const yRange = yMax - yMin || 1;

  const points = useMemo(
    () =>
      entries.map((e, i) => {
        const x =
          PAD_L + (i / Math.max(1, entries.length - 1)) * INNER_W;
        const y = PAD_T + ((yMax - e.value) / yRange) * INNER_H;
        return { x, y, value: e.value, date: e.date };
      }),
    [entries, yMax, yRange],
  );

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      d += ` C ${cpX1} ${prev.y}, ${cpX2} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [points]);

  const areaPath = useMemo(() => {
    if (!linePath || points.length < 2) return '';
    const last = points[points.length - 1];
    const first = points[0];
    return `${linePath} L ${last.x} ${PAD_T + INNER_H} L ${first.x} ${PAD_T + INNER_H} Z`;
  }, [linePath, points]);

  // Stroke draw-in animation (0 → full)
  const drawProgress = useSharedValue(0);
  useEffect(() => {
    drawProgress.value = 0;
    drawProgress.value = withTiming(1, {
      duration: 1200,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [drawProgress, metric, entries.length, linePath]);

  const STROKE_LEN = 1000; // upper bound; safe for any plausible path
  const lineAnimProps = useAnimatedProps(() => ({
    strokeDashoffset: STROKE_LEN * (1 - drawProgress.value),
  }));

  // Pulse halo on the last point (radius 8 → 6, opacity 0.2 → 0.05)
  const haloPulse = useSharedValue(0);
  useEffect(() => {
    haloPulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(haloPulse);
  }, [haloPulse]);

  const haloProps = useAnimatedProps(() => ({
    opacity: 0.2 - haloPulse.value * 0.15,
    r: 8 - haloPulse.value * 2.5,
  }));

  if (entries.length === 0) {
    return <View style={styles.empty} />;
  }

  return (
    <View
      style={styles.wrap}
      accessibilityRole="image"
      accessibilityLabel={`${metric === 'weight' ? 'Weight' : 'Body fat'} trend, ${entries.length} entries, ${entries[0].value.toFixed(1)} to ${entries[entries.length - 1].value.toFixed(1)}`}
    >
      <Svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.chartFillStart} stopOpacity={1} />
            <Stop offset="1" stopColor={t.chartFillEnd} stopOpacity={1} />
          </LinearGradient>
        </Defs>

        {/* Horizontal gridlines */}
        <G>
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
            <Line
              key={i}
              x1={PAD_L}
              y1={PAD_T + p * INNER_H}
              x2={PAD_L + INNER_W}
              y2={PAD_T + p * INNER_H}
              stroke={t.chartGrid}
              strokeWidth={1}
              strokeDasharray={i === 0 || i === 4 ? undefined : '2 4'}
            />
          ))}
        </G>

        {/* Y-axis labels (top, middle, bottom) */}
        {[0, 0.5, 1].map((p, i) => {
          const val = yMax - p * yRange;
          return (
            <SvgText
              key={i}
              x={PAD_L - 6}
              y={PAD_T + p * INNER_H + 3}
              textAnchor="end"
              fontSize={9}
              fontWeight="500"
              fill={t.chartAxisLabel}
              fontFamily={Font.medium}
            >
              {metric === 'weight' ? val.toFixed(0) : val.toFixed(1)}
            </SvgText>
          );
        })}

        {/* Area fill + animated stroke */}
        {points.length >= 2 ? (
          <>
            <Path d={areaPath} fill="url(#chartArea)" />
            <AnimatedPath
              d={linePath}
              fill="none"
              stroke={t.primary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={STROKE_LEN}
              animatedProps={lineAnimProps}
            />
          </>
        ) : null}

        {/* Data points */}
        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          return (
            <G key={i}>
              {isLast ? (
                <AnimatedCircle
                  cx={p.x}
                  cy={p.y}
                  r={8}
                  fill={t.primary}
                  animatedProps={haloProps}
                />
              ) : null}
              <Circle
                cx={p.x}
                cy={p.y}
                r={isLast ? 3 : 2}
                fill={isLast ? t.primary : t.bgCard}
                stroke={t.primary}
                strokeWidth={isLast ? 0 : 1.5}
              />
            </G>
          );
        })}

        {/* X-axis labels (first + last; last in emerald) */}
        {points.length > 1 ? (
          <>
            <SvgText
              x={points[0].x}
              y={CHART_H - 8}
              textAnchor="start"
              fontSize={9}
              fontWeight="500"
              fill={t.chartAxisLabel}
              fontFamily={Font.medium}
            >
              {fmtShortDate(points[0].date)}
            </SvgText>
            <SvgText
              x={points[points.length - 1].x}
              y={CHART_H - 8}
              textAnchor="end"
              fontSize={9}
              fontWeight="500"
              fill={t.primary}
              fontFamily={Font.medium}
            >
              {fmtShortDate(points[points.length - 1].date)}
            </SvgText>
          </>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 160,
  },
  empty: {
    height: 160,
  },
});
