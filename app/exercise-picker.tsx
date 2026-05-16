import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useActiveWorkout } from '../lib/active-workout-context';
import { useExerciseSearch } from '../hooks/useExerciseSearch';
import { EXERCISE_CATEGORIES } from '../lib/exercises';
import ExerciseSearchInput from '../components/exercise-picker/ExerciseSearchInput';
import ExerciseCategoryPills from '../components/exercise-picker/ExerciseCategoryPills';
import ExerciseSectionHeader from '../components/exercise-picker/ExerciseSectionHeader';
import ExerciseRow from '../components/exercise-picker/ExerciseRow';

export default function ExercisePickerScreen() {
  const router = useRouter();
  const { category: seedCategory } = useLocalSearchParams<{ category?: string }>();
  const ws = useActiveWorkout();

  const initialCategory =
    seedCategory && EXERCISE_CATEGORIES.includes(seedCategory)
      ? seedCategory
      : 'All';

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>(initialCategory);
  const [addedNames, setAddedNames] = useState<string[]>([]);

  const sections = useExerciseSearch(query, category);

  function handleAdd(name: string) {
    ws.addExercise(name);
    setAddedNames((prev) => [...prev, name]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Feather name="chevron-left" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Add Exercise</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.searchWrap}>
        <ExerciseSearchInput value={query} onChange={setQuery} />
      </View>

      <ExerciseCategoryPills selected={category} onSelect={setCategory} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {sections.length === 0 ? (
          <Text style={styles.empty}>No exercises match your search.</Text>
        ) : (
          sections.map((section) => (
            <View key={section.letter}>
              <ExerciseSectionHeader letter={section.letter} />
              {section.items.map((ex) => (
                <ExerciseRow
                  key={ex.id}
                  exercise={ex}
                  added={addedNames.includes(ex.name)}
                  onAdd={() => handleAdd(ex.name)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  empty: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 40,
  },
});
