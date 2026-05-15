import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Colors } from '../../../constants/Colors';

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
  return (
    <View
      style={[
        styles.bar,
        { width: width as ViewStyle['width'], height, borderRadius: radius },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.surfaceMuted,
  },
});
