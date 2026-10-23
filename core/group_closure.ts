/**
 * Deterministic finite-group closure from affine crystallographic generators
 * modulo the integer lattice ℤ³.
 *
 * Reuses project primitives:
 * - ExactRational (+ mod1) for fractional translations
 * - AffineOperationAlgebra.applyMatrixToVector for W·w on ExactRational
 * - canonicalOperationKey
 *
 * Integer matrix algebra (det, multiply, inverse) is implemented locally with BigInt
 * so intermediate products never rely on JavaScript number precision. Results are
 * converted back to number only when each entry is a safe integer; otherwise INVALID_INPUT.
 *
 * Does NOT prove finiteness a priori: CLOSED only after BFS exhausts;
 * LIMIT_EXCEEDED is a resource bound, not a crystallographic theorem.
 */

import {
  ExactRational,
  Rational,
  ExchangeSymmetryOperation,
  canonicalOperationKey
} from './schema/crystallographic_exchange';
import { AffineOperationAlgebra } from './group_properties';

export type GroupClosureStatus = 'CLOSED' | 'LIMIT_EXCEEDED' | 'INVALID_INPUT';

export interface GroupClosureOptions {
  /** Maximum number of distinct operations (default 192). Resource bound only. */
  maxSize?: number;
  /**
   * If true (default), seed the worklist with two-sided inverses of generators
   * when the linear part is in GL(3,ℤ) with det ±1.
   */
  seedInverses?: boolean;
}

export interface GroupClosureResult {
  status: GroupClosureStatus;
  operations: ExchangeSymmetryOperation[];
  order: number;
  notes: string[];
  /** Canonical keys in deterministic insertion order */
  keys: string[];
}

const DEFAULT_MAX_SIZE = 192;

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
const MIN_SAFE = BigInt(Number.MIN_SAFE_INTEGER);

function bigDet3(W: number[][]): bigint {
  const a = BigInt(W[0][0]), b = BigInt(W[0][1]), c = BigInt(W[0][2]);
  const d = BigInt(W[1][0]), e = BigInt(W[1][1]), f = BigInt(W[1][2]);
  const g = BigInt(W[2][0]), h = BigInt(W[2][1]), i = BigInt(W[2][2]);
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

function bigMul3(A: number[][], B: number[][]): bigint[][] {
  const C: bigint[][] = [
    [0n, 0n, 0n],
    [0n, 0n, 0n],
    [0n, 0n, 0n]
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      C[i][j] =
        BigInt(A[i][0]) * BigInt(B[0][j]) +
        BigInt(A[i][1]) * BigInt(B[1][j]) +
        BigInt(A[i][2]) * BigInt(B[2][j]);
    }
  }
  return C;
}

/** Convert BigInt matrix to number[][] or throw if any entry leaves safe integer range. */
function bigMatrixToSafeNumbers(M: bigint[][], context: string): number[][] {
  const out: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const v = M[i][j];
      if (v < MIN_SAFE || v > MAX_SAFE) {
        throw new Error(
          `INTEGER_OVERFLOW: ${context} produced entry [${i}][${j}]=${v.toString()} outside Number safe integer range`
        );
      }
      out[i][j] = Number(v);
    }
  }
  return out;
}


function isSafeIntMatrix(W: unknown): W is number[][] {
  if (!Array.isArray(W) || W.length !== 3) return false;
  for (let i = 0; i < 3; i++) {
    const row = W[i];
    if (!Array.isArray(row) || row.length !== 3) return false;
    for (let j = 0; j < 3; j++) {
      if (typeof row[j] !== 'number' || !Number.isSafeInteger(row[j])) return false;
    }
  }
  return true;
}

function parseW(W: number[][]): number[][] {
  return W.map(row => row.map(x => x));
}

function toExactW(
  w: Rational[] | [Rational, Rational, Rational]
): [ExactRational, ExactRational, ExactRational] {
  if (!Array.isArray(w) || w.length !== 3) {
    throw new Error('Translation w must be a length-3 rational vector');
  }
  return [
    ExactRational.fromRational(w[0]),
    ExactRational.fromRational(w[1]),
    ExactRational.fromRational(w[2])
  ];
}

function mod1Vector(
  v: [ExactRational, ExactRational, ExactRational]
): [ExactRational, ExactRational, ExactRational] {
  return [v[0].mod1(), v[1].mod1(), v[2].mod1()];
}

function toOp(
  W: number[][],
  w: [ExactRational, ExactRational, ExactRational]
): ExchangeSymmetryOperation {
  const wm = mod1Vector(w);
  return {
    W: parseW(W),
    w: [
      wm[0].toRational(),
      wm[1].toRational(),
      wm[2].toRational()
    ]
  };
}

function identityOp(): ExchangeSymmetryOperation {
  return {
    W: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ],
    w: [
      { numerator: 0, denominator: 1 },
      { numerator: 0, denominator: 1 },
      { numerator: 0, denominator: 1 }
    ]
  };
}

/** Integer inverse of W when det = ±1; BigInt adjugate. Throws on overflow to number. */
function invertIntegerMatrix(W: number[][]): number[][] | null {
  const det = bigDet3(W);
  if (det !== 1n && det !== -1n) return null;
  const a = BigInt(W[0][0]), b = BigInt(W[0][1]), c = BigInt(W[0][2]);
  const d = BigInt(W[1][0]), e = BigInt(W[1][1]), f = BigInt(W[1][2]);
  const g = BigInt(W[2][0]), h = BigInt(W[2][1]), i = BigInt(W[2][2]);
  // adjugate entries (still exact BigInt)
  const adj: bigint[][] = [
    [e * i - f * h, c * h - b * i, b * f - c * e],
    [f * g - d * i, a * i - c * g, c * d - a * f],
    [d * h - e * g, b * g - a * h, a * e - b * d]
  ];
  // divide by det (±1)
  const invBig: bigint[][] = adj.map(row => row.map(x => x / det));
  return bigMatrixToSafeNumbers(invBig, 'W^{-1}');
}

/**
 * Affine inverse: (W, w)^{-1} = (W^{-1}, -W^{-1} w), then reduce w mod ℤ³.
 */
function invertAffine(op: ExchangeSymmetryOperation): ExchangeSymmetryOperation | null {
  const Win = invertIntegerMatrix(op.W);
  if (!Win) return null;
  const wEx = toExactW(op.w as Rational[]);
  const mapped = AffineOperationAlgebra.applyMatrixToVector(Win, wEx);
  const neg: [ExactRational, ExactRational, ExactRational] = [
    new ExactRational(-mapped[0].n, mapped[0].d),
    new ExactRational(-mapped[1].n, mapped[1].d),
    new ExactRational(-mapped[2].n, mapped[2].d)
  ];
  return toOp(Win, neg);
}

function composeCanon(
  op1: ExchangeSymmetryOperation,
  op2: ExchangeSymmetryOperation
): ExchangeSymmetryOperation {
  // W1*W2 via BigInt — refuse if product leaves safe integer range
  const Wbig = bigMul3(op1.W, op2.W);
  const W = bigMatrixToSafeNumbers(Wbig, 'W1*W2 in composition');
  const w1 = toExactW(op1.w as Rational[]);
  const w2 = toExactW(op2.w as Rational[]);
  // w = W1*w2 + w1 (ExactRational path already exact)
  const lin = AffineOperationAlgebra.applyMatrixToVector(op1.W, w2);
  const w: [ExactRational, ExactRational, ExactRational] = [
    lin[0].add(w1[0]),
    lin[1].add(w1[1]),
    lin[2].add(w1[2])
  ];
  return toOp(W, w);
}

function validateGenerator(op: unknown, index: number): ExchangeSymmetryOperation {
  if (!op || typeof op !== 'object') {
    throw new Error(`INVALID_INPUT: generator[${index}] is not an object`);
  }
  const o = op as ExchangeSymmetryOperation;
  if (!isSafeIntMatrix(o.W)) {
    throw new Error(`INVALID_INPUT: generator[${index}].W must be a 3×3 safe-integer matrix`);
  }
  if (!Array.isArray(o.w) || o.w.length !== 3) {
    throw new Error(`INVALID_INPUT: generator[${index}].w must be a length-3 rational vector`);
  }
  for (let i = 0; i < 3; i++) {
    const t = o.w[i];
    if (
      !t ||
      typeof t !== 'object' ||
      typeof (t as Rational).numerator !== 'number' ||
      typeof (t as Rational).denominator !== 'number' ||
      !Number.isSafeInteger((t as Rational).numerator) ||
      !Number.isSafeInteger((t as Rational).denominator) ||
      (t as Rational).denominator === 0
    ) {
      throw new Error(`INVALID_INPUT: generator[${index}].w[${i}] is not a valid Rational`);
    }
  }
  // Crystallographic GL(3,ℤ) contract: det(W) must be ±1 (exact BigInt det)
  const det = bigDet3(o.W);
  if (det !== 1n && det !== -1n) {
    throw new Error(
      `INVALID_INPUT: generator[${index}] has det(W)=${det.toString()}; crystallographic generators require det(W)=±1 (GL(3,ℤ))`
    );
  }

  // Canonical form
  return toOp(parseW(o.W), toExactW(o.w as Rational[]));
}

/**
 * Build the subgroup generated by `generators` under affine composition modulo ℤ³.
 *
 * Empty generators → trivial group {e} (CLOSED).
 * LIMIT_EXCEEDED returns status without presenting a partial set as CLOSED.
 */
export function closeGroupFromGenerators(
  generators: ExchangeSymmetryOperation[],
  options: GroupClosureOptions = {}
): GroupClosureResult {
  const notes: string[] = [];
  const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
  const seedInverses = options.seedInverses !== false;

  if (!Array.isArray(generators)) {
    return {
      status: 'INVALID_INPUT',
      operations: [],
      order: 0,
      notes: ['generators must be an array'],
      keys: []
    };
  }

  if (maxSize < 1 || !Number.isSafeInteger(maxSize)) {
    return {
      status: 'INVALID_INPUT',
      operations: [],
      order: 0,
      notes: ['maxSize must be a positive safe integer'],
      keys: []
    };
  }

  let validated: ExchangeSymmetryOperation[];
  try {
    validated = generators.map((g, i) => validateGenerator(g, i));
  } catch (e: any) {
    return {
      status: 'INVALID_INPUT',
      operations: [],
      order: 0,
      notes: [String(e?.message || e)],
      keys: []
    };
  }

  // Map key → operation, insertion order
  const map = new Map<string, ExchangeSymmetryOperation>();
  const queue: ExchangeSymmetryOperation[] = [];

  const tryAdd = (op: ExchangeSymmetryOperation): 'added' | 'exists' | 'limit' => {
    const k = canonicalOperationKey(op);
    if (map.has(k)) return 'exists';
    if (map.size + 1 > maxSize) return 'limit';
    map.set(k, op);
    queue.push(op);
    return 'added';
  };

  // Identity always
  tryAdd(identityOp());
  notes.push('Seeded identity (I, 0).');

  for (const g of validated) {
    const r = tryAdd(g);
    if (r === 'limit') {
      return {
        status: 'LIMIT_EXCEEDED',
        operations: [],
        order: 0,
        notes: [
          ...notes,
          `LIMIT_EXCEEDED while seeding generators (maxSize=${maxSize}). Partial set discarded.`
        ],
        keys: []
      };
    }
  }

  if (seedInverses) {
    for (const g of validated) {
      const inv = invertAffine(g);
      if (inv) {
        const r = tryAdd(inv);
        if (r === 'limit') {
          return {
            status: 'LIMIT_EXCEEDED',
            operations: [],
            order: 0,
            notes: [
              ...notes,
              `LIMIT_EXCEEDED while seeding inverses (maxSize=${maxSize}). Partial set discarded.`
            ],
            keys: []
          };
        }
      } else {
        notes.push(
          `Could not seed inverse for generator with det(W)∉{±1}; continuing with one-sided generation.`
        );
      }
    }
  }

  // Generator set used for multiplication (unique keys among seeds beyond identity)
  const genList = [...map.values()];

  let qi = 0;
  while (qi < queue.length) {
    const u = queue[qi++];
    for (const s of genList) {
      let products: ExchangeSymmetryOperation[];
      try {
        products = [composeCanon(s, u), composeCanon(u, s)];
      } catch (e: any) {
        return {
          status: 'INVALID_INPUT',
          operations: [],
          order: 0,
          notes: [
            ...notes,
            String(e?.message || e),
            'Aborted before CLOSED: integer matrix intermediate left Number safe range.'
          ],
          keys: []
        };
      }
      for (const v of products) {
        const r = tryAdd(v);
        if (r === 'limit') {
          return {
            status: 'LIMIT_EXCEEDED',
            operations: [],
            order: 0,
            notes: [
              ...notes,
              `LIMIT_EXCEEDED during BFS (maxSize=${maxSize}). Partial set discarded — not reported as CLOSED.`
            ],
            keys: []
          };
        }
      }
    }
  }

  const operations = [...map.values()];
  const keys = [...map.keys()];

  // Group axiom: every element has a two-sided inverse in the set (under project composition + keys).
  for (const g of operations) {
    let found = false;
    for (const h of operations) {
      const gh = composeCanon(g, h);
      const hg = composeCanon(h, g);
      if (
        canonicalOperationKey(gh) === canonicalOperationKey(identityOp()) &&
        canonicalOperationKey(hg) === canonicalOperationKey(identityOp())
      ) {
        found = true;
        break;
      }
    }
    if (!found) {
      return {
        status: 'INVALID_INPUT',
        operations: [],
        order: 0,
        notes: [
          ...notes,
          `Result set of size ${operations.length} is closed under generation but lacks a two-sided inverse for key ${canonicalOperationKey(g)}; refusing CLOSED (not a group under contract).`
        ],
        keys: []
      };
    }
  }

  notes.push(`CLOSED with order ${operations.length}. Resource maxSize=${maxSize}. Inverses verified.`);

  return {
    status: 'CLOSED',
    operations,
    order: operations.length,
    notes,
    keys
  };
}

/**
 * Pairwise closure check: every product of result elements is again in the result
 * (by canonical key). Returns false if any product is missing.
 */
export function isOperationSetClosed(ops: ExchangeSymmetryOperation[]): boolean {
  const keys = new Set(ops.map(o => canonicalOperationKey(toOp(parseW(o.W), toExactW(o.w as Rational[])))));
  for (const a of ops) {
    for (const b of ops) {
      const p = composeCanon(
        toOp(parseW(a.W), toExactW(a.w as Rational[])),
        toOp(parseW(b.W), toExactW(b.w as Rational[]))
      );
      if (!keys.has(canonicalOperationKey(p))) return false;
    }
  }
  return true;
}


/** True iff every op has a two-sided inverse in the set (canonical keys). */
export function resultHasAllInverses(ops: ExchangeSymmetryOperation[]): boolean {
  if (ops.length === 0) return false;
  const idKey = canonicalOperationKey(identityOp());
  const normalized = ops.map(o => toOp(parseW(o.W), toExactW(o.w as Rational[])));
  for (const g of normalized) {
    let found = false;
    for (const h of normalized) {
      if (
        canonicalOperationKey(composeCanon(g, h)) === idKey &&
        canonicalOperationKey(composeCanon(h, g)) === idKey
      ) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}
