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
import { Font } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
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
  const t = useTokens();
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
      <Pressable
        style={[styles.backdrop, { backgroundColor: t.bgOverlay }]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: t.bgCard, borderTopColor: t.borderDefault },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <SafeAreaView edges={['bottom']} style={styles.safeInner}>
            <View style={[styles.handle, { backgroundColor: t.borderStrong }]} />

            <View style={styles.header}>
              <Text style={[styles.title, { color: t.textPrimary }]}>Add exercise</Text>
              <Pressable
                onPress={onClose}
                style={[
                  styles.closeBtn,
                  { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={14} color={t.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>

            {/* Search */}
            <View
              style={[
                styles.searchWrap,
                { backgroundColor: t.bgInput, borderColor: t.borderDefault },
              ]}
            >
              <Search size={14} color={t.textTertiary} strokeWidth={2} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search exercises…"
                placeholderTextColor={t.textTertiary}
                style={[styles.searchInput, { color: t.textPrimary }]}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {query.length > 0 ? (
                <Pressable
                  onPress={() => setQuery('')}
                  hitSlop={6}
                  accessibilityLabel="Clear search"
                >
                  <X size={14} color={t.textTertiary} strokeWidth={2} />
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
                    style={[
                      styles.pill,
                      { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
                      active && { backgroundColor: t.primary, borderColor: t.primary },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: active ? t.textOnPrimary : t.textSecondary },
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
                  <Text style={[styles.emptyText, { color: t.textTertiary }]}>
                    No exercises match.
                  </Text>
                </View>
              ) : (
                filtered.map((ex) => (
                  <Pressable
                    key={ex.id}
                    onPress={() => onPick(ex.name)}
                    style={({ pressed }) => [
                      styles.row,
                      { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
                      pressed && { backgroundColor: t.borderDefault },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${ex.name}`}
                  >
                    <View
                      style={[
                        styles.rowIcon,
                        {
                          backgroundColor: t.primaryTintBg,
                          borderColor: t.primaryTintBorder,
                        },
                      ]}
                    >
                      <Dumbbell
                        size={14}
                        color={t.primary}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={[styles.rowName, { color: t.textPrimary }]} numberOfLines={1}>
                        {ex.name}
                      </Text>
                      <View style={styles.rowMetaRow}>
                        <Text style={[styles.rowMeta, { color: t.textTertiary }]}>
                          {titleCase(ex.bodyPart)}
                        </Text>
                        <Text style={[styles.rowMetaDot, { color: t.textQuaternary }]}>·</Text>
                        <Text style={[styles.rowMeta, { color: t.textTertiary }]}>
                          {titleCase(ex.equipment)}
                        </Text>
                      </View>
                    </View>
                    <Plus size={16} color={t.primary} strokeWidth={2.5} />
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
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
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
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    borderWidth: 1,
  },
  pillText: {
    fontFamily: Font.semibold,
    fontSize: 11,
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
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
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
  },
  rowMetaDot: {
    fontSize: 10,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Font.medium,
    fontSize: 13,
  },
});
