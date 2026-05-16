import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export type ActivityView = 'year' | 'month';

type Props = {
  view: ActivityView;
  onViewChange: (v: ActivityView) => void;
  year: number;
  monthLabel: string;
  isCurrentYear: boolean;
  isCurrentMonth: boolean;
  daysLogged: number;
  workouts: number;
  currentStreak: number;
  onPrev: () => void;
  onNext: () => void;
  onBack: () => void;
};

export default function ActivityHeader({
  view,
  onViewChange,
  year,
  monthLabel,
  isCurrentYear,
  isCurrentMonth,
  daysLogged,
  workouts,
  currentStreak,
  onPrev,
  onNext,
  onBack,
}: Props) {
  const title =
    view === 'year' ? (isCurrentYear ? 'Your year so far.' : `${year}`) : monthLabel;
  const kicker = `Activity · ${view === 'year' ? year : monthLabel}`;
  const nextDisabled = view === 'year' ? isCurrentYear : isCurrentMonth;

  return (
    <View>
      <View style={styles.topRow}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="chevron-left" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.screenTitle}>Activity</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.kicker}>
        <View style={styles.kickerDot} />
        <Text style={styles.kickerText}>{kicker}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.subtitle}>
        <Text style={styles.stat}>
          {daysLogged} {daysLogged === 1 ? 'day' : 'days'}
        </Text>
        {view === 'year' ? ' logged · ' : ' logged this month · '}
        <Text style={styles.stat}>
          {workouts} {workouts === 1 ? 'workout' : 'workouts'}
        </Text>
        {view === 'year' && isCurrentYear ? (
          <>
            {' · current streak '}
            <Text style={styles.stat}>
              {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
            </Text>
          </>
        ) : null}
      </Text>

      <View style={styles.controls}>
        <View style={styles.nav}>
          <Pressable
            onPress={onPrev}
            style={styles.navButton}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={view === 'year' ? 'Previous year' : 'Previous month'}
          >
            <Feather name="chevron-left" size={16} color={Colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={onNext}
            disabled={nextDisabled}
            style={[styles.navButton, nextDisabled && styles.navButtonDisabled]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={view === 'year' ? 'Next year' : 'Next month'}
          >
            <Feather name="chevron-right" size={16} color={Colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.toggle}>
          <Pressable
            onPress={() => onViewChange('year')}
            style={[styles.toggleBtn, view === 'year' && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, view === 'year' && styles.toggleTextActive]}>
              Year
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onViewChange('month')}
            style={[styles.toggleBtn, view === 'month' && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, view === 'month' && styles.toggleTextActive]}>
              Month
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  kickerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.accentLight,
  },
  kickerText: {
    color: Colors.accentLight,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    marginBottom: 16,
  },
  stat: {
    color: Colors.accentLight,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nav: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 7,
  },
  toggleBtnActive: {
    backgroundColor: Colors.accentSoft,
  },
  toggleText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: Colors.accentLight,
    fontWeight: '600',
  },
});
