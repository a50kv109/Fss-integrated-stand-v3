import { SymmetryCatalog } from './registry';
import { SymmetryAdapter } from './symmetry_adapter';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('Running KB-06 Completeness & Exact Finite-Set Validation Tests...\n');

const expectedCounts: Record<string, number> = {
  "P1": 1,
  "P-1": 2,
  "P2": 2,
  "P21": 2,
  "P212121": 4,
  "P21/c": 4,
  "C2": 4,
  "Cc": 4,
  "P41": 4
};

// Helper for rational arithmetic
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

class Rat {
  n: number;
  d: number;
  constructor(n: number, d: number = 1) {
    if (d === 0) throw new Error("Zero denominator");
    const common = gcd(Math.abs(n), Math.abs(d));
    this.n = (n / common);
    this.d = (d / common);
    if (this.d < 0) {
      this.n = -this.n;
      this.d = -this.d;
    }
  }
  add(o: Rat): Rat { return new Rat(this.n * o.d + o.n * this.d, this.d * o.d); }
  mul(o: Rat): Rat { return new Rat(this.n * o.n, this.d * o.d); }
  mod1(): Rat {
    let num = (this.n * 1) % (1 * this.d);
    if (num < 0) num += this.d;
    return new Rat(num, this.d);
  }
  equals(o: Rat): boolean { return this.n * o.d === o.n * this.d; }
}

function matMul(W1: number[][], W2: number[][]): number[][] {
  let res = [[0,0,0],[0,0,0],[0,0,0]];
  for(let i=0; i<3; i++) {
    for(let j=0; j<3; j++) {
      res[i][j] = W1[i][0]*W2[0][j] + W1[i][1]*W2[1][j] + W1[i][2]*W2[2][j];
    }
  }
  return res;
}

function composeOps(op1: any, op2: any) {
  const W1 = op1.W;
  const w1 = op1.w.map((x: any) => new Rat(x.numerator, x.denominator));
  const W2 = op2.W;
  const w2 = op2.w.map((x: any) => new Rat(x.numerator, x.denominator));

  const W3 = matMul(W1, W2);
  const w3 = [0,1,2].map(i => {
    let sum = new Rat(0);
    for(let k=0; k<3; k++) {
      sum = sum.add(new Rat(W1[i][k]).mul(w2[k]));
    }
    return w1[i].add(sum).mod1();
  });
  return { W: W3, w: w3 };
}

// 1. Check operation counts and contents against expected with exact finite-set validation
for (const [settingId, expectedCount] of Object.entries(expectedCounts)) {
  const record = SymmetryCatalog.findBySettingId(settingId);
  assert(!!record, `Explicit failure report: Record '${settingId}' not found in symmetry catalog.`);
  assert(record!.operations.length === expectedCount, `Explicit failure report: Setting '${settingId}' expected ${expectedCount} operations, got ${record!.operations.length}.`);
  
  // Check no duplicates
  const opStrings = record!.operations.map(op => JSON.stringify(op));
  const uniqueOps = new Set(opStrings);
  assert(uniqueOps.size === record!.operations.length, `Explicit failure report: Setting '${settingId}' contains duplicate operations.`);

  // Check identity presence (modulo lattice translations)
  const hasIdentity = record!.operations.some(op => {
    const isIdMat = op.W[0][0]===1 && op.W[1][1]===1 && op.W[2][2]===1 &&
                    op.W[0][1]===0 && op.W[0][2]===0 && op.W[1][0]===0 && op.W[1][2]===0 && op.W[2][0]===0 && op.W[2][1]===0;
    const isZeroTrans = op.w.every((t: any) => new Rat(t.numerator, t.denominator).mod1().n === 0);
    return isIdMat && isZeroTrans;
  });
  assert(hasIdentity, `Explicit failure report: Setting '${settingId}' is missing the identity operation.`);

  // Check closure under composition modulo integer lattice translations
  for (let i = 0; i < record!.operations.length; i++) {
    for (let j = 0; j < record!.operations.length; j++) {
      const op1 = record!.operations[i];
      const op2 = record!.operations[j];
      const comp = composeOps(op1, op2);
      const matchesAny = record!.operations.some(target => {
        const tW = target.W;
        const tw = target.w.map((x: any) => new Rat(x.numerator, x.denominator));
        const matEq = tW.every((row, rowIdx) => row.every((val, colIdx) => val === comp.W[rowIdx][colIdx]));
        const vecEq = tw.every((val, idx) => val.equals(comp.w[idx]));
        return matEq && vecEq;
      });
      assert(matchesAny, `Explicit failure report: Setting '${settingId}' is not closed under composition for operation pair [${i}, ${j}].`);
    }
  }

  // Check presence of inverse for every operation modulo lattice translations
  for (let i = 0; i < record!.operations.length; i++) {
    const op1 = record!.operations[i];
    let hasInverse = false;
    for (let j = 0; j < record!.operations.length; j++) {
      const op2 = record!.operations[j];
      const comp = composeOps(op1, op2);
      const isIdMat = comp.W[0][0]===1 && comp.W[1][1]===1 && comp.W[2][2]===1 &&
                      comp.W[0][1]===0 && comp.W[0][2]===0 && comp.W[1][0]===0 && comp.W[1][2]===0 && comp.W[2][0]===0 && comp.W[2][1]===0;
      const isZeroTrans = comp.w.every((t: Rat) => t.mod1().n === 0);
      if (isIdMat && isZeroTrans) {
        hasInverse = true;
        break;
      }
    }
    assert(hasInverse, `Explicit failure report: Setting '${settingId}' operation index ${i} lacks an inverse operation modulo lattice translations.`);
  }

  // Check adapter compatibility
  const adapted = SymmetryAdapter.adapt(record!);
  assert(adapted.length === expectedCount, `Explicit failure report: Setting '${settingId}' adapter output length mismatch.`);
}

// 2. Explicit test distinguishing Group No. 5 (C2) from Group No. 9 (Cc)
const recC2 = SymmetryCatalog.findBySettingId("C2");
const recCc = SymmetryCatalog.findBySettingId("Cc");
assert(!!recC2, 'Group C2 must be registered');
assert(!!recCc, 'Group Cc must be registered');
assert(recC2!.groupNumber === 5, 'C2 group number must be 5');
assert(recCc!.groupNumber === 9, 'Cc group number must be 9');
assert(recC2!.hmSymbol !== recCc!.hmSymbol, 'C2 and Cc must have distinct HM symbols');
assert(recC2!.hallSymbol !== recCc!.hallSymbol, 'C2 and Cc must have distinct Hall symbols');
assert(recC2!.operations.length === recCc!.operations.length, 'C2 and Cc both have 4 operations but differ in glide/centering semantics');

// 3. Specific tests for P41
const recP41 = SymmetryCatalog.findBySettingId("P41");
assert(!!recP41, 'Group P41 must be registered');
assert(recP41!.groupNumber === 76, 'P41 group number must be 76');
assert(recP41!.hmSymbol === "P 41", 'P41 HM symbol must be P 41');

// Provenance check
const p1 = SymmetryCatalog.findBySettingId("P1");
assert(!!p1?.provenanceDetails && !!p1.provenanceDetails.license, 'Provenance details missing');

console.log('All KB-06 and Stage A exact finite-set validation & Cc reconciliation tests passed successfully!');
