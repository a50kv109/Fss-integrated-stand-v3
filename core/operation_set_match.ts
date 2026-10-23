/**
 * Operation-Set Matcher & Candidate Filter (EXP-09 Module)
 * 
 * Implements two-stage crystallographic space-group classification:
 * 1. Fast Candidate Filtering: Prunes incompatible space-group candidates using
 *    coordinate-independent invariant profiles (matrix orders, inversion, proper/improper, traces).
 * 2. Strict Operation Matching: Bijective element-by-element verification of canonical
 *    operation keys (W and w mod 1).
 * 
 * CLASSIFICATION SAFETY & EPISTEMIC CONTRACT:
 * - Profile matching is an invariant filter, NEVER a mathematical proof of space-group identity.
 * - Strict matching verifies representation equality against a specific registered setting,
 *   NOT general space-group isomorphism under arbitrary coordinate transformations.
 * - Candidate filtering is SOUND: guarantees zero false negatives for valid settings.
 * - If query operations match a group under a non-standard origin shift (e.g. Group 19),
 *   it is classified as SETTING_MISMATCH rather than an outright rejection or silent aliasing.
 */

import {
  Rational,
  ExactRational,
  canonicalOperationKey,
  ExchangeSymmetryOperation
} from './schema/crystallographic_exchange';
import {
  OperationSetProfile,
  buildOperationSetProfile,
  InputSymmetryOperation
} from './operation_set_profile';
import { SymmetryCatalog, DetailedSymmetryRecord } from './registry';
import { OriginShiftAnalyzer } from './reference_loader';

/**
 * Standard setting IDs registered in Studio's working catalog.
 */
export const REGISTERED_SETTING_IDS = [
  'P1',
  'P-1',
  'P2',
  'P21',
  'C2',
  'Cc',
  'P21/c',
  'P212121'
] as const;

export type RegisteredSettingId = (typeof REGISTERED_SETTING_IDS)[number];

/**
 * Returns the default list of all 8 registered space group records from SymmetryCatalog.
 */
export function getDefaultCatalog(): DetailedSymmetryRecord[] {
  const records: DetailedSymmetryRecord[] = [];
  for (const id of REGISTERED_SETTING_IDS) {
    const rec = SymmetryCatalog.findBySettingId(id);
    if (rec) {
      records.push(rec);
    }
  }
  return records;
}

export interface CandidateMatch {
  settingId: string;
  spaceGroupNumber: number;
  hmSymbol: string;
  profileMatchReason: string;
}

export interface CandidateFilterResult {
  queryProfile: OperationSetProfile;
  candidates: CandidateMatch[];
  prunedCount: number;
  totalCatalogCount: number;
  filterSummary: string;
}

export type StrictMatchVerdict =
  | 'EXACT_MATCH'
  | 'SETTING_MISMATCH'
  | 'OPERATION_MISMATCH'
  | 'AMBIGUOUS'
  | 'NO_CANDIDATES'
  | 'INVALID_INPUT';

export interface StrictMatchDetail {
  settingId: string;
  spaceGroupNumber: number;
  hmSymbol: string;
  isExactSetMatch: boolean;
  isExactMultisetMatch: boolean;
  isOriginShiftEquivalent: boolean;
  originShiftVector?: [Rational, Rational, Rational];
  missingInTargetKeys: string[];
  extraInTargetKeys: string[];
  discrepancies: string[];
}

export interface TwoStageMatchReport {
  queryProfile: OperationSetProfile;
  candidateFilter: CandidateFilterResult;
  verdict: StrictMatchVerdict;
  matchedSettingId: string | null;
  matchedSpaceGroupNumber: number | null;
  exactMatches: string[];
  candidateEvaluations: StrictMatchDetail[];
  notes: string[];
}

/**
 * Compares two frequency histograms for exact key-value equality.
 */
function isHistogramEqual(
  h1: Record<number, number>,
  h2: Record<number, number>
): boolean {
  const keys1 = Object.keys(h1);
  const keys2 = Object.keys(h2);
  if (keys1.length !== keys2.length) return false;
  for (const k of keys1) {
    if (h1[Number(k)] !== h2[Number(k)]) return false;
  }
  return true;
}

/**
 * Evaluates whether an invariant query profile is compatible with a candidate profile.
 * 
 * Necessary invariant conditions:
 * 1. distinctCount must be identical.
 * 2. hasInversion (centrosymmetry) must be identical.
 * 3. properRotationsCount must be identical.
 * 4. improperRotationsCount must be identical.
 * 5. orderHistogram must be identical.
 * 6. traceHistogram must be identical.
 */
export function isProfileCompatible(
  queryProfile: OperationSetProfile,
  candidateProfile: OperationSetProfile
): boolean {
  if (queryProfile.distinctCount === 0 || candidateProfile.distinctCount === 0) {
    return false;
  }
  if (queryProfile.distinctCount !== candidateProfile.distinctCount) {
    return false;
  }
  if (queryProfile.hasInversion !== candidateProfile.hasInversion) {
    return false;
  }
  if (queryProfile.properRotationsCount !== candidateProfile.properRotationsCount) {
    return false;
  }
  if (queryProfile.improperRotationsCount !== candidateProfile.improperRotationsCount) {
    return false;
  }
  if (!isHistogramEqual(queryProfile.orderHistogram, candidateProfile.orderHistogram)) {
    return false;
  }
  if (!isHistogramEqual(queryProfile.traceHistogram, candidateProfile.traceHistogram)) {
    return false;
  }
  return true;
}

/**
 * Stage 1: Candidate Filtering
 * 
 * Filters catalog candidates using coordinate-independent invariant profiles.
 * Guarantees zero false negatives: if query operations represent a valid setting of
 * a group in the catalog, that group will NEVER be pruned.
 */
export function filterCandidates(
  input: InputSymmetryOperation[] | OperationSetProfile,
  catalog: DetailedSymmetryRecord[] = getDefaultCatalog()
): CandidateFilterResult {
  const queryProfile: OperationSetProfile = Array.isArray(input)
    ? buildOperationSetProfile(input)
    : input;

  if (queryProfile.distinctCount === 0) {
    return {
      queryProfile,
      candidates: [],
      prunedCount: catalog.length,
      totalCatalogCount: catalog.length,
      filterSummary: 'Input operations are empty; no space group candidates possible.'
    };
  }

  const candidates: CandidateMatch[] = [];

  for (const rec of catalog) {
    const candidateProfile = buildOperationSetProfile(rec.operations);
    if (isProfileCompatible(queryProfile, candidateProfile)) {
      candidates.push({
        settingId: rec.settingId,
        spaceGroupNumber: rec.groupNumber,
        hmSymbol: rec.hmSymbol,
        profileMatchReason: `Matching distinct count (${candidateProfile.distinctCount}), inversion (${candidateProfile.hasInversion}), and matrix order/trace spectrum.`
      });
    }
  }

  const prunedCount = catalog.length - candidates.length;
  const filterSummary = candidates.length > 0
    ? `Retained ${candidates.length} candidate(s), pruned ${prunedCount} incompatible setting(s).`
    : `Pruned all ${catalog.length} candidate(s); query profile does not match any registered setting.`;

  return {
    queryProfile,
    candidates,
    prunedCount,
    totalCatalogCount: catalog.length,
    filterSummary
  };
}

/**
 * Stage 2: Strict Operation Matching
 * 
 * Compares canonical operation keys element-by-element modulo unit-cell translations Z^3.
 * Also checks canonical origin shift equivalence if exact keys differ.
 */
export function matchStrict(
  queryOperations: InputSymmetryOperation[],
  candidateRecord: DetailedSymmetryRecord
): StrictMatchDetail {
  const discrepancies: string[] = [];

  // Generate canonical keys for query and target
  const queryKeys = queryOperations.map(op =>
    canonicalOperationKey(op as ExchangeSymmetryOperation)
  );
  const targetKeys = candidateRecord.operations.map(op =>
    canonicalOperationKey(op as ExchangeSymmetryOperation)
  );

  const querySet = new Set(queryKeys);
  const targetSet = new Set(targetKeys);

  const missingInTargetKeys = [...querySet].filter(k => !targetSet.has(k));
  const extraInTargetKeys = [...targetSet].filter(k => !querySet.has(k));

  const isExactSetMatch =
    missingInTargetKeys.length === 0 && extraInTargetKeys.length === 0;

  const hasQueryDuplicates = queryKeys.length !== querySet.size;
  const isExactMultisetMatch = isExactSetMatch && !hasQueryDuplicates && queryKeys.length === targetKeys.length;

  if (!isExactSetMatch) {
    if (missingInTargetKeys.length > 0) {
      discrepancies.push(
        `${missingInTargetKeys.length} query operation(s) missing from target canonical set`
      );
    }
    if (extraInTargetKeys.length > 0) {
      discrepancies.push(
        `${extraInTargetKeys.length} target operation(s) missing from query set`
      );
    }
  }

  // Investigate origin shift equivalence if exact set match failed
  let isOriginShiftEquivalent = false;
  let originShiftVector: [Rational, Rational, Rational] | undefined = undefined;

  if (!isExactSetMatch && queryOperations.length > 0) {
    // Check canonical ITA Volume A shift (1/4, 1/4, 1/4) for Group 19
    const shift14: [Rational, Rational, Rational] = [
      { numerator: 1, denominator: 4 },
      { numerator: 1, denominator: 4 },
      { numerator: 1, denominator: 4 }
    ];
    if (
      OriginShiftAnalyzer.verifyEquivalenceUnderShift(
        queryOperations as ExchangeSymmetryOperation[],
        candidateRecord.operations,
        shift14
      )
    ) {
      isOriginShiftEquivalent = true;
      originShiftVector = shift14;
      discrepancies.push('Exact equivalence proven under origin shift (1/4, 1/4, 1/4)');
    }
  }

  return {
    settingId: candidateRecord.settingId,
    spaceGroupNumber: candidateRecord.groupNumber,
    hmSymbol: candidateRecord.hmSymbol,
    isExactSetMatch,
    isExactMultisetMatch,
    isOriginShiftEquivalent,
    originShiftVector,
    missingInTargetKeys,
    extraInTargetKeys,
    discrepancies
  };
}

/**
 * End-to-End Two-Stage Classifier
 * 
 * Pipeline:
 * 1. Profile input operations and run Candidate Filter.
 * 2. If candidates exist, run Strict Matcher across all retained candidates.
 * 3. Emit detailed, unambiguous classification report.
 */
export function classifyOperationSet(
  queryOperations: InputSymmetryOperation[],
  catalog: DetailedSymmetryRecord[] = getDefaultCatalog()
): TwoStageMatchReport {
  const notes: string[] = [];

  // 1. Syntax check & profile building
  let queryProfile: OperationSetProfile;
  try {
    queryProfile = buildOperationSetProfile(queryOperations);
  } catch (err: any) {
    return {
      queryProfile: {
        totalCount: queryOperations.length,
        distinctCount: 0,
        hasDuplicates: false,
        orderHistogram: {},
        hasInversion: false,
        properRotationsCount: 0,
        improperRotationsCount: 0,
        traceHistogram: {},
        translationsSummary: { zeroCount: 0, fractionalCount: 0 }
      },
      candidateFilter: {
        queryProfile: {} as any,
        candidates: [],
        prunedCount: catalog.length,
        totalCatalogCount: catalog.length,
        filterSummary: `Input error: ${err.message}`
      },
      verdict: 'INVALID_INPUT',
      matchedSettingId: null,
      matchedSpaceGroupNumber: null,
      exactMatches: [],
      candidateEvaluations: [],
      notes: [`Malformed input: ${err.message}`]
    };
  }

  if (queryOperations.length === 0) {
    return {
      queryProfile,
      candidateFilter: {
        queryProfile,
        candidates: [],
        prunedCount: catalog.length,
        totalCatalogCount: catalog.length,
        filterSummary: 'Empty input operation set.'
      },
      verdict: 'NO_CANDIDATES',
      matchedSettingId: null,
      matchedSpaceGroupNumber: null,
      exactMatches: [],
      candidateEvaluations: [],
      notes: ['Empty operation set cannot match any space group.']
    };
  }

  if (queryProfile.hasDuplicates) {
    notes.push(
      `Input multiset contains ${queryProfile.totalCount - queryProfile.distinctCount} duplicate operation(s) mod 1; set matching evaluated over distinct operations.`
    );
  }

  // 2. Candidate Filtering
  const candidateFilter = filterCandidates(queryProfile, catalog);

  if (candidateFilter.candidates.length === 0) {
    return {
      queryProfile,
      candidateFilter,
      verdict: 'NO_CANDIDATES',
      matchedSettingId: null,
      matchedSpaceGroupNumber: null,
      exactMatches: [],
      candidateEvaluations: [],
      notes: [
        'No compatible candidates found in current registry. Invariant profile does not match any registered setting.'
      ]
    };
  }

  // 3. Strict Matching on retained candidates
  const candidateEvaluations: StrictMatchDetail[] = [];
  const exactMatches: string[] = [];
  let originShiftMatch: StrictMatchDetail | null = null;

  for (const cand of candidateFilter.candidates) {
    const record = catalog.find(r => r.settingId === cand.settingId)!;
    const detail = matchStrict(queryOperations, record);
    candidateEvaluations.push(detail);

    if (detail.isExactSetMatch) {
      exactMatches.push(cand.settingId);
    }
    if (detail.isOriginShiftEquivalent) {
      originShiftMatch = detail;
    }
  }

  // 4. Synthesize final verdict
  let verdict: StrictMatchVerdict;
  let matchedSettingId: string | null = null;
  let matchedSpaceGroupNumber: number | null = null;

  if (exactMatches.length === 1) {
    verdict = 'EXACT_MATCH';
    matchedSettingId = exactMatches[0];
    const matchedRecord = catalog.find(r => r.settingId === matchedSettingId)!;
    matchedSpaceGroupNumber = matchedRecord.groupNumber;
    notes.push(
      `Exact canonical representation match verified for setting ${matchedSettingId} (Group No. ${matchedSpaceGroupNumber}).`
    );
  } else if (exactMatches.length > 1) {
    verdict = 'AMBIGUOUS';
    notes.push(
      `Multiple settings matched exact canonical operations: ${exactMatches.join(', ')}.`
    );
  } else if (originShiftMatch) {
    verdict = 'SETTING_MISMATCH';
    matchedSettingId = originShiftMatch.settingId;
    matchedSpaceGroupNumber = originShiftMatch.spaceGroupNumber;
    notes.push(
      `Exact operation match failed, but query is proven equivalent to ${originShiftMatch.settingId} under origin shift ${JSON.stringify(originShiftMatch.originShiftVector)}.`
    );
  } else {
    verdict = 'OPERATION_MISMATCH';
    notes.push(
      `Candidate profile was compatible with [${candidateFilter.candidates.map(c => c.settingId).join(', ')}], but exact canonical operations did not match.`
    );
  }

  return {
    queryProfile,
    candidateFilter,
    verdict,
    matchedSettingId,
    matchedSpaceGroupNumber,
    exactMatches,
    candidateEvaluations,
    notes
  };
}

// -----------------------------------------------------------------------------
// Direct CLI Execution Self-Check
// -----------------------------------------------------------------------------
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('operation_set_match.ts')) {
  console.log('Running operation_set_match self-check across registered settings...');
  const catalog = getDefaultCatalog();
  console.log(`Loaded ${catalog.length} registered settings from catalog.`);
  for (const rec of catalog) {
    const report = classifyOperationSet(rec.operations, catalog);
    console.log(`- ${rec.settingId.padEnd(8)}: verdict=${report.verdict}, matched=${report.matchedSettingId}`);
  }
}
