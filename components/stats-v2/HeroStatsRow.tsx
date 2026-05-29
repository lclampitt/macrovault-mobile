import { StyleSheet, Text, View } from 'react-native';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Scale,
  type LucideIcon,
} from 'lucide-react-native';
import { DS, Font, Tabular } from '../../lib/design-system';
import Card from '../ds/Card';
import Sparkline from '../ds/Sparkline';

type Props = {
  /** Most recent weight in lb, or null when no entries. */
  weight: number | null;
  weightDelta: number | null;
  weightHistory: number[]; // last N values, ascending
  /** Most recent BF%, or null when never logged. */
  bodyFat: number | null;
  bodyFatDelta: number | null;
  bodyFatHistory: number[];
  rangeEntryCount: number;
};

function fmtNum(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}

function fmtDelta(n: number, decimals = 1): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}${Math.abs(n).toFixed(decimals)}`;
}

export default function HeroStatsRow({
  weight,
  weightDelta,
  weightHistory,
  bodyFat,
  bodyFatDelta,
  bodyFatHistory,
  rangeEntryCount,
}: Props) {
  return (
    <View style={styles.row}>
      <HeroCard
        Icon={Scale}
        label="Weight"
        value={weight != null ? fmtNum(weight, 1) : '—'}
        unit="lb"
        delta={weightDelta}
        deltaUnit="lb"
        history={weightHistory}
        secondaryMeta={
          rangeEntryCount > 0
            ? `${rangeEntryCount} ${rangeEntryCount === 1 ? 'entry' : 'entries'}`
            : null
        }
      />
      <HeroCard
        Icon={Activity}
        label="Body fat"
        value={bodyFat != null ? fmtNum(bodyFat, 1) : '—'}
        unit="%"
        delta={bodyFatDelta}
        deltaUnit="%"
        history={bodyFatHistory}
        secondaryMeta={null}
      />
    </View>
  );
}

type HeroProps = {
  Icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  delta: number | null;
  deltaUnit: string;
  history: number[];
  secondaryMeta: string | null;
};

function HeroCard({
  Icon,
  label,
  value,
  unit,
  delta,
  deltaUnit,
  history,
  secondaryMeta,
}: HeroProps) {
  const Arrow = delta != null && delta > 0 ? ArrowUpRight : ArrowDownRight;
  const showSpark = history.length >= 2;

  return (
    <Card style={styles.tile}>
      <View style={styles.headerRow}>
        <View style={styles.labelRow}>
          <Icon size={12} color={DS.accent} strokeWidth={2.5} />
          <Text style={styles.label}>{label.toUpperCase()}</Text>
        </View>
        {delta != null ? (
          <Arrow size={14} color={DS.accent} strokeWidth={2.5} />
        ) : null}
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.value, Tabular]}>{value}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>

      <Text style={[styles.meta, Tabular]}>
        {delta != null ? (
          <Text style={{ color: DS.accent }}>
            {fmtDelta(delta, 1)} {deltaUnit}
          </Text>
        ) : (
          <Text style={{ color: DS.textTertiary }}>No prior entry</Text>
        )}
        {secondaryMeta ? (
          <Text style={{ color: DS.textTertiary }}> · {secondaryMeta}</Text>
        ) : null}
      </Text>

      <View style={styles.sparkWrap}>
        {showSpark ? (
          <Sparkline points={history} height={24} />
        ) : (
          <View style={styles.sparkPlaceholder} />
        )}
      </View>
    </Card>
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
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: Font.semibold,
    fontSize: 10,
    color: DS.textSecondary,
    letterSpacing: 0.6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontFamily: Font.bold,
    fontSize: 28,
    color: DS.text,
    letterSpacing: -0.6,
  },
  unit: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textSecondary,
  },
  meta: {
    fontFamily: Font.medium,
    fontSize: 11,
    marginTop: 6,
  },
  sparkWrap: {
    marginTop: 8,
    height: 24,
  },
  sparkPlaceholder: {
    height: 24,
  },
});
