import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../lib/theme-context';

type Props = {
  consumed: number;
  goal: number;
  size?: number;
};

// Ring math: viewBox 100x100, radius 42, circumference ≈ 2π × 42 ≈ 263.89.
const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CaloriesRing({ consumed, goal, size = 76 }: Props) {
  const { theme: c } = useTheme();
  const ratio = goal > 0 ? Math.min(1, consumed / goal) : 0;
  const dashoffset = CIRCUMFERENCE - CIRCUMFERENCE * ratio;
  const showFill = consumed > 0 && goal > 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={50}
          cy={50}
          r={RADIUS}
          stroke={c.border}
          strokeWidth={7}
          fill="none"
        />
        {showFill ? (
          <Circle
            cx={50}
            cy={50}
            r={RADIUS}
            stroke={c.accentLight}
            strokeWidth={7}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashoffset}
          />
        ) : null}
      </Svg>
    </View>
  );
}
