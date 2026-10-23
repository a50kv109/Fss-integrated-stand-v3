/**
 * STL V1 exact rational scalar (normalized p/q).
 * Independent of crystallographic ExactRational to avoid API coupling.
 * Invariants: denominator > 0; gcd(|p|, q) = 1; zero is 0/1.
 *
 * number arguments must be safe integers (Number.isSafeInteger).
 * Prefer bigint or integer strings for large exact values.
 */

export class ExactScalar {
  readonly num: bigint;
  readonly den: bigint;

  constructor(numerator: bigint | number | string, denominator: bigint | number | string = 1n) {
    const num = ExactScalar.parseIntegerInput(numerator, 'numerator');
    const denRaw = ExactScalar.parseIntegerInput(denominator, 'denominator');
    let den = denRaw;
    let n = num;
    if (den === 0n) {
      throw new Error('ExactScalar: denominator must be non-zero');
    }
    if (den < 0n) {
      n = -n;
      den = -den;
    }
    const g = ExactScalar.gcd(ExactScalar.abs(n), den);
    this.num = n / g;
    this.den = den / g;
  }

  /**
   * Accept bigint, safe integer number, or optional-sign digit string.
   * Reject unsafe numbers, non-integers, empty/invalid strings.
   */
  static parseIntegerInput(value: bigint | number | string, label: string): bigint {
    if (typeof value === 'bigint') {
      return value;
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        throw new Error(`ExactScalar: ${label} must be a finite number`);
      }
      if (!Number.isInteger(value)) {
        throw new Error(`ExactScalar: ${label} must be an integer number, got ${value}`);
      }
      if (!Number.isSafeInteger(value)) {
        throw new Error(
          `ExactScalar: ${label} is outside Number.MAX_SAFE_INTEGER; use bigint or integer string`
        );
      }
      return BigInt(value);
    }
    if (typeof value === 'string') {
      const s = value.trim();
      if (!/^[+-]?\d+$/.test(s)) {
        throw new Error(`ExactScalar: ${label} string must be an integer digit sequence`);
      }
      return BigInt(s);
    }
    throw new Error(`ExactScalar: ${label} must be bigint, safe integer number, or integer string`);
  }

  static abs(a: bigint): bigint {
    return a < 0n ? -a : a;
  }

  static gcd(a: bigint, b: bigint): bigint {
    let x = a;
    let y = b;
    while (y !== 0n) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x < 0n ? -x : x;
  }

  static zero(): ExactScalar {
    return new ExactScalar(0n, 1n);
  }

  static one(): ExactScalar {
    return new ExactScalar(1n, 1n);
  }

  static fromInt(n: bigint | number | string): ExactScalar {
    return new ExactScalar(n, 1n);
  }

  add(o: ExactScalar): ExactScalar {
    return new ExactScalar(this.num * o.den + o.num * this.den, this.den * o.den);
  }

  sub(o: ExactScalar): ExactScalar {
    return new ExactScalar(this.num * o.den - o.num * this.den, this.den * o.den);
  }

  mul(o: ExactScalar): ExactScalar {
    return new ExactScalar(this.num * o.num, this.den * o.den);
  }

  div(o: ExactScalar): ExactScalar {
    if (o.num === 0n) {
      throw new Error('ExactScalar: division by zero');
    }
    return new ExactScalar(this.num * o.den, this.den * o.num);
  }

  neg(): ExactScalar {
    return new ExactScalar(-this.num, this.den);
  }

  equals(o: ExactScalar): boolean {
    return this.num === o.num && this.den === o.den;
  }

  isZero(): boolean {
    return this.num === 0n;
  }

  /** Canonical string for set keys and reports */
  toString(): string {
    if (this.den === 1n) return this.num.toString();
    return `${this.num.toString()}/${this.den.toString()}`;
  }
}
