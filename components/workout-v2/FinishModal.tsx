import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, RefreshCw, Save, type LucideIcon } from 'lucide-react-native';
import { DS, Font, Radius, Shadow, Tabular } from '../../lib/design-system';

export type FinishOption = 'update' | 'new' | 'keep';

type Props = {
  visible: boolean;
  workoutName: string;
  templateName: string | null;
  duration: string; // "30:45"
  doneSets: number;
  volumeLb: number;
  saving: boolean;
  onClose: () => void;
  onSave: (option: FinishOption) => void;
};

const OPTIONS: Array<{
  key: FinishOption;
  Icon: LucideIcon;
  label: string;
  sub: string;
}> = [
  { key: 'update', Icon: RefreshCw, label: 'Update template', sub: 'Overwrite with this workout' },
  { key: 'new', Icon: Save, label: 'Save as new template', sub: 'Keep original, add another' },
  { key: 'keep', Icon: Check, label: 'Keep original', sub: 'Just log this workout' },
];

function fmtNum(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export default function FinishModal({
  visible,
  workoutName,
  templateName,
  duration,
  doneSets,
  volumeLb,
  saving,
  onClose,
  onSave,
}: Props) {
  const [option, setOption] = useState<FinishOption>('keep');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.sheet}
          onPress={(e) => e.stopPropagation()}
        >
          <SafeAreaView edges={['bottom']}>
            <View style={styles.handle} />
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Finish workout</Text>
              <Text style={styles.subtitle}>
                Great work. Here&apos;s your session:
              </Text>
            </View>

            <View style={styles.statsCard}>
              <Stat label="DURATION" value={duration} />
              <View style={styles.statDivider} />
              <Stat label="SETS" value={String(doneSets)} />
              <View style={styles.statDivider} />
              <Stat label="VOLUME" value={fmtNum(volumeLb)} />
            </View>

            {templateName ? (
              <Text style={styles.templateLine}>
                Started from{' '}
                <Text style={styles.templateName}>{templateName}</Text>. What
                should happen to the template?
              </Text>
            ) : (
              <Text style={styles.templateLine}>
                Save this workout. Optionally save it as a new template.
              </Text>
            )}

            <View style={styles.optionsCol}>
              {(templateName
                ? OPTIONS
                : OPTIONS.filter((o) => o.key !== 'update')
              ).map((opt) => {
                const active = option === opt.key;
                const Icon = opt.Icon;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setOption(opt.key)}
                    style={[
                      styles.optionRow,
                      active && styles.optionRowActive,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={opt.label}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        active && styles.optionIconActive,
                      ]}
                    >
                      <Icon
                        size={14}
                        color={active ? DS.accent : DS.textSecondary}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={styles.optionText}>
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: active ? DS.text : '#DDD' },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text style={styles.optionSub}>{opt.sub}</Text>
                    </View>
                    {active ? (
                      <View style={styles.activeCheck}>
                        <Check size={12} color="#000" strokeWidth={3} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                onPress={onClose}
                disabled={saving}
                style={({ pressed }) => [
                  styles.keepGoingBtn,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Keep going"
              >
                <Text style={styles.keepGoingText}>Keep going</Text>
              </Pressable>
              <Pressable
                onPress={() => onSave(option)}
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveBtn,
                  Shadow.emeraldGlow,
                  styles.saveBtnRing,
                  saving && styles.disabled,
                  pressed && !saving && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Save workout"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.saveText}>Save workout</Text>
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, Tabular]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: DS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: DS.border,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'center',
    marginVertical: 8,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 20,
    color: DS.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textSecondary,
    marginTop: 4,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: DS.bg,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: DS.border,
  },
  statLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.textTertiary,
    letterSpacing: 0.6,
  },
  statValue: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: DS.text,
  },
  templateLine: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textSecondary,
    marginBottom: 10,
  },
  templateName: {
    fontFamily: Font.bold,
    color: DS.accent,
  },
  optionsCol: {
    gap: 8,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: DS.bg,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  optionRowActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0F0F0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  optionSub: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textTertiary,
    marginTop: 2,
  },
  activeCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: DS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 24,
    paddingTop: 4,
  },
  keepGoingBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.cardCompact,
    backgroundColor: '#0F0F0F',
    borderColor: DS.border,
    borderWidth: 1,
    alignItems: 'center',
  },
  keepGoingText: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.cardCompact,
    backgroundColor: DS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnRing: {
    borderWidth: 1,
    borderColor: DS.accentBorderStrong,
  },
  saveText: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: '#000',
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
