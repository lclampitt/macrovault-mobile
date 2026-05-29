import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dumbbell, Plus, Search, X } from 'lucide-react-native';
import { DS, Font } from '../../lib/design-system';
import {
  EXERCISES,
  EXERCISE_CATEGORIES,
  titleCase,
  type Exercise,
} from '../../lib/exercises';

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (exerciseName: string) => void;
};

export default function AddExerciseSheet({ visible, onClose, onPick }: Props) {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');

  const filtered: Exercise[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      if (category !== 'All' && titleCase(e.bodyPart) !== category) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.targetMuscle.toLowerCase().includes(q) ||
        e.equipment.toLowerCase().includes(q) ||
        e.bodyPart.toLowerCase().includes(q)
      );
    });
  }, [category, query]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <SafeAreaView edges={['bottom']} style={styles.safeInner}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>Add exercise</Text>
              <Pressable
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={14} color={DS.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
              <Search size={14} color={DS.textTertiary} strokeWidth={2} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search exercises…"
                placeholderTextColor={DS.textTertiary}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {query.length > 0 ? (
                <Pressable
                  onPress={() => setQuery('')}
                  hitSlop={6}
                  accessibilityLabel="Clear search"
                >
                  <X size={14} color={DS.textTertiary} strokeWidth={2} />
                </Pressable>
              ) : null}
            </View>

            {/* Filter pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pillsScroll}
              contentContainerStyle={styles.pillsRow}
            >
              {EXERCISE_CATEGORIES.map((c) => {
                const active = c === category;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    style={[styles.pill, active && styles.pillActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        active && styles.pillTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* List */}
            <ScrollView
              style={styles.list}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            >
              {filtered.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No exercises match.</Text>
                </View>
              ) : (
                filtered.map((ex) => (
                  <Pressable
                    key={ex.id}
                    onPress={() => onPick(ex.name)}
                    style={({ pressed }) => [
                      styles.row,
                      pressed && styles.rowPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${ex.name}`}
                  >
                    <View style={styles.rowIcon}>
                      <Dumbbell
                        size={14}
                        color={DS.accent}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={styles.rowName} numberOfLines={1}>
                        {ex.name}
                      </Text>
                      <View style={styles.rowMetaRow}>
                        <Text style={styles.rowMeta}>
                          {titleCase(ex.bodyPart)}
                        </Text>
                        <Text style={styles.rowMetaDot}>·</Text>
                        <Text style={styles.rowMeta}>
                          {titleCase(ex.equipment)}
                        </Text>
                      </View>
                    </View>
                    <Plus size={16} color={DS.accent} strokeWidth={2.5} />
                  </Pressable>
                ))
              )}
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: DS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: DS.border,
    paddingHorizontal: 20,
    paddingTop: 8,
    maxHeight: '85%',
  },
  safeInner: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 18,
    color: DS.text,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0F0F0F',
    borderColor: DS.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F0F0F',
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 13,
    color: DS.text,
    padding: 0,
  },
  pillsScroll: {
    flexGrow: 0,
    marginBottom: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#0F0F0F',
    borderColor: DS.border,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: DS.accent,
    borderColor: DS.accent,
  },
  pillText: {
    fontFamily: Font.semibold,
    fontSize: 11,
    color: DS.textSecondary,
  },
  pillTextActive: {
    color: '#000',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0F0F0F',
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  rowPressed: {
    backgroundColor: '#141414',
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
  },
  rowName: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.text,
  },
  rowMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  rowMeta: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textTertiary,
  },
  rowMetaDot: {
    color: DS.textDimmest,
    fontSize: 10,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: DS.textTertiary,
  },
});
