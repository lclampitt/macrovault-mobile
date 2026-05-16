// AsyncStorage persistence for calculator results — the mobile equivalent of
// the web app's localStorage keys (macrovault_macro_results /
// macrovault_1rm_results). Kept on-device only, exactly like web.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GoalKey } from './calculators';

const MACRO_KEY = 'macrovault_macro_results';
const ONE_RM_KEY = 'macrovault_1rm_results';

export type StoredMacroResult = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  goal: GoalKey;
  calculated_at: string; // ISO
};

export type StoredOneRmResult = {
  oneRepMax: number;
  unit: 'lbs' | 'kg';
  updatedAt: string; // ISO
};

export async function saveMacroResult(r: StoredMacroResult): Promise<void> {
  try {
    await AsyncStorage.setItem(MACRO_KEY, JSON.stringify(r));
  } catch (e) {
    console.error('[calculatorStorage] saveMacroResult', e);
  }
}

export async function loadMacroResult(): Promise<StoredMacroResult | null> {
  try {
    const raw = await AsyncStorage.getItem(MACRO_KEY);
    return raw ? (JSON.parse(raw) as StoredMacroResult) : null;
  } catch (e) {
    console.error('[calculatorStorage] loadMacroResult', e);
    return null;
  }
}

export async function saveOneRmResult(r: StoredOneRmResult): Promise<void> {
  try {
    await AsyncStorage.setItem(ONE_RM_KEY, JSON.stringify(r));
  } catch (e) {
    console.error('[calculatorStorage] saveOneRmResult', e);
  }
}

export async function loadOneRmResult(): Promise<StoredOneRmResult | null> {
  try {
    const raw = await AsyncStorage.getItem(ONE_RM_KEY);
    return raw ? (JSON.parse(raw) as StoredOneRmResult) : null;
  } catch (e) {
    console.error('[calculatorStorage] loadOneRmResult', e);
    return null;
  }
}
