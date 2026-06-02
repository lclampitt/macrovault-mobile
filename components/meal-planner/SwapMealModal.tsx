import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Font } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import type { SwapPayload } from '../../hooks/useMealPlanMutations';
import SwapMealTabs, { type SwapTab } from './SwapMealTabs';
import SwapManualEntryTab from './SwapManualEntryTab';
import SwapSavedMealsTab from './SwapSavedMealsTab';
import SwapFoodSearchTab from './SwapFoodSearchTab';
import SwapAITab from './SwapAITab';

export type SwapSlot = {
  day_of_week: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dateLabel: string; // "Mon, May 18"
};

export type SlotAIContext = {
  remaining: { calories: number; protein: number; carbs: number; fat: number };
  goal: string; // 'cutting' | 'bulking' | 'maintenance'
};

type Props = {
  visible: boolean;
  slot: SwapSlot | null;
  saving: boolean;
  aiContext: SlotAIContext | null;
  onClose: () => void;
  onAdd: (meal: SwapPayload) => void;
};

const MEAL_LABEL: Record<SwapSlot['meal_type'], string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export default function SwapMealModal({
  visible,
  slot,
  saving,
  aiContext,
  onClose,
  onAdd,
}: Props) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<SwapTab>('manual');

  // Reset to Manual Entry whenever the modal opens for a new slot.
  useEffect(() => {
    if (visible) setTab('manual');
  }, [visible, slot?.day_of_week, slot?.meal_type]);

  if (!slot) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      {/* Root paints the page background directly — same color the app
          shell uses, so on Sakura the cream background carries through.
          Atmospheric layers from the app shell live behind the Modal's
          own surface (Modal manages its own root view) so they're not
          visible here; the Modal is a self-contained sheet. */}
      <View style={[styles.flex, { backgroundColor: t.bgPage }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          {/* Header — explicit insets.top + 8 padding so the title clears
              the dynamic island / notch on every device. Uses the same
              rounded-pill back button pattern as the other in-app
              headers (goal-planner, exercise-library, settings). */}
          <View
            style={[
              styles.header,
              { paddingTop: insets.top + 8 },
            ]}
          >
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={[
                styles.backBtn,
                {
                  backgroundColor: t.bgCard,
                  borderColor: t.borderDefault,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <ChevronLeft size={18} color={t.textPrimary} strokeWidth={2} />
            </Pressable>
            <Text
              style={[styles.title, { color: t.textPrimary }]}
              numberOfLines={1}
            >
              {slot.dateLabel} — {MEAL_LABEL[slot.meal_type]}
            </Text>
            {/* Spacer matches back button width so the title stays
                visually centered. */}
            <View style={styles.spacer} />
          </View>

          <View style={styles.tabsWrap}>
            <SwapMealTabs active={tab} onChange={setTab} />
          </View>

          <View
            style={[
              styles.body,
              { paddingBottom: 14 + insets.bottom },
            ]}
          >
            {tab === 'ai' ? (
              <SwapAITab
                dayOfWeek={slot.day_of_week}
                mealType={slot.meal_type}
                remaining={
                  aiContext?.remaining ?? {
                    calories: 600,
                    protein: 35,
                    carbs: 75,
                    fat: 20,
                  }
                }
                goal={aiContext?.goal ?? 'maintenance'}
                saving={saving}
                onAdd={onAdd}
              />
            ) : tab === 'saved' ? (
              <SwapSavedMealsTab saving={saving} onAdd={onAdd} />
            ) : tab === 'search' ? (
              <SwapFoodSearchTab saving={saving} onAdd={onAdd} />
            ) : (
              <SwapManualEntryTab saving={saving} onAdd={onAdd} />
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: Font.bold,
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  spacer: {
    width: 36,
    height: 36,
  },
  tabsWrap: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 4,
  },
  body: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
});
