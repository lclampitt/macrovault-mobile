import { StyleSheet, Text, View } from 'react-native';
import { Lock } from 'lucide-react-native';
import { DS, Font, Shadow } from '../../lib/design-system';

type Props = {
  compact?: boolean;
  /** Show the "· SECURED" microtype underneath. */
  secured?: boolean;
};

export default function AuthLogo({ compact, secured }: Props) {
  return (
    <View style={styles.col}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, compact && styles.iconWrapCompact, Shadow.emeraldGlow]}>
          <Lock size={compact ? 16 : 18} color="#000" strokeWidth={2.5} />
        </View>
        <Text style={[styles.wordmark, compact && styles.wordmarkCompact]}>
          MacroVault
        </Text>
      </View>
      {secured ? <Text style={styles.secured}>· SECURED</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  col: { alignItems: 'center', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: DS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapCompact: {
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  wordmark: {
    fontFamily: Font.bold,
    fontSize: 22,
    color: DS.text,
    letterSpacing: -0.5,
  },
  wordmarkCompact: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  secured: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.accent,
    letterSpacing: 2.5,
  },
});
