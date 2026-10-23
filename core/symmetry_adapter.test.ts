import { SymmetryAdapter, SymmetryRecord } from './symmetry_adapter';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

const records: SymmetryRecord[] = [
  {
    groupNumber: 1, settingId: "P1", hmSymbol: "P 1", hallSymbol: "P 1",
    provenance: "Gemmi/ITA 2024.1 (MPL-2.0)",
    operations: [{ W: [[1,0,0],[0,1,0],[0,0,1]], w: [{numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}] }]
  },
  {
    groupNumber: 2, settingId: "P-1", hmSymbol: "P -1", hallSymbol: "-P 1",
    provenance: "Gemmi/ITA 2024.1 (MPL-2.0)",
    operations: [
      { W: [[1,0,0],[0,1,0],[0,0,1]], w: [{numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}] },
      { W: [[-1,0,0],[0,-1,0],[0,0,-1]], w: [{numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}] }
    ]
  },
  {
    groupNumber: 19, settingId: "P212121", hmSymbol: "P 21 21 21", hallSymbol: "P 2ac 2ab",
    provenance: "Gemmi/ITA 2024.1 (MPL-2.0)",
    operations: [
      { W: [[1,0,0],[0,1,0],[0,0,1]], w: [{numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}] },
      { W: [[1,0,0],[0,-1,0],[0,0,-1]], w: [{numerator: 1, denominator: 2}, {numerator: 0, denominator: 1}, {numerator: 1, denominator: 2}] }
    ]
  },
  {
    groupNumber: 14, settingId: "P21/c", hmSymbol: "P 21/c", hallSymbol: "-P 2ybc",
    provenance: "Gemmi/ITA 2024.1 (MPL-2.0)",
    operations: [
      { W: [[1,0,0],[0,1,0],[0,0,1]], w: [{numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}] },
      { W: [[-1,0,0],[0,1,0],[0,0,-1]], w: [{numerator: 0, denominator: 1}, {numerator: 1, denominator: 2}, {numerator: 1, denominator: 2}] }
    ]
  }
];

// Tests
console.log('Running SymmetryAdapter tests...');

// 1. Success cases
const ops1 = SymmetryAdapter.adapt(records[0]);
assert(ops1.length === 1, 'P1 should have 1 op');

const ops19 = SymmetryAdapter.adapt(records[2]);
assert(ops19[1].matrix4x4[0][3] === 0.5, 'P212121 translation should be 0.5');

// 2. Failure cases
try {
  SymmetryAdapter.adapt({
    groupNumber: 0, settingId: "ERR", hmSymbol: "ERR", hallSymbol: "ERR",
    provenance: "TEST",
    operations: [{ W: [[1,0,0]], w: [{numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}] }]
  });
  assert(false, 'Should throw error for bad matrix');
} catch (e) {
  console.log('Caught expected error for bad matrix');
}

try {
  SymmetryAdapter.adapt({
    groupNumber: 0, settingId: "ERR", hmSymbol: "ERR", hallSymbol: "ERR",
    provenance: "TEST",
    operations: [{ W: [[1,0,0],[0,1,0],[0,0,1]], w: [{numerator: 0, denominator: 0}, {numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}] }]
  });
  assert(false, 'Should throw error for zero denominator');
} catch (e) {
  console.log('Caught expected error for zero denominator');
}

console.log('All tests passed!');
