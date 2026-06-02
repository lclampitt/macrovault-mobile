import { Text, type TextStyle } from 'react-native';
import { Font } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

type Props = {
  children: React.ReactNode;
  /** Use the emerald variant for hero-card headers ("CALORIES TODAY"). */
  emerald?: boolean;
  style?: TextStyle;
};

/**
 * Uppercase tracked label above cards. Tertiary-text grey by default, or
 * emerald variant for hero-card headers. Theme-aware via `useTokens`.
 */
export default function SectionLabel({ children, emerald, style }: Props) {
  const t = useTokens();
  return (
    <Text
      style={[
        {
          fontFamily: emerald ? Font.bold : Font.semibold,
          fontSize: 11,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: emerald ? t.primary : t.textTertiary,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
