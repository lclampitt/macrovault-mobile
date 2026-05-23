import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

type Props = {
  dateLabel: string; // "Monday, May 18"
};

/**
 * 3 action chips on the right mirror the web's per-day controls. They're
 * stubbed in Phase 10a — wiring lands in Phase 10b (clipboard/duplicate) and
 * Phase 10c (refresh-day with AI).
 */
export default function SelectedDayHeader({ dateLabel }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{dateLabel}</Text>
      <View style={styles.actions}>
        <ActionChip
          label="Regenerate day with AI"
          icon="refresh-cw"
          onPress={() =>
            Alert.alert(
              'Regenerate day',
              'Coming soon — Phase 10c. Will rebuild this day via Claude.',
            )
          }
        />
        <ActionChip
          label="Copy day to…"
          icon="copy"
          onPress={() =>
            Alert.alert(
              'Copy day',
              'Coming soon — Phase 10b. Will copy these meals to another day.',
            )
          }
        />
        <ActionChip
          label="Log day to macros"
          icon="clipboard"
          onPress={() =>
            Alert.alert(
              'Log day',
              'Coming soon — Phase 10b. Will write this day’s meals to your food log.',
            )
          }
        />
      </View>
    </View>
  );
}

type ChipProps = {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
};

function ActionChip({ label, icon, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={styles.chip}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Feather name={icon} size={15} color={Colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 10,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderColor: Colors.border,
    borderWidth: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
