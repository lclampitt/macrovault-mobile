import { useMemo } from 'react';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { Colors } from '../../constants/Colors';
import {
  calculateChartBounds,
  formatDateLabel,
  makeTicks,
  type BodyCompEntry,
} from '../../lib/bodyComp';

export const CHART_HEIGHT = 300;

// Reserve space for axis labels (web's Recharts auto-allocates this; in raw
// SVG we pad explicitly).
const PAD_LEFT = 40;
const PAD_RIGHT = 40;
const PAD_TOP = 20;
const PAD_BOTTOM = 30;

type Props = {
  entries: BodyCompEntry[]; // already range-filtered, ascending
  width: number;
  height: number;
};

function dateMs(d: string): number {
  return new Date(`${d}T00:00:00`).getTime();
}

export default function BodyCompChart({ entries, width, height }: Props) {
  const model = useMemo(() => {
    const plotW = Math.max(1, width - PAD_LEFT - PAD_RIGHT);
    const plotH = Math.max(1, height - PAD_TOP - PAD_BOTTOM);

    const weightVals = entries
      .map((e) => e.weight)
      .filter((v): v is number => v != null);
    const bfVals = entries
      .map((e) => e.bodyFat)
      .filter((v): v is number => v != null);

    const bounds = calculateChartBounds(weightVals, bfVals);
    const weightTicks = makeTicks(bounds.weight.min, bounds.weight.max, 6);
    const bfTicks = makeTicks(bounds.bf.min, bounds.bf.max, 6);

    const dMin = entries.length ? dateMs(entries[0].date) : 0;
    const dMax = entries.length ? dateMs(entries[entries.length - 1].date) : 1;
    const dSpan = dMax - dMin || 1;
    const spanDays = Math.round(dSpan / 86400000) || 7;

    const xScale = (d: string) =>
      entries.length <= 1
        ? PAD_LEFT + plotW / 2
        : PAD_LEFT + ((dateMs(d) - dMin) / dSpan) * plotW;

    const yWeight = (w: number) => {
      const r = bounds.weight.max - bounds.weight.min || 1;
      return PAD_TOP + plotH - ((w - bounds.weight.min) / r) * plotH;
    };
    const yBf = (b: number) => {
      const r = bounds.bf.max - bounds.bf.min || 1;
      return PAD_TOP + plotH - ((b - bounds.bf.min) / r) * plotH;
    };

    // connectNulls: skip null points but keep one continuous path.
    const linePath = (getVal: (e: BodyCompEntry) => number | null, y: (v: number) => number) => {
      let d = '';
      let started = false;
      entries.forEach((e) => {
        const v = getVal(e);
        if (v == null) return;
        d += `${started ? 'L' : 'M'}${xScale(e.date).toFixed(1)},${y(v).toFixed(1)} `;
        started = true;
      });
      return d.trim();
    };

    // Up to 6 evenly-spaced x labels.
    const n = entries.length;
    const labelCount = Math.min(6, n);
    const labelIdx: number[] = [];
    if (n > 0) {
      if (labelCount === 1) labelIdx.push(0);
      else {
        for (let k = 0; k < labelCount; k++) {
          labelIdx.push(Math.round((k * (n - 1)) / (labelCount - 1)));
        }
      }
    }

    return {
      plotH,
      bounds,
      weightTicks,
      bfTicks,
      xScale,
      yWeight,
      yBf,
      weightPath: linePath((e) => e.weight, yWeight),
      bfPath: linePath((e) => e.bodyFat, yBf),
      labelIdx,
      spanDays,
      showDots: n <= 5, // web shows dots only when data.length <= 5
    };
  }, [entries, width, height]);

  if (width <= 0) return null;

  const {
    plotH,
    weightTicks,
    bfTicks,
    xScale,
    yWeight,
    yBf,
    weightPath,
    bfPath,
    labelIdx,
    spanDays,
    showDots,
  } = model;

  return (
    <Svg width={width} height={height}>
      <G>
        {/* Horizontal gridlines at weight ticks (subtle) */}
        {weightTicks.map((t, i) => {
          const y = yWeight(t);
          return (
            <Line
              key={`h${i}`}
              x1={PAD_LEFT}
              y1={y}
              x2={width - PAD_RIGHT}
              y2={y}
              stroke={Colors.chartGrid}
              strokeWidth={1}
            />
          );
        })}

        {/* Vertical dotted gridlines at label positions */}
        {labelIdx.map((idx, i) => {
          const x = xScale(entries[idx].date);
          return (
            <Line
              key={`v${i}`}
              x1={x}
              y1={PAD_TOP}
              x2={x}
              y2={PAD_TOP + plotH}
              stroke={Colors.chartGrid}
              strokeWidth={1}
              strokeDasharray="3,3"
            />
          );
        })}

        {/* Left Y-axis labels (weight, integer) */}
        {weightTicks.map((t, i) => (
          <SvgText
            key={`wy${i}`}
            x={PAD_LEFT - 6}
            y={yWeight(t) + 3}
            fontSize={11}
            fill={Colors.chartAxisLabel}
            textAnchor="end"
          >
            {Math.round(t)}
          </SvgText>
        ))}

        {/* Right Y-axis labels (BF%, integer + %) */}
        {bfTicks.map((t, i) => (
          <SvgText
            key={`by${i}`}
            x={width - PAD_RIGHT + 6}
            y={yBf(t) + 3}
            fontSize={11}
            fill={Colors.chartAxisLabel}
            textAnchor="start"
          >
            {`${Math.round(t)}%`}
          </SvgText>
        ))}

        {/* Weight line (solid) */}
        {weightPath ? (
          <Path
            d={weightPath}
            stroke={Colors.chartWeightLine}
            strokeWidth={2}
            fill="none"
          />
        ) : null}

        {/* Body fat line (dashed) */}
        {bfPath ? (
          <Path
            d={bfPath}
            stroke={Colors.chartBodyFatLine}
            strokeWidth={2}
            strokeDasharray="5,3"
            fill="none"
          />
        ) : null}

        {/* Hollow point markers (stroke matches line) */}
        {showDots
          ? entries.map((e, i) =>
              e.weight != null ? (
                <Circle
                  key={`wp${i}`}
                  cx={xScale(e.date)}
                  cy={yWeight(e.weight)}
                  r={3}
                  fill={Colors.background}
                  stroke={Colors.chartWeightLine}
                  strokeWidth={1.5}
                />
              ) : null,
            )
          : null}
        {showDots
          ? entries.map((e, i) =>
              e.bodyFat != null ? (
                <Circle
                  key={`bp${i}`}
                  cx={xScale(e.date)}
                  cy={yBf(e.bodyFat)}
                  r={3}
                  fill={Colors.background}
                  stroke={Colors.chartBodyFatLine}
                  strokeWidth={1.5}
                />
              ) : null,
            )
          : null}

        {/* X-axis date labels */}
        {labelIdx.map((idx, i) => (
          <SvgText
            key={`xl${i}`}
            x={xScale(entries[idx].date)}
            y={height - 10}
            fontSize={11}
            fill={Colors.chartAxisLabel}
            textAnchor="middle"
          >
            {formatDateLabel(entries[idx].date, spanDays)}
          </SvgText>
        ))}
      </G>
    </Svg>
  );
}
