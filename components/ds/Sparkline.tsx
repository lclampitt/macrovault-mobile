import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';
import { DS } from '../../lib/design-system';

type Props = {
  /** Y values (0-based). Any length; rescaled to fit. */
  points: number[];
  width?: number;
  height?: number;
  color?: string;
};

/**
 * 1.5px emerald sparkline with a gradient fill (30% opacity → transparent)
 * below. Auto-scales to fit. Renders nothing if fewer than 2 points.
 */
export default function Sparkline({
  points,
  width = 120,
  height = 24,
  color = DS.accent,
}: Props) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);

  const norm = points.map((p, i) => ({
    x: i * stepX,
    y: height - ((p - min) / range) * (height - 2) - 1,
  }));

  const linePath = norm
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  const fillPath = `${linePath} L${width},${height} L0,${height} Z`;

  const gradId = `spark-${Math.round(Math.random() * 1e6)}`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={fillPath} fill={`url(#${gradId})`} />
      <Path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
