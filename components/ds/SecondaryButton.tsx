import {
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';
import { DS, Radius } from '../../lib/design-system';

type Props = {
  onPress: (e: GestureResponderEvent) => void;
  /** Render the inner content (icon, label, etc.) yourself. */
  children: React.ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

/**
 * #0A0A0A background, #1A1A1A border, same radius/padding as the primary
 * button. Used for the trailing meatball icon next to the CTA, etc.
 */
export default function SecondaryButton({
  onPress,
  children,
  style,
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.cardCompact,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
