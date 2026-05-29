import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Activity, Play } from 'lucide-react-native';
import { DS, Font, Radius } from '../../lib/design-system';

type Props = {
  onQuickStart: () => void;
  onCardio: () => void;
};

export default function PrimaryActions({ onQuickStart, onCardio }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onQuickStart}
        style={({ pressed }) => [
          styles.tile,
          styles.tileEmerald,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Quick start workout"
      >
        {/* Top-right radial glow */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <Defs>
              <RadialGradient
                id="qsGlow"
                cx={100}
                cy={0}
                r={100}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset={0} stopColor={DS.accent} stopOpacity={0.22} />
                <Stop offset={1} stopColor={DS.accent} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect width={100} height={100} fill="url(#qsGlow)" />
          </Svg>
        </View>
        <View style={styles.emeraldIcon}>
          <Play size={20} color="#000" fill="#000" strokeWidth={0} />
        </View>
        <Text style={styles.tileTitle}>Quick Start</Text>
        <Text style={styles.tileSub}>Empty workout</Text>
      </Pressable>

      <Pressable
        onPress={onCardio}
        style={({ pressed }) => [
          styles.tile,
          styles.tileDefault,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Start cardio"
      >
        <View style={styles.darkIcon}>
          <Activity size={20} color={DS.accent} strokeWidth={2} />
        </View>
        <Text style={styles.tileTitle}>Start Cardio</Text>
        <Text style={styles.tileSub}>Bike, treadmill, more</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  tile: {
    flex: 1,
    borderRadius: Radius.card,
    paddingVertical: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  tileEmerald: {
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.accentBorder,
  },
  tileDefault: {
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.border,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  emeraldIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: DS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  darkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: DS.surfaceFlat,
    borderWidth: 1,
    borderColor: DS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileTitle: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: DS.text,
  },
  tileSub: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textSecondary,
    marginTop: 2,
  },
});
