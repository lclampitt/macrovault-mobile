import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

type Props = {
  dateLabel: string; // "Monday, May 18"
  isLogged: boolean;
  busy: boolean;
  onToggleLogDay: () => void;
};

/**
 * 3 chips on the right: refresh-day (Phase 10c stub), copy-day (Phase 10b
 * stub — kept simple for this slice), and clipboard log-day (wired).
 */
export default function SelectedDayHeader({
  dateLabel,
  isLogged,
  busy,
  onToggleLogDay,
}: Props) {
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
              'Coming soon. Will copy these meals to another day.',
            )
          }
        />
        <Pressable
          onPress={onToggleLogDay}
          hitSlop={6}
          disabled={busy}
          style={[
            styles.chip,
            isLogged && styles.chipLogged,
            busy && styles.chipBusy,
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: isLogged }}
          accessibilityLabel={
            isLogged ? 'Unlog this day from macros' : 'Log this day to macros'
          }
        >
          <Feather
            name={isLogged ? 'check-square' : 'clipboard'}
            size={13}
            color={isLogged ? Colors.accentLight : Colors.textSecondary}
          />
        </Pressable>
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
      <Feather name={icon} size={13} color={Colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 6,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderColor: Colors.border,
    borderWidth: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLogged: {
    borderColor: Colors.borderAccent,
    backgroundColor: Colors.accentSoft,
  },
  chipBusy: {
    opacity: 0.5,
  },
});
