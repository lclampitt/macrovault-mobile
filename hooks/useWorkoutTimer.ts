import { useEffect, useState } from 'react';

/** Port of WorkoutLogger.jsx formatDuration: "m:ss", or "Hh Mm" at >= 60min. */
export function formatWorkoutDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm}m`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Elapsed-time string that ticks once per second from `startedAt`. */
export function useWorkoutTimer(startedAt: number): string {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - startedAt) / 1000),
  );

  useEffect(() => {
    setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return formatWorkoutDuration(elapsed);
}
