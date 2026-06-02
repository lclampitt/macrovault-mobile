import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius, Spacing } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
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
 * Base card primitive. Default tone reads from `tokens.bgCard` so the same
 * surface looks correct in dark / light / sakura. Emerald tone overlays the
 * `tokens.gradientCardTinted` gradient on top of the base card.
 */
export default function Card({
  tone = 'default',
  size = 'md',
  brackets,
  children,
  style,
  ...rest
}: Props) {
  const t = useTokens();
  const paddingStyle =
    size === 'lg'
      ? styles.padLg
      : size === 'sm'
        ? styles.padSm
        : styles.padMd;

  if (tone === 'emerald') {
    return (
      <View
        style={[
          styles.outer,
          {
            borderColor: t.primaryTintBorder,
            backgroundColor: t.bgCard,
          },
          style,
        ]}
        {...rest}
      >
        <LinearGradient
          colors={t.gradientCardTinted as unknown as readonly [string, string]}
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
    <View
      style={[
        styles.outer,
        {
          backgroundColor: t.bgCard,
          borderColor: t.borderDefault,
        },
        paddingStyle,
        style,
      ]}
      {...rest}
    >
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
    borderWidth: 1,
  } as ViewStyle,
  inner: {
    borderRadius: Radius.card,
  },
  padLg: { padding: Spacing.cardLg },
  padMd: { padding: Spacing.card },
  padSm: { padding: Spacing.cardSm },
});
