import { StyleSheet, TextInput } from 'react-native';
import { Colors } from '../../constants/Colors';

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function WorkoutNameInput({ value, onChange }: Props) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="Workout name…"
      placeholderTextColor={Colors.textMuted}
      style={styles.input}
      maxLength={80}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 10,
  },
});
