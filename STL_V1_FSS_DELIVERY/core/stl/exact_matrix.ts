/**
 * STL V1 exact n×n matrix (n = 2 or 3), entries ExactScalar.
 */

import { ExactScalar } from './exact_scalar';

export type MatrixDim = 2 | 3;

export class ExactMatrix {
  readonly n: MatrixDim;
  readonly data: ExactScalar[][]; // row-major

  constructor(n: MatrixDim, data: ExactScalar[][]) {
    if (n !== 2 && n !== 3) {
      throw new Error(`ExactMatrix: unsupported dimension ${n}`);
    }
    if (!Array.isArray(data) || data.length !== n) {
      throw new Error(`ExactMatrix: expected ${n} rows`);
    }
    for (let i = 0; i < n; i++) {
      if (!Array.isArray(data[i]) || data[i].length !== n) {
        throw new Error(`ExactMatrix: row ${i} must have length ${n}`);
      }
      for (let j = 0; j < n; j++) {
        if (!(data[i][j] instanceof ExactScalar)) {
          throw new Error(`ExactMatrix: entry [${i}][${j}] must be ExactScalar`);
        }
      }
    }
    this.n = n;
    this.data = data.map(row => row.map(x => x));
  }

  /** Integer matrix from number[][] */
  static fromInt(entries: number[][]): ExactMatrix {
    const n = entries.length;
    if (n !== 2 && n !== 3) {
      throw new Error(`ExactMatrix.fromInt: n must be 2 or 3, got ${n}`);
    }
    for (const row of entries) {
      if (row.length !== n) throw new Error('ExactMatrix.fromInt: not square');
      for (const v of row) {
        if (!Number.isSafeInteger(v)) {
          throw new Error(`ExactMatrix.fromInt: entry ${v} is not a safe integer`);
        }
      }
    }
    const data = entries.map(row => row.map(v => ExactScalar.fromInt(v)));
    return new ExactMatrix(n as MatrixDim, data);
  }

  static identity(n: MatrixDim): ExactMatrix {
    const data: ExactScalar[][] = [];
    for (let i = 0; i < n; i++) {
      const row: ExactScalar[] = [];
      for (let j = 0; j < n; j++) {
        row.push(i === j ? ExactScalar.one() : ExactScalar.zero());
      }
      data.push(row);
    }
    return new ExactMatrix(n, data);
  }

  get(i: number, j: number): ExactScalar {
    return this.data[i][j];
  }

  equals(o: ExactMatrix): boolean {
    if (this.n !== o.n) return false;
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        if (!this.data[i][j].equals(o.data[i][j])) return false;
      }
    }
    return true;
  }

  /** Canonical key for set membership (order-independent via sorted keys of set) */
  canonicalKey(): string {
    const parts: string[] = [];
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        parts.push(this.data[i][j].toString());
      }
    }
    return `${this.n}:[${parts.join(',')}]`;
  }

  mul(o: ExactMatrix): ExactMatrix {
    if (this.n !== o.n) {
      throw new Error('ExactMatrix.mul: dimension mismatch');
    }
    const n = this.n;
    const data: ExactScalar[][] = [];
    for (let i = 0; i < n; i++) {
      const row: ExactScalar[] = [];
      for (let j = 0; j < n; j++) {
        let sum = ExactScalar.zero();
        for (let k = 0; k < n; k++) {
          sum = sum.add(this.data[i][k].mul(o.data[k][j]));
        }
        row.push(sum);
      }
      data.push(row);
    }
    return new ExactMatrix(n, data);
  }

  /**
   * Exact determinant via Leibniz / explicit formulas (BigInt through ExactScalar).
   */
  det(): ExactScalar {
    const n = this.n;
    const a = this.data;
    if (n === 2) {
      return a[0][0].mul(a[1][1]).sub(a[0][1].mul(a[1][0]));
    }
    // n === 3
    return a[0][0]
      .mul(a[1][1].mul(a[2][2]).sub(a[1][2].mul(a[2][1])))
      .sub(a[0][1].mul(a[1][0].mul(a[2][2]).sub(a[1][2].mul(a[2][0]))))
      .add(a[0][2].mul(a[1][0].mul(a[2][1]).sub(a[1][1].mul(a[2][0]))));
  }

  /**
   * Exact inverse via adjugate / det. Throws if det = 0.
   */
  inverse(): ExactMatrix {
    const d = this.det();
    if (d.isZero()) {
      throw new Error('ExactMatrix.inverse: singular matrix (det=0)');
    }
    const n = this.n;
    const a = this.data;
    if (n === 2) {
      // (1/det) * [[d, -b], [-c, a]]
      const invData: ExactScalar[][] = [
        [a[1][1].div(d), a[0][1].neg().div(d)],
        [a[1][0].neg().div(d), a[0][0].div(d)]
      ];
      return new ExactMatrix(2, invData);
    }
    // 3×3 cofactor transpose / det
    const c00 = a[1][1].mul(a[2][2]).sub(a[1][2].mul(a[2][1]));
    const c01 = a[1][0].mul(a[2][2]).sub(a[1][2].mul(a[2][0])).neg();
    const c02 = a[1][0].mul(a[2][1]).sub(a[1][1].mul(a[2][0]));
    const c10 = a[0][1].mul(a[2][2]).sub(a[0][2].mul(a[2][1])).neg();
    const c11 = a[0][0].mul(a[2][2]).sub(a[0][2].mul(a[2][0]));
    const c12 = a[0][0].mul(a[2][1]).sub(a[0][1].mul(a[2][0])).neg();
    const c20 = a[0][1].mul(a[1][2]).sub(a[0][2].mul(a[1][1]));
    const c21 = a[0][0].mul(a[1][2]).sub(a[0][2].mul(a[1][0])).neg();
    const c22 = a[0][0].mul(a[1][1]).sub(a[0][1].mul(a[1][0]));
    // adjugate is transpose of cofactor
    const invData: ExactScalar[][] = [
      [c00.div(d), c10.div(d), c20.div(d)],
      [c01.div(d), c11.div(d), c21.div(d)],
      [c02.div(d), c12.div(d), c22.div(d)]
    ];
    return new ExactMatrix(3, invData);
  }

  toString(): string {
    return this.data.map(row => '[' + row.map(x => x.toString()).join(', ') + ']').join('; ');
  }
}

/** Set equality: ignore order and duplicate occurrences (mathematical set). */
export function matrixSetEquals(a: ExactMatrix[], b: ExactMatrix[]): boolean {
  if (a.length === 0 && b.length === 0) return true;
  const keysA = new Set(a.map(m => m.canonicalKey()));
  const keysB = new Set(b.map(m => m.canonicalKey()));
  if (keysA.size !== keysB.size) return false;
  for (const k of keysA) {
    if (!keysB.has(k)) return false;
  }
  return true;
}

export function matrixSetDiff(
  computed: ExactMatrix[],
  expected: ExactMatrix[]
): { missing: string[]; extra: string[] } {
  const cKeys = new Set(computed.map(m => m.canonicalKey()));
  const eKeys = new Set(expected.map(m => m.canonicalKey()));
  const missing: string[] = [];
  const extra: string[] = [];
  for (const k of eKeys) {
    if (!cKeys.has(k)) missing.push(k);
  }
  for (const k of cKeys) {
    if (!eKeys.has(k)) extra.push(k);
  }
  return { missing, extra };
}
