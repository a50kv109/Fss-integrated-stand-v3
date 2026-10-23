/**
 * STL V1 — exact matrix conjugacy verification.
 * g' = P^{-1} g P for user-supplied P.
 * Does NOT search for P. Does NOT prove that G is a group.
 */

import {
  ExactMatrix,
  MatrixDim,
  matrixSetEquals,
  matrixSetDiff
} from './exact_matrix';

export type ConjugacyStatus =
  | 'CONJUGACY_VERIFIED'
  | 'REFUTED'
  | 'INVALID_INPUT'
  | 'UNSUPPORTED_INPUT'
  | 'INCONCLUSIVE';

export interface ElementEvidence {
  index: number;
  gKey: string;
  gComputedKey: string;
  gComputedString: string;
  pairMatch?: boolean;
}

export interface ConjugacyRequest {
  /** Source matrices (list order preserved for evidence; set equality ignores order) */
  G: ExactMatrix[];
  /** User-supplied change-of-basis */
  P: ExactMatrix;
  /** Optional expected image set (mathematical set equality) */
  expected?: ExactMatrix[];
  /** Optional explicit pairs (g, gExpected) checked elementwise */
  pairs?: { g: ExactMatrix; gExpected: ExactMatrix }[];
  /** Soft limit on |G| (default 32) */
  maxSize?: number;
}

export interface ConjugacyResult {
  status: ConjugacyStatus;
  dimension?: MatrixDim;
  detP?: string;
  invPPresent: boolean;
  images: ExactMatrix[];
  evidence: ElementEvidence[];
  setMatch?: boolean;
  missing?: string[];
  extra?: string[];
  pairFailures?: number;
  reason: string;
  limits: string[];
}

const DEFAULT_MAX = 32;

function validateMaxSize(
  maxSize: number
): { ok: true } | { ok: false; status: ConjugacyStatus; reason: string } {
  if (typeof maxSize !== 'number' || !Number.isFinite(maxSize)) {
    return { ok: false, status: 'INVALID_INPUT', reason: 'maxSize must be a finite number' };
  }
  if (!Number.isInteger(maxSize) || maxSize < 1) {
    return { ok: false, status: 'INVALID_INPUT', reason: 'maxSize must be a positive integer' };
  }
  return { ok: true };
}

function validateMatrixList(
  G: ExactMatrix[],
  maxSize: number
): { ok: true; n: MatrixDim } | { ok: false; status: ConjugacyStatus; reason: string } {
  if (!Array.isArray(G)) {
    return { ok: false, status: 'INVALID_INPUT', reason: 'G must be an array' };
  }
  if (G.length === 0) {
    return { ok: false, status: 'INVALID_INPUT', reason: 'G must be non-empty' };
  }
  // Validate every entry BEFORE reading .n (avoids throw on malformed G[0])
  for (let i = 0; i < G.length; i++) {
    if (!(G[i] instanceof ExactMatrix)) {
      return { ok: false, status: 'INVALID_INPUT', reason: `G[${i}] is not ExactMatrix` };
    }
  }
  const n = G[0].n;
  if (n !== 2 && n !== 3) {
    return { ok: false, status: 'UNSUPPORTED_INPUT', reason: `unsupported dimension ${n}` };
  }
  for (let i = 1; i < G.length; i++) {
    if (G[i].n !== n) {
      return {
        ok: false,
        status: 'INVALID_INPUT',
        reason: `mixed dimensions: G[0].n=${n}, G[${i}].n=${G[i].n}`
      };
    }
  }
  if (G.length > maxSize) {
    return {
      ok: false,
      status: 'UNSUPPORTED_INPUT',
      reason: `G length ${G.length} exceeds maxSize ${maxSize}`
    };
  }
  return { ok: true, n };
}

/**
 * Compute g' = P^{-1} g P for each g and evaluate optional comparisons.
 */
export function verifyConjugacy(
  req: ConjugacyRequest | null | undefined
): ConjugacyResult {
  const limits: string[] = [
    'V1 supports n=2 and n=3 only',
    'User supplies P; no search for P',
    'CONJUGACY_VERIFIED does not prove that G is a group',
    'Float/epsilon not used for verdicts'
  ];

  if (req === null || req === undefined || typeof req !== 'object') {
    return {
      status: 'INVALID_INPUT',
      invPPresent: false,
      images: [],
      evidence: [],
      reason: 'request must be a non-null object',
      limits
    };
  }

  // Contract: undefined → default 32; explicit null / non-number / non-positive → INVALID_INPUT
  const rawMax = (req as { maxSize?: number | null }).maxSize;
  let maxSize: number;
  if (rawMax === undefined) {
    maxSize = DEFAULT_MAX;
  } else {
    const maxCheck = validateMaxSize(rawMax as number);
    if (maxCheck.ok === false) {
      return {
        status: maxCheck.status,
        invPPresent: false,
        images: [],
        evidence: [],
        reason: maxCheck.reason,
        limits
      };
    }
    maxSize = rawMax as number;
  }

  const v = validateMatrixList(req.G, maxSize);
  if (v.ok === false) {
    return {
      status: v.status,
      invPPresent: false,
      images: [],
      evidence: [],
      reason: v.reason,
      limits
    };
  }
  const n = v.n;

  if (!(req.P instanceof ExactMatrix)) {
    return {
      status: 'INVALID_INPUT',
      invPPresent: false,
      images: [],
      evidence: [],
      reason: 'P must be ExactMatrix',
      limits
    };
  }
  if (req.P.n !== n) {
    return {
      status: 'INVALID_INPUT',
      dimension: n,
      invPPresent: false,
      images: [],
      evidence: [],
      reason: `P.n=${req.P.n} does not match G dimension ${n}`,
      limits
    };
  }

  const detP = req.P.det();
  if (detP.isZero()) {
    return {
      status: 'INVALID_INPUT',
      dimension: n,
      detP: detP.toString(),
      invPPresent: false,
      images: [],
      evidence: [],
      reason: 'P is singular (det P = 0)',
      limits
    };
  }

  let invP: ExactMatrix;
  try {
    invP = req.P.inverse();
  } catch (e) {
    return {
      status: 'INVALID_INPUT',
      dimension: n,
      detP: detP.toString(),
      invPPresent: false,
      images: [],
      evidence: [],
      reason: `failed to invert P: ${e instanceof Error ? e.message : String(e)}`,
      limits
    };
  }

  const images: ExactMatrix[] = [];
  const evidence: ElementEvidence[] = [];

  for (let i = 0; i < req.G.length; i++) {
    const g = req.G[i];
    // g' = P^{-1} * g * P
    const gImage = invP.mul(g).mul(req.P);
    images.push(gImage);
    evidence.push({
      index: i,
      gKey: g.canonicalKey(),
      gComputedKey: gImage.canonicalKey(),
      gComputedString: gImage.toString()
    });
  }

  let setMatch: boolean | undefined;
  let missing: string[] | undefined;
  let extra: string[] | undefined;
  let pairFailures = 0;

  if (req.expected !== undefined) {
    if (!Array.isArray(req.expected)) {
      return {
        status: 'INVALID_INPUT',
        dimension: n,
        detP: detP.toString(),
        invPPresent: true,
        images,
        evidence,
        reason: 'expected must be an array when provided',
        limits
      };
    }
    for (const m of req.expected) {
      if (!(m instanceof ExactMatrix) || m.n !== n) {
        return {
          status: 'INVALID_INPUT',
          dimension: n,
          detP: detP.toString(),
          invPPresent: true,
          images,
          evidence,
          reason: 'expected matrices must be ExactMatrix of same dimension as G',
          limits
        };
      }
    }
    setMatch = matrixSetEquals(images, req.expected);
    const diff = matrixSetDiff(images, req.expected);
    missing = diff.missing;
    extra = diff.extra;
    if (!setMatch) {
      return {
        status: 'REFUTED',
        dimension: n,
        detP: detP.toString(),
        invPPresent: true,
        images,
        evidence,
        setMatch: false,
        missing,
        extra,
        reason: 'computed image set does not equal expected set',
        limits
      };
    }
  }

  if (req.pairs !== undefined) {
    if (!Array.isArray(req.pairs)) {
      return {
        status: 'INVALID_INPUT',
        dimension: n,
        detP: detP.toString(),
        invPPresent: true,
        images,
        evidence,
        reason: 'pairs must be an array when provided',
        limits
      };
    }
    for (let i = 0; i < req.pairs.length; i++) {
      const pair = req.pairs[i];
      if (!pair || typeof pair !== 'object') {
        return {
          status: 'INVALID_INPUT',
          dimension: n,
          detP: detP.toString(),
          invPPresent: true,
          images,
          evidence,
          reason: `pairs[${i}] must be an object`,
          limits
        };
      }
      const g = pair.g;
      const gExpected = pair.gExpected;
      if (!(g instanceof ExactMatrix) || !(gExpected instanceof ExactMatrix)) {
        return {
          status: 'INVALID_INPUT',
          dimension: n,
          detP: detP.toString(),
          invPPresent: true,
          images,
          evidence,
          reason: `pairs[${i}] requires ExactMatrix g and gExpected`,
          limits
        };
      }
      if (g.n !== n || gExpected.n !== n) {
        return {
          status: 'INVALID_INPUT',
          dimension: n,
          detP: detP.toString(),
          invPPresent: true,
          images,
          evidence,
          reason: `pairs[${i}] dimension mismatch`,
          limits
        };
      }
      const computed = invP.mul(g).mul(req.P);
      const ok = computed.equals(gExpected);
      if (!ok) pairFailures++;
      evidence.push({
        index: 1000 + i,
        gKey: g.canonicalKey(),
        gComputedKey: computed.canonicalKey(),
        gComputedString: computed.toString(),
        pairMatch: ok
      });
    }
    if (pairFailures > 0) {
      return {
        status: 'REFUTED',
        dimension: n,
        detP: detP.toString(),
        invPPresent: true,
        images,
        evidence,
        setMatch,
        missing,
        extra,
        pairFailures,
        reason: `${pairFailures} pair correspondence(s) failed`,
        limits
      };
    }
  }

  return {
    status: 'CONJUGACY_VERIFIED',
    dimension: n,
    detP: detP.toString(),
    invPPresent: true,
    images,
    evidence,
    setMatch,
    missing,
    extra,
    pairFailures: req.pairs ? pairFailures : undefined,
    reason:
      req.expected || req.pairs
        ? 'conjugacy and supplied comparison criteria satisfied'
        : 'conjugacy images computed for all elements (no expected set supplied)',
    limits
  };
}

function summarizeRequest(req: ConjugacyRequest | null | undefined): string {
  if (req === null || req === undefined || typeof req !== 'object') {
    return 'invalid-request';
  }
  const G = (req as ConjugacyRequest).G;
  const expected = (req as ConjugacyRequest).expected;
  if (!Array.isArray(G)) {
    return `G=${G === null || G === undefined ? String(G) : typeof G}`;
  }
  const n =
    G.length > 0 && G[0] instanceof ExactMatrix ? String(G[0].n) : '?';
  const exp =
    expected === undefined
      ? 'none'
      : Array.isArray(expected)
        ? String(expected.length)
        : 'invalid';
  return `n=${n}|G|=${G.length}|expected=${exp}`;
}

/** Session snapshot (in-memory only for V1) */
export interface Snapshot {
  id: string;
  requestSummary: string;
  result: ConjugacyResult;
  timestamp: string;
}

export class StlSession {
  private history: Snapshot[] = [];

  run(req: ConjugacyRequest | null | undefined, id?: string): Snapshot {
    const result = verifyConjugacy(req);
    const snap: Snapshot = {
      id: id ?? `snap_${this.history.length}`,
      requestSummary: summarizeRequest(req),
      result,
      timestamp: new Date().toISOString()
    };
    this.history.push(snap);
    return snap;
  }

  snapshots(): readonly Snapshot[] {
    return this.history;
  }
}
