import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { DS, Font, Radius } from '../../lib/design-system';

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
  return (
    <View style={styles.outer}>
      <View style={styles.card}>
        <View style={styles.iconBubble}>
          <Icon size={20} color={DS.accent} strokeWidth={2} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
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
    backgroundColor: DS.surface,
    borderColor: DS.border,
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
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: DS.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  body: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 17,
  },
});
