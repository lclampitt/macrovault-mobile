import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Activity,
  Award,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Heart,
  MoreHorizontal,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { Font, Motion, Tabular } from '../../lib/design-system';
import { useTheme, useTokens } from '../../lib/theme-context';
import { alphaize, SAKURA_BURGUNDY } from '../../lib/tokens';
import { useHealthKit } from '../../hooks/useHealthKit';
import type { BurnRange, HRZoneBucket } from '../../lib/healthkit-types';
import DailyBurnChart from './DailyBurnChart';
import ConsistencyHeatmap from './ConsistencyHeatmap';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function fmtHms(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fmtMinShort(seconds: number): string {
  const m = Math.round(seconds / 60);
  return `${m}m`;
}

function fmtZoneTime(seconds: number): string {
  return fmtHms(seconds);
}

function fmtMonth(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Coral red used for negative deltas / unfavorable resting-HR changes.
const DESTRUCTIVE = '#E5736A';

// --------------------------------------------------------------------------
// Screen
// --------------------------------------------------------------------------

export default function FitnessScreen() {
  const router = useRouter();
  const t = useTokens();
  const { appearanceTheme } = useTheme();
  const isSakura = appearanceTheme === 'sakura';
  const { data, loading, requestPermissions, setRange, setMonth } = useHealthKit();

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  const isToday = useMemo(() => {
    const now = new Date();
    return data.month.getMonth() === now.getMonth() && data.month.getFullYear() === now.getFullYear();
  }, [data.month]);

  const dailyAvg = useMemo(() => {
    if (data.dailyBurn.days.length === 0) return 0;
    const sum = data.dailyBurn.days.reduce((s, d) => s + d.cal, 0);
    return Math.round(sum / data.dailyBurn.days.length);
  }, [data.dailyBurn.days]);

  const showHkPrompt =
    data.status === 'disconnected' || data.status === 'denied';
  const hkUnavailable = data.status === 'unavailable';

  const cardStyle = {
    backgroundColor: t.bgCard,
    borderColor: t.borderDefault,
  };
  const iconBtnStyle = {
    backgroundColor: t.bgCard,
    borderColor: t.borderDefault,
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Top emerald glow moved to the app shell — see _layout.tsx's
          <TopGradientGlow />. */}

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={10}
          style={[styles.iconBtn, iconBtnStyle]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={18} color={t.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>
          Fitness
        </Text>
        <Pressable
          onPress={() => {
            /* NOTE: future kebab menu — set max HR, force refresh, etc. */
          }}
          hitSlop={10}
          style={[styles.iconBtn, iconBtnStyle]}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <MoreHorizontal size={16} color={t.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Fitness statistics"
      >
        {/* Month navigator */}
        <View style={styles.monthRow}>
          <Pressable
            onPress={() => {
              const next = new Date(data.month);
              next.setMonth(next.getMonth() - 1);
              setMonth(next);
            }}
            style={[
              styles.monthArrow,
              { backgroundColor: t.bgCard, borderColor: t.borderDefault },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <ChevronLeft size={14} color={t.textTertiary} strokeWidth={2} />
          </Pressable>
          <View style={styles.monthCenter}>
            <Text style={[styles.monthCaption, { color: t.primary }]}>
              {isToday ? 'THIS MONTH' : ''}
            </Text>
            <Text style={[styles.monthTitle, { color: t.textPrimary }]}>
              {fmtMonth(data.month)}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              if (isToday) return;
              const next = new Date(data.month);
              next.setMonth(next.getMonth() + 1);
              setMonth(next);
            }}
            disabled={isToday}
            style={[
              styles.monthArrow,
              { backgroundColor: t.bgCard, borderColor: t.borderDefault },
              isToday && styles.monthArrowDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            accessibilityState={{ disabled: isToday }}
          >
            <ChevronRight size={14} color={t.textTertiary} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Connect Apple Health prompt */}
        {showHkPrompt ? (
          <ConnectHealthCard
            denied={data.status === 'denied'}
            onConnect={async () => {
              await requestPermissions();
            }}
          />
        ) : null}
        {hkUnavailable ? <UnavailableCard /> : null}

        {/* Workouts + Avg HR */}
        <Animated.View
          entering={FadeInDown.duration(Motion.durationRise).delay(40)}
          style={styles.statRow}
        >
          <View style={[styles.card, styles.statCard, cardStyle]}>
            <SectionHead Icon={Dumbbell} label="WORKOUTS" />
            <Text style={[styles.heroLg, { color: t.primary }]}>
              {data.workouts.count}
            </Text>
            <Text style={[styles.heroCaption, { color: t.textSecondary }]}>
              this month
            </Text>
            <View
              style={[
                styles.statFooter,
                { borderTopColor: t.borderDefault },
              ]}
            >
              {data.workouts.deltaPct != null ? (
                <>
                  {data.workouts.deltaPct >= 0 ? (
                    <TrendingUp size={10} color={t.primary} strokeWidth={2} />
                  ) : (
                    <TrendingDown size={10} color={DESTRUCTIVE} strokeWidth={2} />
                  )}
                  <Text
                    style={[
                      styles.deltaText,
                      {
                        color:
                          data.workouts.deltaPct < 0 ? DESTRUCTIVE : t.primary,
                      },
                    ]}
                  >
                    {data.workouts.deltaPct >= 0 ? '+' : ''}
                    {data.workouts.deltaPct}%
                  </Text>
                  <Text style={[styles.deltaMeta, { color: t.textTertiary }]}>
                    vs prev
                  </Text>
                </>
              ) : (
                <Text style={[styles.deltaMeta, { color: t.textTertiary }]}>
                  Building data…
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.card, styles.statCard, cardStyle]}>
            <SectionHead Icon={Heart} label="AVG HR" />
            <View style={styles.heroRow}>
              <Text style={[styles.heroLg, { color: t.primary }]}>
                {data.heartRate.avg > 0 ? data.heartRate.avg : '—'}
              </Text>
              <Text style={[styles.heroUnit, { color: t.textTertiary }]}>
                bpm
              </Text>
            </View>
            <Text style={[styles.heroCaption, { color: t.textSecondary }]}>
              during workouts
            </Text>
            <View
              style={[
                styles.statFooter,
                { borderTopColor: t.borderDefault },
              ]}
            >
              <Text style={[styles.deltaMeta, { color: t.textTertiary }]}>
                Resting
              </Text>
              <Text style={[styles.deltaWhite, { color: t.textPrimary }]}>
                {data.heartRate.resting > 0 ? data.heartRate.resting : '—'}
              </Text>
              {data.heartRate.restingDelta !== 0 ? (
                <>
                  <View style={{ flex: 1 }} />
                  {data.heartRate.restingDelta < 0 ? (
                    <TrendingDown size={10} color={t.primary} strokeWidth={2} />
                  ) : (
                    <TrendingUp size={10} color={DESTRUCTIVE} strokeWidth={2} />
                  )}
                  <Text
                    style={[
                      styles.deltaText,
                      {
                        color:
                          data.heartRate.restingDelta > 0
                            ? DESTRUCTIVE
                            : t.primary,
                      },
                    ]}
                  >
                    {data.heartRate.restingDelta}
                  </Text>
                </>
              ) : null}
            </View>
          </View>
        </Animated.View>

        {/* Total time */}
        <Animated.View
          entering={FadeInDown.duration(Motion.durationRise).delay(80)}
          style={[styles.card, cardStyle]}
        >
          <View style={styles.totalTimeRow}>
            <View
              style={[
                styles.iconBoxLarge,
                {
                  backgroundColor: t.primaryTintBg,
                  borderColor: t.primaryTintBorder,
                },
              ]}
            >
              <Clock size={16} color={t.primary} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionLabel, { color: t.primary }]}>
                TOTAL TIME
              </Text>
              <Text style={[styles.heroMd, { color: t.primary }, Tabular]}>
                {fmtHms(data.totalTime.seconds)}
              </Text>
            </View>
            <View style={styles.totalTimeRight}>
              <Text style={[styles.sectionLabelMuted, { color: t.textTertiary }]}>
                AVG
              </Text>
              <Text style={[styles.avgValue, { color: t.textPrimary }, Tabular]}>
                {data.totalTime.avgSeconds > 0
                  ? fmtMinShort(data.totalTime.avgSeconds)
                  : '—'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Calories Active / Total */}
        <Animated.View
          entering={FadeInDown.duration(Motion.durationRise).delay(120)}
          style={[styles.card, cardStyle]}
        >
          <View style={styles.cardHeaderRow}>
            <SectionHead Icon={Flame} label="CALORIES" />
            <Text style={[styles.cardHeaderMeta, { color: t.textTertiary }]}>
              Apple Health
            </Text>
          </View>
          <View style={styles.calRow}>
            <View style={styles.calCol}>
              <Text style={[styles.sectionLabelMuted, { color: t.textTertiary }]}>
                ACTIVE
              </Text>
              <View style={styles.heroRow}>
                <Text style={[styles.heroSm, { color: t.primary }]}>
                  {data.calories.active.toLocaleString()}
                </Text>
                <Text style={[styles.heroUnitSm, { color: t.textTertiary }]}>
                  CAL
                </Text>
              </View>
            </View>
            <View
              style={[styles.calDivider, { backgroundColor: t.borderDefault }]}
            />
            <View style={styles.calCol}>
              <Text style={[styles.sectionLabelMuted, { color: t.textTertiary }]}>
                TOTAL
              </Text>
              <View style={styles.heroRow}>
                <Text style={[styles.heroSm, { color: t.textPrimary }]}>
                  {data.calories.total.toLocaleString()}
                </Text>
                <Text style={[styles.heroUnitSm, { color: t.textTertiary }]}>
                  CAL
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Daily burn */}
        <Animated.View
          entering={FadeInDown.duration(Motion.durationRise).delay(160)}
          style={[styles.card, cardStyle]}
        >
          <View style={styles.cardHeaderRow}>
            <SectionHead Icon={Zap} label="DAILY BURN" />
            <RangeToggle value={data.dailyBurn.range} onChange={setRange} />
          </View>

          <DailyBurnChart
            days={data.dailyBurn.days}
            resetKey={data.dailyBurn.range}
          />

          <View style={[styles.cardFooter, { borderTopColor: t.borderDefault }]}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendSwatch,
                    { backgroundColor: alphaize(t.primary, 0.7) },
                  ]}
                />
                <Text style={[styles.legendLabel, { color: t.textSecondary }]}>
                  Workout
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendSwatch,
                    { backgroundColor: alphaize(t.primary, 0.2) },
                  ]}
                />
                <Text style={[styles.legendLabel, { color: t.textSecondary }]}>
                  Rest
                </Text>
              </View>
            </View>
            <View style={styles.legendAvg}>
              <Text
                style={[styles.legendAvgValue, { color: t.textPrimary }, Tabular]}
              >
                {dailyAvg.toLocaleString()}
              </Text>
              <Text style={[styles.legendAvgLabel, { color: t.textTertiary }]}>
                cal/day avg
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* HR range */}
        <Animated.View
          entering={FadeInDown.duration(Motion.durationRise).delay(200)}
          style={[styles.card, cardStyle]}
        >
          <View style={styles.cardHeaderRow}>
            <SectionHead Icon={Heart} label="HEART RATE RANGE" />
            <Text style={[styles.cardHeaderMeta, { color: t.textTertiary }]}>
              Apple Watch
            </Text>
          </View>

          <View style={styles.hrTriRow}>
            <HRTri label="MIN" value={data.heartRate.min} color={t.macroCarbs} />
            <View
              style={[styles.hrTriDivider, { backgroundColor: t.borderDefault }]}
            />
            <HRTri
              label="AVG"
              value={data.heartRate.avg}
              color={t.primary}
              glow
            />
            <View
              style={[styles.hrTriDivider, { backgroundColor: t.borderDefault }]}
            />
            <HRTri label="MAX" value={data.heartRate.max} color={t.textPrimary} />
          </View>

          {/* Gradient zone bar — light → mid → primary → darker → darkest.
              Emerald keeps its hand-tuned dark green tail; Sakura uses
              progressively darker rose hues ending in the burgundy depth
              color so the right side still reads as "high intensity". */}
          <View style={styles.zoneBarWrap}>
            <LinearGradient
              colors={
                isSakura
                  ? [
                      t.macroFat,
                      t.macroCarbs,
                      t.primary,
                      '#A8567B',
                      SAKURA_BURGUNDY,
                    ]
                  : ['#34D399', '#6EE7B7', t.primary, '#059669', '#047857']
              }
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.zoneBar}
            />
            <Dot
              left={pctFromBpm(data.heartRate.min, data.heartRate)}
              outline={t.macroCarbs}
              size={6}
            />
            <Dot
              left={pctFromBpm(data.heartRate.avg, data.heartRate)}
              outline="#fff"
              fill={t.primary}
              size={8}
            />
            <Dot
              left={pctFromBpm(data.heartRate.max, data.heartRate)}
              outline={isSakura ? SAKURA_BURGUNDY : '#047857'}
              size={6}
            />
          </View>
          <View style={styles.zoneAxis}>
            <Text style={[styles.axisTiny, { color: t.textQuaternary }]}>
              {data.heartRate.rangeFloor}
            </Text>
            <Text style={[styles.axisTiny, { color: t.textQuaternary }]}>
              {data.heartRate.rangeCeil}
            </Text>
          </View>
        </Animated.View>

        {/* HR zones */}
        <Animated.View
          entering={FadeInDown.duration(Motion.durationRise).delay(240)}
          style={[styles.card, cardStyle]}
        >
          <View style={styles.cardHeaderRow}>
            <SectionHead Icon={Activity} label="HR ZONES" />
            <Text
              style={[
                styles.cardHeaderMeta,
                Tabular,
                { color: t.textPrimary },
              ]}
            >
              {fmtHms(data.totalTime.seconds)}
            </Text>
          </View>

          {data.heartRate.zones.map((z, i) => (
            <ZoneRow key={z.name} zone={z} index={i} />
          ))}
        </Animated.View>

        {/* Consistency */}
        <Animated.View
          entering={FadeInDown.duration(Motion.durationRise).delay(280)}
          style={[styles.card, cardStyle]}
        >
          <View style={styles.cardHeaderRow}>
            <SectionHead Icon={Target} label="CONSISTENCY" />
            <View style={styles.streakBadge}>
              <Award size={11} color={t.primary} strokeWidth={2} />
              <Text style={[styles.streakText, { color: t.primary }, Tabular]}>
                {data.consistency.streak} day streak
              </Text>
            </View>
          </View>

          <ConsistencyHeatmap weeks={data.consistency.heatmap} />

          <View
            style={[
              styles.consistencyFooter,
              { borderTopColor: t.borderDefault },
            ]}
          >
            <View style={styles.legendRow}>
              <Text style={[styles.legendLabel, { color: t.textSecondary }]}>
                Less
              </Text>
              {[0, 1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.miniSwatch,
                    {
                      backgroundColor:
                        i === 0
                          ? t.activityEmpty
                          : alphaize(t.primary, 0.2 + i * 0.2),
                    },
                  ]}
                />
              ))}
              <Text style={[styles.legendLabel, { color: t.textSecondary }]}>
                More
              </Text>
            </View>
            <View style={styles.activeDaysRow}>
              <Text
                style={[styles.activeDaysValue, { color: t.textPrimary }, Tabular]}
              >
                {data.consistency.activeDays}
              </Text>
              <Text style={[styles.activeDaysLabel, { color: t.textTertiary }]}>
                active days
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Muscle split */}
        <Animated.View
          entering={FadeInDown.duration(Motion.durationRise).delay(320)}
          style={[styles.card, cardStyle]}
        >
          <View style={styles.cardHeaderRow}>
            <SectionHead Icon={Dumbbell} label="MUSCLE SPLIT" />
            <Text style={[styles.cardHeaderMeta, { color: t.textTertiary }]}>
              by volume
            </Text>
          </View>

          {data.muscleSplit.length === 0 ? (
            <Text style={[styles.emptyMuscle, { color: t.textTertiary }]}>
              Log a workout this month to see volume by muscle group.
            </Text>
          ) : (
            data.muscleSplit.map((m) => (
              <View key={m.name} style={styles.muscleRow}>
                <Text style={[styles.muscleName, { color: t.textPrimary }]}>
                  {m.name}
                </Text>
                <View
                  style={[
                    styles.muscleTrack,
                    { backgroundColor: t.bgCardElevated },
                  ]}
                >
                  <LinearGradient
                    colors={[alphaize(t.primary, 0.4), t.primary]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[
                      styles.muscleFill,
                      { width: `${Math.round(m.pct)}%` },
                    ]}
                  />
                </View>
                <View style={styles.muscleValueWrap}>
                  <Text
                    style={[styles.muscleValue, { color: t.textPrimary }, Tabular]}
                  >
                    {m.volume >= 1000
                      ? `${(m.volume / 1000).toFixed(1)}k`
                      : Math.round(m.volume)}
                  </Text>
                  <Text style={[styles.muscleUnit, { color: t.textTertiary }]}>
                    lb
                  </Text>
                </View>
              </View>
            ))
          )}
        </Animated.View>

        {/* HealthKit status */}
        <Animated.View
          entering={FadeInDown.duration(Motion.durationRise).delay(360)}
          style={[styles.card, styles.statusCard, cardStyle]}
          accessibilityLiveRegion="polite"
        >
          <View
            style={[
              styles.statusIcon,
              {
                backgroundColor: t.primaryTintBg,
                borderColor: t.primaryTintBorder,
              },
            ]}
          >
            <Heart size={12} color={t.primary} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusTitle, { color: t.textPrimary }]}>
              {data.status === 'connected'
                ? 'Apple Health connected'
                : data.status === 'partial'
                  ? 'Apple Health partially connected'
                  : data.status === 'denied'
                    ? 'Apple Health access denied'
                    : data.status === 'unavailable'
                      ? 'Apple Health not available'
                      : 'Apple Health not connected'}
            </Text>
            <Text style={[styles.statusMeta, { color: t.textTertiary }]}>
              Heart rate · Calories · Workouts
            </Text>
          </View>
          <Text
            style={[
              styles.statusBadge,
              {
                color: data.status === 'connected' ? t.primary : t.textTertiary,
              },
            ]}
          >
            {data.status === 'connected'
              ? loading
                ? 'Syncing'
                : 'Synced'
              : 'Off'}
          </Text>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// --------------------------------------------------------------------------
// Sub-components
// --------------------------------------------------------------------------

function SectionHead({ Icon, label }: { Icon: LucideIcon; label: string }) {
  const t = useTokens();
  return (
    <View style={styles.sectionHead}>
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: t.primaryTintBg,
            borderColor: t.primaryTintBorder,
          },
        ]}
      >
        <Icon size={10} color={t.primary} strokeWidth={2.5} />
      </View>
      <Text style={[styles.sectionLabel, { color: t.primary }]}>{label}</Text>
    </View>
  );
}

function RangeToggle({
  value,
  onChange,
}: {
  value: BurnRange;
  onChange: (r: BurnRange) => void;
}) {
  const t = useTokens();
  return (
    <View
      style={[
        styles.rangeWrap,
        {
          backgroundColor: t.bgCardElevated,
          borderColor: t.borderDefault,
        },
      ]}
    >
      {(['7d', '14d', '30d'] as BurnRange[]).map((r) => {
        const active = r === value;
        return (
          <Pressable
            key={r}
            onPress={() => onChange(r)}
            style={[
              styles.rangeSeg,
              active && { backgroundColor: t.primary },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Show last ${r}`}
          >
            <Text
              style={[
                styles.rangeSegLabel,
                { color: active ? t.textOnPrimary : t.textTertiary },
              ]}
            >
              {r}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function HRTri({
  label,
  value,
  color,
  glow,
}: {
  label: string;
  value: number;
  color: string;
  glow?: boolean;
}) {
  const t = useTokens();
  // Derive the glow halo color from the tri's primary color so it
  // tracks the theme — emerald glow in Emerald, rose glow in Sakura.
  const glowStyle = glow
    ? {
        textShadowColor: alphaize(color, 0.45),
        textShadowRadius: 12,
      }
    : null;
  return (
    <View style={styles.hrTriCol}>
      <Text style={[styles.sectionLabelMuted, { color: t.textTertiary }]}>
        {label}
      </Text>
      <View style={styles.heroRow}>
        <Text style={[styles.heroXs, { color }, glowStyle]}>
          {value > 0 ? value : '—'}
        </Text>
        <Text style={[styles.heroUnitSm, { color: t.textTertiary }]}>BPM</Text>
      </View>
    </View>
  );
}

function pctFromBpm(
  bpm: number,
  hr: { rangeFloor: number; rangeCeil: number },
): number {
  if (bpm <= 0) return 0;
  const range = hr.rangeCeil - hr.rangeFloor || 1;
  const pct = ((bpm - hr.rangeFloor) / range) * 100;
  return Math.max(0, Math.min(100, pct));
}

function Dot({
  left,
  outline,
  fill,
  size,
}: {
  left: number;
  outline: string;
  fill?: string;
  size: number;
}) {
  const style: ViewStyle = {
    position: 'absolute',
    top: '50%',
    left: `${left}%`,
    marginLeft: -size / 2,
    marginTop: -size / 2,
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 1.5,
    borderColor: outline,
    backgroundColor: fill ?? '#fff',
  };
  return <View pointerEvents="none" style={style} />;
}

function ZoneRow({ zone, index }: { zone: HRZoneBucket; index: number }) {
  const t = useTokens();
  const { appearanceTheme } = useTheme();
  const isSakura = appearanceTheme === 'sakura';
  // Five-zone intensity ramp. Index 0–2 use alphaized primary (so they
  // swap emerald → rose cleanly); index 3–4 need progressively darker
  // shades, which emerald and sakura express differently — emerald uses
  // its hand-tuned dark green stops, sakura ramps through deep rose into
  // burgundy.
  const fillColor =
    index === 0
      ? alphaize(t.primary, 0.4)
      : index === 1
        ? alphaize(t.primary, 0.6)
        : index === 2
          ? t.primary
          : index === 3
            ? isSakura
              ? '#A8567B'
              : '#059669'
            : isSakura
              ? SAKURA_BURGUNDY
              : '#047857';
  return (
    <View style={styles.zoneRow}>
      <View style={styles.zoneLeft}>
        <Text style={[styles.zoneName, { color: t.textPrimary }]}>
          {zone.name}
        </Text>
        <Text style={[styles.zoneLabel, { color: t.textTertiary }]}>
          {zone.label}
        </Text>
      </View>
      <View
        style={[
          styles.zoneTrack,
          {
            backgroundColor: t.bgCardElevated,
            borderColor: t.borderDefault,
          },
        ]}
      >
        <View
          style={[
            styles.zoneFill,
            { width: `${zone.pct}%`, backgroundColor: fillColor },
          ]}
        >
          {zone.pct > 18 ? (
            <Text style={[styles.zonePct, { color: t.textOnPrimary }, Tabular]}>
              {zone.pct}%
            </Text>
          ) : null}
        </View>
      </View>
      <Text style={[styles.zoneTime, { color: t.textPrimary }, Tabular]}>
        {fmtZoneTime(zone.seconds)}
      </Text>
    </View>
  );
}

function ConnectHealthCard({
  denied,
  onConnect,
}: {
  denied: boolean;
  onConnect: () => void | Promise<void>;
}) {
  const t = useTokens();
  return (
    <View
      style={[
        styles.card,
        styles.connectCard,
        {
          backgroundColor: t.bgCard,
          borderColor: t.borderDefault,
        },
      ]}
    >
      <View
        style={[
          styles.connectIcon,
          {
            backgroundColor: t.primaryTintBg,
            borderColor: t.primaryTintBorder,
          },
        ]}
      >
        <Heart size={20} color={t.primary} strokeWidth={2} />
      </View>
      <Text style={[styles.connectTitle, { color: t.textPrimary }]}>
        {denied ? 'Reconnect Apple Health' : 'Connect Apple Health'}
      </Text>
      <Text style={[styles.connectBody, { color: t.textSecondary }]}>
        {denied
          ? 'You denied access earlier. Re-enable it from iPhone Settings → Health → Data Access & Devices → MacroVault.'
          : 'See your heart rate, calorie burn, and Apple Watch workouts in MacroVault. Your data stays private.'}
      </Text>
      <Pressable
        onPress={() => void onConnect()}
        style={({ pressed }) => [
          styles.connectBtn,
          { backgroundColor: t.primary },
          pressed && styles.connectBtnPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={denied ? 'Reconnect' : 'Connect Apple Health'}
      >
        <Text style={[styles.connectBtnText, { color: t.textOnPrimary }]}>
          {denied ? 'Reconnect' : 'Continue'}
        </Text>
      </Pressable>
    </View>
  );
}

function UnavailableCard() {
  const t = useTokens();
  return (
    <View
      style={[
        styles.card,
        styles.connectCard,
        {
          backgroundColor: t.bgCard,
          borderColor: t.borderDefault,
        },
      ]}
    >
      <View
        style={[
          styles.connectIcon,
          {
            backgroundColor: t.primaryTintBg,
            borderColor: t.primaryTintBorder,
          },
        ]}
      >
        <Heart size={20} color={t.textTertiary} strokeWidth={2} />
      </View>
      <Text style={[styles.connectTitle, { color: t.textPrimary }]}>
        Apple Health not available
      </Text>
      <Text style={[styles.connectBody, { color: t.textSecondary }]}>
        HealthKit only runs on iPhones. Workout, volume, and consistency cards
        still work from your MacroVault data.
      </Text>
    </View>
  );
}

// --------------------------------------------------------------------------
// Styles
// --------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Font.bold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 8,
  },
  // Month nav
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  monthArrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowDisabled: { opacity: 0.4 },
  monthCenter: { alignItems: 'center' },
  monthCaption: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  monthTitle: {
    fontFamily: Font.bold,
    fontSize: 15,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  // Cards
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderMeta: {
    fontFamily: Font.medium,
    fontSize: 9,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  // Section head
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxLarge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 1,
  },
  sectionLabelMuted: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 1,
  },
  // Stat row
  statRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, padding: 14, overflow: 'hidden' },
  heroLg: {
    fontFamily: Font.extrabold,
    fontSize: 40,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
    lineHeight: 42,
    marginTop: 6,
  },
  heroMd: {
    fontFamily: Font.extrabold,
    fontSize: 26,
    letterSpacing: -0.8,
    lineHeight: 28,
    marginTop: 2,
  },
  heroSm: {
    fontFamily: Font.extrabold,
    fontSize: 24,
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  heroXs: {
    fontFamily: Font.extrabold,
    fontSize: 22,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  // glow style moved inline into HRTri so the halo color is derived from
  // the active token (rose in Sakura, emerald otherwise) via alphaize().
  heroCaption: {
    fontFamily: Font.medium,
    fontSize: 10,
    marginTop: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 6,
  },
  heroUnit: {
    fontFamily: Font.bold,
    fontSize: 10,
  },
  heroUnitSm: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.4,
  },
  statFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  deltaText: {
    fontFamily: Font.bold,
    fontSize: 9,
    fontVariant: ['tabular-nums'],
  },
  deltaMeta: {
    fontFamily: Font.medium,
    fontSize: 9,
  },
  deltaWhite: {
    fontFamily: Font.bold,
    fontSize: 9,
    fontVariant: ['tabular-nums'],
  },
  // Total time
  totalTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalTimeRight: { alignItems: 'flex-end' },
  avgValue: {
    fontFamily: Font.bold,
    fontSize: 14,
    marginTop: 2,
  },
  // Calories
  calRow: { flexDirection: 'row' },
  calCol: { flex: 1, paddingHorizontal: 4 },
  calDivider: {
    width: 1,
    marginHorizontal: 6,
  },
  // Range toggle
  rangeWrap: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    padding: 2,
  },
  rangeSeg: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rangeSegLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.3,
  },
  // Daily-burn legend
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendSwatch: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendLabel: {
    fontFamily: Font.semibold,
    fontSize: 9,
  },
  legendAvg: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  legendAvgValue: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  legendAvgLabel: {
    fontFamily: Font.semibold,
    fontSize: 9,
  },
  // HR range
  hrTriRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  hrTriCol: { flex: 1, alignItems: 'center', gap: 4 },
  hrTriDivider: {
    width: 1,
  },
  zoneBarWrap: {
    position: 'relative',
    marginBottom: 2,
  },
  zoneBar: {
    height: 6,
    borderRadius: 3,
  },
  zoneAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  axisTiny: {
    fontFamily: Font.bold,
    fontSize: 8,
    fontVariant: ['tabular-nums'],
  },
  // HR zones
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  zoneLeft: { width: 56 },
  zoneName: {
    fontFamily: Font.bold,
    fontSize: 10,
  },
  zoneLabel: {
    fontFamily: Font.medium,
    fontSize: 8,
  },
  zoneTrack: {
    flex: 1,
    height: 16,
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  zoneFill: {
    height: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  zonePct: {
    fontFamily: Font.bold,
    fontSize: 8,
  },
  zoneTime: {
    fontFamily: Font.bold,
    fontSize: 9,
    width: 60,
    textAlign: 'right',
  },
  // Consistency
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontFamily: Font.bold,
    fontSize: 10,
  },
  consistencyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  miniSwatch: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  activeDaysRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  activeDaysValue: {
    fontFamily: Font.bold,
    fontSize: 12,
  },
  activeDaysLabel: {
    fontFamily: Font.medium,
    fontSize: 9,
  },
  // Muscle split
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  muscleName: {
    width: 64,
    fontFamily: Font.bold,
    fontSize: 10,
  },
  muscleTrack: {
    flex: 1,
    height: 12,
    borderRadius: 3,
    overflow: 'hidden',
  },
  muscleFill: { height: '100%' },
  muscleValueWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    width: 50,
    justifyContent: 'flex-end',
  },
  muscleValue: {
    fontFamily: Font.bold,
    fontSize: 10,
  },
  muscleUnit: {
    fontFamily: Font.medium,
    fontSize: 8,
  },
  emptyMuscle: {
    fontFamily: Font.medium,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 8,
  },
  // Status row
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  statusIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    fontFamily: Font.bold,
    fontSize: 11,
  },
  statusMeta: {
    fontFamily: Font.medium,
    fontSize: 9,
    marginTop: 1,
  },
  statusBadge: {
    fontFamily: Font.bold,
    fontSize: 9,
  },
  // Connect card
  connectCard: {
    alignItems: 'center',
    padding: 18,
    gap: 8,
  },
  connectIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectTitle: {
    fontFamily: Font.bold,
    fontSize: 14,
    marginTop: 2,
  },
  connectBody: {
    fontFamily: Font.medium,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 4,
  },
  connectBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  connectBtnPressed: { opacity: 0.85 },
  connectBtnText: {
    fontFamily: Font.bold,
    fontSize: 12,
  },
  bottomSpacer: { height: 140 },
});
