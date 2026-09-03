import { Injectable } from '@nestjs/common';

export interface VinValidationResult {
  valid: boolean;
  reason?: string;
}

export interface VinDecodeResult {
  vin: string;
  manufacturer: string;
  country: string;
  modelYear: number | string;
  engine: string;
}

interface WmiEntry {
  manufacturer: string;
  country: string;
}

// ISO 3779 transliteration table: letters map to digits for the check-digit calculation.
// I, O, Q are excluded from valid VINs entirely (never appear as transliteration keys).
const TRANSLITERATION: Record<string, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  J: 1,
  K: 2,
  L: 3,
  M: 4,
  N: 5,
  P: 7,
  R: 9,
  S: 2,
  T: 3,
  U: 4,
  V: 5,
  W: 6,
  X: 7,
  Y: 8,
  Z: 9,
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
};

// Weight per VIN position (1-indexed), position 9 (the check digit itself) carries weight 0.
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

// Standard VIN model-year code table (position 10). The cycle repeats every 30 years;
// this table covers both the 1980-2009 cycle and the 2010-2039 cycle.
const MODEL_YEAR_CODES: Record<string, number[]> = {
  A: [1980, 2010],
  B: [1981, 2011],
  C: [1982, 2012],
  D: [1983, 2013],
  E: [1984, 2014],
  F: [1985, 2015],
  G: [1986, 2016],
  H: [1987, 2017],
  J: [1988, 2018],
  K: [1989, 2019],
  L: [1990, 2020],
  M: [1991, 2021],
  N: [1992, 2022],
  P: [1993, 2023],
  R: [1994, 2024],
  S: [1995, 2025],
  T: [1996, 2026],
  V: [1997, 2027],
  W: [1998, 2028],
  X: [1999, 2029],
  Y: [2000, 2030],
  1: [2001, 2031],
  2: [2002, 2032],
  3: [2003, 2033],
  4: [2004, 2034],
  5: [2005, 2035],
  6: [2006, 2036],
  7: [2007, 2037],
  8: [2008, 2038],
  9: [2009, 2039],
};

// Small in-memory WMI (World Manufacturer Identifier) lookup. Not exhaustive — a real
// implementation would query a maintained WMI registry.
const WMI_TABLE: Record<string, WmiEntry> = {
  '1HG': { manufacturer: 'Honda', country: 'USA' },
  '1HD': { manufacturer: 'Honda', country: 'USA' },
  JHM: { manufacturer: 'Honda', country: 'Japan' },
  WBA: { manufacturer: 'BMW', country: 'Germany' },
  '1FA': { manufacturer: 'Ford', country: 'USA' },
  '5YJ': { manufacturer: 'Tesla', country: 'USA' },
  KNA: { manufacturer: 'Kia', country: 'South Korea' },
  WVW: { manufacturer: 'Volkswagen', country: 'Germany' },
  JT: { manufacturer: 'Toyota', country: 'Japan' },
};

// Simplified deterministic mock of an engine/trim catalogue, not a real manufacturer
// database. A short fixed list of plausible engine descriptions, selected by summing
// the character codes of the VDS (positions 4-8).
const ENGINE_OPTIONS = ['2.0L I4', '3.0L V6', '1.6L I4 Turbo', 'Electric Motor'];

const VIN_LENGTH = 17;
const VALID_CHARS_REGEX = /^[A-HJ-NPR-Z0-9]+$/;

/**
 * Pure VIN validation and decoding service — no I/O, no external dependencies.
 */
@Injectable()
export class VinDecoderService {
  validate(vin: string): VinValidationResult {
    if (typeof vin !== 'string' || vin.length !== VIN_LENGTH) {
      return { valid: false, reason: `VIN must be exactly ${VIN_LENGTH} characters` };
    }

    const normalized = vin.toUpperCase();

    if (!VALID_CHARS_REGEX.test(normalized)) {
      return {
        valid: false,
        reason: 'VIN must contain only uppercase letters and digits, excluding I, O, Q',
      };
    }

    const expectedCheckDigit = this.computeCheckDigit(normalized);
    const actualCheckDigit = normalized[8];

    if (expectedCheckDigit !== actualCheckDigit) {
      return {
        valid: false,
        reason: `VIN check digit mismatch: expected '${expectedCheckDigit}', got '${actualCheckDigit}'`,
      };
    }

    return { valid: true };
  }

  decode(vin: string): VinDecodeResult {
    const normalized = vin.toUpperCase();

    const wmi = this.lookupWmi(normalized);
    const modelYear = this.decodeModelYear(normalized);
    const engine = this.decodeEngine(normalized);

    return {
      vin: normalized,
      manufacturer: wmi.manufacturer,
      country: wmi.country,
      modelYear,
      engine,
    };
  }

  private computeCheckDigit(normalizedVin: string): string {
    let sum = 0;

    for (let i = 0; i < normalizedVin.length; i++) {
      const value = TRANSLITERATION[normalizedVin[i]];
      sum += value * WEIGHTS[i];
    }

    const remainder = sum % 11;

    return remainder === 10 ? 'X' : String(remainder);
  }

  private lookupWmi(normalizedVin: string): WmiEntry {
    const threeChar = normalizedVin.slice(0, 3);
    const twoChar = normalizedVin.slice(0, 2);

    return (
      WMI_TABLE[threeChar] ?? WMI_TABLE[twoChar] ?? { manufacturer: 'Unknown', country: 'Unknown' }
    );
  }

  private decodeModelYear(normalizedVin: string): number | string {
    const code = normalizedVin[9];
    const years = MODEL_YEAR_CODES[code];

    if (!years) {
      return 'Unknown';
    }

    // Without the model-year-cycle-disambiguating position 7 digit/letter convention,
    // default to the more recent cycle (2010+).
    return years[1];
  }

  private decodeEngine(normalizedVin: string): string {
    const vds = normalizedVin.slice(3, 8);
    let sum = 0;

    for (let i = 0; i < vds.length; i++) {
      sum += vds.charCodeAt(i);
    }

    return ENGINE_OPTIONS[sum % ENGINE_OPTIONS.length];
  }
}
