import { StyleSheet, Text, View } from 'react-native';
import { DS, Font, Radius } from '../../lib/design-system';

type Props = {
  label: string;
};

/**
 * Exercise chip / inert pill. #0A0A0A bg, #1A1A1A border, 6px radius,
 * 11px medium #999 text.
 */
export default function Pill({ label }: Props) {
  return (
    <View style={styles.pill}>
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textSecondary,
  },
});
