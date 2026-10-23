/**
 * Core Crystallographic Group Properties Analyzer (KB-14)
 * 
 * Computes derived mathematical properties from exact crystallographic operations:
 * - Linear parts analysis (order, determinant, trace, classification)
 * - Inversion and centrosymmetry analysis with exact inversion center coordinates
 * - Operation powers and unreduced translational components: (W, w)^k
 * - Intrinsic translation vectors tau = (1/k) * sum_{j=0}^{k-1} W^j w
 * - Traceable verification statuses and explicit limitations
 */

import {
  Rational,
  ExactRational,
  ExchangeSymmetryOperation,
  SpaceGroupRecord
} from './schema/crystallographic_exchange';

export type VerificationStatus = 'VERIFIED' | 'INCOMPLETE' | 'NOT_APPLICABLE';

export interface PropertyStatus<T> {
  status: VerificationStatus;
  value: T;
  basisOrMethod: string;
  limitations: string[];
}

export type LinearTransformationType =
  | 'IDENTITY'
  | 'INVERSION'
  | 'PROPER_ROTATION'
  | 'REFLECTION'
  | 'INVERSION_ROTATION';

export interface LinearPartAnalysis {
  matrix: number[][];
  matrixKey: string;
  order: number;
  determinant: number;
  trace: number;
  classification: LinearTransformationType;
  crystallographicallyPermitted: boolean;
}

export interface InversionAnalysis {
  hasInversion: boolean;
  inversionOpIndex: number | null;
  inversionCenter: [Rational, Rational, Rational] | null;
  inversionCenterDescription: string | null;
}

export interface SinglePowerStep {
  power: number;
  W: number[][];
  unreducedTranslation: [Rational, Rational, Rational];
  mod1Translation: [Rational, Rational, Rational];
}

export interface OperationPowerAnalysis {
  operationIndex: number;
  initialOperation: {
    W: number[][];
    w: [Rational, Rational, Rational];
    triplet?: string;
  };
  linearOrder: number;
  powers: SinglePowerStep[];
  unreducedTranslationAtOrder: [Rational, Rational, Rational];
  mod1TranslationAtOrder: [Rational, Rational, Rational];
  intrinsicTranslation: [Rational, Rational, Rational];
  isUnreducedTranslationLatticeVector: boolean;
  isMod1TranslationZero: boolean;
  hasNonZeroIntrinsicTranslation: boolean;
  limitations: string[];
}

export interface SpaceGroupPropertyReport {
  spaceGroupNumber: number;
  settingId: string;
  operationsCount: number;
  uniqueLinearPartsCount: number;
  linearParts: PropertyStatus<LinearPartAnalysis[]>;
  centrosymmetry: PropertyStatus<InversionAnalysis>;
  operationPowers: PropertyStatus<OperationPowerAnalysis[]>;
  overallLimitations: string[];
}

// -----------------------------------------------------------------------------
// Exact Affine & Matrix Algebra Utilities
// -----------------------------------------------------------------------------

export class AffineOperationAlgebra {
  /**
   * Multiplies two 3x3 integer matrices.
   */
  static multiply3x3(A: number[][], B: number[][]): number[][] {
    const C: number[][] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        C[i][j] = A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j];
      }
    }
    return C;
  }

  /**
   * Determinant of 3x3 integer matrix.
   */
  static determinant3x3(M: number[][]): number {
    return (
      M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
      M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
      M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
    );
  }

  /**
   * Trace of 3x3 matrix.
   */
  static trace3x3(M: number[][]): number {
    return M[0][0] + M[1][1] + M[2][2];
  }

  /**
   * Checks if 3x3 matrix is Identity matrix.
   */
  static isIdentity(M: number[][]): boolean {
    return (
      M[0][0] === 1 && M[0][1] === 0 && M[0][2] === 0 &&
      M[1][0] === 0 && M[1][1] === 1 && M[1][2] === 0 &&
      M[2][0] === 0 && M[2][1] === 0 && M[2][2] === 1
    );
  }

  /**
   * Checks if 3x3 matrix is Inversion (-I_3).
   */
  static isInversion(M: number[][]): boolean {
    return (
      M[0][0] === -1 && M[0][1] === 0 && M[0][2] === 0 &&
      M[1][0] === 0 && M[1][1] === -1 && M[1][2] === 0 &&
      M[2][0] === 0 && M[2][1] === 0 && M[2][2] === -1
    );
  }

  /**
   * Determines the algebraic order of an integer matrix W.
   * Under crystallographic restriction in 3D, orders of periodic operations in Z^3 can only be 1, 2, 3, 4, 6.
   * Returns order k if W^k = I, or null if order > 12 (unbounded / non-crystallographic).
   */
  static computeMatrixOrder(W: number[][], maxOrder: number = 12): number | null {
    if (this.isIdentity(W)) return 1;

    let current = W.map(row => [...row]);
    for (let k = 2; k <= maxOrder; k++) {
      current = this.multiply3x3(current, W);
      if (this.isIdentity(current)) {
        return k;
      }
    }
    return null;
  }

  /**
   * Applies 3x3 integer matrix W to 3D ExactRational vector v.
   */
  static applyMatrixToVector(
    W: number[][],
    v: [ExactRational, ExactRational, ExactRational]
  ): [ExactRational, ExactRational, ExactRational] {
    const res: [ExactRational, ExactRational, ExactRational] = [
      new ExactRational(0, 1),
      new ExactRational(0, 1),
      new ExactRational(0, 1)
    ];

    for (let i = 0; i < 3; i++) {
      let term = new ExactRational(0, 1);
      for (let j = 0; j < 3; j++) {
        term = term.add(new ExactRational(W[i][j], 1).mul(v[j]));
      }
      res[i] = term;
    }

    return res;
  }

  /**
   * Adds two 3D ExactRational vectors.
   */
  static addVectors(
    v1: [ExactRational, ExactRational, ExactRational],
    v2: [ExactRational, ExactRational, ExactRational]
  ): [ExactRational, ExactRational, ExactRational] {
    return [v1[0].add(v2[0]), v1[1].add(v2[1]), v1[2].add(v2[2])];
  }

  /**
   * Computes affine composition of two operations WITHOUT modulo reduction:
   * (W1, w1) o (W2, w2) = (W1 * W2, W1 * w2 + w1).
   */
  static composeAffineExact(
    op1: { W: number[][]; w: [ExactRational, ExactRational, ExactRational] },
    op2: { W: number[][]; w: [ExactRational, ExactRational, ExactRational] }
  ): { W: number[][]; w: [ExactRational, ExactRational, ExactRational] } {
    const W = this.multiply3x3(op1.W, op2.W);
    const linTerm = this.applyMatrixToVector(op1.W, op2.w);
    const w = this.addVectors(linTerm, op1.w);
    return { W, w };
  }

  /**
   * Scales ExactRational vector by rational scalar 1 / k.
   */
  static scaleVector(
    v: [ExactRational, ExactRational, ExactRational],
    numerator: number,
    denominator: number
  ): [ExactRational, ExactRational, ExactRational] {
    const factor = new ExactRational(numerator, denominator);
    return [v[0].mul(factor), v[1].mul(factor), v[2].mul(factor)];
  }

  /**
   * Converts ExactRational 3-vector to standard Rational representation.
   */
  static toRationalVector(
    v: [ExactRational, ExactRational, ExactRational]
  ): [Rational, Rational, Rational] {
    return [v[0].toRational(), v[1].toRational(), v[2].toRational()];
  }

  /**
   * Checks if all vector components are exact integers (i.e. denominator === 1).
   */
  static isLatticeVector(v: [ExactRational, ExactRational, ExactRational]): boolean {
    return v[0].d === 1 && v[1].d === 1 && v[2].d === 1;
  }

  /**
   * Checks if vector is zero vector (0, 0, 0).
   */
  static isZeroVector(v: [ExactRational, ExactRational, ExactRational]): boolean {
    return v[0].n === 0 && v[1].n === 0 && v[2].n === 0;
  }
}

// -----------------------------------------------------------------------------
// Group Properties Analyzer
// -----------------------------------------------------------------------------

export class CrystallographicGroupProperties {
  /**
   * Classifies a 3x3 integer matrix into geometric transformation type based on det and trace.
   */
  static classifyLinearPart(W: number[][]): {
    classification: LinearTransformationType;
    order: number;
    det: number;
    trace: number;
    crystallographicallyPermitted: boolean;
  } {
    const det = AffineOperationAlgebra.determinant3x3(W);
    const trace = AffineOperationAlgebra.trace3x3(W);
    const order = AffineOperationAlgebra.computeMatrixOrder(W);

    if (order === null) {
      throw new Error(`Matrix order exceeds crystallographic restriction bound: ${JSON.stringify(W)}`);
    }

    const permittedOrders = [1, 2, 3, 4, 6];
    const crystallographicallyPermitted = permittedOrders.includes(order) && Math.abs(det) === 1;

    let classification: LinearTransformationType;
    if (AffineOperationAlgebra.isIdentity(W)) {
      classification = 'IDENTITY';
    } else if (AffineOperationAlgebra.isInversion(W)) {
      classification = 'INVERSION';
    } else if (det === 1) {
      classification = 'PROPER_ROTATION';
    } else if (det === -1 && trace === 1) {
      // Reflection has eigenvalues -1, 1, 1 -> det = -1, trace = 1, order = 2
      classification = 'REFLECTION';
    } else {
      classification = 'INVERSION_ROTATION';
    }

    return {
      classification,
      order,
      det,
      trace,
      crystallographicallyPermitted
    };
  }

  /**
   * A. Analyzes the linear parts of a space group record.
   */
  static analyzeLinearParts(record: SpaceGroupRecord): PropertyStatus<LinearPartAnalysis[]> {
    const limitations: string[] = [
      'Classification describes the linear action W in the current crystal basis, not full 3D affine space motion.',
      'Metric tensor of the lattice basis is not provided; orthogonality of rotation axes is assumed relative to standard ITA setting.'
    ];

    if (!record.operations || record.operations.length === 0) {
      return {
        status: 'INCOMPLETE',
        value: [],
        basisOrMethod: 'Linear parts extraction from operation matrices W',
        limitations: ['Record contains no operations']
      };
    }

    const seenMatrices = new Map<string, LinearPartAnalysis>();

    for (const op of record.operations) {
      const key = JSON.stringify(op.W);
      if (!seenMatrices.has(key)) {
        const info = this.classifyLinearPart(op.W);
        seenMatrices.set(key, {
          matrix: op.W.map(row => [...row]),
          matrixKey: key,
          order: info.order,
          determinant: info.det,
          trace: info.trace,
          classification: info.classification,
          crystallographicallyPermitted: info.crystallographicallyPermitted
        });
      }
    }

    const analyses = Array.from(seenMatrices.values());
    const allPermitted = analyses.every(a => a.crystallographicallyPermitted);

    return {
      status: allPermitted ? 'VERIFIED' : 'INCOMPLETE',
      value: analyses,
      basisOrMethod: 'Exact integer determinant, trace, and power cycle verification (order in {1,2,3,4,6})',
      limitations
    };
  }

  /**
   * B. Analyzes inversion operation and centrosymmetry.
   */
  static analyzeCentrosymmetry(record: SpaceGroupRecord): PropertyStatus<InversionAnalysis> {
    const limitations: string[] = [
      'Centrosymmetry verdict is established strictly within the explicit representation and verified operation set.',
      'Inversion center coordinates x_0 = (1/2)*w mod 1 apply to the coordinate system of the current setting.',
      'Does not extrapolate to other possible settings or origin choices.'
    ];

    if (!record.operations || record.operations.length === 0) {
      return {
        status: 'INCOMPLETE',
        value: {
          hasInversion: false,
          inversionOpIndex: null,
          inversionCenter: null,
          inversionCenterDescription: null
        },
        basisOrMethod: 'Search for W = -I_3 among group operations',
        limitations: ['Record contains no operations']
      };
    }

    let inversionOpIndex: number | null = null;
    let inversionCenter: [Rational, Rational, Rational] | null = null;
    let inversionCenterDescription: string | null = null;

    for (let i = 0; i < record.operations.length; i++) {
      const op = record.operations[i];
      if (AffineOperationAlgebra.isInversion(op.W)) {
        inversionOpIndex = i;

        // Inversion operation: x' = -x + w.
        // Fixed center x_0: x_0 = -x_0 + w => 2 * x_0 = w => x_0 = (1/2) * w.
        const wExact: [ExactRational, ExactRational, ExactRational] = [
          ExactRational.fromRational(op.w[0]),
          ExactRational.fromRational(op.w[1]),
          ExactRational.fromRational(op.w[2])
        ];

        const centerExact = AffineOperationAlgebra.scaleVector(wExact, 1, 2);
        const centerMod1: [ExactRational, ExactRational, ExactRational] = [
          centerExact[0].mod1(),
          centerExact[1].mod1(),
          centerExact[2].mod1()
        ];

        inversionCenter = AffineOperationAlgebra.toRationalVector(centerMod1);
        inversionCenterDescription = `(${inversionCenter[0].numerator}/${inversionCenter[0].denominator}, ${inversionCenter[1].numerator}/${inversionCenter[1].denominator}, ${inversionCenter[2].numerator}/${inversionCenter[2].denominator})`;
        break;
      }
    }

    const hasInversion = inversionOpIndex !== null;

    return {
      status: 'VERIFIED',
      value: {
        hasInversion,
        inversionOpIndex,
        inversionCenter,
        inversionCenterDescription
      },
      basisOrMethod: 'Algebraic identification of W = -I_3 and exact rational midpoint x_0 = (1/2)*w mod 1',
      limitations
    };
  }

  /**
   * C. Computes powers of each operation up to order k = ord(W) using EXACT rational arithmetic,
   * preserving unreduced translation sums to detect intrinsic translations.
   */
  static analyzeOperationPowers(record: SpaceGroupRecord): PropertyStatus<OperationPowerAnalysis[]> {
    const limitations: string[] = [
      'Coordinate convention x\' = W x + w assumes right-hand affine action on fractional coordinates.',
      'Unreduced translation t_unreduced = sum_{j=0}^{k-1} W^j w gives the exact shift in the affine group R^3.',
      'Classification as screw axis or glide plane requires both non-zero intrinsic translation and geometric direction analysis (parallel to rotation axis or in reflection plane).',
      'Lattice centering vectors (A, B, C, I, F, R) can contribute fractional components to lattice translations in non-primitive settings.'
    ];

    if (!record.operations || record.operations.length === 0) {
      return {
        status: 'INCOMPLETE',
        value: [],
        basisOrMethod: 'Iterative exact affine power computation (W, w)^k without modular reduction',
        limitations: ['Record contains no operations']
      };
    }

    const analyses: OperationPowerAnalysis[] = [];

    for (let idx = 0; idx < record.operations.length; idx++) {
      const op = record.operations[idx];
      const W0 = op.W.map(row => [...row]);
      const w0Exact: [ExactRational, ExactRational, ExactRational] = [
        ExactRational.fromRational(op.w[0]),
        ExactRational.fromRational(op.w[1]),
        ExactRational.fromRational(op.w[2])
      ];

      const linearOrder = AffineOperationAlgebra.computeMatrixOrder(W0);
      if (linearOrder === null) {
        throw new Error(`Operation at index ${idx} has unbounded or non-crystallographic linear order`);
      }

      const powers: SinglePowerStep[] = [];
      let currentW = W0.map(row => [...row]);
      let currentWExact = [...w0Exact] as [ExactRational, ExactRational, ExactRational];

      // Power 1: (W, w)
      powers.push({
        power: 1,
        W: currentW.map(row => [...row]),
        unreducedTranslation: AffineOperationAlgebra.toRationalVector(currentWExact),
        mod1Translation: AffineOperationAlgebra.toRationalVector([
          currentWExact[0].mod1(),
          currentWExact[1].mod1(),
          currentWExact[2].mod1()
        ])
      });

      // Successive powers: (W, w)^m = (W, w) o (W, w)^(m-1)
      for (let m = 2; m <= linearOrder; m++) {
        const nextOp = AffineOperationAlgebra.composeAffineExact(
          { W: W0, w: w0Exact },
          { W: currentW, w: currentWExact }
        );
        currentW = nextOp.W;
        currentWExact = nextOp.w;

        powers.push({
          power: m,
          W: currentW.map(row => [...row]),
          unreducedTranslation: AffineOperationAlgebra.toRationalVector(currentWExact),
          mod1Translation: AffineOperationAlgebra.toRationalVector([
            currentWExact[0].mod1(),
            currentWExact[1].mod1(),
            currentWExact[2].mod1()
          ])
        });
      }

      // At power k = linearOrder, W^k must equal I_3
      if (!AffineOperationAlgebra.isIdentity(currentW)) {
        throw new Error(
          `Matrix arithmetic inconsistency: at power ${linearOrder}, matrix did not return to identity`
        );
      }

      const tUnreduced = currentWExact;
      const tMod1: [ExactRational, ExactRational, ExactRational] = [
        tUnreduced[0].mod1(),
        tUnreduced[1].mod1(),
        tUnreduced[2].mod1()
      ];

      // Intrinsic translation: tau = (1 / k) * t_unreduced
      const tau = AffineOperationAlgebra.scaleVector(tUnreduced, 1, linearOrder);

      const isUnreducedLattice = AffineOperationAlgebra.isLatticeVector(tUnreduced);
      const isMod1Zero = AffineOperationAlgebra.isZeroVector(tMod1);
      const hasNonZeroIntrinsic = !AffineOperationAlgebra.isZeroVector(tau);

      const opLimitations: string[] = [];
      if (hasNonZeroIntrinsic && isMod1Zero) {
        opLimitations.push(
          'CRITICAL: Translation reduces to 0 mod 1, but possesses non-zero unreduced translation sum. Premature modulo reduction would erase intrinsic screw/glide component.'
        );
      }

      analyses.push({
        operationIndex: idx,
        initialOperation: {
          W: op.W.map(row => [...row]),
          w: [op.w[0], op.w[1], op.w[2]],
          triplet: op.triplet
        },
        linearOrder,
        powers,
        unreducedTranslationAtOrder: AffineOperationAlgebra.toRationalVector(tUnreduced),
        mod1TranslationAtOrder: AffineOperationAlgebra.toRationalVector(tMod1),
        intrinsicTranslation: AffineOperationAlgebra.toRationalVector(tau),
        isUnreducedTranslationLatticeVector: isUnreducedLattice,
        isMod1TranslationZero: isMod1Zero,
        hasNonZeroIntrinsicTranslation: hasNonZeroIntrinsic,
        limitations: opLimitations
      });
    }

    return {
      status: 'VERIFIED',
      value: analyses,
      basisOrMethod: 'Exact rational affine composition (W1*W2, W1*w2 + w1) through order k = ord(W)',
      limitations
    };
  }

  /**
   * Generates comprehensive mathematical property report for a space group record.
   */
  static analyzeSpaceGroup(record: SpaceGroupRecord): SpaceGroupPropertyReport {
    const linearPartsReport = this.analyzeLinearParts(record);
    const centrosymmetryReport = this.analyzeCentrosymmetry(record);
    const powersReport = this.analyzeOperationPowers(record);

    const overallLimitations: string[] = [
      'Derived mathematical properties represent exact analysis of the provided operation set.',
      'Results are valid for the given coordinate setting and basis convention.',
      'They do not constitute automated discovery or global classification of arbitrary unknown crystal groups.'
    ];

    return {
      spaceGroupNumber: record.spaceGroupNumber,
      settingId: record.settingId,
      operationsCount: record.operations ? record.operations.length : 0,
      uniqueLinearPartsCount: linearPartsReport.value.length,
      linearParts: linearPartsReport,
      centrosymmetry: centrosymmetryReport,
      operationPowers: powersReport,
      overallLimitations
    };
  }
}
