import { useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import type { ActiveExercise } from '../../lib/active-workout-context';
import SetRow from './SetRow';

type Props = {
  exercise: ActiveExercise;
  onUpdateSet: (
    setId: string,
    field: 'weight' | 'reps' | 'completed',
    value: string | boolean,
  ) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onRequestRemove: () => void;
  onSetNote: (note: string) => void;
  onRestTimer: () => void;
  drag?: () => void;
  isActive?: boolean;
};

type Anchor = { x: number; y: number; w: number; h: number };
const MENU_W = 220;

export default function ExerciseCard({
  exercise,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onRequestRemove,
  onSetNote,
  onRestTimer,
  drag,
  isActive,
}: Props) {
  const kebabRef = useRef<View>(null);
  const [menuAnchor, setMenuAnchor] = useState<Anchor | null>(null);
  const [showNote, setShowNote] = useState(
    !!exercise.note && exercise.note.length > 0,
  );

  function openMenu() {
    kebabRef.current?.measureInWindow((x, y, w, h) => {
      setMenuAnchor({ x, y, w, h });
    });
  }

  function closeMenu() {
    setMenuAnchor(null);
  }

  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      <View style={styles.header}>
        <Pressable
          onLongPress={drag}
          delayLongPress={120}
          disabled={!drag}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Reorder ${exercise.name}`}
        >
          <MaterialCommunityIcons
            name="drag-horizontal-variant"
            size={18}
            color={Colors.textMuted}
          />
        </Pressable>
        <Text style={styles.name} numberOfLines={2}>
          {exercise.name}
        </Text>
        <Pressable
          ref={kebabRef}
          onPress={openMenu}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${exercise.name} options`}
        >
          <Feather name="more-vertical" size={18} color={Colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.colHeader}>
        <Text style={[styles.colText, styles.setCol]}>SET</Text>
        <Text style={[styles.colText, styles.flexCol]}>LBS</Text>
        <Text style={[styles.colText, styles.flexCol]}>REPS</Text>
        <View style={styles.checkCol} />
      </View>

      {exercise.sets.map((set, i) => (
        <SetRow
          key={set.id}
          index={i}
          set={set}
          onChange={(field, value) => onUpdateSet(set.id, field, value)}
          onRemove={() => onRemoveSet(set.id)}
        />
      ))}

      <Pressable
        onPress={onAddSet}
        style={styles.addSet}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Add set"
      >
        <Feather name="plus" size={14} color={Colors.accentLight} />
        <Text style={styles.addSetText}>Add Set</Text>
      </Pressable>

      {showNote ? (
        <TextInput
          value={exercise.note ?? ''}
          onChangeText={onSetNote}
          placeholder="Exercise note…"
          placeholderTextColor={Colors.textMuted}
          style={styles.noteInput}
          multiline
        />
      ) : null}

      <Modal
        visible={menuAnchor !== null}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.backdrop} onPress={closeMenu}>
          {menuAnchor ? (
            <View
              style={[
                styles.menu,
                {
                  top: menuAnchor.y + menuAnchor.h + 6,
                  left: Math.max(
                    8,
                    menuAnchor.x + menuAnchor.w - MENU_W,
                  ),
                },
              ]}
            >
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setShowNote(true);
                  closeMenu();
                }}
                accessibilityRole="button"
                accessibilityLabel="Add note"
              >
                <Feather name="file-text" size={16} color={Colors.accentLight} />
                <Text style={styles.menuText}>Add Note</Text>
              </Pressable>
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  closeMenu();
                  onRestTimer();
                }}
                accessibilityRole="button"
                accessibilityLabel="Rest timer"
              >
                <Feather name="clock" size={16} color={Colors.textSecondary} />
                <Text style={styles.menuText}>Rest Timer</Text>
              </Pressable>
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  closeMenu();
                  onRequestRemove();
                }}
                accessibilityRole="button"
                accessibilityLabel="Remove exercise"
              >
                <Feather name="trash-2" size={16} color={Colors.error} />
                <Text style={[styles.menuText, styles.menuTextDanger]}>
                  Remove Exercise
                </Text>
              </Pressable>
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardActive: {
    borderColor: Colors.accent,
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  name: {
    flex: 1,
    color: Colors.accentLight,
    fontSize: 16,
    fontWeight: '700',
  },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 4,
  },
  colText: {
    color: Colors.textHint,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  setCol: {
    width: 32,
    textAlign: 'center',
  },
  flexCol: {
    flex: 1,
    textAlign: 'center',
  },
  checkCol: {
    width: 32,
  },
  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
  },
  addSetText: {
    color: Colors.accentLight,
    fontSize: 13,
    fontWeight: '600',
  },
  noteInput: {
    marginTop: 10,
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 13,
    minHeight: 44,
  },
  backdrop: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    width: MENU_W,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  menuTextDanger: {
    color: Colors.error,
  },
});
