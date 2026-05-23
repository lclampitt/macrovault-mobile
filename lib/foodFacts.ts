// Open Food Facts helpers ported from
// gainlytics-v2/src/components/FoodSearch/FoodSearch.jsx.
// Used by the Meal Planner's Food Search tab.

export type OffProduct = {
  id: string;
  name: string;
  brand: string;
  servingGrams: number;
  servingLabel: string;
  per100: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
};

// "30 g", "1 bar (30 g)", "250ml" → grams (or null if no grams parseable).
export function parseServingGrams(str: string | null | undefined): number | null {
  if (!str || typeof str !== 'string') return null;
  const match = str.match(/(\d+(?:[.,]\d+)?)\s*g\b/i);
  if (match) return parseFloat(match[1].replace(',', '.'));
  return null;
}

// Normalize an Open Food Facts product into the shape we render. Falls back
// through every energy field OFF might provide so branded products don't get
// silently dropped.
export function formatOffProduct(p: any): OffProduct {
  const n = p.nutriments || {};
  const servingGrams = parseServingGrams(p.serving_size) || 100;

  let cal100 = Number(n['energy-kcal_100g']) || Number(n['energy-kcal']) || 0;
  if (!cal100) {
    const kj =
      Number(n['energy-kj_100g']) ||
      Number(n['energy-kj']) ||
      Number(n.energy_100g) ||
      Number(n.energy) ||
      0;
    if (kj) cal100 = kj / 4.184;
  }
  if (!cal100) {
    const calServ =
      Number(n['energy-kcal_serving']) ||
      (Number(n['energy-kj_serving'])
        ? Number(n['energy-kj_serving']) / 4.184
        : 0);
    if (calServ && servingGrams) cal100 = (calServ * 100) / servingGrams;
  }

  const protein100 =
    Number(n.proteins_100g) ||
    (Number(n.proteins_serving) && servingGrams
      ? (Number(n.proteins_serving) * 100) / servingGrams
      : 0);
  const carbs100 =
    Number(n.carbohydrates_100g) ||
    (Number(n.carbohydrates_serving) && servingGrams
      ? (Number(n.carbohydrates_serving) * 100) / servingGrams
      : 0);
  const fat100 =
    Number(n.fat_100g) ||
    (Number(n.fat_serving) && servingGrams
      ? (Number(n.fat_serving) * 100) / servingGrams
      : 0);

  return {
    id: p.code || `${p.product_name}-${Math.random()}`,
    name: (p.product_name || '').trim() || 'Unknown product',
    brand: ((p.brands || '').split(',')[0] || '').trim(),
    servingGrams,
    servingLabel: p.serving_size || `${servingGrams}g`,
    per100: {
      calories: cal100 || 0,
      protein: protein100 || 0,
      carbs: carbs100 || 0,
      fat: fat100 || 0,
    },
  };
}

export function roundMacro(v: number, decimals = 1): number {
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}

/** Scale a per-100g product by a weight in grams. */
export function scaleByGrams(p: OffProduct, grams: number) {
  const factor = (Number(grams) || 0) / 100;
  return {
    calories: Math.round(p.per100.calories * factor),
    protein: roundMacro(p.per100.protein * factor, 1),
    carbs: roundMacro(p.per100.carbs * factor, 1),
    fat: roundMacro(p.per100.fat * factor, 1),
  };
}

/** Hit Open Food Facts. Filters to US-tagged products with parseable calories. */
export async function searchOpenFoodFacts(q: string): Promise<OffProduct[]> {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl` +
    `?search_terms=${encodeURIComponent(q)}` +
    `&tagtype_0=countries&tag_contains_0=contains&tag_0=united-states` +
    `&sort_by=unique_scans_n` +
    `&page_size=40&json=1&lc=en`;
  let data: any;
  try {
    const res = await fetch(url);
    data = await res.json();
  } catch {
    const fallback =
      `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(q)}` +
      `&countries_tags=en:united-states&page_size=40&lc=en`;
    const res2 = await fetch(fallback);
    data = await res2.json();
  }
  const products: OffProduct[] = (data?.products || [])
    .filter((p: any) => {
      if (!p.product_name || !p.nutriments) return false;
      const tags = Array.isArray(p.countries_tags) ? p.countries_tags : [];
      if (!tags.includes('en:united-states')) return false;
      if (/[À-ÿ]/.test(p.product_name)) return false;
      return true;
    })
    .map(formatOffProduct)
    .filter((p: OffProduct) => p.per100.calories > 0)
    .slice(0, 15);
  return products;
}
