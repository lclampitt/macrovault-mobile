// Date helpers ported from gainlytics-v2/src/pages/dashboard.jsx.
// All "today" boundaries are local time, matching the web app's behavior.

/** Format a Date as YYYY-MM-DD using local time. */
export function fmtLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Monday-Sunday week range containing `now` (default: today), in YYYY-MM-DD. */
export function getWeekRange(now: Date = new Date()): { start: string; end: string } {
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMon = (day === 0 ? -6 : 1) - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: fmtLocalDate(mon), end: fmtLocalDate(sun) };
}

/** "today", "yesterday", "3 days ago", "2 wk ago", "1 mo ago" from a YYYY-MM-DD. */
export function fmtAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const dt = new Date(dateStr + 'T00:00:00');
  const days = Math.floor((Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} wk ago`;
  return `${Math.floor(days / 30)} mo ago`;
}

/** "Good morning" etc. Used by web for greeting. Kept for parity. */
export function getGreeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Good night';
}

/** "MORNING" / "AFTERNOON" / "EVENING" / "NIGHT" for the kicker pill. */
export function getPeriodLabel(now: Date = new Date()): string {
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'MORNING';
  if (h >= 12 && h < 17) return 'AFTERNOON';
  if (h >= 17 && h < 21) return 'EVENING';
  return 'NIGHT';
}

/** "4:22 PM" via locale formatting. */
export function fmtClock(now: Date = new Date()): string {
  return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Time-of-day → upcoming meal label. Matches web's getNextMealLabel(). */
export function getNextMealLabel(now: Date = new Date()): string {
  const h = now.getHours();
  if (h >= 5 && h < 10) return 'Breakfast';
  if (h >= 10 && h < 14) return 'Lunch';
  if (h >= 14 && h < 17) return 'Snack';
  if (h >= 17 && h < 21) return 'Dinner';
  return "Tomorrow's Breakfast";
}
