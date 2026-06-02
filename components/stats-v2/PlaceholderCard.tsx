import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Font, Radius } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

type Props = {
  Icon: LucideIcon;
  title: string;
  body: string;
};

/**
 * Quiet, confident empty state — no sad faces, no excessive copy. Used for
 * the Strength and Nutrition sub-nav tabs.
 */
export default function PlaceholderCard({ Icon, title, body }: Props) {
  const t = useTokens();
  return (
    <View style={styles.outer}>
      <View style={[styles.card, { backgroundColor: t.bgCard, borderColor: t.borderDefault }]}>
        <View
          style={[
            styles.iconBubble,
            { backgroundColor: t.primaryTintBg, borderColor: t.primaryTintBorder },
          ]}
        >
          <Icon size={20} color={t.primary} strokeWidth={2} />
        </View>
        <Text style={[styles.title, { color: t.textPrimary }]}>{title}</Text>
        <Text style={[styles.body, { color: t.textSecondary }]}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  body: {
    fontFamily: Font.medium,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 17,
  },
});
