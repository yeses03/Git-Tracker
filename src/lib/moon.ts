// Moon phase from the mean synodic month. Accurate to within about a day, which is
// plenty for a decorative widget. Pure function of the date — nothing is hardcoded.

const SYNODIC_DAYS = 29.530588853;
// A known new moon: 2000-01-06 18:14 UTC.
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);

export type MoonPhase = {
  /** 0–1 through the cycle: 0 = new, 0.5 = full. */
  fraction: number;
  /** 0–100 percent of the disc that is lit. */
  illumination: number;
  name: string;
  waxing: boolean;
};

export function moonPhase(now: Date = new Date()): MoonPhase {
  const days = (now.getTime() - REFERENCE_NEW_MOON_MS) / 86_400_000;
  const fraction = (((days / SYNODIC_DAYS) % 1) + 1) % 1;
  const illumination = Math.round(((1 - Math.cos(2 * Math.PI * fraction)) / 2) * 100);

  const names = [
    "New Moon",
    "Waxing Crescent",
    "First Quarter",
    "Waxing Gibbous",
    "Full Moon",
    "Waning Gibbous",
    "Last Quarter",
    "Waning Crescent",
  ];
  const name = names[Math.round(fraction * 8) % 8];
  return { fraction, illumination, name, waxing: fraction < 0.5 };
}
