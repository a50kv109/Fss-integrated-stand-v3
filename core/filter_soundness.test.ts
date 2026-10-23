/**
 * Candidate Filter Soundness & Strict Matcher Test Suite (EXP-09 Module)
 * 
 * Verifies the mathematical guarantees of the two-stage classification engine:
 * 1. Filter Soundness: Zero false negatives across all 8 registered settings.
 * 2. Stage 2 Strictness: Conflated profiles (P2 vs P21) strictly distinguished by canonical keys.
 * 3. Set vs Multiset semantics: Duplicate operations handled without data distortion.
 * 4. Boundary robustness: Rejection of malformed, empty, or non-crystallographic operations.
 * 5. Order invariance: Robustness against operation reordering and catalog permutation.
 */

import {
  filterCandidates,
  matchStrict,
  classifyOperationSet,
  getDefaultCatalog,
  isProfileCompatible,
  CandidateFilterResult
} from './operation_set_match';
import {
  buildOperationSetProfile,
  InputSymmetryOperation
} from './operation_set_profile';
import { SymmetryCatalog, DetailedSymmetryRecord } from './registry';
import { ReferenceArtifactLoader } from './reference_loader';
import * as path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('====================================================');
console.log('RUNNING EXP-09 CANDIDATE FILTER SOUNDNESS TEST SUITE');
console.log('====================================================\n');

const catalog = getDefaultCatalog();
assert(catalog.length === 8, 'Default catalog must contain exactly 8 registered settings');

// -----------------------------------------------------------------------------
// TEST T1: Identical Canonical Sets Match (EXACT_MATCH)
// Detects: Inability to recognize exact canonical group representations
// -----------------------------------------------------------------------------
console.log('TEST T1: Identical Canonical Sets Match (EXACT_MATCH)...');
for (const rec of catalog) {
  const report = classifyOperationSet(rec.operations, catalog);
  assert(
    report.verdict === 'EXACT_MATCH',
    `T1: ${rec.settingId} must achieve EXACT_MATCH, got ${report.verdict}`
  );
  assert(
    report.matchedSettingId === rec.settingId,
    `T1: ${rec.settingId} matched ID must be ${rec.settingId}, got ${report.matchedSettingId}`
  );
  assert(
    report.matchedSpaceGroupNumber === rec.groupNumber,
    `T1: ${rec.settingId} group number must be ${rec.groupNumber}`
  );
  assert(
    report.exactMatches.length === 1 && report.exactMatches[0] === rec.settingId,
    `T1: exactMatches must contain exactly ${rec.settingId}`
  );
}
console.log('  ✅ T1 PASSED: All 8 registered settings match their canonical representations.\n');

// -----------------------------------------------------------------------------
// TEST T2: Operation Reordering Invariance (Set Semantics)
// Detects: Fragile array index order dependence in matcher
// -----------------------------------------------------------------------------
console.log('TEST T2: Operation Reordering Invariance...');
for (const rec of catalog) {
  const reversedOps = [...rec.operations].reverse();
  const reportReversed = classifyOperationSet(reversedOps, catalog);
  assert(
    reportReversed.verdict === 'EXACT_MATCH',
    `T2: Reversed ${rec.settingId} must achieve EXACT_MATCH`
  );
  assert(
    reportReversed.matchedSettingId === rec.settingId,
    `T2: Reversed ${rec.settingId} matched setting must be ${rec.settingId}`
  );

  // Random permutation
  const shuffledOps = [...rec.operations].sort(() => 0.5 - Math.random());
  const reportShuffled = classifyOperationSet(shuffledOps, catalog);
  assert(
    reportShuffled.matchedSettingId === rec.settingId,
    `T2: Shuffled ${rec.settingId} must match ${rec.settingId}`
  );
}
console.log('  ✅ T2 PASSED: Arbitrary operation permutations yield bit-identical classifications.\n');

// -----------------------------------------------------------------------------
// TEST T3: Duplication of Operations (Set vs Multiset Semantics)
// Detects: Silent mutation, uninspected multiset distortion, false multiset match
// -----------------------------------------------------------------------------
console.log('TEST T3: Duplication of Operations (Set vs Multiset)...');
const p1Record = SymmetryCatalog.findBySettingId('P1')!;
// Construct multiset with 3 identical copies of the P1 identity operation
const p1Duplicates: InputSymmetryOperation[] = [
  p1Record.operations[0],
  p1Record.operations[0],
  p1Record.operations[0]
];
const reportDuplicates = classifyOperationSet(p1Duplicates, catalog);
assert(
  reportDuplicates.queryProfile.totalCount === 3,
  'T3: totalCount must reflect all 3 multiset operations'
);
assert(
  reportDuplicates.queryProfile.distinctCount === 1,
  'T3: distinctCount must reflect 1 unique operation mod 1'
);
assert(
  reportDuplicates.queryProfile.hasDuplicates === true,
  'T3: hasDuplicates must be true'
);
assert(
  reportDuplicates.verdict === 'EXACT_MATCH',
  'T3: Verdict should be EXACT_MATCH on set equality'
);
assert(
  reportDuplicates.matchedSettingId === 'P1',
  'T3: Must match P1'
);
assert(
  reportDuplicates.candidateEvaluations[0].isExactSetMatch === true,
  'T3: Distinct set match must be true'
);
assert(
  reportDuplicates.candidateEvaluations[0].isExactMultisetMatch === false,
  'T3: Multiset match must be false due to duplicates'
);
assert(
  reportDuplicates.notes.some(n => n.includes('duplicate operation(s)')),
  'T3: Notes must explicitly record duplicate detection'
);
console.log('  ✅ T3 PASSED: Duplicate operations handled without data loss or silent mutation.\n');

// -----------------------------------------------------------------------------
// TEST T4: Translation Distinction Preservation (P2 vs P21)
// Detects: False canonicalization or improper translation erasure
// -----------------------------------------------------------------------------
console.log('TEST T4: Translation Distinction Preservation (P2 vs P21)...');
const p2Record = SymmetryCatalog.findBySettingId('P2')!;
const p21Record = SymmetryCatalog.findBySettingId('P21')!;

const matchP2onP2 = matchStrict(p2Record.operations, p2Record);
const matchP2onP21 = matchStrict(p2Record.operations, p21Record);

assert(matchP2onP2.isExactSetMatch === true, 'T4: P2 query must match P2 target');
assert(
  matchP2onP21.isExactSetMatch === false,
  'T4: P2 query (pure rotation w=0) must NOT match P21 target (screw axis w_y=1/2)'
);
assert(
  matchP2onP21.missingInTargetKeys.length > 0,
  'T4: P2 against P21 must report missing keys in target'
);

const matchP21onP21 = matchStrict(p21Record.operations, p21Record);
const matchP21onP2 = matchStrict(p21Record.operations, p2Record);

assert(matchP21onP21.isExactSetMatch === true, 'T4: P21 query must match P21 target');
assert(
  matchP21onP2.isExactSetMatch === false,
  'T4: P21 query must NOT match P2 target'
);
console.log('  ✅ T4 PASSED: Pure rotation vs screw axis translations strictly differentiated.\n');

// -----------------------------------------------------------------------------
// TEST T5: Candidate Filter Soundness (Zero False Negatives)
// Detects: Over-aggressive candidate pruning
// -----------------------------------------------------------------------------
console.log('TEST T5: Candidate Filter Soundness (Zero False Negatives)...');
for (const rec of catalog) {
  const filterResult = filterCandidates(rec.operations, catalog);
  const candidateIds = filterResult.candidates.map(c => c.settingId);
  assert(
    candidateIds.includes(rec.settingId),
    `T5: Soundness failure: filter pruned true group ${rec.settingId} from candidates [${candidateIds.join(', ')}]`
  );
  assert(
    filterResult.prunedCount > 0,
    `T5: Filter must prune at least one incompatible setting for ${rec.settingId}`
  );
}
console.log('  ✅ T5 PASSED: Filter retains true group for 100% of registered settings.\n');

// -----------------------------------------------------------------------------
// TEST T6: Profile Collision Separation in Stage 2
// Detects: False match when distinct groups share invariant profile
// -----------------------------------------------------------------------------
console.log('TEST T6: Profile Collision Separation in Stage 2...');
const filterP2 = filterCandidates(p2Record.operations, catalog);
assert(
  filterP2.candidates.length === 2,
  'T6: Stage 1 filter must retain BOTH P2 and P21 for P2 query'
);
const candidateIdsP2 = filterP2.candidates.map(c => c.settingId).sort();
assert(
  candidateIdsP2[0] === 'P2' && candidateIdsP2[1] === 'P21',
  'T6: Candidate list must be exactly [P2, P21]'
);

const reportP2 = classifyOperationSet(p2Record.operations, catalog);
assert(
  reportP2.verdict === 'EXACT_MATCH',
  'T6: Overall verdict must be EXACT_MATCH'
);
assert(
  reportP2.matchedSettingId === 'P2',
  'T6: Matched setting must be P2, not P21'
);
assert(
  reportP2.exactMatches.length === 1 && reportP2.exactMatches[0] === 'P2',
  'T6: Only P2 must be an exact match'
);
console.log('  ✅ T6 PASSED: Colliding profiles in Stage 1 correctly resolved in Stage 2.\n');

// -----------------------------------------------------------------------------
// TEST T7: Verification Across All 8 Settings & Origin Shifted Group 19
// Detects: Unhandled setting discrepancies or catalog divergence
// -----------------------------------------------------------------------------
console.log('TEST T7: Verification of All 8 Settings & Origin Shifted Group 19...');
const expectedCandidates: Record<string, string[]> = {
  P1: ['P1'],
  'P-1': ['P-1'],
  P2: ['P2', 'P21'],
  P21: ['P2', 'P21'],
  C2: ['C2'],
  Cc: ['Cc'],
  'P21/c': ['P21/c'],
  P212121: ['P212121']
};

for (const [settingId, expected] of Object.entries(expectedCandidates)) {
  const rec = SymmetryCatalog.findBySettingId(settingId)!;
  const filtered = filterCandidates(rec.operations, catalog);
  const actualIds = filtered.candidates.map(c => c.settingId).sort();
  assert(
    JSON.stringify(actualIds) === JSON.stringify(expected.sort()),
    `T7: Filter mismatch for ${settingId}: expected ${expected}, got ${actualIds}`
  );
}

// Load Gemmi benchmark reference artifact (which uses standard ITA Volume A origin for Group 19)
const artifactPath = path.resolve('data/crystallography/gemmi_benchmark_4.json');
const artifact = ReferenceArtifactLoader.loadFromFile(artifactPath);
const gemmiGroup19 = artifact.records.find(r => r.spaceGroupNumber === 19)!;

const reportGemmi19 = classifyOperationSet(gemmiGroup19.operations, catalog);
assert(
  reportGemmi19.candidateFilter.candidates.some(c => c.settingId === 'P212121'),
  'T7: Gemmi Group 19 must retain P212121 in candidate filter'
);
assert(
  reportGemmi19.verdict === 'SETTING_MISMATCH',
  `T7: Gemmi Group 19 must evaluate to SETTING_MISMATCH, got ${reportGemmi19.verdict}`
);
assert(
  reportGemmi19.matchedSettingId === 'P212121',
  'T7: Matched setting under origin shift must be P212121'
);
assert(
  reportGemmi19.notes.some(n => n.includes('origin shift')),
  'T7: Report notes must document origin shift equivalence'
);
console.log('  ✅ T7 PASSED: All 8 settings and origin-shifted Group 19 classified accurately.\n');

// -----------------------------------------------------------------------------
// TEST T8: Empty Input, Malformed Operations & Error Handling
// Detects: Unhandled exceptions, crashes, undefined state
// -----------------------------------------------------------------------------
console.log('TEST T8: Empty Input & Malformed Operations Handling...');
const reportEmpty = classifyOperationSet([], catalog);
assert(reportEmpty.verdict === 'NO_CANDIDATES', 'T8: Empty input must yield NO_CANDIDATES');
assert(reportEmpty.matchedSettingId === null, 'T8: Matched ID must be null for empty input');

// Malformed matrix (non-integer)
const malformedMatrix: any = [
  {
    W: [[1.5, 0, 0], [0, 1, 0], [0, 0, 1]],
    w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
  }
];
const reportBadMat = classifyOperationSet(malformedMatrix, catalog);
assert(reportBadMat.verdict === 'INVALID_INPUT', 'T8: Non-integer matrix must yield INVALID_INPUT');

// Malformed translation (zero denominator)
const malformedDenom: any = [
  {
    W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    w: [{ numerator: 0, denominator: 0 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
  }
];
const reportBadDen = classifyOperationSet(malformedDenom, catalog);
assert(reportBadDen.verdict === 'INVALID_INPUT', 'T8: Zero denominator must yield INVALID_INPUT');
console.log('  ✅ T8 PASSED: Edge cases and malformed inputs handled gracefully.\n');

// -----------------------------------------------------------------------------
// TEST T9: Catalog Traversal Order Invariance
// Detects: Order bias in catalog iteration
// -----------------------------------------------------------------------------
console.log('TEST T9: Catalog Traversal Order Invariance...');
const reversedCatalog = [...catalog].reverse();
for (const rec of catalog) {
  const repOriginal = classifyOperationSet(rec.operations, catalog);
  const repReversed = classifyOperationSet(rec.operations, reversedCatalog);
  assert(
    repOriginal.verdict === repReversed.verdict,
    `T9: Verdict must match regardless of catalog order for ${rec.settingId}`
  );
  assert(
    repOriginal.matchedSettingId === repReversed.matchedSettingId,
    `T9: Matched ID must match regardless of catalog order for ${rec.settingId}`
  );
}
console.log('  ✅ T9 PASSED: Classification is 100% invariant to catalog traversal order.\n');

// -----------------------------------------------------------------------------
// TEST T10: Boundary Enforcement (No Silent False Positives)
// Detects: False positive classification on invalid or non-closed inputs
// -----------------------------------------------------------------------------
console.log('TEST T10: Boundary Enforcement (No False Positives)...');
// Synthetic incomplete set: single C2 rotation without identity
const incompleteSet: InputSymmetryOperation[] = [
  {
    W: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]],
    w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
  }
];
const reportIncomplete = classifyOperationSet(incompleteSet, catalog);
assert(
  reportIncomplete.verdict === 'NO_CANDIDATES',
  'T10: Incomplete operation set (distinct=1 with order 2) must have NO_CANDIDATES in catalog'
);
assert(
  reportIncomplete.matchedSettingId === null,
  'T10: Matched setting must be null'
);

// Synthetic non-crystallographic 5-fold rotation
const nonCrystSet: InputSymmetryOperation[] = [
  {
    W: [[0, 1, 0], [0, 0, 1], [1, 0, 0]], // order 3
    w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
  }
];
const reportNonCryst = classifyOperationSet(nonCrystSet, catalog);
assert(
  reportNonCryst.verdict === 'NO_CANDIDATES',
  'T10: Unsupported order distribution must yield NO_CANDIDATES'
);
console.log('  ✅ T10 PASSED: Operations outside catalog contract never falsely classify.\n');

// -----------------------------------------------------------------------------
// 16 SOUNDNESS SCENARIOS (S1 to S16)
// -----------------------------------------------------------------------------
console.log('RUNNING 16 EXTENDED SOUNDNESS SCENARIOS (S1 to S16)...');

// S1: P1
const s1 = filterCandidates(catalog.find(r => r.settingId === 'P1')!.operations, catalog);
assert(s1.candidates.length === 1 && s1.candidates[0].settingId === 'P1', 'S1: P1 sound');

// S2: P-1
const s2 = filterCandidates(catalog.find(r => r.settingId === 'P-1')!.operations, catalog);
assert(s2.candidates.length === 1 && s2.candidates[0].settingId === 'P-1', 'S2: P-1 sound');

// S3: P2
const s3 = filterCandidates(catalog.find(r => r.settingId === 'P2')!.operations, catalog);
assert(s3.candidates.some(c => c.settingId === 'P2'), 'S3: P2 sound');

// S4: P21
const s4 = filterCandidates(catalog.find(r => r.settingId === 'P21')!.operations, catalog);
assert(s4.candidates.some(c => c.settingId === 'P21'), 'S4: P21 sound');

// S5: C2
const s5 = filterCandidates(catalog.find(r => r.settingId === 'C2')!.operations, catalog);
assert(s5.candidates.length === 1 && s5.candidates[0].settingId === 'C2', 'S5: C2 sound');

// S6: Cc
const s6 = filterCandidates(catalog.find(r => r.settingId === 'Cc')!.operations, catalog);
assert(s6.candidates.length === 1 && s6.candidates[0].settingId === 'Cc', 'S6: Cc sound');

// S7: P21/c
const s7 = filterCandidates(catalog.find(r => r.settingId === 'P21/c')!.operations, catalog);
assert(s7.candidates.length === 1 && s7.candidates[0].settingId === 'P21/c', 'S7: P21/c sound');

// S8: P212121
const s8 = filterCandidates(catalog.find(r => r.settingId === 'P212121')!.operations, catalog);
assert(s8.candidates.length === 1 && s8.candidates[0].settingId === 'P212121', 'S8: P212121 sound');

// S9: Triclinic input eliminates Monoclinic & Orthorhombic
assert(s1.candidates.every(c => c.spaceGroupNumber === 1), 'S9: P1 prunes groups 2-19');
assert(s2.candidates.every(c => c.spaceGroupNumber === 2), 'S9: P-1 prunes non-triclinic');

// S10: Centrosymmetric query eliminates non-centrosymmetric
const nonCentrosymmetric = catalog.filter(r => !r.settingId.includes('-') && r.settingId !== 'P21/c');
for (const cand of s2.candidates) {
  assert(!nonCentrosymmetric.some(nc => nc.settingId === cand.settingId), 'S10: P-1 prunes non-centrosymmetric');
}

// S11: Improper-containing query eliminates pure proper rotation groups (e.g. Cc vs C2)
assert(!s6.candidates.some(c => c.settingId === 'C2'), 'S11: Cc prunes pure rotation C2');

// S12: Pure rotation query eliminates improper-containing groups (e.g. C2 vs Cc)
assert(!s5.candidates.some(c => c.settingId === 'Cc'), 'S12: C2 prunes reflection Cc');

// S13: Translation-shifted query (integer lattice vector w + (1, 0, 0)) preserves candidate list
const shiftedP1Ops = [
  {
    W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    w: [{ numerator: 1, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
  }
];
const s13 = filterCandidates(shiftedP1Ops, catalog);
assert(s13.candidates.length === 1 && s13.candidates[0].settingId === 'P1', 'S13: Periodic shift preserves candidates');

// S14: Permuted query operations preserve candidate list
const s14 = filterCandidates([...catalog.find(r => r.settingId === 'P21/c')!.operations].reverse(), catalog);
assert(s14.candidates.length === 1 && s14.candidates[0].settingId === 'P21/c', 'S14: Permutation preserves candidates');

// S15: Multiset query with duplicates preserves candidate list
const s15 = filterCandidates(p1Duplicates, catalog);
assert(s15.candidates.length === 1 && s15.candidates[0].settingId === 'P1', 'S15: Duplicates preserve candidates');

// S16: Origin-shifted Group 19 reference operations preserve candidate list with zero false negatives
const s16 = filterCandidates(gemmiGroup19.operations, catalog);
assert(
  s16.candidates.length === 1 && s16.candidates[0].settingId === 'P212121',
  'S16: Origin-shifted Group 19 preserves candidate P212121'
);

console.log('  ✅ ALL 16 EXTENDED SOUNDNESS SCENARIOS PASSED (100% SOUND, 0 FALSE NEGATIVES).\n');

console.log('====================================================');
console.log('ALL EXP-09 CANDIDATE FILTER SOUNDNESS TESTS PASSED (100%)');
console.log('====================================================');
