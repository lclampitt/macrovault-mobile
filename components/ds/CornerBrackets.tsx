import { StyleSheet, View } from 'react-native';
import { DS } from '../../lib/design-system';

/**
 * 8px L-shaped emerald brackets at top-left and bottom-right corners — the
 * "instrument feel" detail from the design spec. Used on the hero card.
 *
 * Drop inside a relatively-positioned container as the last child.
 */
export default function CornerBrackets() {
  return (
    <>
      <View style={[styles.bracket, styles.topLeftH]} pointerEvents="none" />
      <View style={[styles.bracket, styles.topLeftV]} pointerEvents="none" />
      <View
        style={[styles.bracket, styles.bottomRightH]}
        pointerEvents="none"
      />
      <View
        style={[styles.bracket, styles.bottomRightV]}
        pointerEvents="none"
      />
    </>
  );
}

const SIZE = 8;
const THICKNESS = 1.5;
const INSET = 6;

const styles = StyleSheet.create({
  bracket: {
    position: 'absolute',
    backgroundColor: DS.accentBracket,
  },
  topLeftH: {
    top: INSET,
    left: INSET,
    width: SIZE,
    height: THICKNESS,
  },
  topLeftV: {
    top: INSET,
    left: INSET,
    width: THICKNESS,
    height: SIZE,
  },
  bottomRightH: {
    bottom: INSET,
    right: INSET,
    width: SIZE,
    height: THICKNESS,
  },
  bottomRightV: {
    bottom: INSET,
    right: INSET,
    width: THICKNESS,
    height: SIZE,
  },
});
