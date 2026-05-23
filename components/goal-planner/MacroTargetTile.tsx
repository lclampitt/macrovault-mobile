import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';

type Props = {
  label: string;
  value: number;
  unit: string;
};

export default function MacroTargetTile({ label, value, unit }: Props) {
  return (
    <View style={styles.tile}>
      <Text style={styles.value}>
        {value}
        <Text style={styles.unit}> {unit}</Text>
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 14,
    gap: 4,
  },
  value: {
    color: Colors.accentLight,
    fontSize: 26,
    fontWeight: '800',
  },
  unit: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  label: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
