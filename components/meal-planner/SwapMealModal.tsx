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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import type { SwapPayload } from '../../hooks/useMealPlanMutations';
import SwapMealTabs, { type SwapTab } from './SwapMealTabs';
import SwapManualEntryTab from './SwapManualEntryTab';
import SwapSavedMealsTab from './SwapSavedMealsTab';
import SwapFoodSearchTab from './SwapFoodSearchTab';
import SwapAITabStub from './SwapAITabStub';

export type SwapSlot = {
  day_of_week: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  dateLabel: string; // "Mon, May 18"
};

type Props = {
  visible: boolean;
  slot: SwapSlot | null;
  saving: boolean;
  onClose: () => void;
  onAdd: (meal: SwapPayload) => void;
};

const MEAL_LABEL: Record<SwapSlot['meal_type'], string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

export default function SwapMealModal({
  visible,
  slot,
  saving,
  onClose,
  onAdd,
}: Props) {
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
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Feather name="chevron-left" size={18} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>
              {slot.dateLabel} — {MEAL_LABEL[slot.meal_type]}
            </Text>
            <View style={styles.spacer} />
          </View>

          <View style={styles.tabsWrap}>
            <SwapMealTabs active={tab} onChange={setTab} aiDisabled />
          </View>

          <View style={styles.body}>
            {tab === 'ai' ? (
              <SwapAITabStub />
            ) : tab === 'saved' ? (
              <SwapSavedMealsTab saving={saving} onAdd={onAdd} />
            ) : tab === 'search' ? (
              <SwapFoodSearchTab saving={saving} onAdd={onAdd} />
            ) : (
              <SwapManualEntryTab saving={saving} onAdd={onAdd} />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  spacer: {
    width: 32,
    height: 32,
  },
  tabsWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  body: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
});
