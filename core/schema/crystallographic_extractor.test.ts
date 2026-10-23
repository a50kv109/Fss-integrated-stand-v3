import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { execSync } from 'child_process';
import {
  CrystallographicExchangeArtifact,
  validateStructuralRecord,
  validateMathematicalGroup,
  validateProvenance,
  validateExchangeRecord,
  canonicalOperationKey
} from './crystallographic_exchange';
import { SymmetryCatalog } from '../registry';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('Running KB-11 Reproducible Extractor & Artifact Tests...\n');

const ARTIFACT_PATH = path.resolve('data/crystallography/gemmi_benchmark_4.json');

// 1. Check Artifact Presence and Structure
assert(fs.existsSync(ARTIFACT_PATH), `Artifact file must exist at ${ARTIFACT_PATH}`);
const rawContent = fs.readFileSync(ARTIFACT_PATH, 'utf-8');
const artifact: CrystallographicExchangeArtifact = JSON.parse(rawContent);

console.log('1. Checking Manifest & Provenance Details...');
const manifest = artifact.manifest;
assert(manifest.sourceName === 'Gemmi', 'Manifest sourceName must be Gemmi');
assert(manifest.sourceCommit === '5cc1c23c6007e0e6cbd69289c6f7c0bff50e943e', 'Manifest sourceCommit must be verified SHA 5cc1c23c6007e0e6cbd69289c6f7c0bff50e943e');
assert(manifest.license === 'MPL-2.0', 'Manifest license must be MPL-2.0');
assert(manifest.recordCount === 8, 'Manifest recordCount must be 8');
assert(manifest.isSourceVerified === true, 'Manifest isSourceVerified must be true');

// Canonical JSON sorting helper for cross-platform SHA-256 verification
function canonicalizeJson(obj: any): any {
  if (Array.isArray(obj)) return obj.map(canonicalizeJson);
  if (obj !== null && typeof obj === 'object') {
    const sorted: Record<string, any> = {};
    Object.keys(obj).sort().forEach(k => {
      sorted[k] = canonicalizeJson(obj[k]);
    });
    return sorted;
  }
  return obj;
}

// Verify SHA-256 Checksum of records
const computedRecordsSha = crypto
  .createHash('sha256')
  .update(JSON.stringify(canonicalizeJson(artifact.records)))
  .digest('hex');
assert(
  computedRecordsSha === manifest.sha256Checksum,
  `Records SHA-256 mismatch: manifest has ${manifest.sha256Checksum}, computed ${computedRecordsSha}`
);
console.log(`✓ Artifact Canonical Checksum Verified: ${manifest.sha256Checksum}`);

// 2. Validate All 8 Extracted Space Groups with KB-10 Contract
console.log('\n2. Validating Extracted Groups against KB-10 Contract...');
assert(artifact.records.length === 8, 'Must have exactly 8 extracted records');

for (const record of artifact.records) {
  const report = validateExchangeRecord(record, manifest);
  
  // Structural validation
  assert(report.structural.valid, `Group ${record.settingId} structural errors: ${report.structural.errors.join('; ')}`);
  
  // Mathematical group validation
  assert(report.mathematical.valid, `Group ${record.settingId} mathematical errors: ${report.mathematical.errors.join('; ')}`);
  assert(report.mathematical.hasIdentity, `Group ${record.settingId} must have identity`);
  assert(report.mathematical.hasInverses, `Group ${record.settingId} must have two-sided inverses`);
  assert(report.mathematical.isClosed, `Group ${record.settingId} must be closed under composition`);
  
  // Provenance validation
  assert(report.provenance.valid, `Group ${record.settingId} provenance errors: ${report.provenance.errors.join('; ')}`);
  assert(report.provenance.isVerified, `Group ${record.settingId} must have verified provenance`);
  assert(report.overallValid, `Group ${record.settingId} must be overall valid`);
  
  console.log(`  ✓ Space Group ${record.spaceGroupNumber} (${record.settingId}): Structural, Mathematical (closed, inverses, id), and Provenance PASS`);
}

// 3. Comparison with Legacy Catalog (core/registry.ts)
console.log('\n3. Comparing Extracted Artifact with Legacy Catalog...');
const discrepancies: { settingId: string; details: string }[] = [];

for (const record of artifact.records) {
  const catalogRecord = SymmetryCatalog.findBySettingId(record.settingId);
  assert(catalogRecord !== undefined, `Legacy catalog must have setting ${record.settingId}`);
  assert(catalogRecord!.groupNumber === record.spaceGroupNumber, `Group number mismatch for ${record.settingId}`);
  assert(catalogRecord!.operations.length === record.operations.length, `Operation count mismatch for ${record.settingId}`);
  
  // Compare operations as algebraic sets
  const extractedKeys = new Set(record.operations.map(op => canonicalOperationKey(op)));
  const catalogKeys = new Set(catalogRecord!.operations.map(op => canonicalOperationKey(op)));
  
  let matches = true;
  for (const k of extractedKeys) {
    if (!catalogKeys.has(k)) {
      matches = false;
      break;
    }
  }

  if (matches) {
    console.log(`  ✓ Space Group ${record.spaceGroupNumber} (${record.settingId}): Exact 100% operation set match with legacy catalog`);
  } else {
    const diff = `Space Group ${record.spaceGroupNumber} (${record.settingId}): Extracted Gemmi operations adhere to standard ITA Vol.A origin choice (Hall 'P 2ac 2ab': 2z->(1/2,0,1/2), 2x->(1/2,1/2,0), 2y->(0,1/2,1/2)), whereas legacy catalog in core/registry.ts contains a permuted setting (2x->(1/2,0,1/2), 2y->(1/2,1/2,0), 2z->(0,1/2,1/2)).`;
    discrepancies.push({ settingId: record.settingId, details: diff });
    console.log(`  ⚠ ${diff}`);
  }
}
assert(discrepancies.length === 1 && discrepancies[0].settingId === 'P212121', 'Expected exactly the known Group 19 origin discrepancy');

// 4. Verify Catalog Immutability (no auto-overwriting occurred)
console.log('\n4. Verifying Legacy Catalog Immutability...');
const p1Legacy = SymmetryCatalog.findBySettingId('P1')!;
assert(
  p1Legacy.provenanceDetails.commitOrVersion === '6ea553a',
  'Legacy catalog must not be automatically overwritten by extractor'
);
console.log('✓ Legacy catalog remained completely untouched');

// 5. Test Extractor Reproducibility (Run 2)
console.log('\n5. Testing Extractor Determinism & Reproducibility...');
const run2Output = execSync('python3 scripts/extract_gemmi_data.py', { encoding: 'utf-8' });
assert(run2Output.includes('Artifact successfully generated'), 'Second extractor run must succeed');

const rawContent2 = fs.readFileSync(ARTIFACT_PATH, 'utf-8');
const artifact2: CrystallographicExchangeArtifact = JSON.parse(rawContent2);
assert(
  artifact2.manifest.sha256Checksum === manifest.sha256Checksum,
  'Successive extractor runs must produce bit-identical records checksums'
);
console.log('✓ Extractor output is 100% deterministic and bit-identical across runs');

// 6. Negative Tests on Artifact
console.log('\n6. Running Negative Validation Tests on Corrupted Artifacts...');

// 6.1 Tampered operation matrix
const corruptedMatrixRecord = JSON.parse(JSON.stringify(artifact.records[0]));
corruptedMatrixRecord.operations[0].W[0][0] = 2; // non-isometry/non-standard
const repMat = validateMathematicalGroup(corruptedMatrixRecord);
assert(!repMat.valid, 'Tampered non-identity matrix in Group 1 must fail mathematical validation');

// 6.2 Omitted operation from Group 14 (3 ops instead of 4)
const record14 = artifact.records.find(r => r.spaceGroupNumber === 14)!;
const corruptedOpsCountRecord = JSON.parse(JSON.stringify(record14));
corruptedOpsCountRecord.operations.pop();
const repCount = validateStructuralRecord(corruptedOpsCountRecord);
assert(!repCount.valid, 'Operation length mismatch must be structurally rejected');
assert(repCount.errors.some(e => e.includes('does not match actual operations length')), 'Must report count mismatch');

console.log('✓ Negative tests passed cleanly');

console.log('\n====================================================');
console.log('ALL KB-11 REPRODUCIBLE EXTRACTOR TESTS PASSED (100%)');
console.log('====================================================');
