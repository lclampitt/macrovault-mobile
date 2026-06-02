import { StyleSheet, Text, View } from 'react-native';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import { Font, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import Card from '../ds/Card';
import Sparkline from '../ds/Sparkline';
import CaloriesBurnedTile, {
  type CaloriesBurnedData,
} from './CaloriesBurnedTile';

type Props = {
  bodyweight: {
    valueLb: number;
    deltaLb: number; // negative = lost weight
    days: number;
    history: number[]; // sparkline series
  };
  burned: CaloriesBurnedData;
};

function fmtWeight(n: number): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export default function StatsGrid({ bodyweight, burned }: Props) {
  const t = useTokens();
  return (
    <View style={styles.row}>
      <Card style={styles.tile}>
        <View style={styles.headerRow}>
          <Text style={[styles.label, { color: t.textTertiary }]}>
            BODYWEIGHT
          </Text>
          {bodyweight.deltaLb < 0 ? (
            <ArrowDownRight size={14} color={t.primary} strokeWidth={2.5} />
          ) : (
            <ArrowUpRight size={14} color={t.primary} strokeWidth={2.5} />
          )}
        </View>
        <View style={styles.valueRow}>
          <Text style={[styles.value, Tabular, { color: t.textPrimary }]}>
            {fmtWeight(bodyweight.valueLb)}
          </Text>
          <Text style={[styles.unit, { color: t.textSecondary }]}>lb</Text>
        </View>
        <Text
          style={[styles.meta, Tabular, { color: t.textSecondary }]}
        >
          <Text style={{ color: t.primary }}>
            {bodyweight.deltaLb > 0 ? '+' : ''}
            {fmtWeight(bodyweight.deltaLb)} lb
          </Text>{' '}
          · {bodyweight.days} days
        </Text>
        <View style={styles.sparkWrap}>
          <Sparkline points={bodyweight.history} height={24} />
        </View>
      </Card>

      <CaloriesBurnedTile data={burned} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
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
  label: {
    fontFamily: Font.bold,
    fontSize: 10,
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
    letterSpacing: -0.6,
  },
  unit: {
    fontFamily: Font.medium,
    fontSize: 11,
  },
  meta: {
    fontFamily: Font.medium,
    fontSize: 11,
    marginTop: 6,
  },
  sparkWrap: {
    marginTop: 8,
  },
});
