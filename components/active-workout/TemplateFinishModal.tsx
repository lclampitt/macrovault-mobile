import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

type Props = {
  visible: boolean;
  templateName: string;
  defaultNewName: string;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onUpdate: () => void;
  onKeepOriginal: () => void;
  onSaveAsNew: (name: string) => void;
};

export default function TemplateFinishModal({
  visible,
  templateName,
  defaultNewName,
  saving,
  error,
  onCancel,
  onUpdate,
  onKeepOriginal,
  onSaveAsNew,
}: Props) {
  const [mode, setMode] = useState<'choices' | 'name'>('choices');
  const [newName, setNewName] = useState(defaultNewName);

  useEffect(() => {
    if (visible) {
      setMode('choices');
      setNewName(defaultNewName);
    }
  }, [visible, defaultNewName]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={saving ? undefined : onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {mode === 'choices' ? (
            <>
              <Text style={styles.title}>Finish workout</Text>
              <Text style={styles.message}>
                Started from{' '}
                <Text style={styles.templateName}>{templateName}</Text>. What
                should happen to the template?
              </Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={[styles.choiceBtn, saving && styles.btnDisabled]}
                onPress={onUpdate}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Update template"
              >
                <Feather name="refresh-cw" size={16} color={Colors.accentLight} />
                <View style={styles.choiceText}>
                  <Text style={styles.choiceTitle}>Update template</Text>
                  <Text style={styles.choiceSub}>
                    Overwrite {templateName} with this workout
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={[styles.choiceBtn, saving && styles.btnDisabled]}
                onPress={() => setMode('name')}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Save as new template"
              >
                <Feather name="plus-square" size={16} color={Colors.accentLight} />
                <View style={styles.choiceText}>
                  <Text style={styles.choiceTitle}>Save as new template</Text>
                  <Text style={styles.choiceSub}>Keep {templateName}, add another</Text>
                </View>
              </Pressable>

              <Pressable
                style={[styles.choiceBtn, saving && styles.btnDisabled]}
                onPress={onKeepOriginal}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Keep original"
              >
                <Feather name="check" size={16} color={Colors.accentLight} />
                <View style={styles.choiceText}>
                  <Text style={styles.choiceTitle}>Keep original</Text>
                  <Text style={styles.choiceSub}>
                    Just log this workout, leave the template
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={styles.ghostBtn}
                onPress={onCancel}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Keep going"
              >
                <Text style={styles.ghostText}>
                  {saving ? 'Saving…' : 'Keep going'}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>New template name</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Template name"
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
                autoFocus
                maxLength={60}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                style={[
                  styles.primaryBtn,
                  (saving || !newName.trim()) && styles.btnDisabled,
                ]}
                onPress={() => onSaveAsNew(newName.trim())}
                disabled={saving || !newName.trim()}
                accessibilityRole="button"
                accessibilityLabel="Save new template"
              >
                <Text style={styles.primaryText}>
                  {saving ? 'Saving…' : 'Save template'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.ghostBtn}
                onPress={() => setMode('choices')}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <Text style={styles.ghostText}>Back</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  templateName: {
    color: Colors.accentLight,
    fontWeight: '600',
  },
  error: {
    color: Colors.error,
    fontSize: 13,
    marginBottom: 12,
  },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  choiceText: {
    flex: 1,
  },
  choiceTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  choiceSub: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  ghostBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ghostText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 16,
    marginBottom: 14,
  },
  primaryBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
