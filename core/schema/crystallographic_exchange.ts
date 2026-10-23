/**
 * Core Crystallographic Exchange Contract
 * 
 * Defines the strict exchange schema, exact rational representation,
 * and multi-stage verification (Structural, Mathematical, and Provenance)
 * for crystallographic space group records entering FSS.
 */

export interface Rational {
  numerator: number;
  denominator: number;
}

export class ExactRational {
  readonly bigN: bigint;
  readonly bigD: bigint;
  readonly n: number;
  readonly d: number;

  constructor(numerator: number | bigint, denominator: number | bigint = 1n) {
    let num: bigint;
    let den: bigint;

    if (typeof numerator === 'number') {
      if (!Number.isSafeInteger(numerator)) {
        throw new Error(`Rational numerator must be a safe integer, got: ${numerator}`);
      }
      num = BigInt(numerator);
    } else if (typeof numerator === 'bigint') {
      num = numerator;
    } else {
      throw new Error(`Rational numerator must be a number or bigint`);
    }

    if (typeof denominator === 'number') {
      if (!Number.isSafeInteger(denominator)) {
        throw new Error(`Rational denominator must be a safe integer, got: ${denominator}`);
      }
      den = BigInt(denominator);
    } else if (typeof denominator === 'bigint') {
      den = denominator;
    } else {
      throw new Error(`Rational denominator must be a number or bigint`);
    }

    if (den <= 0n) {
      throw new Error(`Rational denominator must be a positive non-zero integer, got: ${denominator}`);
    }

    const g = ExactRational.bigGcd(ExactRational.bigAbs(num), den);
    this.bigN = num / g;
    this.bigD = den / g;

    // Verify safe integer bounds for JavaScript number representation
    if (
      this.bigN < BigInt(Number.MIN_SAFE_INTEGER) ||
      this.bigN > BigInt(Number.MAX_SAFE_INTEGER) ||
      this.bigD > BigInt(Number.MAX_SAFE_INTEGER)
    ) {
      throw new Error(`Canonical rational exceeds JavaScript safe integer range: ${this.bigN}/${this.bigD}`);
    }

    this.n = Number(this.bigN);
    this.d = Number(this.bigD);
  }

  static bigGcd(a: bigint, b: bigint): bigint {
    let x = a;
    let y = b;
    while (y !== 0n) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x;
  }

  static bigAbs(a: bigint): bigint {
    return a < 0n ? -a : a;
  }

  static gcd(a: number, b: number): number {
    return Number(ExactRational.bigGcd(BigInt(Math.abs(a)), BigInt(Math.abs(b))));
  }

  static fromRational(r: Rational): ExactRational {
    return new ExactRational(r.numerator, r.denominator);
  }

  add(other: ExactRational): ExactRational {
    const num = this.bigN * other.bigD + other.bigN * this.bigD;
    const den = this.bigD * other.bigD;
    return new ExactRational(num, den);
  }

  mul(other: ExactRational): ExactRational {
    const num = this.bigN * other.bigN;
    const den = this.bigD * other.bigD;
    return new ExactRational(num, den);
  }

  /**
   * Reduces fraction to canonical periodic interval [0, 1) mod 1.
   * Specific to crystallographic fractional translations modulo unit cell lattice vectors.
   */
  mod1(): ExactRational {
    let rem = this.bigN % this.bigD;
    if (rem < 0n) rem += this.bigD;
    return new ExactRational(rem, this.bigD);
  }

  equals(other: ExactRational): boolean {
    return this.bigN === other.bigN && this.bigD === other.bigD;
  }

  toRational(): Rational {
    return { numerator: this.n, denominator: this.d };
  }

  toString(): string {
    return `${this.n}/${this.d}`;
  }
}

export interface ExchangeSymmetryOperation {
  /** 3x3 integer rotation/inversion matrix */
  W: number[][];
  /** Exact rational 3D translation vector */
  w: [Rational, Rational, Rational] | Rational[];
  /** Optional symbolic Hermann-Mauguin / Jones-Faithful triplet (e.g. "-x, y+1/2, -z+1/2") */
  triplet?: string;
  /** Optional crystallographic operation order */
  order?: number;
}

export type CrystalSystem =
  | 'triclinic'
  | 'monoclinic'
  | 'orthorhombic'
  | 'tetragonal'
  | 'trigonal'
  | 'hexagonal'
  | 'cubic';

export type CenteringType = 'P' | 'A' | 'B' | 'C' | 'I' | 'F' | 'R';

export interface RecordProvenance {
  sourceName: string;
  sourceRepository?: string;
  sourceCommit?: string;
  tablePath?: string;
  license?: string;
  attribution?: string;
  isVerified: boolean;
}

export interface SpaceGroupRecord {
  spaceGroupNumber: number;
  settingId: string;
  hmSymbol: string;
  hallSymbol: string;
  crystalSystem?: CrystalSystem;
  centering?: CenteringType;
  originChoice?: number;
  cellChoice?: number;
  uniqueAxis?: 'a' | 'b' | 'c';
  operationsCount: number;
  operations: ExchangeSymmetryOperation[];
  provenance?: RecordProvenance;
}

export interface ExchangeManifest {
  schemaId: string;
  schemaVersion: string;
  sourceName: string;
  sourceRepository?: string;
  sourceCommit?: string;
  tablePath?: string;
  license?: string;
  attribution?: string;
  sourceVersion?: string;
  extractorVersion?: string;
  extractedAt?: string;
  recordCount: number;
  sha256Checksum?: string;
  isSourceVerified: boolean;
}

export interface CrystallographicExchangeArtifact {
  manifest: ExchangeManifest;
  records: SpaceGroupRecord[];
}

export interface StructuralValidationResult {
  valid: boolean;
  errors: string[];
}

export interface MathematicalValidationResult {
  valid: boolean;
  hasIdentity: boolean;
  hasInverses: boolean;
  isClosed: boolean;
  errors: string[];
}

export interface ProvenanceValidationResult {
  valid: boolean;
  isVerified: boolean;
  errors: string[];
  warnings: string[];
}

export interface RecordValidationReport {
  settingId: string;
  spaceGroupNumber: number;
  structural: StructuralValidationResult;
  mathematical: MathematicalValidationResult;
  provenance: ProvenanceValidationResult;
  overallValid: boolean;
}

/**
 * 1. Structural Validation
 * Validates syntax, ranges, dimensionality, and field consistency without group algebra.
 */
export function validateStructuralRecord(record: SpaceGroupRecord): StructuralValidationResult {
  const errors: string[] = [];

  if (typeof record.spaceGroupNumber !== 'number' || !Number.isSafeInteger(record.spaceGroupNumber)) {
    errors.push(`Invalid spaceGroupNumber: must be safe integer, got ${record.spaceGroupNumber}`);
  } else if (record.spaceGroupNumber < 1 || record.spaceGroupNumber > 230) {
    errors.push(`Space group number out of range [1, 230]: ${record.spaceGroupNumber}`);
  }

  if (!record.settingId || typeof record.settingId !== 'string' || record.settingId.trim() === '') {
    errors.push('Missing or empty settingId');
  }

  if (!record.hmSymbol || typeof record.hmSymbol !== 'string' || record.hmSymbol.trim() === '') {
    errors.push('Missing or empty hmSymbol');
  }

  if (!record.hallSymbol || typeof record.hallSymbol !== 'string' || record.hallSymbol.trim() === '') {
    errors.push('Missing or empty hallSymbol');
  }

  if (!Array.isArray(record.operations)) {
    errors.push('Field operations must be an array');
    return { valid: false, errors };
  }

  if (record.operations.length !== record.operationsCount) {
    errors.push(
      `Declared operationsCount (${record.operationsCount}) does not match actual operations length (${record.operations.length})`
    );
  }

  if (record.operations.length === 0) {
    errors.push('Record has 0 operations; cannot form a crystallographic space group');
  }

  const seenOps = new Set<string>();

  record.operations.forEach((op, idx) => {
    if (!op || typeof op !== 'object') {
      errors.push(`Operation at index ${idx} is not an object`);
      return;
    }

    // Check W (3x3 integer matrix)
    if (!Array.isArray(op.W) || op.W.length !== 3) {
      errors.push(`Operation at index ${idx}: W matrix must have 3 rows`);
    } else {
      for (let r = 0; r < 3; r++) {
        const row = op.W[r];
        if (!Array.isArray(row) || row.length !== 3) {
          errors.push(`Operation at index ${idx}: W row ${r} must have 3 columns`);
        } else {
          for (let c = 0; c < 3; c++) {
            if (!Number.isSafeInteger(row[c])) {
              errors.push(`Operation at index ${idx}: W[${r}][${c}] must be a safe integer, got ${row[c]}`);
            }
          }
        }
      }
    }

    // Check w (3 exact rational translation components)
    if (!Array.isArray(op.w) || op.w.length !== 3) {
      errors.push(`Operation at index ${idx}: translation vector w must have 3 rational components`);
    } else {
      for (let i = 0; i < 3; i++) {
        const t = op.w[i];
        if (!t || typeof t !== 'object') {
          errors.push(`Operation at index ${idx}: translation component ${i} is missing or not an object`);
        } else {
          if (!Number.isSafeInteger(t.numerator)) {
            errors.push(`Operation at index ${idx}: translation component ${i} numerator must be safe integer, got ${t.numerator}`);
          }
          if (!Number.isSafeInteger(t.denominator)) {
            errors.push(`Operation at index ${idx}: translation component ${i} denominator must be safe integer, got ${t.denominator}`);
          } else if (t.denominator <= 0) {
            errors.push(`Operation at index ${idx}: translation component ${i} denominator must be positive (> 0), got ${t.denominator}`);
          }
        }
      }
    }

    // Canonical key check for duplicates (W and w mod 1)
    if (Array.isArray(op.W) && op.W.length === 3 && Array.isArray(op.w) && op.w.length === 3) {
      try {
        const key = canonicalOperationKey(op);
        if (seenOps.has(key)) {
          errors.push(`Duplicate symmetry operation detected at index ${idx}: ${key}`);
        } else {
          seenOps.add(key);
        }
      } catch {
        // Errors in formatting caught by earlier validations
      }
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * 2. Mathematical Group Validation
 * Verifies algebraic group properties: identity, inverses, and closure under composition modulo 1.
 */
export function validateMathematicalGroup(record: SpaceGroupRecord): MathematicalValidationResult {
  const errors: string[] = [];
  let hasIdentity = false;
  let hasInverses = true;
  let isClosed = true;

  if (!Array.isArray(record.operations) || record.operations.length === 0) {
    return {
      valid: false,
      hasIdentity: false,
      hasInverses: false,
      isClosed: false,
      errors: ['No operations to evaluate mathematically']
    };
  }

  // Canonicalize operations: ExactRational modulo 1
  interface CanonOp {
    index: number;
    W: number[][];
    w: [ExactRational, ExactRational, ExactRational];
    key: string;
  }

  const canonOps: CanonOp[] = [];

  for (let i = 0; i < record.operations.length; i++) {
    const raw = record.operations[i];
    try {
      const W = raw.W.map(row => [...row]);
      const w: [ExactRational, ExactRational, ExactRational] = [
        new ExactRational(raw.w[0].numerator, raw.w[0].denominator).mod1(),
        new ExactRational(raw.w[1].numerator, raw.w[1].denominator).mod1(),
        new ExactRational(raw.w[2].numerator, raw.w[2].denominator).mod1()
      ];
      const key = `${JSON.stringify(W)}|${w.map(r => r.toString()).join(',')}`;
      canonOps.push({ index: i, W, w, key });
    } catch (e: any) {
      errors.push(`Mathematical validation aborted due to invalid operation at index ${i}: ${e.message}`);
      return {
        valid: false,
        hasIdentity: false,
        hasInverses: false,
        isClosed: false,
        errors
      };
    }
  }

  // A. Check Identity Presence (W = I_3, w = [0, 0, 0] mod 1)
  const isIdentity = (op: CanonOp): boolean => {
    const isIdMatrix =
      op.W[0][0] === 1 && op.W[0][1] === 0 && op.W[0][2] === 0 &&
      op.W[1][0] === 0 && op.W[1][1] === 1 && op.W[1][2] === 0 &&
      op.W[2][0] === 0 && op.W[2][1] === 0 && op.W[2][2] === 1;
    const isZeroTrans = op.w.every(r => r.n === 0);
    return isIdMatrix && isZeroTrans;
  };

  const idOp = canonOps.find(isIdentity);
  if (idOp) {
    hasIdentity = true;
  } else {
    hasIdentity = false;
    errors.push('Missing identity symmetry operation (W = I_3, w = 0 mod 1)');
  }

  // Helper for matrix multiplication
  const matMul = (W1: number[][], W2: number[][]): number[][] => {
    const res: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        res[i][j] = W1[i][0] * W2[0][j] + W1[i][1] * W2[1][j] + W1[i][2] * W2[2][j];
      }
    }
    return res;
  };

  // Helper for composition: (W1, w1) o (W2, w2) = (W1*W2, W1*w2 + w1 mod 1)
  const compose = (
    op1: CanonOp,
    op2: CanonOp
  ): { W: number[][]; w: [ExactRational, ExactRational, ExactRational]; key: string } => {
    const W = matMul(op1.W, op2.W);
    const w: [ExactRational, ExactRational, ExactRational] = [
      new ExactRational(0, 1),
      new ExactRational(0, 1),
      new ExactRational(0, 1)
    ];

    for (let i = 0; i < 3; i++) {
      let linTerm = new ExactRational(0, 1);
      for (let k = 0; k < 3; k++) {
        linTerm = linTerm.add(new ExactRational(op1.W[i][k], 1).mul(op2.w[k]));
      }
      w[i] = op1.w[i].add(linTerm).mod1();
    }

    const key = `${JSON.stringify(W)}|${w.map(r => r.toString()).join(',')}`;
    return { W, w, key };
  };

  // B. Check Inverses & Closure
  const opKeys = new Set(canonOps.map(op => op.key));

  if (opKeys.size !== canonOps.length) {
    errors.push(
      `Mathematical set contains duplicate operations: ${canonOps.length} operations declared, but only ${opKeys.size} distinct canonical operations found`
    );
  }

  for (let i = 0; i < canonOps.length; i++) {
    const op1 = canonOps[i];
    let foundInverse = false;

    for (let j = 0; j < canonOps.length; j++) {
      const op2 = canonOps[j];
      const compRight = compose(op1, op2); // op1 o op2
      const compLeft = compose(op2, op1);  // op2 o op1

      // Check if composition is in group (Closure)
      if (!opKeys.has(compRight.key)) {
        isClosed = false;
        errors.push(
          `Group closure violated: composition of op[${op1.index}] and op[${op2.index}] yields operation not present in set (${compRight.key})`
        );
      }

      // Check if op2 is two-sided inverse of op1: op1 o op2 == I AND op2 o op1 == I
      const isRightId =
        compRight.W[0][0] === 1 && compRight.W[0][1] === 0 && compRight.W[0][2] === 0 &&
        compRight.W[1][0] === 0 && compRight.W[1][1] === 1 && compRight.W[1][2] === 0 &&
        compRight.W[2][0] === 0 && compRight.W[2][1] === 0 && compRight.W[2][2] === 1 &&
        compRight.w.every(r => r.n === 0);

      const isLeftId =
        compLeft.W[0][0] === 1 && compLeft.W[0][1] === 0 && compLeft.W[0][2] === 0 &&
        compLeft.W[1][0] === 0 && compLeft.W[1][1] === 1 && compLeft.W[1][2] === 0 &&
        compLeft.W[2][0] === 0 && compLeft.W[2][1] === 0 && compLeft.W[2][2] === 1 &&
        compLeft.w.every(r => r.n === 0);

      if (isRightId && isLeftId) {
        foundInverse = true;
      }
    }

    if (!foundInverse) {
      hasInverses = false;
      errors.push(`Operation at index ${op1.index} lacks a two-sided inverse within the operation set`);
    }
  }

  const valid = hasIdentity && hasInverses && isClosed && errors.length === 0;

  return {
    valid,
    hasIdentity,
    hasInverses,
    isClosed,
    errors
  };
}

/**
 * 3. Provenance & Source Traceability Validation
 * Validates metadata integrity, origin commit attribution, and explicit verification flags.
 */
export function validateProvenance(
  record: SpaceGroupRecord,
  manifest?: ExchangeManifest
): ProvenanceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let isVerified = false;

  const prov = record.provenance;

  if (!prov) {
    warnings.push('Record has no explicit provenance block; source origin unverified');
  } else {
    if (!prov.sourceName || prov.sourceName.trim() === '') {
      errors.push('Provenance sourceName is empty');
    }
    if (prov.isVerified === true) {
      if (!prov.sourceCommit || prov.sourceCommit.length < 7) {
        errors.push('Record claims verified status but sourceCommit is missing or incomplete (< 7 chars)');
      } else {
        isVerified = true;
      }
    } else {
      warnings.push('Record provenance is explicitly marked as unverified');
    }
  }

  if (manifest) {
    if (manifest.isSourceVerified && (!manifest.sourceCommit || manifest.sourceCommit.length < 7)) {
      errors.push('Manifest claims verified source but sourceCommit is invalid or missing');
    }
    if (prov && manifest.sourceName && prov.sourceName !== manifest.sourceName) {
      warnings.push(`Record sourceName (${prov.sourceName}) does not match manifest sourceName (${manifest.sourceName})`);
    }
  }

  return {
    valid: errors.length === 0,
    isVerified,
    errors,
    warnings
  };
}

/**
 * Combined Multi-Stage Record Validator
 * Evaluates Structural, Mathematical, and Provenance layers independently.
 */
export function validateExchangeRecord(
  record: SpaceGroupRecord,
  manifest?: ExchangeManifest
): RecordValidationReport {
  const structural = validateStructuralRecord(record);
  const mathematical = structural.valid
    ? validateMathematicalGroup(record)
    : {
        valid: false,
        hasIdentity: false,
        hasInverses: false,
        isClosed: false,
        errors: ['Skipped mathematical validation due to structural errors']
      };
  const provenance = validateProvenance(record, manifest);

  const overallValid = structural.valid && mathematical.valid && provenance.valid;

  return {
    settingId: record.settingId,
    spaceGroupNumber: record.spaceGroupNumber,
    structural,
    mathematical,
    provenance,
    overallValid
  };
}

/**
 * Helper to build canonical key for symmetry operation (W and w mod 1).
 */
export function canonicalOperationKey(op: ExchangeSymmetryOperation): string {
  const WStr = JSON.stringify(op.W);
  const wStr = op.w
    .map(t => new ExactRational(t.numerator, t.denominator).mod1().toString())
    .join(',');
  return `${WStr}|${wStr}`;
}
