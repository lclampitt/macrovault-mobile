import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2, Undo2 } from 'lucide-react-native';
import { DS, Font } from '../../lib/design-system';

const DELETE_COLOR = '#E5736A';
const UNDO_WINDOW_MS = 5000;

type Props = {
  visible: boolean;
  /** Headline — "Weight entry deleted". */
  title: string;
  /** Subheading — "Jan 18 · 171.0 lb". */
  subtitle: string;
  onUndo: () => void;
  /** Fires when the countdown elapses or the toast is explicitly closed. */
  onDismiss: () => void;
};

/**
 * Floating top-of-screen toast with a 5-second countdown bar. Tapping Undo
 * fires the parent's restore action and dismisses immediately.
 *
 * NOTE: Stacked toasts (max 3) per the spec are next pass. For now we show
 *   one toast at a time — if a second delete happens, the parent should
 *   dismiss the current toast (commit it) before showing the next.
 */
export default function UndoToast({
  visible,
  title,
  subtitle,
  onUndo,
  onDismiss,
}: Props) {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    // Reset and start the countdown when the toast appears.
    progress.value = 1;
    progress.value = withTiming(0, {
      duration: UNDO_WINDOW_MS,
      easing: Easing.linear,
    });
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, UNDO_WINDOW_MS);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, onDismiss, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (!visible) return null;

  function handleUndo() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    progress.value = 0;
    onUndo();
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { top: insets.top + 8 }]}
    >
      <View style={styles.toast}>
        <View style={styles.iconWrap}>
          <Trash2 size={14} color={DELETE_COLOR} strokeWidth={2.5} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Pressable
          onPress={handleUndo}
          style={({ pressed }) => [
            styles.undoBtn,
            pressed && { opacity: 0.8 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Undo deletion"
        >
          <Undo2 size={12} color={DS.accent} strokeWidth={2.5} />
          <Text style={styles.undoText}>Undo</Text>
        </Pressable>
      </View>
      <View style={styles.countdownTrack}>
        <Animated.View style={[styles.countdownFill, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(20, 14, 14, 0.95)',
    borderColor: 'rgba(229, 115, 106, 0.3)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 32,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(229, 115, 106, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: DS.text,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textSecondary,
    marginTop: 1,
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
  },
  undoText: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: DS.accent,
  },
  countdownTrack: {
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(229, 115, 106, 0.1)',
    marginTop: 4,
    overflow: 'hidden',
  },
  countdownFill: {
    height: '100%',
    backgroundColor: DELETE_COLOR,
  },
});
