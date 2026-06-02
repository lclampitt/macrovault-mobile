import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Activity, Play } from 'lucide-react-native';
import { Font, Radius } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

type Props = {
  onQuickStart: () => void;
  onCardio: () => void;
};

export default function PrimaryActions({ onQuickStart, onCardio }: Props) {
  const t = useTokens();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onQuickStart}
        style={({ pressed }) => [
          styles.tile,
          { backgroundColor: t.bgCard, borderColor: t.primaryTintBorder },
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
                <Stop offset={0} stopColor={t.primary} stopOpacity={0.22} />
                <Stop offset={1} stopColor={t.primary} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect width={100} height={100} fill="url(#qsGlow)" />
          </Svg>
        </View>
        <View style={[styles.emeraldIcon, { backgroundColor: t.primary }]}>
          <Play size={20} color={t.textOnPrimary} fill={t.textOnPrimary} strokeWidth={0} />
        </View>
        <Text style={[styles.tileTitle, { color: t.textPrimary }]}>Quick Start</Text>
        <Text style={[styles.tileSub, { color: t.textSecondary }]}>Empty workout</Text>
      </Pressable>

      <Pressable
        onPress={onCardio}
        style={({ pressed }) => [
          styles.tile,
          { backgroundColor: t.bgCard, borderColor: t.borderDefault },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Start cardio"
      >
        <View
          style={[
            styles.darkIcon,
            { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
          ]}
        >
          <Activity size={20} color={t.primary} strokeWidth={2} />
        </View>
        <Text style={[styles.tileTitle, { color: t.textPrimary }]}>Start Cardio</Text>
        <Text style={[styles.tileSub, { color: t.textSecondary }]}>Bike, treadmill, more</Text>
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
    borderWidth: 1,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  emeraldIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  darkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileTitle: {
    fontFamily: Font.bold,
    fontSize: 14,
  },
  tileSub: {
    fontFamily: Font.medium,
    fontSize: 11,
    marginTop: 2,
  },
});
