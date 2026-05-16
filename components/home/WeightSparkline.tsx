import Svg, { Polyline } from 'react-native-svg';
import { useTheme } from '../../lib/theme-context';

type Props = {
  history: number[];
  width?: number;
  height?: number;
};

const VIEWBOX_W = 120;
const VIEWBOX_H = 16;

export default function WeightSparkline({ history, width, height = 16 }: Props) {
  const { theme: c } = useTheme();
  if (history.length < 2) return null;

  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;

  const points = history
    .map((value, i) => {
      const x = (i / (history.length - 1)) * VIEWBOX_W;
      // Invert: higher weight → lower y in viewBox.
      const y = VIEWBOX_H - ((value - min) / range) * VIEWBOX_H;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <Svg
      width={width ?? '100%'}
      height={height}
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      preserveAspectRatio="none"
    >
      <Polyline
        points={points}
        fill="none"
        stroke={c.accentLight}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
