import { StyleSheet, Text, type TextStyle } from 'react-native';
import { Type } from '../../lib/design-system';

type Props = {
  children: React.ReactNode;
  emerald?: boolean;
  style?: TextStyle;
};

/**
 * Uppercase tracked label above cards. 11px semibold #666 by default, or
 * emerald variant for hero-card headers ("NEXT UP"). Sentence-case
 * everywhere else per the spec.
 */
export default function SectionLabel({ children, emerald, style }: Props) {
  return (
    <Text style={[emerald ? Type.sectionLabelEmerald : Type.sectionLabel, style]}>
      {children}
    </Text>
  );
}

// Suppress unused import warning — StyleSheet kept for future variants.
StyleSheet.create({});
