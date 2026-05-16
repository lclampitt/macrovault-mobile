// Pure calculator logic ported verbatim from the MacroVault web app
// (gainlytics-v2/src/calculators/MacroCalculator.js + OneRepMaxCalculator.js).
// Keep these formulas byte-for-byte identical to web for parity.

// ---------------------------------------------------------------------------
// Macro Calculator
// ---------------------------------------------------------------------------

export const MACRO_TOTAL_STEPS = 6;

export type ActivityKey = 'sedentary' | 'light' | 'moderate' | 'active' | 'extra';
export type GoalKey = 'cut' | 'maintain' | 'bulk';
export type DietKey = 'standard' | 'lowcarb' | 'keto' | 'highprotein';
export type Sex = 'male' | 'female';

export const ACTIVITY_OPTS: {
  key: ActivityKey;
  label: string;
  mult: number;
  desc: string;
}[] = [
  { key: 'sedentary', label: 'Sedentary', mult: 1.2, desc: 'Little or no exercise, desk job' },
  { key: 'light', label: 'Lightly active', mult: 1.375, desc: 'Light exercise 1–3 days per week' },
  { key: 'moderate', label: 'Moderately active', mult: 1.55, desc: 'Moderate exercise 3–5 days per week' },
  { key: 'active', label: 'Very active', mult: 1.725, desc: 'Hard exercise 6–7 days per week' },
  { key: 'extra', label: 'Extra active', mult: 1.9, desc: 'Very hard exercise or physical job' },
];

export const GOAL_OPTS: {
  key: GoalKey;
  label: string;
  delta: number;
  desc: string;
  icon: string;
}[] = [
  { key: 'cut', label: 'Cut', delta: -500, desc: '500 kcal deficit', icon: 'trending-down' },
  { key: 'maintain', label: 'Maintain', delta: 0, desc: 'At TDEE', icon: 'minus' },
  { key: 'bulk', label: 'Bulk', delta: 300, desc: '300 kcal surplus', icon: 'trending-up' },
];

export const DIET_OPTS: {
  key: DietKey;
  label: string;
  fatPct: number;
  desc: string;
}[] = [
  { key: 'standard', label: 'Standard', fatPct: 0.25, desc: 'Balanced split' },
  { key: 'lowcarb', label: 'Low carb', fatPct: 0.4, desc: 'Higher fat' },
  { key: 'keto', label: 'Keto', fatPct: 0.65, desc: 'Very high fat' },
  { key: 'highprotein', label: 'High protein', fatPct: 0.2, desc: 'Leaner fats' },
];

export type MacroInput = {
  sex: Sex;
  age: number;
  imperial: boolean;
  // imperial
  weightLbsOrKg: number; // raw weight value the user typed
  heightFt: number;
  heightIn: number;
  // metric
  heightCm: number;
  bodyFat: string; // '' when skipped
  activity: ActivityKey;
  goal: GoalKey;
  diet: DietKey;
};

export type MacroResult = {
  bmr: number;
  tdee: number;
  targetCals: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  bmrFormula: 'katch' | 'mifflin';
};

export function computeMacros(input: MacroInput): MacroResult {
  const {
    sex,
    age: ageN,
    imperial,
    weightLbsOrKg: weight,
    heightFt,
    heightIn,
    heightCm,
    bodyFat,
    activity,
    goal,
    diet,
  } = input;

  const isMale = sex === 'male';

  const weightKg = imperial ? weight * 0.453592 : weight;
  const heightCmN = imperial ? (heightFt * 12 + (heightIn || 0)) * 2.54 : heightCm;

  const hasBodyFat = bodyFat !== '' && Number(bodyFat) > 0;
  const bmrFormula: 'katch' | 'mifflin' = hasBodyFat ? 'katch' : 'mifflin';

  let bmr: number;
  if (hasBodyFat) {
    const leanMassKg = weightKg * (1 - Number(bodyFat) / 100);
    bmr = Math.round(370 + 21.6 * leanMassKg);
  } else {
    bmr = Math.round(10 * weightKg + 6.25 * heightCmN - 5 * ageN + (isMale ? 5 : -161));
  }

  const mult = ACTIVITY_OPTS.find((a) => a.key === activity)?.mult ?? 1.55;
  const tdee = Math.round(bmr * mult);

  const delta = GOAL_OPTS.find((g) => g.key === goal)?.delta ?? 0;
  const targetCals = Math.round((tdee + delta) / 10) * 10;

  const weightLbs = imperial ? weight : weight * 2.20462;
  const bfPct = bodyFat !== '' ? Number(bodyFat) : isMale ? 15 : 25;
  const leanMassLbs = weightLbs * (1 - bfPct / 100);

  let ageMult = 1.0;
  if (ageN >= 60) ageMult = 1.2;
  else if (ageN >= 50) ageMult = 1.15;
  else if (ageN >= 40) ageMult = 1.08;
  const proteinG = Math.round(leanMassLbs * 0.88 * ageMult);

  const fatPct = DIET_OPTS.find((d) => d.key === diet)?.fatPct ?? 0.25;
  const fatG = Math.round((targetCals * fatPct) / 9);
  let carbG = Math.round((targetCals - proteinG * 4 - fatG * 9) / 4);

  let finalProteinG = proteinG;
  if (carbG < 20) {
    carbG = 20;
    finalProteinG = Math.max(0, Math.round((targetCals - carbG * 4 - fatG * 9) / 4));
  }

  return {
    bmr,
    tdee,
    targetCals,
    proteinG: finalProteinG,
    carbG,
    fatG,
    bmrFormula,
  };
}

// ---------------------------------------------------------------------------
// One-Rep Max Calculator
// ---------------------------------------------------------------------------

export function calculateOneRepMax(weight: number, reps: number): number | null {
  const w = weight;
  const r = reps;
  if (!w || !r || r <= 0) return null;
  return Math.round(w / (1.0278 - 0.0278 * r));
}

export const REP_MAX_PERCENTAGES = [
  1.0, 0.95, 0.93, 0.9, 0.87, 0.85, 0.83, 0.8, 0.77, 0.75, 0.73, 0.7, 0.65, 0.6, 0.55, 0.5,
];

export type RepMaxRow = { reps: string; weight: number; pct: number };

export function buildRepMaxTable(oneRepMax: number): RepMaxRow[] {
  return REP_MAX_PERCENTAGES.map((percent, idx) => ({
    reps: idx + 1 <= 12 ? String(idx + 1) : '-',
    weight: Math.round(oneRepMax * percent),
    pct: Math.round(percent * 100),
  }));
}
