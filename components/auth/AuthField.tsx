import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { DS, Font } from '../../lib/design-system';

type Props = {
  label: string;
  /** Right-side label (e.g. "Forgot?" or "Strong"). */
  rightLabel?: { text: string; color?: string; onPress?: () => void };
  Icon: LucideIcon;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  /** Trailing element (e.g. "lb" suffix). Mutually exclusive with secure toggle. */
  suffix?: string;
  /** Show error state on the border. */
  errored?: boolean;
};

export default function AuthField({
  label,
  rightLabel,
  Icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  suffix,
  errored,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [showSecure, setShowSecure] = useState(false);
  const isPassword = !!secureTextEntry;

  return (
    <View>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        {rightLabel ? (
          <Pressable hitSlop={6} onPress={rightLabel.onPress}>
            <Text
              style={[
                styles.rightLabel,
                { color: rightLabel.color ?? DS.accent },
              ]}
            >
              {rightLabel.text}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          errored && styles.fieldErrored,
        ]}
      >
        <Icon size={16} color={DS.textTertiary} strokeWidth={2} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#555"
          secureTextEntry={isPassword && !showSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
        {isPassword ? (
          <Pressable
            hitSlop={8}
            onPress={() => setShowSecure((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={showSecure ? 'Hide password' : 'Show password'}
          >
            {showSecure ? (
              <EyeOff size={16} color={DS.textTertiary} strokeWidth={2} />
            ) : (
              <Eye size={16} color={DS.textTertiary} strokeWidth={2} />
            )}
          </Pressable>
        ) : suffix ? (
          <Text style={styles.suffix}>{suffix}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.textTertiary,
    letterSpacing: 1,
  },
  rightLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 12,
  },
  fieldFocused: {
    backgroundColor: '#0D0D0D',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    // RN doesn't render an outer glow — the active background lift carries
    // the focused feel without an extra inset shadow.
  },
  fieldErrored: {
    borderColor: 'rgba(168, 124, 94, 0.6)',
  },
  input: {
    flex: 1,
    color: DS.text,
    fontFamily: Font.medium,
    fontSize: 14,
  },
  suffix: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: DS.textTertiary,
  },
});
