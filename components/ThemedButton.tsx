import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { Colors } from '../constants/Colors';

type Variant = 'primary' | 'ghost';

type Props = Omit<PressableProps, 'children'> & {
  title: string;
  loadingTitle?: string;
  loading?: boolean;
  variant?: Variant;
};

export function ThemedButton({
  title,
  loadingTitle,
  loading = false,
  variant = 'primary',
  disabled,
  style,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        state.pressed && !isDisabled && (isPrimary ? styles.primaryPressed : styles.ghostPressed),
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <Text style={[styles.text, isPrimary ? styles.primaryText : styles.ghostText]}>
        {loading && loadingTitle ? loadingTitle : title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: Colors.accent,
  },
  primaryPressed: {
    backgroundColor: Colors.accentDark,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  ghostPressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  ghostText: {
    color: Colors.accentLight,
  },
});
