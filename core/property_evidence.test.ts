import * as path from 'path';
import {
  CrystallographicEvidenceGenerator,
  EvidenceBackedGroupReport,
  PropertyEvidence
} from './property_evidence';
import { ReferenceArtifactLoader } from './reference_loader';
import { SpaceGroupRecord } from './schema/crystallographic_exchange';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('Running KB-15 Evidence-Backed Mathematical Property Reports Tests...\n');

const ARTIFACT_PATH = path.resolve('data/crystallography/gemmi_benchmark_4.json');
const artifact = ReferenceArtifactLoader.loadFromFile(ARTIFACT_PATH);
const benchmarkReports = CrystallographicEvidenceGenerator.generateBenchmarkReports(ARTIFACT_PATH);

// -----------------------------------------------------------------------------
// TEST 1: Subject and Setting Linkage
// -----------------------------------------------------------------------------
console.log('1. Testing Subject and Setting Linkage across all Evidences...');

assert(benchmarkReports.length === 8, 'Must generate reports for all 8 benchmark groups');

for (const rep of benchmarkReports) {
  assert(rep.passport.spaceGroupNumber > 0, 'Group number must be positive');
  assert(typeof rep.passport.settingId === 'string' && rep.passport.settingId.length > 0, 'settingId must not be empty');

  for (const evid of rep.evidenceList) {
    assert(
      evid.subject.spaceGroupNumber === rep.passport.spaceGroupNumber,
      `Evidence ${evid.evidenceId} subject spaceGroupNumber mismatch`
    );
    assert(
      evid.subject.settingId === rep.passport.settingId,
      `Evidence ${evid.evidenceId} subject settingId mismatch`
    );
    assert(evid.evidenceId.startsWith(`EVID-SG${rep.passport.spaceGroupNumber}-`), 'Evidence ID prefix must match group');
    assert(evid.sourceChecksum === rep.sourceProvenance.artifactChecksum, 'Source checksum must match manifest');
  }
}
console.log('  ✓ All 8 group reports strictly bind each evidence to its subject group and setting');

// -----------------------------------------------------------------------------
// TEST 2: Operation References Integrity
// -----------------------------------------------------------------------------
console.log('\n2. Testing Operation References Integrity...');

for (const rep of benchmarkReports) {
  const matchingRecord = artifact.records.find(r => r.spaceGroupNumber === rep.passport.spaceGroupNumber)!;
  assert(matchingRecord !== undefined, `Artifact must contain record for group ${rep.passport.spaceGroupNumber}`);

  for (const evid of rep.evidenceList) {
    for (const ref of evid.operationReferences) {
      assert(
        ref.operationIndex >= 0 && ref.operationIndex < matchingRecord.operations.length,
        `Operation index ${ref.operationIndex} must be within bounds [0, ${matchingRecord.operations.length})`
      );
      const targetOp = matchingRecord.operations[ref.operationIndex];
      assert(
        ref.matrixKey === JSON.stringify(targetOp.W),
        `Matrix key in reference ${ref.operationIndex} must match actual operation W`
      );
      assert(ref.linearOrder >= 1 && ref.linearOrder <= 6, 'Linear order must satisfy crystallographic restriction');
    }
  }
}
console.log('  ✓ All operation references strictly point to existing, authentic operations in the record');

// -----------------------------------------------------------------------------
// TEST 3: Exact Calculation Concordance
// -----------------------------------------------------------------------------
console.log('\n3. Testing Exact Calculation Concordance in Evidences...');

// Group 14 (P21/c):
const rep14 = benchmarkReports.find(r => r.passport.spaceGroupNumber === 14)!;
assert(rep14 !== undefined, 'Group 14 report must exist');

// Op 1 in Group 14: 2_1 screw axis along y -> tau = (0, 1/2, 0)
const evid14_screw = rep14.evidenceList.find(e => e.property === 'OPERATION_POWER_AND_INTRINSIC_TRANSLATION_OP_1')!;
assert(evid14_screw !== undefined, 'Group 14 Op 1 evidence must exist');
assert(evid14_screw.result.linearOrder === 2, 'Linear order must be 2');
assert(
  evid14_screw.result.intrinsicTranslation[0].numerator === 0 &&
  evid14_screw.result.intrinsicTranslation[1].numerator === 1 &&
  evid14_screw.result.intrinsicTranslation[1].denominator === 2 &&
  evid14_screw.result.intrinsicTranslation[2].numerator === 0,
  'Group 14 Op 1 intrinsic translation tau must be (0, 1/2, 0)'
);
assert(evid14_screw.result.hasNonZeroIntrinsicTranslation === true, 'Op 1 must have non-zero tau');
assert(evid14_screw.result.isUnreducedTranslationLatticeVector === true, 'Op 1 t_unreduced must be lattice vector');

// Op 3 in Group 14: c-glide plane across xz -> tau = (0, 0, 1/2)
const evid14_glide = rep14.evidenceList.find(e => e.property === 'OPERATION_POWER_AND_INTRINSIC_TRANSLATION_OP_3')!;
assert(evid14_glide !== undefined, 'Group 14 Op 3 evidence must exist');
assert(
  evid14_glide.result.intrinsicTranslation[0].numerator === 0 &&
  evid14_glide.result.intrinsicTranslation[1].numerator === 0 &&
  evid14_glide.result.intrinsicTranslation[2].numerator === 1 &&
  evid14_glide.result.intrinsicTranslation[2].denominator === 2,
  'Group 14 Op 3 intrinsic translation tau must be (0, 0, 1/2)'
);

// Group 2 (P-1): Centrosymmetry and origin inversion
const rep2 = benchmarkReports.find(r => r.passport.spaceGroupNumber === 2)!;
const evid2_centro = rep2.evidenceList.find(e => e.property === 'CENTROSYMMETRY_AND_INVERSION_CENTER')!;
assert(evid2_centro.result.hasInversion === true, 'Group 2 must have inversion');
assert(
  evid2_centro.result.inversionCenter[0].numerator === 0 &&
  evid2_centro.result.inversionCenter[1].numerator === 0 &&
  evid2_centro.result.inversionCenter[2].numerator === 0,
  'Group 2 inversion center must be (0, 0, 0)'
);

// Group 19 (P212121): All 3 non-trivial operations have non-zero tau
const rep19 = benchmarkReports.find(r => r.passport.spaceGroupNumber === 19)!;
for (let i = 1; i <= 3; i++) {
  const evid19_op = rep19.evidenceList.find(e => e.property === `OPERATION_POWER_AND_INTRINSIC_TRANSLATION_OP_${i}`)!;
  assert(evid19_op.result.hasNonZeroIntrinsicTranslation === true, `Group 19 Op ${i} must have non-zero tau`);
}

console.log('  ✓ Mathematical calculations in evidence match exact theoretical expectations');

// -----------------------------------------------------------------------------
// TEST 4: Data Tampering Detection
// -----------------------------------------------------------------------------
console.log('\n4. Testing Data Tampering Detection...');

const record14 = artifact.records.find(r => r.spaceGroupNumber === 14)!;
const tamperedRecord: SpaceGroupRecord = JSON.parse(JSON.stringify(record14));
tamperedRecord.operations[1].w[1] = { numerator: 1, denominator: 3 }; // tamper translation 1/2 -> 1/3

const repTampered = CrystallographicEvidenceGenerator.generateReportForRecord(
  tamperedRecord,
  artifact.manifest
);
assert(
  repTampered.validationSummary.mathematicalAxioms.isClosed === false,
  'Tampered translation must break group closure'
);
const evidTamperedScrew = repTampered.evidenceList.find(
  e => e.property === 'OPERATION_POWER_AND_INTRINSIC_TRANSLATION_OP_1'
)!;
assert(
  evidTamperedScrew.result.intrinsicTranslation[1].numerator === 1 &&
  evidTamperedScrew.result.intrinsicTranslation[1].denominator === 3,
  'Tampered translation must be reflected in evidence result'
);
assert(
  evidTamperedScrew.result.isUnreducedTranslationLatticeVector === false,
  'Tampered translation sum (2/3) is NOT an integer lattice vector'
);

console.log('  ✓ Tampered data detected cleanly by validation and reflected in evidence');

// -----------------------------------------------------------------------------
// TEST 5: Tampered Checksum Prevents Source Verification
// -----------------------------------------------------------------------------
console.log('\n5. Testing Tampered Checksum Prevention...');

const tamperedManifest = {
  ...artifact.manifest,
  sha256Checksum: 'invalid_corrupted_hash',
  isSourceVerified: false
};

const repUntrusted = CrystallographicEvidenceGenerator.generateReportForRecord(
  artifact.records[0],
  tamperedManifest
);
assert(repUntrusted.sourceProvenance.isSourceVerified === false, 'Source must not be verified');
for (const evid of repUntrusted.evidenceList) {
  assert(
    evid.verificationStatus === 'CONFLICT',
    'Evidence with unverified/corrupted manifest checksum must receive CONFLICT status'
  );
}
console.log('  ✓ Corrupted checksum correctly demotes evidence status to CONFLICT');

// -----------------------------------------------------------------------------
// TEST 6: Strict Prohibition of False Promotion to REFERENCE_VERIFIED
// -----------------------------------------------------------------------------
console.log('\n6. Testing Verification Levels & No False Promotion...');

for (const rep of benchmarkReports) {
  for (const evid of rep.evidenceList) {
    // None of the internal computed properties should claim REFERENCE_VERIFIED without an external independent reference
    assert(
      evid.verificationStatus !== 'REFERENCE_VERIFIED',
      `Evidence ${evid.evidenceId} must not be falsely promoted to REFERENCE_VERIFIED`
    );
    assert(
      evid.verificationStatus === 'PROPERTY_VERIFIED' || evid.verificationStatus === 'PROPERTY_COMPUTED',
      `Evidence ${evid.evidenceId} must have legitimate computed or verified status, got: ${evid.verificationStatus}`
    );
  }
}
console.log('  ✓ Verification levels strictly partitioned; zero false promotion to REFERENCE_VERIFIED');

// -----------------------------------------------------------------------------
// TEST 7: Permutation Invariance of Evidence Content
// -----------------------------------------------------------------------------
console.log('\n7. Testing Permutation Invariance of Evidence...');

const record14ForPerm = artifact.records.find(r => r.spaceGroupNumber === 14)!;
const reversedGroup14: SpaceGroupRecord = {
  ...record14ForPerm,
  operations: [...record14ForPerm.operations].reverse()
};

const repReversed = CrystallographicEvidenceGenerator.generateReportForRecord(
  reversedGroup14,
  artifact.manifest
);

assert(
  repReversed.validationSummary.mathematicalAxioms.valid === rep14.validationSummary.mathematicalAxioms.valid,
  'Mathematical axioms must remain valid under permutation'
);
const linearOrig = rep14.evidenceList.find(e => e.property === 'LINEAR_PARTS_SET')!;
const linearRev = repReversed.evidenceList.find(e => e.property === 'LINEAR_PARTS_SET')!;
assert(
  linearOrig.result.length === linearRev.result.length,
  'Distinct linear parts count must be identical under permutation'
);
console.log('  ✓ Mathematical properties in evidence are permutation invariant');

// -----------------------------------------------------------------------------
// TEST 8: Catalog Discrepancy Preservation (Group 19 Origin Shift)
// -----------------------------------------------------------------------------
console.log('\n8. Testing Preservation of Catalog Discrepancies in Reports...');

assert(rep19.catalogComparison.verdict === 'SETTING_MISMATCH', 'Group 19 must record SETTING_MISMATCH');
assert(rep19.catalogComparison.originShiftProven === true, 'Group 19 origin shift equivalence must be proven');
assert(
  rep19.catalogComparison.shiftVector![0].numerator === 1 &&
  rep19.catalogComparison.shiftVector![0].denominator === 4,
  'Origin shift vector must be (1/4, 1/4, 1/4)'
);
assert(
  rep19.unresolvedQuestionsAndLimitations.some(u => u.includes('Working catalog uses shifted origin')),
  'Report must explicitly record the origin shift difference under unresolved questions'
);

console.log('  ✓ Origin setting discrepancy preserved and traced in Group 19 report');

// -----------------------------------------------------------------------------
// TEST 9: Incomplete Data Handling
// -----------------------------------------------------------------------------
console.log('\n9. Testing Incomplete Data Handling...');

const incompleteRecord: SpaceGroupRecord = {
  spaceGroupNumber: 1,
  settingId: 'P1-incomplete',
  hmSymbol: 'P 1',
  hallSymbol: 'P 1',
  operationsCount: 0,
  operations: []
};

const repIncomplete = CrystallographicEvidenceGenerator.generateReportForRecord(
  incompleteRecord,
  artifact.manifest
);
assert(
  repIncomplete.evidenceList.every(e => e.verificationStatus === 'INCOMPLETE'),
  'All evidences for empty record must have INCOMPLETE status'
);
console.log('  ✓ Incomplete data correctly tagged with INCOMPLETE status');

// -----------------------------------------------------------------------------
// TEST 10: Reproducibility across 100 Runs
// -----------------------------------------------------------------------------
console.log('\n10. Testing Reproducibility across 100 Runs...');

const baseReportJson = JSON.stringify(CrystallographicEvidenceGenerator.generateBenchmarkReports(ARTIFACT_PATH));
for (let run = 1; run <= 100; run++) {
  const testJson = JSON.stringify(CrystallographicEvidenceGenerator.generateBenchmarkReports(ARTIFACT_PATH));
  assert(testJson === baseReportJson, `Run ${run} must be bit-identical to base run`);
}
console.log('  ✓ 100/100 runs bit-identical and fully deterministic');

console.log('\n====================================================');
console.log('ALL KB-15 EVIDENCE REPORT TESTS PASSED (100%)');
console.log('====================================================');
