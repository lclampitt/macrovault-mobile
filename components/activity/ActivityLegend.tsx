import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';

const ITEMS: { label: string; color: string }[] = [
  { label: 'Workout', color: Colors.activityWorkout },
  { label: 'Meals', color: Colors.activityMeals },
  { label: 'Both', color: Colors.activityBoth },
  { label: 'Nothing', color: Colors.activityEmpty },
];

export default function ActivityLegend() {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>Logged:</Text>
      {ITEMS.map((it) => (
        <View key={it.label} style={styles.item}>
          <View style={[styles.swatch, { backgroundColor: it.color }]} />
          <Text style={styles.itemText}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  label: {
    color: Colors.textHint,
    fontSize: 11,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  itemText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
});
