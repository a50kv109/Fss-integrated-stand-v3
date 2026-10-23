
import { SymmetryCatalog } from '../registry';
import { AffineOperationAlgebra } from '../group_properties';
import { ExactRational } from '../schema/crystallographic_exchange';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('Running SG-002 P-1 Mathematical Passport Implementation Tests...\n');

const group2 = SymmetryCatalog.findByGroupNumber(2)[0];
const inversionOp = group2.operations.find(op => AffineOperationAlgebra.isInversion(op.W))!;

// 1. Recognition of W = -I
const W = inversionOp.W;
assert(W[0][0] === -1 && W[1][1] === -1 && W[2][2] === -1, 'W[0][0], W[1][1], W[2][2] must be -1');
assert(W[0][1] === 0 && W[0][2] === 0 && W[1][0] === 0 && W[1][2] === 0 && W[2][0] === 0 && W[2][1] === 0, 'Off-diagonal elements must be 0');
console.log('  ✓ Recognition of W = -I passed');

// 2. Exact center calculation and fixed-point verification
const w = inversionOp.w.map(r => new ExactRational(r.numerator, r.denominator)) as [ExactRational, ExactRational, ExactRational];
const center = AffineOperationAlgebra.scaleVector(w, 1, 2);

const Wc = AffineOperationAlgebra.applyMatrixToVector(inversionOp.W, center);
const WcPlusW = AffineOperationAlgebra.addVectors(Wc, w);

assert(WcPlusW[0].equals(center[0]), 'Fixed-point x check failed');
assert(WcPlusW[1].equals(center[1]), 'Fixed-point y check failed');
assert(WcPlusW[2].equals(center[2]), 'Fixed-point z check failed');
console.log('  ✓ Exact center calculation and fixed-point verification passed');

// 3. Exact self-composition to identity
const op = { W: inversionOp.W, w: inversionOp.w.map(r => new ExactRational(r.numerator, r.denominator)) as [ExactRational, ExactRational, ExactRational] };
const comp = AffineOperationAlgebra.composeAffineExact(op, op);
assert(AffineOperationAlgebra.isIdentity(comp.W), 'Self-composition W must be I');
assert(AffineOperationAlgebra.isZeroVector(comp.w), 'Self-composition w must be 0');
console.log('  ✓ Exact self-composition to identity passed');

// 4. Negative case: Rejection of non-inversion matrix
const identityW = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
assert(!AffineOperationAlgebra.isInversion(identityW), 'Identity matrix must not be inversion');
console.log('  ✓ Negative case passed');

console.log('\n✅ SG-002 P-1 Mathematical Passport Implementation tests passed.');
