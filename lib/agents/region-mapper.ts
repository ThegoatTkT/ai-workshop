/**
 * Maps countries to regional tone rule keys
 * Used to select appropriate communication tone guidelines based on company location
 */

export type Region = "uk" | "usa" | "mena" | "eu" | "dach";

const COUNTRY_TO_REGION: Record<string, Region> = {
  // UK
  UK: "uk",

  // USA
  USA: "usa",

  // MENA (Middle East and North Africa)
  UAE: "mena",
  "Saudi Arabia": "mena",
  Qatar: "mena",

  // DACH (Germany, Austria, Switzerland)
  Germany: "dach",
  Austria: "dach",
  Switzerland: "dach",

  // EU (European Union - remaining European countries)
  Belgium: "eu",
  Cyprus: "eu",
  Denmark: "eu",
  Estonia: "eu",
  Finland: "eu",
  France: "eu",
  Hungary: "eu",
  Ireland: "eu",
  Italy: "eu",
  Latvia: "eu",
  Lithuania: "eu",
  Luxembourg: "eu",
  Malta: "eu",
  Netherlands: "eu",
  Poland: "eu",
  Serbia: "eu",
  Sweden: "eu",

  // Other countries - map to closest regional style
  Australia: "uk", // Commonwealth, similar business culture
  Canada: "usa", // North American business culture
  Georgia: "eu", // Eastern European
  Kazakhstan: "eu", // Post-Soviet, European business influence
  Singapore: "usa", // International business hub, direct style
  "South Africa": "uk", // Commonwealth heritage
  "South Korea": "usa", // Direct business style
};

/**
 * Get the regional tone setting key for a given country
 * @param country - The country name (from COUNTRIES array in processor.ts)
 * @returns The settings key for regional tone (e.g., 'regional_tone_usa')
 */
export function getRegionalToneKey(country: string): string {
  const region = COUNTRY_TO_REGION[country];
  if (region) {
    return `regional_tone_${region}`;
  }
  // Default to USA style for unknown countries
  return "regional_tone_usa";
}

/**
 * Get the region code for a given country
 * @param country - The country name
 * @returns The region code (uk, usa, mena, eu, dach)
 */
export function getRegion(country: string): Region {
  return COUNTRY_TO_REGION[country] || "usa";
}

/**
 * Get the region display name for a given country
 * @param country - The country name
 * @returns Human-readable region name
 */
export function getRegionDisplayName(country: string): string {
  const region = COUNTRY_TO_REGION[country];
  const displayNames: Record<Region, string> = {
    uk: "UK",
    usa: "USA",
    mena: "MENA",
    eu: "EU",
    dach: "DACH",
  };
  return displayNames[region] || "USA";
}
