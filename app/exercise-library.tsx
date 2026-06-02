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
import { Font, Radius } from '../lib/design-system';
import { useTokens } from '../lib/theme-context';
import {
  EXERCISES,
  EXERCISE_CATEGORIES,
  titleCase,
  type Exercise,
} from '../lib/exercises';

export default function ExerciseLibraryScreen() {
  const router = useRouter();
  const t = useTokens();
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
          <ChevronLeft size={18} color={t.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>
          Exercise Library
        </Text>
        <View
          style={[
            styles.headerMeta,
            {
              backgroundColor: t.primaryTintBg,
              borderColor: t.primaryTintBorder,
            },
          ]}
        >
          <Text style={[styles.headerCount, { color: t.primary }]}>
            {filtered.length}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.searchRow,
          {
            backgroundColor: t.bgCard,
            borderColor: t.borderDefault,
          },
        ]}
      >
        <Search size={14} color={t.textTertiary} strokeWidth={2} />
        <TextInput
          style={[styles.searchInput, { color: t.textPrimary }]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, muscle, or equipment"
          placeholderTextColor={t.textQuaternary}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={6}>
            <X size={14} color={t.textTertiary} strokeWidth={2} />
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
              style={[
                styles.pill,
                {
                  borderColor: active ? t.primaryBorderStrong : t.borderDefault,
                  backgroundColor: active ? t.primaryTintBg : t.bgCardElevated,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: active ? t.primary : t.textSecondary },
                ]}
              >
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
          <Dumbbell size={28} color={t.textTertiary} strokeWidth={2} />
          <Text style={[styles.emptyText, { color: t.textTertiary }]}>
            No exercises match that filter.
          </Text>
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
  const t = useTokens();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? t.bgCardElevated : t.bgCard,
          borderColor: t.borderDefault,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={item.name}
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
        <Dumbbell size={16} color={t.primary} strokeWidth={2} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowName, { color: t.textPrimary }]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.rowChips}>
          <RowChip label={titleCase(item.bodyPart)} accent />
          <RowChip label={titleCase(item.equipment)} />
        </View>
        <Text
          style={[styles.rowMuscle, { color: t.textTertiary }]}
          numberOfLines={1}
        >
          Target: {titleCase(item.targetMuscle)} · {titleCase(item.difficulty)}
        </Text>
      </View>
      <ChevronRight size={14} color={t.textTertiary} strokeWidth={2} />
    </Pressable>
  );
}

function RowChip({ label, accent }: { label: string; accent?: boolean }) {
  const t = useTokens();
  return (
    <View
      style={[
        styles.chip,
        {
          borderColor: accent ? t.primaryTintBorder : t.borderDefault,
          backgroundColor: accent ? t.primaryTintBg : t.bgPage,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: accent ? t.primary : t.textTertiary },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
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
    letterSpacing: -0.2,
  },
  headerMeta: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerCount: {
    fontFamily: Font.bold,
    fontSize: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    borderWidth: 1,
    borderRadius: Radius.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
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
    borderWidth: 1,
  },
  pillText: {
    fontFamily: Font.semibold,
    fontSize: 11,
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
    borderWidth: 1,
    borderRadius: Radius.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
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
  },
  chip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.4,
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
  },
});
