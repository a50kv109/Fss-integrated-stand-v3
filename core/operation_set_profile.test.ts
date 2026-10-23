/**
 * Operation-Set Invariant Profile Test Suite (EXP-09 Module)
 * 
 * Verifies profile generation, matrix orders, proper/improper rotation counts,
 * central inversion detection, translation classification, duplicate multiset handling (T6b),
 * periodic lattice translation invariance, reordering invariance, and determinism.
 */

import { buildOperationSetProfile, InputSymmetryOperation } from './operation_set_profile';
import { SymmetryCatalog } from './registry';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('====================================================');
console.log('RUNNING EXP-09 OPERATION-SET PROFILE TEST SUITE');
console.log('====================================================\n');

// -----------------------------------------------------------------------------
// Test Helpers: Canonical Identity, Inversion, Rotations
// -----------------------------------------------------------------------------
const OP_IDENTITY: InputSymmetryOperation = {
  W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
};

const OP_INVERSION: InputSymmetryOperation = {
  W: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]],
  w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
};

const OP_C2_Y: InputSymmetryOperation = {
  W: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]],
  w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
};

const OP_SCREW_21_Y: InputSymmetryOperation = {
  W: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]],
  w: [{ numerator: 0, denominator: 1 }, { numerator: 1, denominator: 2 }, { numerator: 0, denominator: 1 }]
};

const OP_REFLECTION_Y: InputSymmetryOperation = {
  W: [[1, 0, 0], [0, -1, 0], [0, 0, 1]],
  w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
};

// -----------------------------------------------------------------------------
// T1: Single Identity Operation
// -----------------------------------------------------------------------------
console.log('TEST T1: Single Identity Operation...');
const profT1 = buildOperationSetProfile([OP_IDENTITY]);
assert(profT1.totalCount === 1, 'T1: totalCount must be 1');
assert(profT1.distinctCount === 1, 'T1: distinctCount must be 1');
assert(!profT1.hasDuplicates, 'T1: hasDuplicates must be false');
assert(profT1.orderHistogram[1] === 1, 'T1: order 1 count must be 1');
assert(!profT1.hasInversion, 'T1: hasInversion must be false');
assert(profT1.properRotationsCount === 1, 'T1: proper count must be 1');
assert(profT1.improperRotationsCount === 0, 'T1: improper count must be 0');
assert(profT1.translationsSummary.zeroCount === 1, 'T1: zeroCount must be 1');
assert(profT1.translationsSummary.fractionalCount === 0, 'T1: fractionalCount must be 0');
console.log('  ✅ T1 PASSED: Identity operation profile verified.\n');

// -----------------------------------------------------------------------------
// T2: Known Inversion Operation
// -----------------------------------------------------------------------------
console.log('TEST T2: Inversion Operation...');
const profT2 = buildOperationSetProfile([OP_INVERSION]);
assert(profT2.distinctCount === 1, 'T2: distinctCount must be 1');
assert(profT2.hasInversion === true, 'T2: hasInversion must be true');
assert(profT2.orderHistogram[2] === 1, 'T2: order 2 count must be 1');
assert(profT2.properRotationsCount === 0, 'T2: proper count must be 0');
assert(profT2.improperRotationsCount === 1, 'T2: improper count must be 1');
console.log('  ✅ T2 PASSED: Central inversion operation profile verified.\n');

// -----------------------------------------------------------------------------
// T3: Proper Rotations vs Reflections
// -----------------------------------------------------------------------------
console.log('TEST T3: Proper Rotation vs Mirror Reflection...');
const profC2 = buildOperationSetProfile([OP_C2_Y]);
assert(profC2.orderHistogram[2] === 1, 'T3: C2 order must be 2');
assert(profC2.properRotationsCount === 1, 'T3: C2 must be proper rotation');
assert(profC2.improperRotationsCount === 0, 'T3: C2 improper count must be 0');
assert(!profC2.hasInversion, 'T3: C2 has no inversion');

const profRefl = buildOperationSetProfile([OP_REFLECTION_Y]);
assert(profRefl.orderHistogram[2] === 1, 'T3: Reflection order must be 2');
assert(profRefl.properRotationsCount === 0, 'T3: Reflection proper count must be 0');
assert(profRefl.improperRotationsCount === 1, 'T3: Reflection must be improper');
console.log('  ✅ T3 PASSED: Determinant distinction verified (+1 proper vs -1 reflection).\n');

// -----------------------------------------------------------------------------
// T6b: Multiset with Duplicate Operations (Criterion C2)
// -----------------------------------------------------------------------------
console.log('TEST T6b: Multiset with Duplicate Operations (Criterion C2)...');
const multisetDuplicates = [
  OP_IDENTITY,
  OP_C2_Y,
  OP_IDENTITY, // Duplicate of OP_IDENTITY
  OP_C2_Y,     // Duplicate of OP_C2_Y
  OP_C2_Y      // Triplicate of OP_C2_Y
];
const profT6b = buildOperationSetProfile(multisetDuplicates);
assert(profT6b.totalCount === 5, 'T6b: totalCount must be 5');
assert(profT6b.distinctCount === 2, 'T6b: distinctCount must be 2');
assert(profT6b.hasDuplicates === true, 'T6b: hasDuplicates must be true');
assert(profT6b.orderHistogram[1] === 1, 'T6b: order 1 count must be 1');
assert(profT6b.orderHistogram[2] === 1, 'T6b: order 2 count must be 1');
assert(profT6b.properRotationsCount === 2, 'T6b: proper count must be 2');
console.log('  ✅ T6b PASSED: Multiset duplicates correctly deduplicated (total=5, distinct=2).\n');

// -----------------------------------------------------------------------------
// T7a: Operation Reordering Invariance
// -----------------------------------------------------------------------------
console.log('TEST T7a: Operation Reordering Invariance...');
const orderA = [OP_IDENTITY, OP_C2_Y, OP_INVERSION];
const orderB = [OP_INVERSION, OP_IDENTITY, OP_C2_Y];
const profA = buildOperationSetProfile(orderA);
const profB = buildOperationSetProfile(orderB);
assert(JSON.stringify(profA) === JSON.stringify(profB), 'T7a: Profile must be invariant to input ordering');
console.log('  ✅ T7a PASSED: Reordered operations yield bit-identical profile.\n');

// -----------------------------------------------------------------------------
// T7b: Periodic Translation Invariance Modulo 1
// -----------------------------------------------------------------------------
console.log('TEST T7b: Periodic Translation Invariance Modulo 1...');
const opWithLatticeShift: InputSymmetryOperation = {
  W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  // w = [1, 2, -1] which is identical to [0, 0, 0] mod 1
  w: [{ numerator: 1, denominator: 1 }, { numerator: 2, denominator: 1 }, { numerator: -1, denominator: 1 }]
};
const profLatticeShift = buildOperationSetProfile([OP_IDENTITY, opWithLatticeShift]);
assert(profLatticeShift.totalCount === 2, 'T7b: totalCount must be 2');
assert(profLatticeShift.distinctCount === 1, 'T7b: distinctCount must be 1 (deduplicated mod 1)');
assert(profLatticeShift.hasDuplicates === true, 'T7b: hasDuplicates must be true');
assert(profLatticeShift.translationsSummary.zeroCount === 1, 'T7b: zero translation count must be 1');
console.log('  ✅ T7b PASSED: Translations differing by integer lattice vectors correctly deduplicate.\n');

// -----------------------------------------------------------------------------
// T5: All 8 Studio Benchmark Space Groups Profile Validation
// -----------------------------------------------------------------------------
console.log('TEST T5: Benchmark Profiles for All 8 Studio Space Groups...');
const testGroups = ['P1', 'P-1', 'P2', 'P21', 'C2', 'Cc', 'P21/c', 'P212121'];
for (const settingId of testGroups) {
  const record = SymmetryCatalog.findBySettingId(settingId);
  assert(record !== undefined, `T5: Group ${settingId} must exist in registry`);
  const profile = buildOperationSetProfile(record!.operations);

  assert(profile.distinctCount === record!.operations.length, `T5: ${settingId} distinct count must match operations length`);
  assert(!profile.hasDuplicates, `T5: ${settingId} must not contain internal duplicate operations`);

  if (settingId === 'P1') {
    assert(profile.distinctCount === 1 && profile.orderHistogram[1] === 1, 'P1 profile check');
    assert(!profile.hasInversion, 'P1 has no inversion');
  } else if (settingId === 'P-1') {
    assert(profile.distinctCount === 2 && profile.hasInversion === true, 'P-1 has inversion');
    assert(profile.properRotationsCount === 1 && profile.improperRotationsCount === 1, 'P-1 proper/improper check');
  } else if (settingId === 'P2') {
    assert(profile.distinctCount === 2 && !profile.hasInversion, 'P2 has no inversion');
    assert(profile.properRotationsCount === 2 && profile.improperRotationsCount === 0, 'P2 proper check');
    assert(profile.translationsSummary.zeroCount === 2, 'P2 all zero translations');
  } else if (settingId === 'P21') {
    assert(profile.distinctCount === 2 && !profile.hasInversion, 'P21 has no inversion');
    assert(profile.translationsSummary.fractionalCount === 1, 'P21 has fractional translation (screw axis)');
  } else if (settingId === 'C2') {
    assert(profile.distinctCount === 4 && profile.properRotationsCount === 4, 'C2 all 4 proper rotations');
  } else if (settingId === 'Cc') {
    assert(profile.distinctCount === 4 && profile.properRotationsCount === 2 && profile.improperRotationsCount === 2, 'Cc 2 proper and 2 reflections');
  } else if (settingId === 'P21/c') {
    assert(profile.distinctCount === 4 && profile.hasInversion === true, 'P21/c has inversion');
    assert(profile.properRotationsCount === 2 && profile.improperRotationsCount === 2, 'P21/c proper/improper');
  } else if (settingId === 'P212121') {
    assert(profile.distinctCount === 4 && !profile.hasInversion, 'P212121 has no inversion');
    assert(profile.properRotationsCount === 4, 'P212121 all 4 proper rotations');
  }
}
console.log('  ✅ T5 PASSED: All 8 registered space group profiles verified.\n');

// -----------------------------------------------------------------------------
// T8: Empty Input Handling
// -----------------------------------------------------------------------------
console.log('TEST T8: Empty Input Handling...');
const profEmpty = buildOperationSetProfile([]);
assert(profEmpty.totalCount === 0, 'T8: totalCount must be 0');
assert(profEmpty.distinctCount === 0, 'T8: distinctCount must be 0');
assert(!profEmpty.hasDuplicates, 'T8: hasDuplicates must be false');
assert(!profEmpty.hasInversion, 'T8: hasInversion must be false');
console.log('  ✅ T8 PASSED: Empty input correctly handled.\n');

// -----------------------------------------------------------------------------
// T9: Malformed Input Rejection
// -----------------------------------------------------------------------------
console.log('TEST T9: Malformed Input Rejection...');
let caughtZeroDen = false;
try {
  buildOperationSetProfile([
    {
      W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      w: [{ numerator: 1, denominator: 0 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
    }
  ]);
} catch (e: any) {
  caughtZeroDen = true;
  assert(e.message.includes('denominator'), 'Must mention denominator error');
}
assert(caughtZeroDen, 'T9: Zero denominator must be rejected');

let caughtMalformedMatrix = false;
try {
  buildOperationSetProfile([
    {
      W: [[1, 0]], // Bad row length
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
    } as any
  ]);
} catch (e: any) {
  caughtMalformedMatrix = true;
}
assert(caughtMalformedMatrix, 'T9: Malformed matrix must be rejected');
console.log('  ✅ T9 PASSED: Malformed operations cleanly rejected.\n');

// -----------------------------------------------------------------------------
// T10: Determinism Across 100 Runs
// -----------------------------------------------------------------------------
console.log('TEST T10: Determinism Across 100 Runs...');
const p21cRecord = SymmetryCatalog.findBySettingId('P21/c')!;
const baseJson = JSON.stringify(buildOperationSetProfile(p21cRecord.operations));
for (let run = 0; run < 100; run++) {
  const currentJson = JSON.stringify(buildOperationSetProfile(p21cRecord.operations));
  assert(currentJson === baseJson, 'T10: Determinism violated');
}
console.log('  ✅ T10 PASSED: 100/100 runs bit-identical and fully deterministic.\n');

console.log('====================================================');
console.log('ALL EXP-09 PROFILE TESTS PASSED SUCCESSFULLY (100%)');
console.log('====================================================');
