import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DS, Radius, Spacing } from '../../lib/design-system';
import CornerBrackets from './CornerBrackets';

type Tone = 'default' | 'emerald';
type Size = 'lg' | 'md' | 'sm';

type Props = ViewProps & {
  tone?: Tone;
  size?: Size;
  /** Add the L-shaped emerald corner brackets (hero-card detail). */
  brackets?: boolean;
};

/**
 * Base card primitive. Default tone = #0A0A0A with #1A1A1A border.
 * Emerald tone applies the subtle gradient + emerald border treatment from
 * the spec (used on the Next Up / Calories hero cards).
 */
export default function Card({
  tone = 'default',
  size = 'md',
  brackets,
  children,
  style,
  ...rest
}: Props) {
  const paddingStyle =
    size === 'lg'
      ? styles.padLg
      : size === 'sm'
        ? styles.padSm
        : styles.padMd;

  if (tone === 'emerald') {
    return (
      <View style={[styles.outer, styles.emeraldBorder, style]} {...rest}>
        <LinearGradient
          colors={[
            'rgba(16, 185, 129, 0.06)',
            'rgba(16, 185, 129, 0.02)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.inner, paddingStyle]}
        >
          {children}
          {brackets ? <CornerBrackets /> : null}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.outer, styles.defaultBorder, paddingStyle, style]} {...rest}>
      {children}
      {brackets ? <CornerBrackets /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: Radius.card,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  defaultBorder: {
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.border,
  },
  emeraldBorder: {
    borderWidth: 1,
    borderColor: DS.accentBorder,
    backgroundColor: DS.surface,
  },
  inner: {
    borderRadius: Radius.card,
  },
  padLg: { padding: Spacing.cardLg },
  padMd: { padding: Spacing.card },
  padSm: { padding: Spacing.cardSm },
});
