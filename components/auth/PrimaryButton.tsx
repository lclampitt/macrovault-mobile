import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { type LucideIcon } from 'lucide-react-native';
import { DS, Font, Shadow } from '../../lib/design-system';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  LeftIcon?: LucideIcon;
  RightIcon?: LucideIcon;
};

export default function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  LeftIcon,
  RightIcon,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        Shadow.emeraldGlow,
        (disabled || loading) && styles.btnDisabled,
        pressed && !disabled && !loading && styles.btnPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled || !!loading }}
    >
      {loading ? (
        <ActivityIndicator color="#000" size="small" />
      ) : (
        <View style={styles.row}>
          {LeftIcon ? <LeftIcon size={16} color="#000" strokeWidth={3} /> : null}
          <Text style={styles.label}>{label}</Text>
          {RightIcon ? <RightIcon size={16} color="#000" strokeWidth={3} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: DS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
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
    letterSpacing: 0.1,
  },
});
