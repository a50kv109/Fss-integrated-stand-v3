/**
 * Operation-Set Invariant Profiler (EXP-09 Module)
 * 
 * Computes coordinate-independent algebraic invariant profiles for sets of crystallographic
 * symmetry operations.
 * 
 * EPISTEMIC BOUNDARY & WARNING:
 * 1. This profile is an invariant structural descriptor, NOT a unique space-group identifier.
 * 2. Generating a profile does NOT prove mathematical group closure, existence of inverses,
 *    or completeness of the operation set.
 * 3. Profiles serve strictly as candidate filtering evidence in two-stage classification.
 */

import {
  Rational,
  ExactRational,
  canonicalOperationKey,
  ExchangeSymmetryOperation
} from './schema/crystallographic_exchange';
import { AffineOperationAlgebra } from './group_properties';

/**
 * Structural invariant profile characterizing an operation set.
 */
export interface OperationSetProfile {
  /** Total count of operations declared in the input multiset */
  totalCount: number;
  /** Count of distinct operations modulo unit-cell lattice translations Z^3 */
  distinctCount: number;
  /** True if input contains duplicated operations modulo lattice translations */
  hasDuplicates: boolean;
  /**
   * Frequency histogram of matrix orders for distinct operations.
   * Under 3D crystallographic restriction, permitted orders are {1, 2, 3, 4, 6}.
   * Order 0 indicates non-periodic or non-crystallographic matrices.
   */
  orderHistogram: Record<number, number>;
  /** True if central spatial inversion W = -I_3 is present among operations */
  hasInversion: boolean;
  /** Count of distinct proper rotation operations (det(W) = +1) */
  properRotationsCount: number;
  /** Count of distinct improper operations / reflections / roto-inversions (det(W) = -1) */
  improperRotationsCount: number;
  /** Multiset histogram of matrix trace values tr(W) */
  traceHistogram: Record<number, number>;
  /** Breakdown of translation components modulo 1 */
  translationsSummary: {
    /** Number of distinct operations with strictly zero fractional translation w = [0, 0, 0] mod 1 */
    zeroCount: number;
    /** Number of distinct operations with non-zero fractional translation (screws, glides, centering) */
    fractionalCount: number;
  };
}

export type InputSymmetryOperation = {
  W: number[][];
  w: Rational[];
  triplet?: string;
  order?: number;
};

/**
 * Validates structural syntax of a symmetry operation before profiling.
 */
function validateOperationSyntax(op: InputSymmetryOperation, idx: number): void {
  if (!op || typeof op !== 'object') {
    throw new Error(`Malformed operation at index ${idx}: expected object`);
  }
  if (!Array.isArray(op.W) || op.W.length !== 3) {
    throw new Error(`Malformed matrix W at index ${idx}: must have 3 rows`);
  }
  for (let r = 0; r < 3; r++) {
    const row = op.W[r];
    if (!Array.isArray(row) || row.length !== 3) {
      throw new Error(`Malformed matrix W row ${r} at index ${idx}: must have 3 columns`);
    }
    for (let c = 0; c < 3; c++) {
      if (!Number.isSafeInteger(row[c])) {
        throw new Error(`Malformed matrix entry W[${r}][${c}] at index ${idx}: must be a safe integer`);
      }
    }
  }
  if (!Array.isArray(op.w) || op.w.length !== 3) {
    throw new Error(`Malformed translation vector w at index ${idx}: must have 3 components`);
  }
  for (let i = 0; i < 3; i++) {
    const t = op.w[i];
    if (!t || typeof t !== 'object') {
      throw new Error(`Malformed translation component w[${i}] at index ${idx}: missing rational object`);
    }
    if (!Number.isSafeInteger(t.numerator)) {
      throw new Error(`Malformed translation numerator at index ${idx}, component ${i}: must be safe integer`);
    }
    if (!Number.isSafeInteger(t.denominator) || t.denominator <= 0) {
      throw new Error(`Malformed translation denominator at index ${idx}, component ${i}: must be positive integer`);
    }
  }
}

/**
 * Builds an invariant profile for an input multiset of symmetry operations.
 * 
 * Rules:
 * - Empty input yields an empty profile with totalCount = 0, distinctCount = 0.
 * - Malformed operations throw explicit syntax errors.
 * - Operations differing only by integer lattice vectors (u, v, w) in Z^3 are canonicalized to identical keys.
 * - Invariant metrics (orders, det, trace, inversion) are computed strictly across the DISTINCT set of operations.
 */
export function buildOperationSetProfile(operations: InputSymmetryOperation[]): OperationSetProfile {
  if (!Array.isArray(operations)) {
    throw new Error('Operations argument must be an array');
  }

  // 1. Handle empty input
  if (operations.length === 0) {
    return {
      totalCount: 0,
      distinctCount: 0,
      hasDuplicates: false,
      orderHistogram: {},
      hasInversion: false,
      properRotationsCount: 0,
      improperRotationsCount: 0,
      traceHistogram: {},
      translationsSummary: {
        zeroCount: 0,
        fractionalCount: 0
      }
    };
  }

  // 2. Validate and deduplicate operations modulo 1
  const seenKeys = new Set<string>();
  const distinctOperations: InputSymmetryOperation[] = [];

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    validateOperationSyntax(op, i);

    const key = canonicalOperationKey(op as ExchangeSymmetryOperation);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      distinctOperations.push(op);
    }
  }

  const totalCount = operations.length;
  const distinctCount = distinctOperations.length;
  const hasDuplicates = totalCount !== distinctCount;

  // 3. Evaluate algebraic invariants over distinct operations
  const orderHistogram: Record<number, number> = {};
  const traceHistogram: Record<number, number> = {};
  let properRotationsCount = 0;
  let improperRotationsCount = 0;
  let hasInversion = false;
  let zeroTranslationCount = 0;
  let fractionalTranslationCount = 0;

  for (const op of distinctOperations) {
    // A. Matrix Order
    const order = AffineOperationAlgebra.computeMatrixOrder(op.W) || 0;
    orderHistogram[order] = (orderHistogram[order] || 0) + 1;

    // B. Determinant (Proper vs Improper)
    const det = AffineOperationAlgebra.determinant3x3(op.W);
    if (det === 1) {
      properRotationsCount++;
    } else {
      improperRotationsCount++;
    }

    // C. Trace
    const trace = AffineOperationAlgebra.trace3x3(op.W);
    traceHistogram[trace] = (traceHistogram[trace] || 0) + 1;

    // D. Central Inversion (W = -I_3)
    if (AffineOperationAlgebra.isInversion(op.W)) {
      hasInversion = true;
    }

    // E. Translation Zero vs Fractional modulo 1
    const isZeroTranslation = op.w.every(comp => {
      const exact = new ExactRational(comp.numerator, comp.denominator).mod1();
      return exact.n === 0;
    });

    if (isZeroTranslation) {
      zeroTranslationCount++;
    } else {
      fractionalTranslationCount++;
    }
  }

  // Ensure deterministic, sorted keys for histograms
  const sortedOrderHistogram: Record<number, number> = {};
  Object.keys(orderHistogram)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach(k => {
      sortedOrderHistogram[k] = orderHistogram[k];
    });

  const sortedTraceHistogram: Record<number, number> = {};
  Object.keys(traceHistogram)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach(k => {
      sortedTraceHistogram[k] = traceHistogram[k];
    });

  return {
    totalCount,
    distinctCount,
    hasDuplicates,
    orderHistogram: sortedOrderHistogram,
    hasInversion,
    properRotationsCount,
    improperRotationsCount,
    traceHistogram: sortedTraceHistogram,
    translationsSummary: {
      zeroCount: zeroTranslationCount,
      fractionalCount: fractionalTranslationCount
    }
  };
}
