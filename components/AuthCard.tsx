import { StyleSheet, View, type ViewProps } from 'react-native';
import { Colors } from '../constants/Colors';

export function AuthCard({ style, children, ...rest }: ViewProps) {
  return (
    <View {...rest} style={[styles.card, style]}>
      <View style={styles.topAccent} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 24,
    paddingVertical: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.accent,
    opacity: 0.8,
  },
});
