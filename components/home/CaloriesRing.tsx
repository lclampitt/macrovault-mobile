import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

type Props = {
  consumed: number;
  goal: number;
  size?: number;
};

// Ring math: viewBox 100x100, radius 42, circumference ≈ 2π × 42 ≈ 263.89.
const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CaloriesRing({ consumed, goal, size = 76 }: Props) {
  const ratio = goal > 0 ? Math.min(1, consumed / goal) : 0;
  const dashoffset = CIRCUMFERENCE - CIRCUMFERENCE * ratio;
  const showFill = consumed > 0 && goal > 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        // Rotate -90deg so the arc starts at the top.
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={50}
          cy={50}
          r={RADIUS}
          stroke={Colors.border}
          strokeWidth={7}
          fill="none"
        />
        {showFill ? (
          <Circle
            cx={50}
            cy={50}
            r={RADIUS}
            stroke={Colors.accentLight}
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
