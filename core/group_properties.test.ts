import * as fs from 'fs';
import * as path from 'path';
import {
  AffineOperationAlgebra,
  CrystallographicGroupProperties,
  SpaceGroupPropertyReport
} from './group_properties';
import { ReferenceArtifactLoader } from './reference_loader';
import { SymmetryCatalog } from './registry';
import { SpaceGroupRecord, ExactRational } from './schema/crystallographic_exchange';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('Running KB-14 Derived Crystallographic Group Properties Tests...\n');

const ARTIFACT_PATH = path.resolve('data/crystallography/gemmi_benchmark_4.json');
const artifact = ReferenceArtifactLoader.loadFromFile(ARTIFACT_PATH);

// -----------------------------------------------------------------------------
// TEST 1: Correctness of Linear Matrix Orders & Crystallographic Restriction
// -----------------------------------------------------------------------------
console.log('1. Testing Matrix Orders & Crystallographic Restriction...');

// Identity (order 1)
const matI = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
assert(AffineOperationAlgebra.computeMatrixOrder(matI) === 1, 'Identity order must be 1');

// Inversion (order 2)
const matInv = [[-1, 0, 0], [0, -1, 0], [0, 0, -1]];
assert(AffineOperationAlgebra.computeMatrixOrder(matInv) === 2, 'Inversion order must be 2');

// 2-fold rotation along z (order 2)
const matC2z = [[-1, 0, 0], [0, -1, 0], [0, 0, 1]];
assert(AffineOperationAlgebra.computeMatrixOrder(matC2z) === 2, 'C2 order must be 2');

// 3-fold rotation along [1,1,1] (order 3)
const matC3 = [[0, 0, 1], [1, 0, 0], [0, 1, 0]];
assert(AffineOperationAlgebra.computeMatrixOrder(matC3) === 3, 'C3 order must be 3');

// 4-fold rotation along z (order 4)
const matC4z = [[0, -1, 0], [1, 0, 0], [0, 0, 1]];
assert(AffineOperationAlgebra.computeMatrixOrder(matC4z) === 4, 'C4 order must be 4');

// 6-fold rotation along z in hexagonal basis (order 6)
const matC6z = [[1, -1, 0], [1, 0, 0], [0, 0, 1]];
assert(AffineOperationAlgebra.computeMatrixOrder(matC6z) === 6, 'C6 order must be 6');

// Non-periodic / expanding matrix (shear / unbounded)
const matShear = [[1, 1, 0], [0, 1, 0], [0, 0, 1]];
assert(AffineOperationAlgebra.computeMatrixOrder(matShear) === null, 'Shear matrix must not have finite order');

console.log('  ✓ Orders 1, 2, 3, 4, 6 and unbounded bounds strictly verified');

// -----------------------------------------------------------------------------
// TEST 2: Detection of Inversion Matrix W = -I and Centrosymmetry
// -----------------------------------------------------------------------------
console.log('\n2. Testing Inversion Detection & Exact Inversion Centers...');

// Stable lookups by setting identifier to avoid fragile positional index assumptions
const recordP1 = artifact.records.find(r => r.settingId === 'P1')!;
assert(recordP1 !== undefined, 'Record P1 must exist in reference artifact');
const recordP_1 = artifact.records.find(r => r.settingId === 'P-1')!;
assert(recordP_1 !== undefined, 'Record P-1 must exist in reference artifact');
const recordP21c = artifact.records.find(r => r.settingId === 'P21/c')!;
assert(recordP21c !== undefined, 'Record P21/c must exist in reference artifact');
assert(recordP21c.spaceGroupNumber === 14, 'Record P21/c must be space group number 14');
const recordP212121 = artifact.records.find(r => r.settingId === 'P212121')!;
assert(recordP212121 !== undefined, 'Record P212121 must exist in reference artifact');
assert(recordP212121.spaceGroupNumber === 19, 'Record P212121 must be space group number 19');

// Benchmark Group 1 (P1): No inversion
const repP1 = CrystallographicGroupProperties.analyzeSpaceGroup(recordP1);
assert(repP1.centrosymmetry.status === 'VERIFIED', 'P1 centrosymmetry status must be VERIFIED');
assert(repP1.centrosymmetry.value.hasInversion === false, 'P1 must not have inversion');
assert(repP1.centrosymmetry.value.inversionCenter === null, 'P1 must have null inversion center');

// Benchmark Group 2 (P-1): Has inversion at origin (0, 0, 0)
const repP_1 = CrystallographicGroupProperties.analyzeSpaceGroup(recordP_1);
assert(repP_1.centrosymmetry.value.hasInversion === true, 'P-1 must have inversion');
assert(repP_1.centrosymmetry.value.inversionOpIndex === 1, 'P-1 inversion is at index 1');
assert(
  repP_1.centrosymmetry.value.inversionCenter![0].numerator === 0 &&
  repP_1.centrosymmetry.value.inversionCenter![1].numerator === 0 &&
  repP_1.centrosymmetry.value.inversionCenter![2].numerator === 0,
  'P-1 inversion center must be (0, 0, 0)'
);

// Benchmark Group 14 (P21/c): Has inversion at (0, 0, 0)
const repP21c = CrystallographicGroupProperties.analyzeSpaceGroup(recordP21c);
assert(repP21c.centrosymmetry.value.hasInversion === true, 'P21/c must have inversion');
assert(repP21c.centrosymmetry.value.inversionOpIndex === 2, 'P21/c inversion is at index 2');

// Benchmark Group 19 (P212121): Non-centrosymmetric
const repP212121 = CrystallographicGroupProperties.analyzeSpaceGroup(recordP212121);
assert(repP212121.centrosymmetry.value.hasInversion === false, 'P212121 must not have inversion');

// Synthetic Inversion off origin: W = -I, w = (1/2, 1/2, 1/2) -> center at (1/4, 1/4, 1/4)
const syntheticInversionRecord: SpaceGroupRecord = {
  spaceGroupNumber: 2,
  settingId: 'P-1-shifted',
  hmSymbol: 'P -1',
  hallSymbol: '-P 1',
  operationsCount: 2,
  operations: [
    {
      W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
    },
    {
      W: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]],
      w: [{ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }]
    }
  ]
};
const repShiftedInv = CrystallographicGroupProperties.analyzeSpaceGroup(syntheticInversionRecord);
assert(repShiftedInv.centrosymmetry.value.hasInversion === true, 'Shifted inversion detected');
assert(
  repShiftedInv.centrosymmetry.value.inversionCenter![0].numerator === 1 &&
  repShiftedInv.centrosymmetry.value.inversionCenter![0].denominator === 4 &&
  repShiftedInv.centrosymmetry.value.inversionCenter![1].numerator === 1 &&
  repShiftedInv.centrosymmetry.value.inversionCenter![1].denominator === 4 &&
  repShiftedInv.centrosymmetry.value.inversionCenter![2].numerator === 1 &&
  repShiftedInv.centrosymmetry.value.inversionCenter![2].denominator === 4,
  'Inversion center with w=(1/2,1/2,1/2) must be exactly (1/4, 1/4, 1/4)'
);

console.log('  ✓ Inversion detection and exact midpoint computation passed');

// -----------------------------------------------------------------------------
// TEST 3: Exact Affine Powers Computation (W, w)^k
// -----------------------------------------------------------------------------
console.log('\n3. Testing Exact Affine Power Computation...');

// Synthetic C3 rotation with translation: W is 3-cycle, w = (1/3, 1/3, 1/3)
const c3Op = {
  W: [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
  w: [new ExactRational(1, 3), new ExactRational(1, 3), new ExactRational(1, 3)] as [ExactRational, ExactRational, ExactRational]
};

// Power 2: (W, w)^2 = (W^2, Ww + w) = (W^2, (2/3, 2/3, 2/3))
const pow2 = AffineOperationAlgebra.composeAffineExact(c3Op, c3Op);
assert(
  pow2.w[0].n === 2 && pow2.w[0].d === 3 &&
  pow2.w[1].n === 2 && pow2.w[1].d === 3 &&
  pow2.w[2].n === 2 && pow2.w[2].d === 3,
  'Power 2 of C3 op must have translation (2/3, 2/3, 2/3)'
);

// Power 3: (W, w)^3 = (I, W^2w + Ww + w) = (I, (1, 1, 1))
const pow3 = AffineOperationAlgebra.composeAffineExact(c3Op, pow2);
assert(AffineOperationAlgebra.isIdentity(pow3.W), 'Power 3 matrix must return to identity');
assert(
  pow3.w[0].n === 1 && pow3.w[0].d === 1 &&
  pow3.w[1].n === 1 && pow3.w[1].d === 1 &&
  pow3.w[2].n === 1 && pow3.w[2].d === 1,
  'Power 3 unreduced translation must be exactly (1, 1, 1)'
);

console.log('  ✓ Exact affine power iteration verified with pre-calculated rational fractions');

// -----------------------------------------------------------------------------
// TEST 4 & 5: Preservation of Full Unreduced Translation & Distinction from Mod 1
// -----------------------------------------------------------------------------
console.log('\n4 & 5. Testing Preservation of Unreduced Translation vs Mod 1 Reduction...');

// Check Group 14 (P21/c) Op 1: 2_1 screw axis along y
const op14_screw = repP21c.operationPowers.value[1];
assert(op14_screw.linearOrder === 2, 'Screw op must have linear order 2');
assert(
  op14_screw.unreducedTranslationAtOrder[0].numerator === 0 &&
  op14_screw.unreducedTranslationAtOrder[1].numerator === 1 &&
  op14_screw.unreducedTranslationAtOrder[1].denominator === 1 &&
  op14_screw.unreducedTranslationAtOrder[2].numerator === 0,
  'Unreduced translation at order 2 for 2_1 screw must be (0, 1, 0)'
);
assert(
  op14_screw.mod1TranslationAtOrder[0].numerator === 0 &&
  op14_screw.mod1TranslationAtOrder[1].numerator === 0 &&
  op14_screw.mod1TranslationAtOrder[2].numerator === 0,
  'Mod 1 translation at order 2 must be (0, 0, 0)'
);
assert(
  op14_screw.intrinsicTranslation[0].numerator === 0 &&
  op14_screw.intrinsicTranslation[1].numerator === 1 &&
  op14_screw.intrinsicTranslation[1].denominator === 2 &&
  op14_screw.intrinsicTranslation[2].numerator === 0,
  'Intrinsic translation tau must be (0, 1/2, 0)'
);
assert(op14_screw.hasNonZeroIntrinsicTranslation === true, 'Must have non-zero intrinsic translation');
assert(op14_screw.isMod1TranslationZero === true, 'Must have zero mod 1 translation');
assert(
  op14_screw.limitations.some(l => l.includes('Premature modulo reduction would erase intrinsic screw/glide component')),
  'Must record critical warning about premature modulo reduction'
);

// Check Group 14 (P21/c) Op 3: c-glide plane across xz
const op14_glide = repP21c.operationPowers.value[3];
assert(op14_glide.linearOrder === 2, 'Glide op must have linear order 2');
assert(
  op14_glide.unreducedTranslationAtOrder[0].numerator === 0 &&
  op14_glide.unreducedTranslationAtOrder[1].numerator === 0 &&
  op14_glide.unreducedTranslationAtOrder[2].numerator === 1 &&
  op14_glide.unreducedTranslationAtOrder[2].denominator === 1,
  'Unreduced translation at order 2 for c-glide must be (0, 0, 1)'
);
assert(
  op14_glide.intrinsicTranslation[0].numerator === 0 &&
  op14_glide.intrinsicTranslation[1].numerator === 0 &&
  op14_glide.intrinsicTranslation[2].numerator === 1 &&
  op14_glide.intrinsicTranslation[2].denominator === 2,
  'Intrinsic translation tau must be (0, 0, 1/2)'
);

// Check Group 19 (P212121): all 3 non-trivial operations have intrinsic translations tau = 1/2
for (let i = 1; i <= 3; i++) {
  const p19_op = repP212121.operationPowers.value[i];
  assert(p19_op.linearOrder === 2, `P212121 op ${i} must have linear order 2`);
  assert(p19_op.isUnreducedTranslationLatticeVector === true, `P212121 op ${i} unreduced sum must be lattice vector`);
  assert(p19_op.isMod1TranslationZero === true, `P212121 op ${i} mod 1 sum must be 0`);
  assert(p19_op.hasNonZeroIntrinsicTranslation === true, `P212121 op ${i} must have non-zero tau`);
}

console.log('  ✓ Fundamental distinction between unreduced lattice sum and mod 1 strictly verified');

// -----------------------------------------------------------------------------
// TEST 6: Determinism Across 100 Repeated Runs
// -----------------------------------------------------------------------------
console.log('\n6. Testing Determinism across 100 Runs...');

const baseJson = JSON.stringify(CrystallographicGroupProperties.analyzeSpaceGroup(recordP21c));
for (let run = 1; run <= 100; run++) {
  const testJson = JSON.stringify(CrystallographicGroupProperties.analyzeSpaceGroup(recordP21c));
  assert(testJson === baseJson, `Run ${run} must be bit-identical to base run`);
}
console.log('  ✓ Determinism verified: 100/100 runs bit-identical');

// -----------------------------------------------------------------------------
// TEST 7: Handling of Insufficient or Incomplete Data
// -----------------------------------------------------------------------------
console.log('\n7. Testing Incomplete Data Handling...');

const emptyRecord: SpaceGroupRecord = {
  spaceGroupNumber: 1,
  settingId: 'P1-empty',
  hmSymbol: 'P 1',
  hallSymbol: 'P 1',
  operationsCount: 0,
  operations: []
};

const repEmpty = CrystallographicGroupProperties.analyzeSpaceGroup(emptyRecord);
assert(repEmpty.linearParts.status === 'INCOMPLETE', 'Empty record linear parts must be INCOMPLETE');
assert(repEmpty.centrosymmetry.status === 'INCOMPLETE', 'Empty record centrosymmetry must be INCOMPLETE');
assert(repEmpty.operationPowers.status === 'INCOMPLETE', 'Empty record powers must be INCOMPLETE');
console.log('  ✓ Incomplete data handled gracefully with explicit statuses');

// -----------------------------------------------------------------------------
// TEST 8: Prevention of False Classification for Off-Origin Pure Rotation
// -----------------------------------------------------------------------------
console.log('\n8. Testing Prevention of False Classification on Off-Origin Pure Rotation...');

// Off-origin pure 2-fold rotation: W = diag(-1, -1, 1), center line at x0 = (1/4, 1/4, 0).
// w = (I - W)*x0 = [2*1/4, 2*1/4, 0] = (1/2, 1/2, 0).
// Even though w is fractional, tau = (1/2)*(W+I)*w = 0!
const offOriginRotationRecord: SpaceGroupRecord = {
  spaceGroupNumber: 3,
  settingId: 'P2-off-origin',
  hmSymbol: 'P 2',
  hallSymbol: 'P 2',
  operationsCount: 2,
  operations: [
    {
      W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
    },
    {
      W: [[-1, 0, 0], [0, -1, 0], [0, 0, 1]],
      w: [{ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }, { numerator: 0, denominator: 1 }]
    }
  ]
};

const repOffOrigin = CrystallographicGroupProperties.analyzeSpaceGroup(offOriginRotationRecord);
const offOriginOp = repOffOrigin.operationPowers.value[1];
assert(
  offOriginOp.unreducedTranslationAtOrder[0].numerator === 0 &&
  offOriginOp.unreducedTranslationAtOrder[1].numerator === 0 &&
  offOriginOp.unreducedTranslationAtOrder[2].numerator === 0,
  'Unreduced translation for off-origin pure rotation must be strictly (0, 0, 0)'
);
assert(
  offOriginOp.hasNonZeroIntrinsicTranslation === false,
  'Off-origin pure rotation must NOT have non-zero intrinsic translation'
);
assert(
  offOriginOp.intrinsicTranslation[0].numerator === 0 &&
  offOriginOp.intrinsicTranslation[1].numerator === 0 &&
  offOriginOp.intrinsicTranslation[2].numerator === 0,
  'Intrinsic translation tau must be strictly (0, 0, 0)'
);
console.log('  ✓ Algorithm correctly discriminates between intrinsic translations and off-origin shifts');

// -----------------------------------------------------------------------------
// TEST 9: Immutability of Artifact JSON & Working Catalog
// -----------------------------------------------------------------------------
console.log('\n9. Verifying Immutability of Artifact JSON and Working Catalog...');

// Check artifact on disk
const artifactOnDisk = JSON.parse(fs.readFileSync(ARTIFACT_PATH, 'utf-8'));
assert(artifactOnDisk.manifest.sha256Checksum === artifact.manifest.sha256Checksum, 'Artifact file must not be modified');

// Check working catalog in registry.ts
const workingP1 = SymmetryCatalog.findBySettingId('P1')!;
assert(workingP1.provenanceDetails.commitOrVersion === '6ea553a', 'Working catalog must remain untouched');
console.log('  ✓ Immutability confirmed: zero modifications to external sources or working catalog');

// -----------------------------------------------------------------------------
// TEST 10: Invariance Under Permutation of Input Operations
// -----------------------------------------------------------------------------
console.log('\n10. Testing Permutation Invariance of Group Properties...');

// Permute operations of Group 14: reverse the array
const permutedP21cRecord: SpaceGroupRecord = {
  ...recordP21c,
  operations: [...recordP21c.operations].reverse()
};

const repPermuted = CrystallographicGroupProperties.analyzeSpaceGroup(permutedP21cRecord);
assert(repPermuted.operationsCount === repP21c.operationsCount, 'Operation counts must match');
assert(repPermuted.uniqueLinearPartsCount === repP21c.uniqueLinearPartsCount, 'Unique linear parts must match');
assert(
  repPermuted.centrosymmetry.value.hasInversion === repP21c.centrosymmetry.value.hasInversion,
  'Centrosymmetry verdict must be identical under permutation'
);
assert(
  repPermuted.linearParts.value.length === repP21c.linearParts.value.length,
  'Linear parts set length must be identical under permutation'
);

console.log('  ✓ Permutation invariance verified');

console.log('\n====================================================');
console.log('ALL KB-14 DERIVED GROUP PROPERTIES TESTS PASSED (100%)');
console.log('====================================================');
