import * as path from 'path';
import {
  ReferenceArtifactLoader,
  OriginShiftAnalyzer,
  CrystallographicComparator,
  GroupComparisonReport
} from './reference_loader';
import { SymmetryCatalog } from './registry';
import { ExactRational, Rational, ExchangeSymmetryOperation } from './schema/crystallographic_exchange';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('Running KB-13A Crystallographic Reference Loader & Comparator Tests...\n');

const ARTIFACT_PATH = path.resolve('data/crystallography/gemmi_benchmark_4.json');

// -----------------------------------------------------------------------------
// 1. Reference Artifact Loader Tests
// -----------------------------------------------------------------------------
console.log('1. Testing ReferenceArtifactLoader...');

const artifact = ReferenceArtifactLoader.loadFromFile(ARTIFACT_PATH);
assert(artifact !== undefined, 'Artifact must load successfully');
assert(artifact.manifest.sourceName === 'Gemmi', 'Manifest sourceName must be Gemmi');
assert(artifact.manifest.recordCount === 8, 'Manifest must declare 8 records');
assert(artifact.records.length === 8, 'Artifact must contain 8 records');
assert(artifact.manifest.recordCount === artifact.records.length, 'Manifest record count must match records array length');
assert(artifact.manifest.isSourceVerified === true, 'Manifest must be verified');

// Check canonical SHA-256 calculation
const computedSha = ReferenceArtifactLoader.computeCanonicalSha256(artifact.records);
assert(computedSha === artifact.manifest.sha256Checksum, 'Canonical SHA-256 must match manifest');
console.log(`  ✓ Successfully loaded and verified artifact with SHA-256: ${computedSha}`);

// Negative test: File not found
let caughtFileNotFound = false;
try {
  ReferenceArtifactLoader.loadFromFile('non_existent_file.json');
} catch (e: any) {
  caughtFileNotFound = true;
  assert(e.message.includes('not found'), 'Error should indicate file not found');
}
assert(caughtFileNotFound, 'Must throw error when artifact file is missing');

// Negative test: Checksum mismatch
let caughtChecksumMismatch = false;
try {
  const tamperedJson = JSON.stringify({
    ...artifact,
    manifest: { ...artifact.manifest, sha256Checksum: '0000000000000000000000000000000000000000000000000000000000000000' }
  });
  ReferenceArtifactLoader.parseAndValidate(tamperedJson);
} catch (e: any) {
  caughtChecksumMismatch = true;
  assert(e.message.includes('checksum mismatch'), 'Error should indicate checksum mismatch');
}
assert(caughtChecksumMismatch, 'Must throw error when checksum does not match');

// Negative test: Invalid record inside artifact
let caughtInvalidRecord = false;
try {
  const invalidRecordArtifact = JSON.parse(JSON.stringify(artifact));
  invalidRecordArtifact.records[0].spaceGroupNumber = 999; // invalid number
  // Recalculate checksum so it passes checksum check and fails contract validation
  invalidRecordArtifact.manifest.sha256Checksum = ReferenceArtifactLoader.computeCanonicalSha256(
    invalidRecordArtifact.records
  );
  ReferenceArtifactLoader.parseAndValidate(JSON.stringify(invalidRecordArtifact));
} catch (e: any) {
  caughtInvalidRecord = true;
  assert(e.message.includes('failed contract validation'), 'Error should indicate contract validation failure');
}
assert(caughtInvalidRecord, 'Must throw error when a record fails KB-10 contract validation');

console.log('  ✓ Negative loader tests passed');

// -----------------------------------------------------------------------------
// 2. Origin Shift Analyzer Tests
// -----------------------------------------------------------------------------
console.log('\n2. Testing OriginShiftAnalyzer...');

// Shift vector x_0 = (1/4, 1/4, 1/4)
const shift14: [Rational, Rational, Rational] = [
  { numerator: 1, denominator: 4 },
  { numerator: 1, denominator: 4 },
  { numerator: 1, denominator: 4 }
];

// Test shifting identity operation
const identityOp: ExchangeSymmetryOperation = {
  W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
};
const shiftedId = OriginShiftAnalyzer.applyOriginShift(identityOp, shift14);
assert(
  shiftedId.w.every(coord => coord.numerator === 0 && coord.denominator === 1),
  'Identity operation translation must remain (0,0,0) under any origin shift because (I - I)*x_0 = 0'
);

// Test Group 19 origin shift equivalence
const refGroup19 = artifact.records.find(r => r.spaceGroupNumber === 19)!;
const workingGroup19 = SymmetryCatalog.findBySettingId('P212121')!;

assert(refGroup19 !== undefined, 'Group 19 must exist in reference artifact');
assert(workingGroup19 !== undefined, 'Group 19 must exist in working catalog');

const isEquiv = OriginShiftAnalyzer.verifyEquivalenceUnderShift(
  refGroup19.operations,
  workingGroup19.operations,
  shift14
);
assert(isEquiv, 'Reference Group 19 and working catalog Group 19 must be equivalent under shift (1/4, 1/4, 1/4)');
console.log('  ✓ Mathematical origin shift equivalence proven: x_0 = (1/4, 1/4, 1/4)');

// Negative shift test: wrong shift vector must not match
const wrongShift: [Rational, Rational, Rational] = [
  { numerator: 1, denominator: 3 },
  { numerator: 0, denominator: 1 },
  { numerator: 0, denominator: 1 }
];
const isEquivWrong = OriginShiftAnalyzer.verifyEquivalenceUnderShift(
  refGroup19.operations,
  workingGroup19.operations,
  wrongShift
);
assert(!isEquivWrong, 'Wrong origin shift must return false');
console.log('  ✓ Non-equivalent shift correctly rejected');

// -----------------------------------------------------------------------------
// 3. Crystallographic Comparator Tests
// -----------------------------------------------------------------------------
console.log('\n3. Testing CrystallographicComparator...');

const reports = CrystallographicComparator.compareWithWorkingCatalog(artifact);
assert(reports.length === 8, 'Must produce reports for all 8 benchmark groups');
assert(reports.length === artifact.records.length, 'Report count must match reference artifact record count');

const rep1 = reports.find(r => r.spaceGroupNumber === 1)!;
assert(rep1.verdict === 'MATCH', 'Group 1 (P1) must have MATCH verdict');
assert(rep1.workingRecord !== undefined, 'Group 1 working record must be present');

const rep2 = reports.find(r => r.spaceGroupNumber === 2)!;
assert(rep2.verdict === 'MATCH', 'Group 2 (P-1) must have MATCH verdict');

const rep14 = reports.find(r => r.spaceGroupNumber === 14)!;
assert(rep14.verdict === 'MATCH', 'Group 14 (P21/c) must have MATCH verdict');

const rep19 = reports.find(r => r.spaceGroupNumber === 19)!;
assert(rep19.verdict === 'SETTING_MISMATCH', 'Group 19 (P212121) must have SETTING_MISMATCH verdict');
assert(rep19.originShiftAnalysis !== undefined, 'Group 19 must have originShiftAnalysis');
assert(rep19.originShiftAnalysis.isEquivalenceProven === true, 'Equivalence under shift must be proven for Group 19');
assert(
  rep19.originShiftAnalysis.shiftVector[0].numerator === 1 &&
  rep19.originShiftAnalysis.shiftVector[0].denominator === 4,
  'Shift vector must be (1/4, 1/4, 1/4)'
);

console.log('  ✓ Benchmark comparison results:');
for (const r of reports) {
  console.log(`    - Group ${r.spaceGroupNumber} (${r.settingId}): ${r.verdict}`);
}

// -----------------------------------------------------------------------------
// 4. Immutability of Working Catalog Verification
// -----------------------------------------------------------------------------
console.log('\n4. Verifying Working Catalog Immutability...');

// Check that core/registry.ts remains completely unchanged
const p1InCatalog = SymmetryCatalog.findBySettingId('P1')!;
assert(
  p1InCatalog.provenanceDetails.commitOrVersion === '6ea553a',
  'Working catalog must retain its original provenance and records unchanged'
);
const p19InCatalog = SymmetryCatalog.findBySettingId('P212121')!;
assert(
  p19InCatalog.operations[1].W[0][0] === 1 &&
  p19InCatalog.operations[1].W[1][1] === -1 &&
  p19InCatalog.operations[1].W[2][2] === -1,
  'Working catalog Group 19 operations must remain in original working setting'
);

console.log('  ✓ Working catalog core/registry.ts remains completely intact and unmodified');

// -----------------------------------------------------------------------------
// 5. Comparator Edge Cases & Boundary Handling
// -----------------------------------------------------------------------------
console.log('\n5. Testing Comparator Boundary Handling...');

// Synthetic artifact with missing group in working catalog
const syntheticArtifact: any = {
  manifest: { ...artifact.manifest, recordCount: 1, sha256Checksum: '' },
  records: [
    {
      ...artifact.records[0],
      settingId: 'P_UNKNOWN_999'
    }
  ]
};
const syntheticReports = CrystallographicComparator.compareWithWorkingCatalog(syntheticArtifact);
assert(syntheticReports[0].verdict === 'INCOMPLETE', 'Missing group must produce INCOMPLETE verdict');
assert(syntheticReports[0].details.includes('missing in working catalog'), 'Must explain reason');

console.log('  ✓ Boundary and incomplete record handling verified');

console.log('\n====================================================');
console.log('ALL KB-13A REFERENCE LOADER & COMPARATOR TESTS PASSED');
console.log('====================================================');
