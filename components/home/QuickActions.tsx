import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import QuickActionHero from './QuickActionHero';
import QuickActionCard from './QuickActionCard';

type Props = {
  heroTitle: string;
  heroKicker: string;
  heroSubtitle: string;
  workoutSubtitle: string;
  weightSubtitle: string;
};

export default function QuickActions({
  heroTitle,
  heroKicker,
  heroSubtitle,
  workoutSubtitle,
  weightSubtitle,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>QUICK ACTIONS</Text>

      <View style={styles.heroWrap}>
        <QuickActionHero
          kicker={heroKicker}
          title={heroTitle}
          subtitle={heroSubtitle}
          onPress={() => console.log('TODO: hero action -> meal logging')}
        />
      </View>

      <View style={styles.secondaryRow}>
        <QuickActionCard
          icon={
            <MaterialCommunityIcons
              name="dumbbell"
              size={17}
              color={Colors.textSecondary}
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
              color={Colors.textSecondary}
            />
          }
          title="Weight"
          subtitle={weightSubtitle}
          onPress={() => console.log('TODO: weight quick action')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  heading: {
    color: Colors.textHint,
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
