import {
  SpaceGroupRecord,
  ExchangeManifest,
  validateStructuralRecord,
  validateMathematicalGroup,
  validateProvenance,
  validateExchangeRecord,
  ExactRational
} from './crystallographic_exchange';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('Running KB-10A Exact Arithmetic and Group Validation Audit Tests...\n');

// =============================================================================
// 1. EXACT RATIONAL ARITHMETIC AUDIT & BOUNDARY TESTS
// =============================================================================
console.log('1. Testing Exact Rational Arithmetic & Safe Integer Boundaries...');

// 1.1 Fraction simplification & equivalent fractions
const rHalf1 = new ExactRational(1, 2);
const rHalf2 = new ExactRational(2, 4);
const rHalf3 = new ExactRational(50, 100);
assert(rHalf1.n === 1 && rHalf1.d === 2, '1/2 must have canonical n=1, d=2');
assert(rHalf2.n === 1 && rHalf2.d === 2, '2/4 must reduce to canonical n=1, d=2');
assert(rHalf3.n === 1 && rHalf3.d === 2, '50/100 must reduce to canonical n=1, d=2');
assert(rHalf1.equals(rHalf2), '1/2 and 2/4 must be equal');
assert(rHalf1.equals(rHalf3), '1/2 and 50/100 must be equal');

// 1.2 Addition and multiplication
const r1_3 = new ExactRational(1, 3);
const r1_6 = new ExactRational(1, 6);
const rAdd = r1_3.add(r1_6);
assert(rAdd.n === 1 && rAdd.d === 2, '1/3 + 1/6 must equal 1/2');

const rMul = rHalf1.mul(r1_3);
assert(rMul.n === 1 && rMul.d === 6, '1/2 * 1/3 must equal 1/6');

// 1.3 Negative numerators and positive denominators
const rNeg1 = new ExactRational(-1, 4);
assert(rNeg1.n === -1 && rNeg1.d === 4, '-1/4 must have n=-1, d=4');
const rNeg2 = new ExactRational(-6, 8);
assert(rNeg2.n === -3 && rNeg2.d === 4, '-6/8 must reduce to n=-3, d=4');

// 1.4 Modulo 1 lattice reduction
// Positive fraction < 1
assert(rHalf1.mod1().equals(rHalf1), '1/2 mod 1 must equal 1/2');

// Positive fraction > 1 (integer carry)
const r3_2 = new ExactRational(3, 2);
assert(r3_2.mod1().n === 1 && r3_2.mod1().d === 2, '3/2 mod 1 must equal 1/2');

const r5_2 = new ExactRational(5, 2);
assert(r5_2.mod1().n === 1 && r5_2.mod1().d === 2, '5/2 mod 1 must equal 1/2');

const rExactInt = new ExactRational(4, 2);
assert(rExactInt.mod1().n === 0 && rExactInt.mod1().d === 1, '4/2 mod 1 must equal 0/1');

// Negative fractions mod 1
const rNegMod1 = rNeg1.mod1(); // -1/4 mod 1 = 3/4
assert(rNegMod1.n === 3 && rNegMod1.d === 4, '-1/4 mod 1 must equal 3/4');

const rNeg5_2 = new ExactRational(-5, 2); // -2.5 mod 1 = 0.5 (1/2)
assert(rNeg5_2.mod1().n === 1 && rNeg5_2.mod1().d === 2, '-5/2 mod 1 must equal 1/2');

const rNegInt = new ExactRational(-4, 4); // -1 mod 1 = 0/1
assert(rNegInt.mod1().n === 0 && rNegInt.mod1().d === 1, '-4/4 mod 1 must equal 0/1');

// 1.5 Safe Integer Boundaries
assert(Number.isSafeInteger(Number.MAX_SAFE_INTEGER), 'Sanity check: MAX_SAFE_INTEGER is safe');
const rMaxSafe = new ExactRational(Number.MAX_SAFE_INTEGER, 1);
assert(rMaxSafe.n === Number.MAX_SAFE_INTEGER, 'MAX_SAFE_INTEGER accepted');

// Unsafe integer rejection
let caughtUnsafeNum = false;
try {
  new ExactRational(9007199254740992 + 2, 1);
} catch (e: any) {
  if (e.message.includes('safe integer')) caughtUnsafeNum = true;
}
assert(caughtUnsafeNum, 'Unsafe integer numerator (> MAX_SAFE_INTEGER) must be rejected');

let caughtUnsafeDen = false;
try {
  new ExactRational(1, 9007199254740992 + 2);
} catch (e: any) {
  if (e.message.includes('safe integer')) caughtUnsafeDen = true;
}
assert(caughtUnsafeDen, 'Unsafe integer denominator (> MAX_SAFE_INTEGER) must be rejected');

// Non-integer (floats) rejection
let caughtFloatNum = false;
try {
  new ExactRational(0.5, 1);
} catch (e: any) {
  if (e.message.includes('safe integer')) caughtFloatNum = true;
}
assert(caughtFloatNum, 'Float numerator (0.5) must be rejected');

// Zero denominator rejection
let caughtZeroDenom = false;
try {
  new ExactRational(1, 0);
} catch (e: any) {
  if (e.message.includes('positive non-zero integer')) caughtZeroDenom = true;
}
assert(caughtZeroDenom, 'Zero denominator must throw descriptive error');

// Negative denominator rejection
let caughtNegDenom = false;
try {
  new ExactRational(1, -5);
} catch (e: any) {
  if (e.message.includes('positive non-zero integer')) caughtNegDenom = true;
}
assert(caughtNegDenom, 'Negative denominator must throw descriptive error');

console.log('✅ Exact Rational Arithmetic and Safe Integer tests passed.\n');

// =============================================================================
// 2. POSITIVE BENCHMARK SPACE GROUPS (Nos. 1, 2, 14, 19)
// =============================================================================
console.log('2. Testing Positive Reference Space Groups...');

const verifiedManifest: ExchangeManifest = {
  schemaId: 'https://fss.local/schemas/crystallographic-exchange-v1.json',
  schemaVersion: '1.0.0',
  sourceName: 'Gemmi',
  sourceRepository: 'https://github.com/project-gemmi/gemmi',
  sourceCommit: '6ea553a',
  tablePath: 'gemmi/include/gemmi/symmetry.hpp',
  license: 'MPL-2.0',
  attribution: 'International Tables for Crystallography (ITA)',
  extractorVersion: '1.0.0',
  extractedAt: '2026-10-10T00:00:00Z',
  recordCount: 4,
  isSourceVerified: true
};

const benchmarkGroup1: SpaceGroupRecord = {
  spaceGroupNumber: 1,
  settingId: 'P1',
  hmSymbol: 'P 1',
  hallSymbol: 'P 1',
  crystalSystem: 'triclinic',
  centering: 'P',
  operationsCount: 1,
  operations: [
    {
      W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }],
      triplet: 'x,y,z'
    }
  ],
  provenance: {
    sourceName: 'Gemmi',
    sourceCommit: '6ea553a',
    isVerified: true
  }
};

const benchmarkGroup2: SpaceGroupRecord = {
  spaceGroupNumber: 2,
  settingId: 'P-1',
  hmSymbol: 'P -1',
  hallSymbol: '-P 1',
  crystalSystem: 'triclinic',
  centering: 'P',
  operationsCount: 2,
  operations: [
    {
      W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
    },
    {
      W: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
    }
  ],
  provenance: {
    sourceName: 'Gemmi',
    sourceCommit: '6ea553a',
    isVerified: true
  }
};

const benchmarkGroup14: SpaceGroupRecord = {
  spaceGroupNumber: 14,
  settingId: 'P21/c',
  hmSymbol: 'P 21/c',
  hallSymbol: '-P 2ybc',
  crystalSystem: 'monoclinic',
  centering: 'P',
  uniqueAxis: 'b',
  cellChoice: 1,
  operationsCount: 4,
  operations: [
    {
      W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
    },
    {
      W: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }]
    },
    {
      W: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
    },
    {
      W: [[1, 0, 0], [0, -1, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }]
    }
  ],
  provenance: {
    sourceName: 'Gemmi',
    sourceCommit: '6ea553a',
    isVerified: true
  }
};

const benchmarkGroup19: SpaceGroupRecord = {
  spaceGroupNumber: 19,
  settingId: 'P212121',
  hmSymbol: 'P 21 21 21',
  hallSymbol: 'P 2ac 2ab',
  crystalSystem: 'orthorhombic',
  centering: 'P',
  operationsCount: 4,
  operations: [
    {
      W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
    },
    {
      W: [[1, 0, 0], [0, -1, 0], [0, 0, -1]],
      w: [{ numerator: 1, denominator: 2 }, { numerator: 0, denominator: 1 }, { numerator: 1, denominator: 2 }]
    },
    {
      W: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]],
      w: [{ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }, { numerator: 0, denominator: 1 }]
    },
    {
      W: [[-1, 0, 0], [0, -1, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }]
    }
  ],
  provenance: {
    sourceName: 'Gemmi',
    sourceCommit: '6ea553a',
    isVerified: true
  }
};

const benchmarks = [benchmarkGroup1, benchmarkGroup2, benchmarkGroup14, benchmarkGroup19];

for (const group of benchmarks) {
  const report = validateExchangeRecord(group, verifiedManifest);
  assert(report.structural.valid, `Group ${group.settingId} structural failed`);
  assert(report.mathematical.valid, `Group ${group.settingId} mathematical failed`);
  assert(report.mathematical.hasIdentity, `Group ${group.settingId} missing identity`);
  assert(report.mathematical.hasInverses, `Group ${group.settingId} missing inverses`);
  assert(report.mathematical.isClosed, `Group ${group.settingId} not closed`);
  assert(report.provenance.valid, `Group ${group.settingId} provenance failed`);
  assert(report.provenance.isVerified, `Group ${group.settingId} must be verified`);
  assert(report.overallValid, `Group ${group.settingId} must be overall valid`);
  console.log(`  ✓ Group ${group.spaceGroupNumber} (${group.settingId}): All 3 layers VERIFIED`);
}
console.log('✅ Positive benchmark tests passed.\n');

// =============================================================================
// 3. NEGATIVE STRUCTURAL TESTS
// =============================================================================
console.log('3. Testing Negative Structural Validation Cases...');

// 3.1 Unsafe integer in matrix W
const unsafeMatRecord: SpaceGroupRecord = {
  ...benchmarkGroup1,
  operations: [
    {
      W: [[9007199254740992 + 2, 0, 0], [0, 1, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
    }
  ]
};
const repUnsafeMat = validateStructuralRecord(unsafeMatRecord);
assert(!repUnsafeMat.valid, 'Unsafe matrix integer must be rejected');
assert(repUnsafeMat.errors.some(e => e.includes('must be a safe integer')), 'Must report safe integer error for matrix W');

// 3.2 Unsafe integer in translation
const unsafeTransRecord: SpaceGroupRecord = {
  ...benchmarkGroup1,
  operations: [
    {
      W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      w: [{ numerator: 9007199254740992 + 2, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
    }
  ]
};
const repUnsafeTrans = validateStructuralRecord(unsafeTransRecord);
assert(!repUnsafeTrans.valid, 'Unsafe translation numerator must be rejected');
assert(repUnsafeTrans.errors.some(e => e.includes('numerator must be safe integer')), 'Must report safe integer error for translation');

// 3.3 Out of range group numbers (0 and 231)
const repGroup0 = validateStructuralRecord({ ...benchmarkGroup1, spaceGroupNumber: 0 });
assert(!repGroup0.valid && repGroup0.errors.some(e => e.includes('out of range')), 'Group 0 must be rejected');
const repGroup231 = validateStructuralRecord({ ...benchmarkGroup1, spaceGroupNumber: 231 });
assert(!repGroup231.valid && repGroup231.errors.some(e => e.includes('out of range')), 'Group 231 must be rejected');

// 3.4 Missing settingId
const repEmptySetting = validateStructuralRecord({ ...benchmarkGroup1, settingId: '' });
assert(!repEmptySetting.valid && repEmptySetting.errors.some(e => e.includes('Missing or empty settingId')), 'Empty settingId must be rejected');

// 3.5 Duplicate operation in structure
const repDuplicateStruct = validateStructuralRecord({
  ...benchmarkGroup2,
  operations: [benchmarkGroup2.operations[0], benchmarkGroup2.operations[0]] // Two identical identity ops
});
assert(!repDuplicateStruct.valid, 'Duplicate operations must be structurally rejected');
assert(repDuplicateStruct.errors.some(e => e.includes('Duplicate symmetry operation detected')), 'Must report duplicate operation');

// 3.6 Declared vs Actual operations count mismatch
const repCountMismatch = validateStructuralRecord({
  ...benchmarkGroup14,
  operationsCount: 3 // Declared 3, but 4 provided
});
assert(!repCountMismatch.valid, 'Count mismatch must be rejected');
assert(repCountMismatch.errors.some(e => e.includes('Declared operationsCount (3) does not match actual operations length (4)')), 'Must report count mismatch');

console.log('✅ Negative structural tests passed.\n');

// =============================================================================
// 4. MATHEMATICAL GROUP VALIDATION AUDIT (CORRECT SIZE BUT INVALID SET)
// =============================================================================
console.log('4. Testing Mathematical Group Validation Audit Cases...');

// 4.1 Set of correct size (4 operations), but containing a duplicate (and therefore missing an element)
// Declared: 4 operations. Operations: Identity, 2_1(x), 2_1(y), and duplicate 2_1(y) instead of 2_1(z).
const correctSizeWithDuplicate: SpaceGroupRecord = {
  spaceGroupNumber: 19,
  settingId: 'P212121_dup_element',
  hmSymbol: 'P 21 21 21',
  hallSymbol: 'P 2ac 2ab',
  operationsCount: 4,
  operations: [
    benchmarkGroup19.operations[0], // Identity
    benchmarkGroup19.operations[1], // 2_1(x)
    benchmarkGroup19.operations[2], // 2_1(y)
    benchmarkGroup19.operations[2]  // Duplicate 2_1(y) instead of 2_1(z)
  ]
};
const repMathDup = validateMathematicalGroup(correctSizeWithDuplicate);
assert(!repMathDup.valid, 'Set with duplicate elements must fail mathematical group validation');
assert(repMathDup.errors.some(e => e.includes('Mathematical set contains duplicate operations')), 'Must report duplicate operations in mathematical set');
assert(!repMathDup.isClosed, 'Set with missing 2_1(z) must violate closure');
assert(repMathDup.errors.some(e => e.includes('Group closure violated')), 'Must report closure violation for missing product');

// 4.2 Set of correct size (4 operations), but with an arbitrary non-closed operation
// Replace 2_1(z) with a 90-degree rotation (which belongs to tetragonal, not orthorhombic)
const correctSizeNonClosed: SpaceGroupRecord = {
  spaceGroupNumber: 19,
  settingId: 'P212121_wrong_element',
  hmSymbol: 'P 21 21 21',
  hallSymbol: 'P 2ac 2ab',
  operationsCount: 4,
  operations: [
    benchmarkGroup19.operations[0], // Identity
    benchmarkGroup19.operations[1], // 2_1(x)
    benchmarkGroup19.operations[2], // 2_1(y)
    {
      // 4-fold rotation around z: (x,y,z) -> (-y, x, z)
      W: [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
    }
  ]
};
const repWrongElem = validateMathematicalGroup(correctSizeNonClosed);
assert(!repWrongElem.valid, 'Set with foreign 4-fold rotation must fail mathematical group validation');
assert(!repWrongElem.isClosed, 'Must violate closure');
assert(repWrongElem.errors.some(e => e.includes('Group closure violated')), 'Must report closure violation');

// 4.3 Set missing Identity operation
const missingIdGroup: SpaceGroupRecord = {
  spaceGroupNumber: 2,
  settingId: 'P-1_no_id',
  hmSymbol: 'P -1',
  hallSymbol: '-P 1',
  operationsCount: 2,
  operations: [
    // Inversion
    {
      W: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
    },
    // Another inversion with translation
    {
      W: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]],
      w: [{ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }]
    }
  ]
};
const repNoId = validateMathematicalGroup(missingIdGroup);
assert(!repNoId.valid, 'Group without identity must fail');
assert(!repNoId.hasIdentity, 'hasIdentity must be false');
assert(repNoId.errors.some(e => e.includes('Missing identity symmetry operation')), 'Must report missing identity');

// 4.4 Set lacking two-sided inverse
// Construct set: Identity and a non-involutory operation without its inverse
const missingInverseGroup: SpaceGroupRecord = {
  spaceGroupNumber: 3,
  settingId: 'P2_broken_inv',
  hmSymbol: 'P 2',
  hallSymbol: 'P 2',
  operationsCount: 2,
  operations: [
    // Identity
    {
      W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
    },
    // Non-involutory rotation around z by 120 degrees
    {
      W: [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
      w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
    }
  ]
};
const repNoInv = validateMathematicalGroup(missingInverseGroup);
assert(!repNoInv.valid, 'Set without inverse must fail');
assert(!repNoInv.hasInverses, 'hasInverses must be false');
assert(repNoInv.errors.some(e => e.includes('lacks a two-sided inverse')), 'Must report missing two-sided inverse');

console.log('✅ Mathematical Group Validation Audit tests passed.\n');

// =============================================================================
// 5. INDEPENDENCE OF PROVENANCE, STRUCTURAL, AND MATHEMATICAL LAYERS
// =============================================================================
console.log('5. Testing Independence of Validation Layers...');

// 5.1 Valid structure + Valid mathematics, but NO provenance
const mathematicallySoundUnverified: SpaceGroupRecord = {
  ...benchmarkGroup2,
  provenance: undefined // No provenance block
};
const reportUnverified = validateExchangeRecord(mathematicallySoundUnverified);
assert(reportUnverified.structural.valid, 'Structural validity must be TRUE');
assert(reportUnverified.mathematical.valid, 'Mathematical validity must be TRUE');
assert(reportUnverified.provenance.valid, 'Provenance validity is TRUE (not errored)');
assert(!reportUnverified.provenance.isVerified, 'isVerified must be FALSE');
assert(reportUnverified.provenance.warnings.length > 0, 'Must contain warning about missing provenance block');
console.log('  ✓ Unverified record can be mathematically validated without claiming verified source');

// 5.2 Valid structure + Valid mathematics, but FALSE isVerified flag
const explicitlyUnverifiedRecord: SpaceGroupRecord = {
  ...benchmarkGroup14,
  provenance: {
    sourceName: 'Hypothetical AI Generated Candidate',
    isVerified: false
  }
};
const reportExplicitlyUnverified = validateExchangeRecord(explicitlyUnverifiedRecord);
assert(reportExplicitlyUnverified.structural.valid, 'Structural validity must be TRUE');
assert(reportExplicitlyUnverified.mathematical.valid, 'Mathematical validity must be TRUE');
assert(!reportExplicitlyUnverified.provenance.isVerified, 'isVerified must be FALSE');
console.log('  ✓ Record with isVerified=false remains mathematically sound without false provenance claim');

// 5.3 Falsely claimed verification (claims isVerified=true, but commit is missing/truncated)
const falseClaimRecord: SpaceGroupRecord = {
  ...benchmarkGroup19,
  provenance: {
    sourceName: 'Gemmi',
    sourceCommit: '123', // Truncated / invalid (< 7 chars)
    isVerified: true
  }
};
const reportFalseClaim = validateExchangeRecord(falseClaimRecord);
assert(reportFalseClaim.structural.valid, 'Structural validity is TRUE');
assert(reportFalseClaim.mathematical.valid, 'Mathematical validity is TRUE');
assert(!reportFalseClaim.provenance.valid, 'Provenance must be INVALID due to invalid commit');
assert(!reportFalseClaim.overallValid, 'Overall valid must be FALSE');
assert(reportFalseClaim.provenance.errors.some(e => e.includes('sourceCommit is missing or incomplete')), 'Must reject truncated commit');
console.log('  ✓ Fraudulent / incomplete commit claim is caught cleanly');

console.log('✅ Independence of Validation Layers verified.\n');

console.log('====================================================');
console.log('ALL KB-10A AUDIT TESTS PASSED SUCCESSFULLY (100%)');
console.log('====================================================');
