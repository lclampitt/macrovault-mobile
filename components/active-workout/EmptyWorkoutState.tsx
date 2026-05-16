import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import AddExerciseButton from './AddExerciseButton';

export default function EmptyWorkoutState({
  onAddExercise,
}: {
  onAddExercise: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons
        name="dumbbell"
        size={40}
        color={Colors.textMuted}
      />
      <Text style={styles.text}>Tap &quot;Add Exercise&quot; to get started</Text>
      <View style={styles.btnWrap}>
        <AddExerciseButton onPress={onAddExercise} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  btnWrap: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
});
