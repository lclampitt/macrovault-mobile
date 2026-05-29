import { StyleSheet, Text, View } from 'react-native';
import { DS, Font, Radius, Tabular } from '../../lib/design-system';

type Props = {
  label: string;
  tabular?: boolean;
};

/**
 * Small emerald status badge (e.g. "~52 min" duration tag on the Next Up card).
 * 10px bold emerald text on rgba(16,185,129,0.12) bg, 4px radius.
 */
export default function StatusBadge({ label, tabular }: Props) {
  return (
    <View style={styles.badge}>
      <Text style={[styles.text, tabular && Tabular]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: DS.accentSoft,
    borderRadius: Radius.badge,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: Font.semibold,
    fontSize: 10,
    color: DS.accent,
    letterSpacing: 0.3,
  },
});
