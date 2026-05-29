import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { DS, Font, Radius, Shadow } from '../../lib/design-system';

type Props = {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  loading?: boolean;
  disabled?: boolean;
  rightIcon?: 'chevron' | 'none';
  style?: ViewStyle;
};

/**
 * Primary emerald CTA. Black text on emerald fill, 12px radius, 1px ring +
 * 32px outer glow. active:scale 0.98 on press.
 */
export default function EmeraldButton({
  label,
  onPress,
  loading,
  disabled,
  rightIcon = 'chevron',
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        Shadow.emeraldGlow,
        styles.ring,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading) }}
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#000" />
      ) : (
        <View style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          {rightIcon === 'chevron' ? (
            <ChevronRight size={16} color="#000" strokeWidth={3} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: DS.accent,
    borderRadius: Radius.cardCompact,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    borderWidth: 1,
    borderColor: DS.accentBorderStrong,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: '#000',
    letterSpacing: -0.2,
  },
});
