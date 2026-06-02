import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  Path,
  Stop,
} from 'react-native-svg';
import { Font, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

type Point = { value: number; date: string };

type Props = {
  series: Point[];
  unit: string;
  /** Animation re-trigger key — change on metric switch to redraw the line. */
  redrawKey?: string;
};

const CHART_W = 360;
const CHART_H = 140;

/**
 * Generic metric line chart. Smooth-bezier line, theme-tinted area fill,
 * dashed gridlines at 0/33/66/100%, end-point dot. Used by the Stats
 * screen regardless of which metric is active.
 *
 * Theme-aware: the line, area fill, and last-point dot all read from
 * `tokens.primary` / `tokens.chartFillStart` / `tokens.chartFillEnd`. The
 * line is emerald in Emerald mode and rose in Sakura mode (rose-tinted
 * area fill, rose dot — the same hue family that drives the rest of the
 * Stats screen).
 *
 * Animation note: the spec describes a 1.2s stroke-dasharray draw. RN's
 * SVG supports `strokeDasharray` but the animation libs to drive it
 * (without native SVG animations) are awkward — we settle for a static
 * draw here, which is honest to the data and avoids jank on metric
 * switches.
 */
export default function MetricLineChart({ series, unit, redrawKey }: Props) {
  const t = useTokens();
  const { linePath, areaPath, last } = useMemo(() => {
    if (series.length === 0) return { linePath: '', areaPath: '', last: null };
    const values = series.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.2 || 1;
    const yRange = max - min + padding * 2;
    const xStep = series.length > 1 ? CHART_W / (series.length - 1) : CHART_W;

    let d = '';
    series.forEach((p, i) => {
      const x = i * xStep;
      const y = CHART_H - ((p.value - min + padding) / yRange) * CHART_H;
      if (i === 0) {
        d += `M ${x} ${y}`;
      } else {
        const prevX = (i - 1) * xStep;
        const prevY =
          CHART_H -
          ((series[i - 1].value - min + padding) / yRange) * CHART_H;
        const cpX = (prevX + x) / 2;
        d += ` C ${cpX} ${prevY}, ${cpX} ${y}, ${x} ${y}`;
      }
    });
    const area = d + ` L ${CHART_W} ${CHART_H} L 0 ${CHART_H} Z`;
    const lastIdx = series.length - 1;
    const lastX = lastIdx * xStep;
    const lastY =
      CHART_H -
      ((series[lastIdx].value - min + padding) / yRange) * CHART_H;
    return {
      linePath: d,
      areaPath: area,
      last: { x: lastX, y: lastY },
    };
  }, [series]);

  if (series.length === 0) {
    return (
      <View style={[styles.outer, styles.empty]}>
        <Text style={[styles.emptyText, { color: t.textTertiary }]}>
          Log at least one entry to see the trend.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.outer}>
      <Svg
        width="100%"
        height={CHART_H}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        preserveAspectRatio="none"
        key={redrawKey}
      >
        <Defs>
          {/* Area fill — tokens.chartFillStart/End already carry the right
              hue (emerald-tinted in Emerald, rose-tinted in Sakura) with
              the appropriate alphas baked in, so stopOpacity stays at 1. */}
          <LinearGradient id="mlcArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={t.chartFillStart} stopOpacity={1} />
            <Stop offset="100%" stopColor={t.chartFillEnd} stopOpacity={1} />
          </LinearGradient>
        </Defs>

        {/* Gridlines */}
        {[0, 0.33, 0.66, 1].map((p, i) => (
          <Line
            key={i}
            x1={0}
            y1={CHART_H * p}
            x2={CHART_W}
            y2={CHART_H * p}
            stroke={t.chartGrid}
            strokeWidth={0.5}
            strokeDasharray="2 2"
          />
        ))}

        <Path d={areaPath} fill="url(#mlcArea)" />
        <Path
          d={linePath}
          fill="none"
          stroke={t.primary}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {last ? (
          <>
            <Circle cx={last.x} cy={last.y} r={5} fill={t.primary} opacity={0.3} />
            <Circle
              cx={last.x}
              cy={last.y}
              r={3}
              fill={t.primary}
              // Inner ring color matches the card surface so the dot
              // looks like a punched cutout rather than floating on top
              // of the line. White in light/sakura, black in dark.
              stroke={t.bgCard}
              strokeWidth={1.5}
            />
          </>
        ) : null}
      </Svg>

      <Text
        style={[styles.unitFloater, Tabular, { color: t.textQuaternary }]}
      >
        {unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    height: CHART_H,
    position: 'relative',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: Font.medium,
    fontSize: 12,
    fontStyle: 'italic',
  },
  unitFloater: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.4,
  },
});
