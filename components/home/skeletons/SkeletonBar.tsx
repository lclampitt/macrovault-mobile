import { View, type ViewStyle } from 'react-native';
import { useTheme } from '../../../lib/theme-context';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

export default function SkeletonBar({
  width = '100%',
  height = 10,
  radius = 6,
  style,
}: Props) {
  const { theme: c } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.surfaceMuted,
          width: width as ViewStyle['width'],
          height,
          borderRadius: radius,
        },
        style,
      ]}
    />
  );
}
