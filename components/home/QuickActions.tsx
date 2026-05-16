import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme-context';
import QuickActionHero from './QuickActionHero';
import QuickActionCard from './QuickActionCard';
import QuickActionSkeleton from './skeletons/QuickActionSkeleton';

type Props = {
  heroKicker: string;
  heroTitle: string;
  heroSubtitle: string;
  workoutSubtitle: string;
  weightSubtitle: string;
  loading: boolean;
};

export default function QuickActions({
  heroKicker,
  heroTitle,
  heroSubtitle,
  workoutSubtitle,
  weightSubtitle,
  loading,
}: Props) {
  const { theme: c } = useTheme();
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.heading, { color: c.textHint }]}>QUICK ACTIONS</Text>

      <View style={styles.heroWrap}>
        {loading ? (
          <QuickActionSkeleton variant="hero" />
        ) : (
          <QuickActionHero
            kicker={heroKicker}
            title={heroTitle}
            subtitle={heroSubtitle}
            onPress={() => console.log('TODO: hero action -> meal logging')}
          />
        )}
      </View>

      <View style={styles.secondaryRow}>
        {loading ? (
          <>
            <QuickActionSkeleton variant="small" />
            <QuickActionSkeleton variant="small" />
          </>
        ) : (
          <>
            <QuickActionCard
              icon={
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={17}
                  color={c.textSecondary}
                />
              }
              title="Workout"
              subtitle={workoutSubtitle}
              onPress={() => console.log('TODO: workout quick action')}
            />
            <QuickActionCard
              icon={
                <MaterialCommunityIcons
                  name="scale-bathroom"
                  size={17}
                  color={c.textSecondary}
                />
              }
              title="Weight"
              subtitle={weightSubtitle}
              onPress={() => console.log('TODO: weight quick action')}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  heading: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  heroWrap: {
    marginBottom: 0,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
