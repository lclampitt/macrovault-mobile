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
import { DS, Font, Motion, Tabular } from '../../lib/design-system';
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

// --------------------------------------------------------------------------
// Screen
// --------------------------------------------------------------------------

export default function FitnessScreen() {
  const router = useRouter();
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <LinearGradient
        colors={['rgba(16, 185, 129, 0.10)', 'transparent']}
        style={styles.topSpine}
        pointerEvents="none"
      />

      {/* Header */}
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
        <Text style={styles.headerTitle}>Fitness</Text>
        <Pressable
          onPress={() => {
            /* NOTE: future kebab menu — set max HR, force refresh, etc. */
          }}
          hitSlop={10}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <MoreHorizontal size={16} color={DS.textSecondary} strokeWidth={2} />
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
            style={styles.monthArrow}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <ChevronLeft size={14} color={DS.textTertiary} strokeWidth={2} />
          </Pressable>
          <View style={styles.monthCenter}>
            <Text style={styles.monthCaption}>
              {isToday ? 'THIS MONTH' : ''}
            </Text>
            <Text style={styles.monthTitle}>{fmtMonth(data.month)}</Text>
          </View>
          <Pressable
            onPress={() => {
              if (isToday) return;
              const next = new Date(data.month);
              next.setMonth(next.getMonth() + 1);
              setMonth(next);
            }}
            disabled={isToday}
            style={[styles.monthArrow, isToday && styles.monthArrowDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            accessibilityState={{ disabled: isToday }}
          >
            <ChevronRight size={14} color={DS.textTertiary} strokeWidth={2} />
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
          <View style={[styles.card, styles.statCard]}>
            <SectionHead Icon={Dumbbell} label="WORKOUTS" />
            <Text style={styles.heroLg}>{data.workouts.count}</Text>
            <Text style={styles.heroCaption}>this month</Text>
            <View style={styles.statFooter}>
              {data.workouts.deltaPct != null ? (
                <>
                  {data.workouts.deltaPct >= 0 ? (
                    <TrendingUp size={10} color={DS.accent} strokeWidth={2} />
                  ) : (
                    <TrendingDown size={10} color="#E5736A" strokeWidth={2} />
                  )}
                  <Text
                    style={[
                      styles.deltaText,
                      data.workouts.deltaPct < 0 && { color: '#E5736A' },
                    ]}
                  >
                    {data.workouts.deltaPct >= 0 ? '+' : ''}
                    {data.workouts.deltaPct}%
                  </Text>
                  <Text style={styles.deltaMeta}>vs prev</Text>
                </>
              ) : (
                <Text style={styles.deltaMeta}>Building data…</Text>
              )}
            </View>
          </View>

          <View style={[styles.card, styles.statCard]}>
            <SectionHead Icon={Heart} label="AVG HR" />
            <View style={styles.heroRow}>
              <Text style={styles.heroLg}>
                {data.heartRate.avg > 0 ? data.heartRate.avg : '—'}
              </Text>
              <Text style={styles.heroUnit}>bpm</Text>
            </View>
            <Text style={styles.heroCaption}>during workouts</Text>
            <View style={styles.statFooter}>
              <Text style={styles.deltaMeta}>Resting</Text>
              <Text style={styles.deltaWhite}>
                {data.heartRate.resting > 0 ? data.heartRate.resting : '—'}
              </Text>
              {data.heartRate.restingDelta !== 0 ? (
                <>
                  <View style={{ flex: 1 }} />
                  {data.heartRate.restingDelta < 0 ? (
                    <TrendingDown size={10} color={DS.accent} strokeWidth={2} />
                  ) : (
                    <TrendingUp size={10} color="#E5736A" strokeWidth={2} />
                  )}
                  <Text
                    style={[
                      styles.deltaText,
                      data.heartRate.restingDelta > 0 && { color: '#E5736A' },
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
          style={styles.card}
        >
          <View style={styles.totalTimeRow}>
            <View style={styles.iconBoxLarge}>
              <Clock size={16} color={DS.accent} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionLabel}>TOTAL TIME</Text>
              <Text style={[styles.heroMd, Tabular]}>
                {fmtHms(data.totalTime.seconds)}
              </Text>
            </View>
            <View style={styles.totalTimeRight}>
              <Text style={styles.sectionLabelMuted}>AVG</Text>
              <Text style={[styles.avgValue, Tabular]}>
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
          style={styles.card}
        >
          <View style={styles.cardHeaderRow}>
            <SectionHead Icon={Flame} label="CALORIES" />
            <Text style={styles.cardHeaderMeta}>Apple Health</Text>
          </View>
          <View style={styles.calRow}>
            <View style={styles.calCol}>
              <Text style={styles.sectionLabelMuted}>ACTIVE</Text>
              <View style={styles.heroRow}>
                <Text style={[styles.heroSm, { color: DS.accent }]}>
                  {data.calories.active.toLocaleString()}
                </Text>
                <Text style={styles.heroUnitSm}>CAL</Text>
              </View>
            </View>
            <View style={styles.calDivider} />
            <View style={styles.calCol}>
              <Text style={styles.sectionLabelMuted}>TOTAL</Text>
              <View style={styles.heroRow}>
                <Text style={[styles.heroSm, { color: DS.text }]}>
                  {data.calories.total.toLocaleString()}
                </Text>
                <Text style={styles.heroUnitSm}>CAL</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Daily burn */}
        <Animated.View
          entering={FadeInDown.duration(Motion.durationRise).delay(160)}
          style={styles.card}
        >
          <View style={styles.cardHeaderRow}>
            <SectionHead Icon={Zap} label="DAILY BURN" />
            <RangeToggle value={data.dailyBurn.range} onChange={setRange} />
          </View>

          <DailyBurnChart
            days={data.dailyBurn.days}
            resetKey={data.dailyBurn.range}
          />

          <View style={styles.cardFooter}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendSwatch,
                    { backgroundColor: 'rgba(16, 185, 129, 0.7)' },
                  ]}
                />
                <Text style={styles.legendLabel}>Workout</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendSwatch,
                    { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
                  ]}
                />
                <Text style={styles.legendLabel}>Rest</Text>
              </View>
            </View>
            <View style={styles.legendAvg}>
              <Text style={[styles.legendAvgValue, Tabular]}>
                {dailyAvg.toLocaleString()}
              </Text>
              <Text style={styles.legendAvgLabel}>cal/day avg</Text>
            </View>
          </View>
        </Animated.View>

        {/* HR range */}
        <Animated.View
          entering={FadeInDown.duration(Motion.durationRise).delay(200)}
          style={styles.card}
        >
          <View style={styles.cardHeaderRow}>
            <SectionHead Icon={Heart} label="HEART RATE RANGE" />
            <Text style={styles.cardHeaderMeta}>Apple Watch</Text>
          </View>

          <View style={styles.hrTriRow}>
            <HRTri label="MIN" value={data.heartRate.min} color="#6EE7B7" />
            <View style={styles.hrTriDivider} />
            <HRTri
              label="AVG"
              value={data.heartRate.avg}
              color={DS.accent}
              glow
            />
            <View style={styles.hrTriDivider} />
            <HRTri label="MAX" value={data.heartRate.max} color={DS.text} />
          </View>

          {/* Gradient zone bar */}
          <View style={styles.zoneBarWrap}>
            <LinearGradient
              colors={['#34D399', '#6EE7B7', DS.accent, '#059669', '#047857']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.zoneBar}
            />
            <Dot
              left={pctFromBpm(data.heartRate.min, data.heartRate)}
              outline="#6EE7B7"
              size={6}
            />
            <Dot
              left={pctFromBpm(data.heartRate.avg, data.heartRate)}
              outline="#fff"
              fill={DS.accent}
              size={8}
            />
            <Dot
              left={pctFromBpm(data.heartRate.max, data.heartRate)}
              outline="#047857"
              size={6}
            />
          </View>
          <View style={styles.zoneAxis}>
            <Text style={styles.axisTiny}>{data.heartRate.rangeFloor}</Text>
            <Text style={styles.axisTiny}>{data.heartRate.rangeCeil}</Text>
          </View>
        </Animated.View>

        {/* HR zones */}
        <Animated.View
          entering={FadeInDown.duration(Motion.durationRise).delay(240)}
          style={styles.card}
        >
          <View style={styles.cardHeaderRow}>
            <SectionHead Icon={Activity} label="HR ZONES" />
            <Text style={[styles.cardHeaderMeta, Tabular, { color: DS.text }]}>
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
          style={styles.card}
        >
          <View style={styles.cardHeaderRow}>
            <SectionHead Icon={Target} label="CONSISTENCY" />
            <View style={styles.streakBadge}>
              <Award size={11} color={DS.accent} strokeWidth={2} />
              <Text style={[styles.streakText, Tabular]}>
                {data.consistency.streak} day streak
              </Text>
            </View>
          </View>

          <ConsistencyHeatmap weeks={data.consistency.heatmap} />

          <View style={styles.consistencyFooter}>
            <View style={styles.legendRow}>
              <Text style={styles.legendLabel}>Less</Text>
              {[0, 1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.miniSwatch,
                    {
                      backgroundColor:
                        i === 0
                          ? '#0F0F0F'
                          : `rgba(16, 185, 129, ${0.2 + i * 0.2})`,
                    },
                  ]}
                />
              ))}
              <Text style={styles.legendLabel}>More</Text>
            </View>
            <View style={styles.activeDaysRow}>
              <Text style={[styles.activeDaysValue, Tabular]}>
                {data.consistency.activeDays}
              </Text>
              <Text style={styles.activeDaysLabel}>active days</Text>
            </View>
          </View>
        </Animated.View>

        {/* Muscle split */}
        <Animated.View
          entering={FadeInDown.duration(Motion.durationRise).delay(320)}
          style={styles.card}
        >
          <View style={styles.cardHeaderRow}>
            <SectionHead Icon={Dumbbell} label="MUSCLE SPLIT" />
            <Text style={styles.cardHeaderMeta}>by volume</Text>
          </View>

          {data.muscleSplit.length === 0 ? (
            <Text style={styles.emptyMuscle}>
              Log a workout this month to see volume by muscle group.
            </Text>
          ) : (
            data.muscleSplit.map((m) => (
              <View key={m.name} style={styles.muscleRow}>
                <Text style={styles.muscleName}>{m.name}</Text>
                <View style={styles.muscleTrack}>
                  <LinearGradient
                    colors={['rgba(16, 185, 129, 0.4)', DS.accent]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[
                      styles.muscleFill,
                      { width: `${Math.round(m.pct)}%` },
                    ]}
                  />
                </View>
                <View style={styles.muscleValueWrap}>
                  <Text style={[styles.muscleValue, Tabular]}>
                    {m.volume >= 1000
                      ? `${(m.volume / 1000).toFixed(1)}k`
                      : Math.round(m.volume)}
                  </Text>
                  <Text style={styles.muscleUnit}>lb</Text>
                </View>
              </View>
            ))
          )}
        </Animated.View>

        {/* HealthKit status */}
        <Animated.View
          entering={FadeInDown.duration(Motion.durationRise).delay(360)}
          style={[styles.card, styles.statusCard]}
          accessibilityLiveRegion="polite"
        >
          <View style={styles.statusIcon}>
            <Heart size={12} color={DS.accent} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>
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
            <Text style={styles.statusMeta}>
              Heart rate · Calories · Workouts
            </Text>
          </View>
          <Text
            style={[
              styles.statusBadge,
              data.status !== 'connected' && {
                color: DS.textTertiary,
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
  return (
    <View style={styles.sectionHead}>
      <View style={styles.iconBox}>
        <Icon size={10} color={DS.accent} strokeWidth={2.5} />
      </View>
      <Text style={styles.sectionLabel}>{label}</Text>
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
  return (
    <View style={styles.rangeWrap}>
      {(['7d', '14d', '30d'] as BurnRange[]).map((r) => {
        const active = r === value;
        return (
          <Pressable
            key={r}
            onPress={() => onChange(r)}
            style={[
              styles.rangeSeg,
              active && styles.rangeSegActive,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Show last ${r}`}
          >
            <Text
              style={[
                styles.rangeSegLabel,
                active && styles.rangeSegLabelActive,
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
  return (
    <View style={styles.hrTriCol}>
      <Text style={styles.sectionLabelMuted}>{label}</Text>
      <View style={styles.heroRow}>
        <Text style={[styles.heroXs, { color }, glow && styles.glow]}>
          {value > 0 ? value : '—'}
        </Text>
        <Text style={styles.heroUnitSm}>BPM</Text>
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
  const fillColor =
    index === 0
      ? 'rgba(16, 185, 129, 0.4)'
      : index === 1
        ? 'rgba(16, 185, 129, 0.6)'
        : index === 2
          ? DS.accent
          : index === 3
            ? '#059669'
            : '#047857';
  return (
    <View style={styles.zoneRow}>
      <View style={styles.zoneLeft}>
        <Text style={styles.zoneName}>{zone.name}</Text>
        <Text style={styles.zoneLabel}>{zone.label}</Text>
      </View>
      <View style={styles.zoneTrack}>
        <View
          style={[
            styles.zoneFill,
            { width: `${zone.pct}%`, backgroundColor: fillColor },
          ]}
        >
          {zone.pct > 18 ? (
            <Text style={[styles.zonePct, Tabular]}>{zone.pct}%</Text>
          ) : null}
        </View>
      </View>
      <Text style={[styles.zoneTime, Tabular]}>
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
  return (
    <View style={[styles.card, styles.connectCard]}>
      <View style={styles.connectIcon}>
        <Heart size={20} color={DS.accent} strokeWidth={2} />
      </View>
      <Text style={styles.connectTitle}>
        {denied ? 'Reconnect Apple Health' : 'Connect Apple Health'}
      </Text>
      <Text style={styles.connectBody}>
        {denied
          ? 'You denied access earlier. Re-enable it from iPhone Settings → Health → Data Access & Devices → MacroVault.'
          : 'See your heart rate, calorie burn, and Apple Watch workouts in MacroVault. Your data stays private.'}
      </Text>
      <Pressable
        onPress={() => void onConnect()}
        style={({ pressed }) => [
          styles.connectBtn,
          pressed && styles.connectBtnPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={denied ? 'Reconnect' : 'Connect Apple Health'}
      >
        <Text style={styles.connectBtnText}>
          {denied ? 'Reconnect' : 'Continue'}
        </Text>
      </Pressable>
    </View>
  );
}

function UnavailableCard() {
  return (
    <View style={[styles.card, styles.connectCard]}>
      <View style={styles.connectIcon}>
        <Heart size={20} color={DS.textTertiary} strokeWidth={2} />
      </View>
      <Text style={styles.connectTitle}>Apple Health not available</Text>
      <Text style={styles.connectBody}>
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
  safeArea: { flex: 1, backgroundColor: DS.bg },
  topSpine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
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
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.border,
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
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowDisabled: { opacity: 0.4 },
  monthCenter: { alignItems: 'center' },
  monthCaption: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.accent,
    letterSpacing: 1.5,
  },
  monthTitle: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: DS.text,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  // Cards
  card: {
    backgroundColor: DS.surface,
    borderColor: DS.border,
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
    color: DS.textTertiary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: DS.border,
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
    backgroundColor: DS.accentSoft,
    borderWidth: 1,
    borderColor: DS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxLarge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: DS.accentSoft,
    borderWidth: 1,
    borderColor: DS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.accent,
    letterSpacing: 1,
  },
  sectionLabelMuted: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.textTertiary,
    letterSpacing: 1,
  },
  // Stat row
  statRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, padding: 14, overflow: 'hidden' },
  heroLg: {
    fontFamily: Font.extrabold,
    fontSize: 40,
    color: DS.accent,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
    lineHeight: 42,
    marginTop: 6,
  },
  heroMd: {
    fontFamily: Font.extrabold,
    fontSize: 26,
    color: DS.accent,
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
  glow: {
    textShadowColor: 'rgba(16, 185, 129, 0.45)',
    textShadowRadius: 12,
  },
  heroCaption: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textSecondary,
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
    color: DS.textTertiary,
  },
  heroUnitSm: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.textTertiary,
    letterSpacing: 0.4,
  },
  statFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: DS.border,
  },
  deltaText: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.accent,
    fontVariant: ['tabular-nums'],
  },
  deltaMeta: {
    fontFamily: Font.medium,
    fontSize: 9,
    color: DS.textTertiary,
  },
  deltaWhite: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.text,
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
    color: DS.text,
    marginTop: 2,
  },
  // Calories
  calRow: { flexDirection: 'row' },
  calCol: { flex: 1, paddingHorizontal: 4 },
  calDivider: {
    width: 1,
    backgroundColor: DS.border,
    marginHorizontal: 6,
  },
  // Range toggle
  rangeWrap: {
    flexDirection: 'row',
    backgroundColor: DS.surfaceFlat,
    borderWidth: 1,
    borderColor: DS.border,
    borderRadius: 8,
    padding: 2,
  },
  rangeSeg: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rangeSegActive: {
    backgroundColor: DS.accent,
  },
  rangeSegLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.textTertiary,
    letterSpacing: 0.3,
  },
  rangeSegLabelActive: {
    color: '#000',
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
    color: DS.textSecondary,
  },
  legendAvg: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  legendAvgValue: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.text,
  },
  legendAvgLabel: {
    fontFamily: Font.semibold,
    fontSize: 9,
    color: DS.textTertiary,
  },
  // HR range
  hrTriRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  hrTriCol: { flex: 1, alignItems: 'center', gap: 4 },
  hrTriDivider: {
    width: 1,
    backgroundColor: DS.border,
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
    color: DS.textQuaternary,
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
    color: DS.text,
  },
  zoneLabel: {
    fontFamily: Font.medium,
    fontSize: 8,
    color: DS.textTertiary,
  },
  zoneTrack: {
    flex: 1,
    height: 16,
    backgroundColor: DS.surfaceFlat,
    borderWidth: 1,
    borderColor: DS.border,
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
    color: '#000',
  },
  zoneTime: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.text,
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
    color: DS.accent,
  },
  consistencyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: DS.border,
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
    color: DS.text,
  },
  activeDaysLabel: {
    fontFamily: Font.medium,
    fontSize: 9,
    color: DS.textTertiary,
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
    color: DS.text,
  },
  muscleTrack: {
    flex: 1,
    height: 12,
    backgroundColor: DS.surfaceFlat,
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
    color: DS.text,
  },
  muscleUnit: {
    fontFamily: Font.medium,
    fontSize: 8,
    color: DS.textTertiary,
  },
  emptyMuscle: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
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
    backgroundColor: DS.accentSoft,
    borderWidth: 1,
    borderColor: DS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: DS.text,
  },
  statusMeta: {
    fontFamily: Font.medium,
    fontSize: 9,
    color: DS.textTertiary,
    marginTop: 1,
  },
  statusBadge: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.accent,
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
    backgroundColor: DS.accentSoft,
    borderWidth: 1,
    borderColor: DS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectTitle: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: DS.text,
    marginTop: 2,
  },
  connectBody: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 4,
  },
  connectBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: DS.accent,
  },
  connectBtnPressed: { opacity: 0.85 },
  connectBtnText: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: '#000',
  },
  bottomSpacer: { height: 140 },
});
