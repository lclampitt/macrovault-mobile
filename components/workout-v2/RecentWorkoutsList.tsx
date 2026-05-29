import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Dumbbell, Repeat, Trash2 } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { DS, Font, Tabular } from '../../lib/design-system';
import { fmtShortMonthDay } from '../../lib/date';
import Card from '../ds/Card';
import type { RecentWorkout } from '../../hooks/useRecentWorkouts';

const DESTRUCTIVE = '#E5736A';

type Props = {
  workouts: RecentWorkout[];
  onPress: (w: RecentWorkout) => void;
  onRepeat: (w: RecentWorkout) => void;
  onDelete: (w: RecentWorkout) => void;
};

const fmtShort = fmtShortMonthDay;

function renderDeleteAction() {
  return (
    <View style={styles.swipeAction}>
      <Trash2 size={16} color="#000" strokeWidth={2.5} />
      <Text style={styles.swipeActionText}>Delete</Text>
    </View>
  );
}

export default function RecentWorkoutsList({
  workouts,
  onPress,
  onRepeat,
  onDelete,
}: Props) {
  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>RECENT WORKOUTS</Text>
        <Text style={[styles.count, Tabular]}>
          {workouts.length} {workouts.length === 1 ? 'session' : 'sessions'}
        </Text>
      </View>

      <View style={styles.outer}>
        <Card style={styles.card}>
          {workouts.length === 0 ? (
            <Text style={styles.empty}>
              No workouts yet. Quick Start above to log your first session.
            </Text>
          ) : (
            workouts.map((w, i) => (
              <Swipeable
                key={w.id}
                renderRightActions={renderDeleteAction}
                onSwipeableOpen={(dir) => {
                  if (dir === 'right') onDelete(w);
                }}
                overshootRight={false}
                friction={2}
              >
                <Pressable
                  onPress={() => onPress(w)}
                  style={({ pressed }) => [
                    styles.row,
                    styles.rowSurface,
                    i < workouts.length - 1 && styles.rowDivider,
                    pressed && styles.rowPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${w.name}`}
                >
                  <View style={styles.iconBubble}>
                    <Dumbbell size={14} color={DS.accent} strokeWidth={2} />
                  </View>
                  <View style={styles.body}>
                    <Text style={styles.name} numberOfLines={1}>
                      {w.name}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={[styles.meta, Tabular]}>
                        {fmtShort(w.date)}
                      </Text>
                      <Text style={styles.metaDot}>·</Text>
                      <Text style={[styles.meta, Tabular]}>
                        {w.exerciseCount}{' '}
                        {w.exerciseCount === 1 ? 'exercise' : 'exercises'}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      onRepeat(w);
                    }}
                    style={({ pressed }) => [
                      styles.repeatBtn,
                      pressed && styles.repeatBtnPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Repeat ${w.name}`}
                    hitSlop={6}
                  >
                    <Repeat size={12} color={DS.accent} strokeWidth={2.5} />
                    <Text style={styles.repeatText}>Repeat</Text>
                  </Pressable>
                </Pressable>
              </Swipeable>
            ))
          )}
        </Card>
      </View>
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
  count: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textSecondary,
  },
  outer: {
    marginHorizontal: 20,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowSurface: {
    // Solid bg so the swipe-action behind the row isn't visible at rest.
    backgroundColor: DS.surface,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: DS.divider,
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  swipeAction: {
    width: 92,
    backgroundColor: DESTRUCTIVE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  swipeActionText: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: '#000',
    letterSpacing: 0.4,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: DS.surfaceFlat,
    borderWidth: 1,
    borderColor: DS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  name: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  meta: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textTertiary,
  },
  metaDot: {
    color: DS.textDimmest,
    fontSize: 10,
  },
  repeatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  repeatBtnPressed: {
    transform: [{ scale: 0.95 }],
  },
  repeatText: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.accent,
  },
  empty: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
    textAlign: 'center',
    paddingVertical: 28,
    paddingHorizontal: 18,
  },
});
