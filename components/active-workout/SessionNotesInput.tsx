import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '../../constants/Colors';

type Props = {
  value: string;
  onChange: (v: string) => void;
};

const MAX = 500;

export default function SessionNotesInput({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>SESSION NOTES</Text>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.slice(0, MAX))}
        placeholder="How did this session feel? Note energy levels, form, anything…"
        placeholderTextColor={Colors.textMuted}
        multiline
        textAlignVertical="top"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: Colors.textHint,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 90,
    color: Colors.textPrimary,
    fontSize: 14,
  },
});
