import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Font } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import PulseDot from '../ds/PulseDot';

type Props = {
  /** First name from the cached profile. Empty / missing / >15 chars → name omitted. */
  firstName: string | null | undefined;
};

const MAX_NAME = 15;

function getTimeOfDayGreeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Goodnight'; // 21:00 – 04:59
}

function buildGreeting(firstName: string | null | undefined): string {
  const greeting = getTimeOfDayGreeting();
  const trimmed = (firstName ?? '').trim();
  if (trimmed.length === 0 || trimmed.length > MAX_NAME) {
    return `${greeting}.`;
  }
  return `${greeting}, ${trimmed}.`;
}

/**
 * Personalized time-of-day greeting that sits below the dashboard header.
 *
 *   ● GOOD MORNING, LOGAN.
 *
 * Visual: same pulsing dot + 10px uppercase tracked emerald label as the
 * previous status banner. The legacy "· Day N" subtitle has been removed
 * entirely.
 *
 * Refresh cadence: we re-evaluate the greeting every 5 minutes via a single
 * interval, which is enough to roll over period boundaries (5am, noon, 5pm,
 * 9pm) for users who leave the app open. We don't tick every minute because
 * the period text never changes in between.
 */
export default function LiveBanner({ firstName }: Props) {
  const [greeting, setGreeting] = useState(() => buildGreeting(firstName));
  const t = useTokens();

  // Re-compute when the cached name lands AND on a 5-minute heartbeat so the
  // period rolls over for long-open sessions.
  useEffect(() => {
    setGreeting(buildGreeting(firstName));
    const id = setInterval(
      () => setGreeting(buildGreeting(firstName)),
      5 * 60 * 1000,
    );
    return () => clearInterval(id);
  }, [firstName]);

  return (
    <View style={styles.row}>
      <PulseDot size={6} />
      {/* `textTransform: uppercase` keeps screen readers announcing the
          sentence-case form ("Good morning, Logan") while displaying the
          uppercase banner. */}
      <Text
        style={[styles.label, { color: t.primary }]}
        accessibilityLabel={greeting}
      >
        {greeting}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  label: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
