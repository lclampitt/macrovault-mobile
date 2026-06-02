import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Calendar,
  CalendarPlus,
  Check,
  Dumbbell,
  Plus,
  Scale,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { Font, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import type { ScheduleItem, ScheduleKind } from '../../lib/schedule-store';
import Card from '../ds/Card';
import SectionLabel from '../ds/SectionLabel';

type Props = {
  items: ScheduleItem[];
  onAdd: () => void;
  /** Opens the shared LogMealSheet — records actual consumption. */
  onLogMeal: (item?: ScheduleItem) => void;
  onRemove?: (id: string) => void;
};

const KIND_ICONS: Record<ScheduleKind, LucideIcon> = {
  meal: Utensils,
  workout: Dumbbell,
  weight: Scale,
  other: Calendar,
};

const KIND_LABEL: Record<ScheduleKind, string> = {
  meal: 'Meal',
  workout: 'Workout',
  weight: 'Weigh-in',
  other: 'Event',
};

function fmtTime12(hhmm: string | undefined): string {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function ScheduleCard({
  items,
  onAdd,
  onLogMeal,
  onRemove,
}: Props) {
  const t = useTokens();
  return (
    <View style={styles.outer}>
      <View style={styles.headerRow}>
        <SectionLabel>Schedule</SectionLabel>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => onLogMeal()}
            hitSlop={6}
            style={({ pressed }) => [
              styles.headerChip,
              {
                backgroundColor: t.primary,
                borderColor: t.primary,
              },
              pressed && styles.addBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Log a meal"
          >
            <Plus size={12} color={t.textOnPrimary} strokeWidth={2.5} />
            <Text
              style={[styles.headerChipLabel, { color: t.textOnPrimary }]}
            >
              Log meal
            </Text>
          </Pressable>
          <Pressable
            onPress={onAdd}
            hitSlop={6}
            style={({ pressed }) => [
              styles.headerChip,
              {
                backgroundColor: t.primaryTintBg,
                borderColor: t.primaryTintBorder,
              },
              pressed && styles.addBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add to schedule"
          >
            <CalendarPlus size={12} color={t.primary} strokeWidth={2.5} />
            <Text style={[styles.headerChipLabel, { color: t.primary }]}>
              Plan
            </Text>
          </Pressable>
        </View>
      </View>

      <Card style={styles.card}>
        {items.length === 0 ? (
          <Pressable
            onPress={onAdd}
            style={({ pressed }) => [
              styles.emptyRow,
              pressed && styles.emptyRowPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add your first schedule item"
          >
            <View
              style={[
                styles.emptyIcon,
                {
                  backgroundColor: t.primaryTintBg,
                  borderColor: t.primaryTintBorder,
                },
              ]}
            >
              <CalendarPlus size={16} color={t.primary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>
                Plan your day
              </Text>
              <Text style={[styles.emptySub, { color: t.textTertiary }]}>
                Add meals, workouts, weigh-ins, or anything else you want on
                deck for today.
              </Text>
            </View>
          </Pressable>
        ) : (
          items.map((item, i) => {
            const Icon = KIND_ICONS[item.kind];
            const accent = item.kind === 'workout' || item.kind === 'weight';
            return (
              <View
                key={item.id}
                style={[
                  styles.row,
                  i < items.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: t.borderSubtle,
                  },
                ]}
              >
                <Text
                  style={[styles.time, Tabular, { color: t.textSecondary }]}
                >
                  {fmtTime12(item.time)}
                </Text>
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: accent
                        ? t.primaryTintBg
                        : t.bgCardElevated,
                      borderColor: accent
                        ? t.primaryTintBorder
                        : t.borderDefault,
                    },
                  ]}
                >
                  <Icon
                    size={14}
                    color={accent ? t.primary : t.textSecondary}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.body}>
                  <Text
                    style={[styles.title, { color: t.textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[styles.meta, { color: t.textTertiary }]}
                    numberOfLines={1}
                  >
                    {item.notes?.trim()
                      ? item.notes.trim()
                      : KIND_LABEL[item.kind]}
                  </Text>
                </View>
                {item.kind === 'meal' ? (
                  <Pressable
                    onPress={() => onLogMeal(item)}
                    hitSlop={6}
                    style={({ pressed }) => [
                      styles.logBtn,
                      {
                        backgroundColor: t.primaryTintBg,
                        borderColor: t.primaryTintBorder,
                      },
                      pressed && styles.removeBtnPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Log ${item.title}`}
                  >
                    <Check size={12} color={t.primary} strokeWidth={2.5} />
                    <Text style={[styles.logBtnLabel, { color: t.primary }]}>
                      Log
                    </Text>
                  </Pressable>
                ) : null}
                {onRemove ? (
                  <Pressable
                    onPress={() => onRemove(item.id)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.removeBtn,
                      { backgroundColor: t.bgCardElevated },
                      pressed && styles.removeBtnPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.title}`}
                  >
                    <X size={12} color={t.textTertiary} strokeWidth={2} />
                  </Pressable>
                ) : null}
              </View>
            );
          })
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { marginHorizontal: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  headerChipLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  addBtnPressed: { opacity: 0.7 },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  logBtnLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.3,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyRowPressed: { opacity: 0.85 },
  emptyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: Font.bold,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  emptySub: {
    fontFamily: Font.medium,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  time: {
    fontFamily: Font.bold,
    fontSize: 11,
    letterSpacing: 0,
    width: 64,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: Font.semibold,
    fontSize: 13,
  },
  meta: {
    fontFamily: Font.medium,
    fontSize: 11,
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnPressed: { opacity: 0.6 },
});
