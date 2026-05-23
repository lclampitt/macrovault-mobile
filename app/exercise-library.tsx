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
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
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
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="chevron-left" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Exercise Library</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchRow}>
        <Feather name="search" size={14} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, muscle, or equipment"
          placeholderTextColor={Colors.textHint}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={6}>
            <Feather name="x" size={14} color={Colors.textMuted} />
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

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No exercises match.</Text>
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
      <View style={styles.rowLeft}>
        <Text style={styles.rowName}>{item.name}</Text>
        <View style={styles.rowChips}>
          <RowChip label={titleCase(item.bodyPart)} accent />
          <RowChip label={titleCase(item.equipment)} />
          <RowChip label={titleCase(item.difficulty)} />
        </View>
        <Text style={styles.rowMuscle}>
          Target: {titleCase(item.targetMuscle)}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.textMuted} />
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
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  headerSpacer: { width: 32, height: 32 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 14,
    marginTop: 4,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  pillsScroll: {
    flexGrow: 0,
    marginTop: 10,
  },
  pillsRow: {
    paddingHorizontal: 14,
    gap: 6,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderColor: Colors.border,
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  pillActive: {
    borderColor: Colors.borderAccent,
    backgroundColor: Colors.accentSoft,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: Colors.accentLight,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 130,
  },
  separator: {
    height: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowPressed: {
    backgroundColor: Colors.surfaceMuted,
  },
  rowLeft: {
    flex: 1,
    gap: 6,
  },
  rowName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  rowChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  rowMuscle: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  chip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 7,
    borderColor: Colors.border,
    borderWidth: 1,
    backgroundColor: Colors.background,
  },
  chipAccent: {
    borderColor: Colors.borderAccentSoft,
    backgroundColor: Colors.accentSofter,
  },
  chipText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  chipTextAccent: {
    color: Colors.accentLight,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
});
