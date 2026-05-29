import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { DS, Font } from '../../lib/design-system';
import type { WorkoutTemplate } from '../../hooks/useWorkoutTemplates';
import TemplateCard from './TemplateCard';

type Props = {
  templates: WorkoutTemplate[];
  onTemplatePress: (t: WorkoutTemplate) => void;
  onNew: () => void;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function TemplatesGrid({
  templates,
  onTemplatePress,
  onNew,
}: Props) {
  const rows = chunk(templates, 2);
  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>YOUR TEMPLATES</Text>
        <Pressable
          onPress={onNew}
          style={({ pressed }) => [styles.new, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="New template"
        >
          <Plus size={12} color={DS.accent} strokeWidth={2.5} />
          <Text style={styles.newText}>New</Text>
        </Pressable>
      </View>

      {templates.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No templates yet. Save a workout to reuse it next time.
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {rows.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onPress={() => onTemplatePress(t)}
                />
              ))}
              {row.length === 1 ? <View style={styles.filler} /> : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  heading: {
    fontFamily: Font.semibold,
    fontSize: 11,
    color: DS.textTertiary,
    letterSpacing: 1,
  },
  new: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  newText: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: DS.accent,
  },
  grid: {
    marginHorizontal: 20,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  filler: {
    flex: 1,
  },
  empty: {
    marginHorizontal: 20,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 18,
  },
  emptyText: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
    textAlign: 'center',
    lineHeight: 17,
  },
});
