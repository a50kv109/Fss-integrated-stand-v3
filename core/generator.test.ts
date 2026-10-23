import { SourceBackedCatalogGenerator } from './generator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('Running KB-08A Generator Audit Tests...');

// 1. Test reproducibility (determinism) across runs
const run1 = SourceBackedCatalogGenerator.generateReferenceCatalog();
const run2 = SourceBackedCatalogGenerator.generateReferenceCatalog();
assert(JSON.stringify(run1) === JSON.stringify(run2), 'Generator runs must be strictly deterministic and identical');
assert(run1.length === 4, 'Generator must produce exactly 4 reference records');

// 2. Test provenance metadata (detecting source attribution and commit)
for (const rec of run1) {
  assert(rec.provenanceDetails !== undefined, 'Provenance details must be present');
  assert(rec.provenanceDetails.commitOrVersion === '6ea553a', 'Commit hash must be 6ea553a');
  assert(rec.provenanceDetails.license === 'MPL-2.0', 'License must be MPL-2.0');
}

// 3. Test comparison with catalog
const comparison = SourceBackedCatalogGenerator.compareWithCatalog();
console.log('Catalog comparison results:', comparison);

for (const res of comparison) {
  assert(res.match, `Comparison failed for ${res.settingId}: ${res.details}`);
}

// 4. Verify rational precision preservation
for (const rec of run1) {
  for (const op of rec.operations) {
    for (const t of op.w) {
      assert(typeof t.numerator === 'number' && Number.isInteger(t.numerator), 'Numerator must be integer');
      assert(typeof t.denominator === 'number' && Number.isInteger(t.denominator) && t.denominator > 0, 'Denominator must be positive integer');
    }
  }
}

console.log('All KB-08A Generator Audit tests passed successfully!');
