import { StyleSheet, Text } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function ExerciseSectionHeader({ letter }: { letter: string }) {
  return <Text style={styles.header}>{letter}</Text>;
}

const styles = StyleSheet.create({
  header: {
    color: Colors.accentLight,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
});
