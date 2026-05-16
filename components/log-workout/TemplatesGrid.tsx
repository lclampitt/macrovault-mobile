import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import type { WorkoutTemplate } from '../../hooks/useWorkoutTemplates';
import TemplateCard from './TemplateCard';

type Props = {
  templates: WorkoutTemplate[];
  onSelect: (template: WorkoutTemplate) => void;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function TemplatesGrid({ templates, onSelect }: Props) {
  if (templates.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          No templates yet. Save a workout as a template to reuse it.
        </Text>
      </View>
    );
  }

  const rows = chunk(templates, 2);

  return (
    <View style={styles.grid}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((t) => (
            <TemplateCard key={t.id} template={t} onPress={() => onSelect(t)} />
          ))}
          {row.length === 1 ? <View style={styles.spacer} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  spacer: {
    flex: 1,
  },
  empty: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
