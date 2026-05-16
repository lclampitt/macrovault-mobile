import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useActiveWorkout } from '../../lib/active-workout-context';
import { useTheme } from '../../lib/theme-context';

function elapsedLabel(startedAt: number): string {
  const ms = Date.now() - startedAt;
  if (ms < 60_000) return 'Started just now';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `Started ${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0
    ? `Started ${hours} hour${hours === 1 ? '' : 's'} ago`
    : `Started ${hours}h ${rem}m ago`;
}

/**
 * Global "you have a workout in progress" banner. Rendered by the root
 * layout on authenticated screens (except the workout/picker screens).
 * Tapping Continue returns to the in-progress session.
 */
export default function ActiveWorkoutBanner() {
  const router = useRouter();
  const { state } = useActiveWorkout();

  const count = state.exercises.length;
  const title = state.name.trim() || 'Workout';

  return (
    <Pressable
      style={styles.banner}
      onPress={() => router.push('/active-workout')}
      accessibilityRole="button"
      accessibilityLabel="Continue workout in progress"
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="dumbbell" size={18} color="#FFFFFF" />
      </View>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          Workout in progress — {title}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {elapsedLabel(state.startedAt)} · {count}{' '}
          {count === 1 ? 'exercise' : 'exercises'}
        </Text>
      </View>
      <View style={styles.continue}>
        <Text style={styles.continueText}>Continue</Text>
        <Feather name="chevron-right" size={16} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  continue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
