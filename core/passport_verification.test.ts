/**
 * Mathematical Passport V1 Verification Test for SG-002 (P-1)
 * 
 * Verifies that claims declared in SG-002 passport correspond to actual
 * core methods in `core/registry.ts` and `core/group_properties.ts`,
 * executing exact rational arithmetic checks.
 */

import * as fs from 'fs';
import * as path from 'path';
import { SymmetryCatalog } from './registry';
import { CrystallographicGroupProperties, AffineOperationAlgebra } from './group_properties';
import { ExactRational } from './schema/crystallographic_exchange';
import { createSG002VisualizationPayload, ExactVector3 } from './visualization_contract';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('Running Mathematical Passport V1 Verification Test for SG-002...\n');

// 1. Retrieve SG-002 from implementation-linked working registry
const recordP1Bar = SymmetryCatalog.findBySettingId('P-1');
assert(recordP1Bar !== undefined, 'Registry must contain P-1 (group 2)');
assert(recordP1Bar!.groupNumber === 2, 'Group number must be 2');
assert(recordP1Bar!.operations.length === 2, 'P-1 must have exactly 2 operations');
console.log('  ✓ SG-002 successfully loaded from working registry');

// 2. Verify inversion operation (W = -I)
const identityOp = recordP1Bar!.operations[0];
const inversionOp = recordP1Bar!.operations[1];

assert(AffineOperationAlgebra.isInversion(inversionOp.W), 'Second operation must be exact inversion W = -I');
console.log('  ✓ Claim inv_matrix (W = -I) verified successfully');

// 3. Verify inversion center midpoint formula (c = w / 2)
const spaceGroupRecord = {
  spaceGroupNumber: recordP1Bar!.groupNumber,
  settingId: recordP1Bar!.settingId,
  hmSymbol: recordP1Bar!.hmSymbol,
  hallSymbol: recordP1Bar!.hallSymbol,
  operationsCount: recordP1Bar!.operations.length,
  operations: recordP1Bar!.operations
};
const centerProp = CrystallographicGroupProperties.analyzeCentrosymmetry(spaceGroupRecord);
assert(centerProp.value.hasInversion, 'SG-002 must have inversion operation');
assert(centerProp.value.inversionCenter !== null, 'Inversion center must be computed');
assert(
  centerProp.value.inversionCenter![0].numerator === 0 && centerProp.value.inversionCenter![0].denominator === 1 &&
  centerProp.value.inversionCenter![1].numerator === 0 && centerProp.value.inversionCenter![1].denominator === 1 &&
  centerProp.value.inversionCenter![2].numerator === 0 && centerProp.value.inversionCenter![2].denominator === 1,
  'Inversion center must be exactly (0/1, 0/1, 0/1)'
);
console.log('  ✓ Claim center_midpoint verified successfully via CrystallographicGroupProperties');

// 4. Explicit verification of fixed point equation Wc + w = c and independent point transformation P' = WP + w
const cExact: [ExactRational, ExactRational, ExactRational] = [
  new ExactRational(centerProp.value.inversionCenter![0].numerator, centerProp.value.inversionCenter![0].denominator),
  new ExactRational(centerProp.value.inversionCenter![1].numerator, centerProp.value.inversionCenter![1].denominator),
  new ExactRational(centerProp.value.inversionCenter![2].numerator, centerProp.value.inversionCenter![2].denominator)
];

const wExact: [ExactRational, ExactRational, ExactRational] = [
  ExactRational.fromRational(inversionOp.w[0]),
  ExactRational.fromRational(inversionOp.w[1]),
  ExactRational.fromRational(inversionOp.w[2])
];

const Wc = AffineOperationAlgebra.applyMatrixToVector(inversionOp.W, cExact);
const WcPlusW = AffineOperationAlgebra.addVectors(Wc, wExact);

const fixedPointOk = 
  WcPlusW[0].bigN === cExact[0].bigN && WcPlusW[0].bigD === cExact[0].bigD &&
  WcPlusW[1].bigN === cExact[1].bigN && WcPlusW[1].bigD === cExact[1].bigD &&
  WcPlusW[2].bigN === cExact[2].bigN && WcPlusW[2].bigD === cExact[2].bigD;

assert(fixedPointOk, 'Fixed point equation Wc + w = c must hold exactly');
console.log('  ✓ Fixed point equation Wc + w = c verified successfully');

const pX = new ExactRational(1, 4);
const pY = new ExactRational(1, 3);
const pZ = new ExactRational(1, 2);

const pointP: ExactVector3 = { x: pX, y: pY, z: pZ };
const WP = AffineOperationAlgebra.applyMatrixToVector(inversionOp.W, [pointP.x, pointP.y, pointP.z]);
const WPPlusW = AffineOperationAlgebra.addVectors(WP, wExact);

const computedPPrime: ExactVector3 = {
  x: WPPlusW[0],
  y: WPPlusW[1],
  z: WPPlusW[2]
};

// Independent expected coordinates for P = (1/4, 1/3, 1/2) under inversion P' = -P: (-1/4, -1/3, -1/2)
const expectedPPrime: ExactVector3 = {
  x: new ExactRational(-1, 4),
  y: new ExactRational(-1, 3),
  z: new ExactRational(-1, 2)
};

const pointTransformOk =
  computedPPrime.x.bigN === expectedPPrime.x.bigN && computedPPrime.x.bigD === expectedPPrime.x.bigD &&
  computedPPrime.y.bigN === expectedPPrime.y.bigN && computedPPrime.y.bigD === expectedPPrime.y.bigD &&
  computedPPrime.z.bigN === expectedPPrime.z.bigN && computedPPrime.z.bigD === expectedPPrime.z.bigD;

assert(pointTransformOk, 'Point transformation P\' = WP + w must match independent expectation (-1/4, -1/3, -1/2)');
console.log('  ✓ Independent point transformation P\' = WP + w verified successfully');

const satisfied = fixedPointOk && pointTransformOk;

const center: ExactVector3 = {
  x: cExact[0],
  y: cExact[1],
  z: cExact[2]
};

const payload = createSG002VisualizationPayload(pointP, computedPPrime, center, satisfied);
assert(payload.structureId === 'SG-002', 'Payload structure ID must be SG-002');
assert(payload.inversionInvariantSatisfied === true, 'Inversion invariant must be satisfied');
assert(payload.inputPointP.x.n === 1 && payload.inputPointP.x.d === 4, 'Exact rational precision must be preserved across boundary');
console.log('  ✓ SG-002 visualization boundary payload successfully created with exact rational preservation');

console.log('\n🎉 All Mathematical Passport V1 Verification Tests for SG-002 passed successfully!');
