import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Search,
  X,
} from 'lucide-react-native';
import { DS, Font, Radius } from '../lib/design-system';
import {
  EXERCISES,
  EXERCISE_CATEGORIES,
  titleCase,
  type Exercise,
} from '../lib/exercises';

export default function ExerciseLibraryScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      if (category !== 'All' && titleCase(e.bodyPart) !== category) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.targetMuscle.toLowerCase().includes(q) ||
        e.equipment.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={10}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={18} color={DS.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Exercise Library</Text>
        <View style={styles.headerMeta}>
          <Text style={styles.headerCount}>{filtered.length}</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <Search size={14} color={DS.textTertiary} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, muscle, or equipment"
          placeholderTextColor={DS.textQuaternary}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={6}>
            <X size={14} color={DS.textTertiary} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

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
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {c}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* NOTE: Custom-exercise creation (the "+ Custom" button on web) is not
          yet wired. Add a small FAB-style button next to the search bar once
          a `custom_exercises` table exists. */}

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Dumbbell size={28} color={DS.textTertiary} strokeWidth={2} />
          <Text style={styles.emptyText}>No exercises match that filter.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ExerciseRow
              item={item}
              onPress={() =>
                router.push({
                  pathname: '/exercise-details/[id]',
                  params: { id: item.id },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function ExerciseRow({
  item,
  onPress,
}: {
  item: Exercise;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      <View style={styles.rowIcon}>
        <Dumbbell size={16} color={DS.accent} strokeWidth={2} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.rowChips}>
          <RowChip label={titleCase(item.bodyPart)} accent />
          <RowChip label={titleCase(item.equipment)} />
        </View>
        <Text style={styles.rowMuscle} numberOfLines={1}>
          Target: {titleCase(item.targetMuscle)} · {titleCase(item.difficulty)}
        </Text>
      </View>
      <ChevronRight size={14} color={DS.textTertiary} strokeWidth={2} />
    </Pressable>
  );
}

function RowChip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <View style={[styles.chip, accent && styles.chipAccent]}>
      <Text style={[styles.chipText, accent && styles.chipTextAccent]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: DS.text,
    letterSpacing: -0.2,
  },
  headerMeta: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.accentSoft,
    borderColor: DS.accentBorder,
    borderWidth: 1,
  },
  headerCount: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: DS.accent,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: DS.text,
    fontFamily: Font.medium,
    fontSize: 13,
  },
  pillsScroll: {
    marginTop: 10,
    maxHeight: 48,
  },
  pillsRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderColor: DS.border,
    borderWidth: 1,
    backgroundColor: DS.surfaceFlat,
  },
  pillActive: {
    borderColor: DS.accentBorderStrong,
    backgroundColor: DS.accentSoft,
  },
  pillText: {
    color: DS.textSecondary,
    fontFamily: Font.semibold,
    fontSize: 11,
  },
  pillTextActive: {
    color: DS.accent,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 140,
  },
  separator: {
    height: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowPressed: {
    backgroundColor: DS.surfaceFlat,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: DS.accentSoft,
    borderColor: DS.accentBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  rowName: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.text,
    letterSpacing: -0.2,
  },
  rowChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  rowMuscle: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textTertiary,
  },
  chip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderColor: DS.border,
    borderWidth: 1,
    backgroundColor: DS.bg,
  },
  chipAccent: {
    borderColor: DS.accentBorder,
    backgroundColor: DS.accentSoft,
  },
  chipText: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.textTertiary,
    letterSpacing: 0.4,
  },
  chipTextAccent: {
    color: DS.accent,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyText: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: DS.textTertiary,
  },
});
