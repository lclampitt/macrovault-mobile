import { StyleSheet, Text, View } from 'react-native';
import { DS, Font, Tabular } from '../../lib/design-system';
import Card from '../ds/Card';
import ProgressBar from '../ds/ProgressBar';

type Macro = {
  key: 'protein' | 'carbs' | 'fat';
  label: string;
  value: number;
  target: number;
  color: string;
};

type Props = {
  /** Used as the React key so animations replay on day change. */
  reanimateKey: string | number;
  consumed: number;
  target: number;
  macros: Macro[];
};

/** Over-target color — amber-leaning emerald per spec. Never red. */
const OVER_COLOR = '#E5A06A';

function fmtNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export default function DayTotalsCard({
  reanimateKey,
  consumed,
  target,
  macros,
}: Props) {
  const rawPct = target > 0 ? (consumed / target) * 100 : 0;
  const displayedPct = Math.round(rawPct);
  const over = rawPct > 100;
  const fillRatio = Math.min(1, rawPct / 100);

  return (
    <View style={styles.outer} key={reanimateKey}>
      <Card>
        {/* Calories hero row */}
        <View style={styles.heroRow}>
          <View style={styles.heroLeft}>
            <Text style={[styles.heroValue, Tabular]}>
              {fmtNumber(consumed)}
            </Text>
            <Text style={[styles.heroTarget, Tabular]}>
              {' '}/ {fmtNumber(target)} kcal
            </Text>
          </View>
          <Text
            style={[
              styles.heroPct,
              Tabular,
              { color: over ? OVER_COLOR : DS.accent },
            ]}
          >
            {displayedPct}%
          </Text>
        </View>

        <ProgressBar
          value={fillRatio}
          color={over ? OVER_COLOR : DS.accent}
          height={4}
          style={styles.heroBar}
        />

        {/* Macro grid */}
        <View style={styles.macrosRow}>
          {macros.map((m, idx) => {
            const macroPctRaw = m.target > 0 ? (m.value / m.target) * 100 : 0;
            const macroOver = macroPctRaw > 100;
            const macroFill = Math.min(1, macroPctRaw / 100);
            return (
              <View key={m.key} style={styles.macroCol}>
                <Text style={styles.macroLabel}>
                  {m.label.toUpperCase()}
                </Text>
                <View style={styles.macroValueRow}>
                  <Text style={[styles.macroValue, Tabular]}>{m.value}</Text>
                  <Text style={styles.macroTarget}>/{m.target}g</Text>
                </View>
                <ProgressBar
                  value={macroFill}
                  color={macroOver ? OVER_COLOR : m.color}
                  delay={idx * 100}
                  height={3}
                />
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heroValue: {
    fontFamily: Font.bold,
    fontSize: 28,
    color: DS.text,
    letterSpacing: -0.6,
  },
  heroTarget: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textTertiary,
  },
  heroPct: {
    fontFamily: Font.medium,
    fontSize: 11,
  },
  heroBar: {
    marginBottom: 16,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroCol: {
    flex: 1,
  },
  macroLabel: {
    fontFamily: Font.semibold,
    fontSize: 10,
    color: DS.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  macroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  macroValue: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: DS.text,
  },
  macroTarget: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: '#555',
  },
});
