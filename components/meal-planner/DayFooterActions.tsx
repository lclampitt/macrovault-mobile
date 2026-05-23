import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

type Props = {
  hasEntries: boolean;
  clearing: boolean;
  onClearWeek: () => void;
};

/**
 * "Anything else to add?" stays a stub — adds a 4th non-slot entry which the
 * current schema (one row per meal_type) doesn't support cleanly. Clear week
 * is wired.
 */
export default function DayFooterActions({
  hasEntries,
  clearing,
  onClearWeek,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() =>
          Alert.alert(
            'Add another entry',
            'Coming soon. Adds an extra snack/meal beyond the 3 main slots.',
          )
        }
        style={styles.addBtn}
        accessibilityRole="button"
        accessibilityLabel="Add another entry"
      >
        <Feather name="plus" size={12} color={Colors.textMuted} />
        <Text style={styles.addText}>Anything else to add?</Text>
      </Pressable>
      <Pressable
        onPress={onClearWeek}
        disabled={clearing || !hasEntries}
        style={[
          styles.clearBtn,
          (clearing || !hasEntries) && styles.clearBtnDisabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Clear week"
      >
        <Feather name="trash-2" size={12} color={Colors.textMuted} />
        <Text style={styles.clearText}>
          {clearing ? 'Clearing…' : 'Clear week'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    marginTop: 14,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderColor: Colors.border,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
  },
  addText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
  },
  clearBtnDisabled: {
    opacity: 0.5,
  },
  clearText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
