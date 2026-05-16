import { StyleSheet, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function ExerciseSearchInput({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Feather name="search" size={16} color={Colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Search exercises…"
        placeholderTextColor={Colors.textMuted}
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
  },
});
