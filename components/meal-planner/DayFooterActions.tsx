import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

/**
 * Two stubs for Phase 10a: "Anything else to add?" and "Clear week" wire up
 * in Phase 10b.
 */
export default function DayFooterActions() {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() =>
          Alert.alert(
            'Add another entry',
            'Coming soon — Phase 10b. Adds an extra snack/meal to this day.',
          )
        }
        style={styles.addBtn}
        accessibilityRole="button"
        accessibilityLabel="Add another entry"
      >
        <Feather name="plus" size={14} color={Colors.textMuted} />
        <Text style={styles.addText}>Anything else to add?</Text>
      </Pressable>
      <Pressable
        onPress={() =>
          Alert.alert(
            'Clear week',
            'Coming soon — Phase 10b. Will remove every meal from this week.',
          )
        }
        style={styles.clearBtn}
        accessibilityRole="button"
        accessibilityLabel="Clear week"
      >
        <Feather name="trash-2" size={14} color={Colors.textMuted} />
        <Text style={styles.clearText}>Clear week</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    marginTop: 18,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderColor: Colors.border,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
  },
  addText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
  },
  clearText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
