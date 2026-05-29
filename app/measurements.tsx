import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Plus,
  Ruler,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import { DS, Font, Motion, Radius, Tabular } from '../lib/design-system';
import { useBodyCompositionData } from '../hooks/useBodyCompositionData';
import Sparkline from '../components/ds/Sparkline';
import SectionLabel from '../components/ds/SectionLabel';

// NOTE: The `progress` table currently stores only weight (kg) and body fat %.
//   To support the rest of the metric set (waist / abdomen / glutes / chest /
//   shoulders / arms / thighs) the schema needs columns or a separate
//   `body_measurements` table. The non-weight/BF metrics below render with
//   placeholder data and a "Setup" CTA so the screen is design-complete.
type MetricKey =
  | 'weight'
  | 'bodyfat'
  | 'waist'
  | 'abdomen'
  | 'glutes'
  | 'chest'
  | 'shoulders'
  | 'arms'
  | 'thighs';

type MetricMeta = {
  key: MetricKey;
  label: string;
  unit: string;
  Icon: LucideIcon;
  group: 'composition' | 'circumference';
};

const METRICS: MetricMeta[] = [
  { key: 'weight', label: 'Weight', unit: 'lb', Icon: Scale, group: 'composition' },
  { key: 'bodyfat', label: 'Body fat', unit: '%', Icon: Activity, group: 'composition' },
  { key: 'waist', label: 'Waist', unit: 'in', Icon: Ruler, group: 'circumference' },
  { key: 'abdomen', label: 'Abdomen', unit: 'in', Icon: Ruler, group: 'circumference' },
  { key: 'glutes', label: 'Glutes', unit: 'in', Icon: Ruler, group: 'circumference' },
  { key: 'chest', label: 'Chest', unit: 'in', Icon: Ruler, group: 'circumference' },
  { key: 'shoulders', label: 'Shoulders', unit: 'in', Icon: Ruler, group: 'circumference' },
  { key: 'arms', label: 'Arms', unit: 'in', Icon: Ruler, group: 'circumference' },
  { key: 'thighs', label: 'Thighs', unit: 'in', Icon: Ruler, group: 'circumference' },
];

type TileData = {
  current: number | null;
  delta: number | null;
  series: number[];
  unit: string;
  hasData: boolean;
};

const EMPTY_TILE: TileData = {
  current: null,
  delta: null,
  series: [],
  unit: '',
  hasData: false,
};

export default function MeasurementsScreen() {
  const router = useRouter();
  const { entries, loading } = useBodyCompositionData('3M');

  const weightTile: TileData = useMemo(() => {
    const series = entries
      .map((d) => d.weight)
      .filter((v): v is number => v != null);
    if (series.length === 0) return { ...EMPTY_TILE, unit: 'lb' };
    return {
      current: series[series.length - 1],
      delta: +(series[series.length - 1] - series[0]).toFixed(1),
      series,
      unit: 'lb',
      hasData: true,
    };
  }, [entries]);

  const bodyFatTile: TileData = useMemo(() => {
    const series = entries
      .map((d) => d.bodyFat)
      .filter((v): v is number => v != null);
    if (series.length === 0) return { ...EMPTY_TILE, unit: '%' };
    return {
      current: series[series.length - 1],
      delta: +(series[series.length - 1] - series[0]).toFixed(1),
      series,
      unit: '%',
      hasData: true,
    };
  }, [entries]);

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function getTile(key: MetricKey): TileData {
    if (key === 'weight') return weightTile;
    if (key === 'bodyfat') return bodyFatTile;
    // Circumference metrics are stubbed until the schema lands.
    return EMPTY_TILE;
  }

  const composition = METRICS.filter((m) => m.group === 'composition');
  const circumference = METRICS.filter((m) => m.group === 'circumference');

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={10}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={18} color={DS.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Measurements</Text>
        <Pressable
          onPress={() => router.push('/progress')}
          hitSlop={10}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Log new entry"
        >
          <Plus size={18} color={DS.accent} strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Body fat analyzer CTA */}
        <Pressable
          onPress={() => router.push('/body-fat-analyzer')}
          style={({ pressed }) => [
            styles.analyzerCard,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Run body fat analyzer"
        >
          <View style={styles.analyzerIcon}>
            <Sparkles size={16} color={DS.accent} strokeWidth={2} />
          </View>
          <View style={styles.analyzerBody}>
            <Text style={styles.analyzerTitle}>Run body fat analyzer</Text>
            <Text style={styles.analyzerSubtitle}>
              NHANES-trained ML estimate from circumference + height + weight
            </Text>
          </View>
          <ChevronRight size={16} color={DS.textTertiary} strokeWidth={2} />
        </Pressable>

        <SectionLabel style={styles.groupLabel}>COMPOSITION</SectionLabel>
        <View style={styles.grid}>
          {composition.map((m, i) => (
            <Animated.View
              key={m.key}
              entering={FadeInDown.duration(Motion.durationRise).delay(
                60 + i * Motion.staggerStep,
              )}
              style={styles.tileSlot}
            >
              <MetricTile
                meta={m}
                data={getTile(m.key)}
                loading={loading}
                onPress={() => router.push('/progress')}
              />
            </Animated.View>
          ))}
        </View>

        <SectionLabel style={styles.groupLabel}>CIRCUMFERENCE</SectionLabel>
        <View style={styles.grid}>
          {circumference.map((m, i) => (
            <Animated.View
              key={m.key}
              entering={FadeInDown.duration(Motion.durationRise).delay(
                120 + i * Motion.staggerStep,
              )}
              style={styles.tileSlot}
            >
              <MetricTile
                meta={m}
                data={getTile(m.key)}
                loading={loading}
                onPress={() => {
                  // NOTE: Per-metric detail chart route lands in next pass.
                  //   For now, all detail navigation goes to Progress.
                  router.push('/progress');
                }}
              />
            </Animated.View>
          ))}
        </View>

        <Text style={styles.footnote}>
          NOTE: Circumference metrics need a schema extension before they read
          real data — see `lib/bodyComp.ts`. The tiles render placeholder state
          so the layout is design-complete today.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricTile({
  meta,
  data,
  loading,
  onPress,
}: {
  meta: MetricMeta;
  data: TileData;
  loading: boolean;
  onPress: () => void;
}) {
  const Icon = meta.Icon;
  const showDelta = data.delta != null && Math.abs(data.delta) >= 0.05;
  const positive = (data.delta ?? 0) > 0;
  const DeltaIcon = positive ? TrendingUp : TrendingDown;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${meta.label} ${data.current ?? 'no data'} ${meta.unit}`}
    >
      <View style={styles.tileHeader}>
        <View style={styles.tileIcon}>
          <Icon size={12} color={DS.accent} strokeWidth={2} />
        </View>
        <Text style={styles.tileLabel}>{meta.label.toUpperCase()}</Text>
      </View>
      <View style={styles.tileValueRow}>
        <Text style={[styles.tileValue, Tabular]}>
          {loading
            ? '…'
            : data.current != null
              ? data.current.toFixed(1)
              : '—'}
        </Text>
        <Text style={styles.tileUnit}>{data.unit || meta.unit}</Text>
      </View>
      <View style={styles.tileSparkRow}>
        {data.hasData ? (
          <Sparkline points={data.series} width={120} height={22} />
        ) : (
          <Text style={styles.tileSetup}>Tap to log first entry</Text>
        )}
      </View>
      {showDelta ? (
        <View style={styles.tileDeltaRow}>
          <DeltaIcon
            size={10}
            color={positive ? DS.accent : '#E5736A'}
            strokeWidth={2}
          />
          <Text
            style={[
              styles.tileDelta,
              { color: positive ? DS.accent : '#E5736A' },
            ]}
          >
            {positive ? '+' : ''}
            {data.delta!.toFixed(1)} {data.unit}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: DS.text,
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 140,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  analyzerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 18,
    backgroundColor: DS.surface,
    borderColor: DS.accentBorder,
    borderWidth: 1,
    borderRadius: Radius.card,
  },
  analyzerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: DS.accentSoft,
    borderColor: DS.accentBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzerBody: { flex: 1 },
  analyzerTitle: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.text,
    letterSpacing: -0.2,
  },
  analyzerSubtitle: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textTertiary,
    marginTop: 3,
  },
  groupLabel: {
    marginTop: 4,
    marginBottom: 10,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  tileSlot: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  tile: {
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: 12,
    gap: 8,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tileIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: DS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.textTertiary,
    letterSpacing: 0.6,
  },
  tileValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  tileValue: {
    fontFamily: Font.bold,
    fontSize: 20,
    color: DS.text,
    letterSpacing: -0.4,
  },
  tileUnit: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textTertiary,
  },
  tileSparkRow: {
    height: 24,
    justifyContent: 'center',
  },
  tileSetup: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textQuaternary,
    fontStyle: 'italic',
  },
  tileDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tileDelta: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  footnote: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textQuaternary,
    fontStyle: 'italic',
    marginTop: 4,
    paddingHorizontal: 4,
    lineHeight: 14,
  },
});
