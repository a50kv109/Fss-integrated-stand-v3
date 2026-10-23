import { CrystallographicImporter, RawGroupSourceData } from './importer';
import { SymmetryCatalog } from './registry';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('Running KB-07B Traceability & Import Validation Tests...');

const validRawData: RawGroupSourceData[] = [
  {
    groupNumber: 1, settingId: "P1", hmSymbol: "P 1", hallSymbol: "P 1",
    operations: [{ W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] }]
  }
];

// 1. Determinism / Reproducibility check
const run1 = CrystallographicImporter.importRecords(validRawData);
const run2 = CrystallographicImporter.importRecords(validRawData);
assert(JSON.stringify(run1) === JSON.stringify(run2), 'Imports must be deterministic and identical');

// 2. Validation & Damaged data tests
const testCases: { name: string; data: RawGroupSourceData[]; errorExpected: string }[] = [
  {
    name: "Missing settingId",
    data: [{ groupNumber: 1, settingId: "", hmSymbol: "P 1", hallSymbol: "P 1", operations: [{ W: [[1,0,0],[0,1,0],[0,0,1]], w: [{numerator:0, denominator:1},{numerator:0, denominator:1},{numerator:0, denominator:1}] }] }],
    errorExpected: "Missing settingId"
  },
  {
    name: "Invalid group number (0)",
    data: [{ groupNumber: 0, settingId: "P1", hmSymbol: "P 1", hallSymbol: "P 1", operations: [{ W: [[1,0,0],[0,1,0],[0,0,1]], w: [{numerator:0, denominator:1},{numerator:0, denominator:1},{numerator:0, denominator:1}] }] }],
    errorExpected: "Invalid group number"
  },
  {
    name: "Invalid group number (231)",
    data: [{ groupNumber: 231, settingId: "P1", hmSymbol: "P 1", hallSymbol: "P 1", operations: [{ W: [[1,0,0],[0,1,0],[0,0,1]], w: [{numerator:0, denominator:1},{numerator:0, denominator:1},{numerator:0, denominator:1}] }] }],
    errorExpected: "Invalid group number"
  },
  {
    name: "Invalid matrix dimension (2x2)",
    data: [{ groupNumber: 1, settingId: "P1", hmSymbol: "P 1", hallSymbol: "P 1", operations: [{ W: [[1,0],[0,1]], w: [{numerator:0, denominator:1},{numerator:0, denominator:1},{numerator:0, denominator:1}] }] }],
    errorExpected: "Invalid rotation matrix W"
  },
  {
    name: "Zero denominator",
    data: [{ groupNumber: 1, settingId: "P1", hmSymbol: "P 1", hallSymbol: "P 1", operations: [{ W: [[1,0,0],[0,1,0],[0,0,1]], w: [{numerator:1, denominator:0},{numerator:0, denominator:1},{numerator:0, denominator:1}] }] }],
    errorExpected: "Zero denominator"
  }
];

for (const tc of testCases) {
  let caught = false;
  try {
    CrystallographicImporter.importRecords(tc.data);
  } catch (e: any) {
    if (e.message.includes(tc.errorExpected)) {
      caught = true;
    }
  }
  assert(caught, `Test case failed: ${tc.name} did not throw expected error "${tc.errorExpected}"`);
}

// 3. Catalog conflict simulation (imported record differs from catalog without auto-overwrite)
const importedConflict = CrystallographicImporter.importRecords([{
  groupNumber: 1, settingId: "P1", hmSymbol: "P 1", hallSymbol: "P 1",
  operations: [
    { W: [[1,0,0],[0,1,0],[0,0,1]], w: [{numerator:0, denominator:1},{numerator:0, denominator:1},{numerator:0, denominator:1}] },
    { W: [[-1,0,0],[0,-1,0],[0,0,-1]], w: [{numerator:0, denominator:1},{numerator:0, denominator:1},{numerator:0, denominator:1}] } // Extra op
  ]
}])[0];

const catalogRecord = SymmetryCatalog.findBySettingId("P1")!;
assert(catalogRecord.operations.length === 1, 'Catalog record should remain pristine (1 op)');
assert(importedConflict.operations.length !== catalogRecord.operations.length, 'Conflict detected correctly');
// Catalog is untouched (no auto-overwrite occurred)

console.log('All KB-07B Traceability & Import Validation tests passed successfully!');
