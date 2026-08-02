export type Locale = "id" | "en";

export const TRANSLATIONS = {
  "nav.title": { id: "TransitFlow Nasional", en: "TransitFlow National" },
  "leaderboard.title": { id: "Papan Peringkat Choke Nasional", en: "National Choke Leaderboard" },
  "leaderboard.rank": { id: "Peringkat", en: "Rank" },
  "leaderboard.hub": { id: "Hub", en: "Hub" },
  "leaderboard.mean": { id: "Rata-rata VCI 7 hari", en: "7-day mean VCI" },
  "leaderboard.trend": { id: "Tren", en: "Trend" },
  "leaderboard.surge": { id: "Lonjakan", en: "Surges" },
  "leaderboard.export": { id: "Ekspor CSV (Kemenhub)", en: "Export CSV (Kemenhub)" },
  "city.paratransit": { id: "Moda paratransit", en: "Paratransit mode" },
  "city.role": { id: "Peran regional", en: "Regional role" },
  "city.role.jabodetabek": { id: "DISHUB JABODETABEK", en: "DISHUB JABODETABEK" },
  "city.role.sumut": { id: "DISHUB SUMUT", en: "DISHUB SUMUT" },
  "city.empty": { id: "Tidak ada data untuk kota ini", en: "No data for this city" },
  "hub.drill": { id: "Buka di dasbor", en: "Open in dashboard" },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS;

export function translate(key: TranslationKey, locale: Locale): string {
  const entry = TRANSLATIONS[key];
  if (!entry) return key;
  return entry[locale] ?? entry.id;
}

export function missingKeys(locale: Locale): TranslationKey[] {
  return (Object.keys(TRANSLATIONS) as TranslationKey[]).filter(
    (k) => TRANSLATIONS[k][locale] == null,
  );
}
