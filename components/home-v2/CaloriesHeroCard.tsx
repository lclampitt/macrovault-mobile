import { StyleSheet, Text, View } from 'react-native';
import { DS, Font, Tabular, Type } from '../../lib/design-system';
import Card from '../ds/Card';
import RingGauge from '../ds/RingGauge';
import ProgressBar from '../ds/ProgressBar';
import SectionLabel from '../ds/SectionLabel';

type Macro = {
  key: 'P' | 'C' | 'F';
  label: string;
  value: number;
  target: number;
  color: string;
};

type Props = {
  consumed: number;
  target: number;
  macros: Macro[];
};

function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export default function CaloriesHeroCard({ consumed, target, macros }: Props) {
  const remaining = Math.max(0, target - consumed);
  const pct = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
  const pctRounded = Math.round(pct);

  return (
    <Card style={styles.card}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <SectionLabel>Calories today</SectionLabel>
        <Text style={[styles.pctMeta, Tabular]}>{pctRounded}%</Text>
      </View>

      {/* Number + ring */}
      <View style={styles.mainRow}>
        <View style={styles.numberCol}>
          <Text style={Type.heroNumber(52)} numberOfLines={1}>
            {fmtInt(remaining)}
          </Text>
          <Text style={styles.kcalLabel}>kcal remaining</Text>
          <View style={styles.subRow}>
            <Text style={[styles.subValue, Tabular]}>{fmtInt(consumed)}</Text>
            <Text style={styles.subSlash}>/</Text>
            <Text style={[styles.subTarget, Tabular]}>{fmtInt(target)}</Text>
          </View>
        </View>

        <RingGauge percent={pct} size={110} strokeWidth={6}>
          <Text style={[styles.ringValue, Tabular]}>{pctRounded}</Text>
          <Text style={styles.ringUnit}>PERCENT</Text>
        </RingGauge>
      </View>

      {/* Macros tri-readout */}
      <View style={styles.divider} />
      <View style={styles.macrosRow}>
        {macros.map((m, idx) => {
          const macroPct = m.target > 0 ? Math.min(100, (m.value / m.target) * 100) : 0;
          return (
            <View key={m.key} style={styles.macroCol}>
              <View style={styles.macroTopRow}>
                <Text style={styles.macroLabel}>{m.label}</Text>
                <Text style={[styles.macroPct, Tabular]}>
                  {Math.round(macroPct)}%
                </Text>
              </View>
              <View style={styles.macroValueRow}>
                <Text style={[styles.macroValue, Tabular]}>{m.value}</Text>
                <Text style={styles.macroTarget}>/{m.target}g</Text>
              </View>
              <ProgressBar
                value={macroPct / 100}
                color={m.color}
                delay={idx * 100}
                height={3}
              />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pctMeta: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.accent,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  numberCol: {
    flex: 1,
  },
  kcalLabel: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textSecondary,
    marginTop: 6,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 12,
  },
  subValue: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textSecondary,
  },
  subSlash: {
    fontSize: 11,
    color: DS.textDimmest,
  },
  subTarget: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: DS.textTertiary,
  },
  ringValue: {
    fontFamily: Font.bold,
    fontSize: 24,
    color: DS.text,
    letterSpacing: -0.4,
  },
  ringUnit: {
    fontFamily: Font.medium,
    fontSize: 8,
    color: DS.textTertiary,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: DS.border,
    marginTop: 20,
    marginBottom: 16,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroCol: {
    flex: 1,
  },
  macroTopRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  macroLabel: {
    fontFamily: Font.semibold,
    fontSize: 10,
    color: DS.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  macroPct: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textQuaternary,
  },
  macroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  macroValue: {
    fontFamily: Font.bold,
    fontSize: 18,
    color: DS.text,
  },
  macroTarget: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textTertiary,
  },
});
