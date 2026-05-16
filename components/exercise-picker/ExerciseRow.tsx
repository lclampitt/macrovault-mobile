import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { titleCase, type Exercise } from '../../lib/exercises';

type Props = {
  exercise: Exercise;
  added: boolean;
  onAdd: () => void;
};

export default function ExerciseRow({ exercise, added, onAdd }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {titleCase(exercise.targetMuscle)} · {titleCase(exercise.equipment)}
        </Text>
      </View>
      <Pressable
        onPress={onAdd}
        style={[styles.addBtn, added && styles.addBtnAdded]}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Add ${exercise.name}`}
      >
        <Feather
          name={added ? 'check' : 'plus'}
          size={16}
          color={added ? Colors.accentLight : '#FFFFFF'}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  sub: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnAdded: {
    backgroundColor: Colors.accentSoft,
  },
});
