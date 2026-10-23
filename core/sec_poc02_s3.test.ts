/**
 * SEC PoC-02: Independent S3 Reference & Non-Commutative Group Verification Test Suite
 * 
 * Objectives:
 * - Define independent mathematical reference for the symmetric group S3 (order 6).
 * - Explicitly establish composition convention (right-to-left: (sigma o tau)(x) = sigma(tau(x))).
 * - Demonstrate non-commutativity: (1 2) o (1 3) = (1 3 2) != (1 3) o (1 2) = (1 2 3).
 * - Validate group axioms: Identity, Closure, Associativity, Inverses, Unique Elements.
 * - Run adversarial / negative testing battery (ADV_S3_01..06) with precise attribution.
 * - Produce canonical JSON serialization and SHA-256 cryptographic evidence digest.
 */

import crypto from 'crypto';

export interface Matrix4x4Type {
  0: [number, number, number, number];
  1: [number, number, number, number];
  2: [number, number, number, number];
  3: [number, number, number, number];
  length: 4;
}

export interface S3Element {
  id: string;
  name: string;
  cycleNotation: string;
  matrix: Matrix4x4Type;
  isEven: boolean; // True for rotations (det +1), false for reflections (det -1)
}

// =============================================================================
// 1. INDEPENDENT MATHEMATICAL REFERENCE SPECIFICATION FOR S3 (Order 6)
// =============================================================================
// Elements of S3 represented as 4x4 homogeneous transformation matrices acting on (x, y, z, 1).

export const S3_REF_ELEMENTS: S3Element[] = [
  {
    id: 'e',
    name: 'Identity',
    cycleNotation: '(1)(2)(3)',
    isEven: true,
    matrix: [
      [1.0, 0.0, 0.0, 0.0],
      [0.0, 1.0, 0.0, 0.0],
      [0.0, 0.0, 1.0, 0.0],
      [0.0, 0.0, 0.0, 1.0]
    ]
  },
  {
    id: 's12',
    name: 'Transposition (1 2)',
    cycleNotation: '(1 2)(3)',
    isEven: false,
    matrix: [
      [0.0, 1.0, 0.0, 0.0],
      [1.0, 0.0, 0.0, 0.0],
      [0.0, 0.0, 1.0, 0.0],
      [0.0, 0.0, 0.0, 1.0]
    ]
  },
  {
    id: 's13',
    name: 'Transposition (1 3)',
    cycleNotation: '(1 3)(2)',
    isEven: false,
    matrix: [
      [0.0, 0.0, 1.0, 0.0],
      [0.0, 1.0, 0.0, 0.0],
      [1.0, 0.0, 0.0, 0.0],
      [0.0, 0.0, 0.0, 1.0]
    ]
  },
  {
    id: 's23',
    name: 'Transposition (2 3)',
    cycleNotation: '(1)(2 3)',
    isEven: false,
    matrix: [
      [1.0, 0.0, 0.0, 0.0],
      [0.0, 0.0, 1.0, 0.0],
      [0.0, 1.0, 0.0, 0.0],
      [0.0, 0.0, 0.0, 1.0]
    ]
  },
  {
    id: 'c123',
    name: '3-Cycle (1 2 3)',
    cycleNotation: '(1 2 3)',
    isEven: true,
    matrix: [
      [0.0, 0.0, 1.0, 0.0],
      [1.0, 0.0, 0.0, 0.0],
      [0.0, 1.0, 0.0, 0.0],
      [0.0, 0.0, 0.0, 1.0]
    ]
  },
  {
    id: 'c132',
    name: '3-Cycle (1 3 2)',
    cycleNotation: '(1 3 2)',
    isEven: true,
    matrix: [
      [0.0, 1.0, 0.0, 0.0],
      [0.0, 0.0, 1.0, 0.0],
      [1.0, 0.0, 0.0, 0.0],
      [0.0, 0.0, 0.0, 1.0]
    ]
  }
];

// Independent analytic Cayley Table (6x6) under matrix multiplication (row * col):
export const INDEPENDENT_S3_CAYLEY_TABLE: number[][] = [
  [0, 1, 2, 3, 4, 5], // e * all
  [1, 0, 5, 4, 3, 2], // (1 2) * all
  [2, 4, 0, 5, 1, 3], // (1 3) * all
  [3, 5, 4, 0, 2, 1], // (2 3) * all
  [4, 2, 3, 1, 5, 0], // (1 2 3) * all
  [5, 3, 1, 2, 0, 4]  // (1 3 2) * all
];

// Canonical JSON stringification
export function canonicalStringify(obj: any): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'number') {
    if (!Number.isFinite(obj)) return 'null';
    if (Object.is(obj, -0)) return '0';
    return JSON.stringify(obj);
  }
  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).filter(k => obj[k] !== undefined).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalStringify(obj[k])).join(',') + '}';
}

export function computeCryptographicDigest(data: any): string {
  const serialized = canonicalStringify(data);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

// Matrix multiplication for 4x4
export function multiplyMatrix4x4(a: Matrix4x4Type, b: Matrix4x4Type): Matrix4x4Type {
  const result: Matrix4x4Type = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 1]
  ];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = Math.abs(sum) < 1e-12 ? 0 : Number(sum.toFixed(6));
    }
  }
  result[3][0] = 0;
  result[3][1] = 0;
  result[3][2] = 0;
  result[3][3] = 1;
  return result;
}

// Compute 3x3 determinant from 4x4 matrix
export function computeDeterminant3x3(m: Matrix4x4Type): number {
  const a = m[0][0], b = m[0][1], c = m[0][2];
  const d = m[1][0], e = m[1][1], f = m[1][2];
  const g = m[2][0], h = m[2][1], i = m[2][2];
  const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  return Number(det.toFixed(4));
}

// Check matrix equality
export function matricesAreEqual(a: Matrix4x4Type, b: Matrix4x4Type, tol = 1e-5): boolean {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (Math.abs(a[i][j] - b[i][j]) > tol) return false;
    }
  }
  return true;
}

// =============================================================================
// 2. VERIFICATION SUITE EXECUTION
// =============================================================================

export interface CheckResult {
  checkId: string;
  name: string;
  passed: boolean;
  message: string;
}

export function runPositiveBaseline(elements: S3Element[]): { passed: boolean; results: CheckResult[] } {
  const results: CheckResult[] = [];

  // 1. CHK_S3_STRUCTURE: Verify 4x4, homogeneous bottom row [0,0,0,1], 3x3 block is a valid permutation matrix (entries 0 or 1, row/col sums = 1), and valid determinant (+/-1).
  let structureOk = true;
  let structMsg = 'All 6 matrices are valid permutation matrices with correct determinants';
  for (const el of elements) {
    if (el.matrix.length !== 4) { structureOk = false; structMsg = `Matrix ${el.id} not 4x4`; break; }
    if (el.matrix[3][0] !== 0 || el.matrix[3][1] !== 0 || el.matrix[3][2] !== 0 || el.matrix[3][3] !== 1) {
      structureOk = false; structMsg = `Matrix ${el.id} invalid homogeneous row`; break;
    }
    // Check 3x3 subblock: entries must be 0 or 1, row sums = 1, col sums = 1
    for (let r = 0; r < 3; r++) {
      let rowSum = 0;
      for (let c = 0; c < 3; c++) {
        const val = el.matrix[r][c];
        if (val !== 0 && val !== 1) {
          structureOk = false;
          structMsg = `Matrix ${el.id} contains non-binary entry at (${r},${c}): ${val}`;
          break;
        }
        rowSum += val;
      }
      if (!structureOk) break;
      if (rowSum !== 1) {
        structureOk = false;
        structMsg = `Matrix ${el.id} row ${r} sum is ${rowSum} (expected 1)`;
        break;
      }
    }
    if (!structureOk) break;

    for (let c = 0; c < 3; c++) {
      let colSum = 0;
      for (let r = 0; r < 3; r++) {
        colSum += el.matrix[r][c];
      }
      if (colSum !== 1) {
        structureOk = false;
        structMsg = `Matrix ${el.id} col ${c} sum is ${colSum} (expected 1)`;
        break;
      }
    }
    if (!structureOk) break;

    const det = computeDeterminant3x3(el.matrix);
    const expectedDet = el.isEven ? 1.0 : -1.0;
    if (Math.abs(det - expectedDet) > 1e-3) {
      structureOk = false; structMsg = `Matrix ${el.id} det=${det}, expected ${expectedDet}`; break;
    }
  }
  results.push({ checkId: 'CHK_S3_STRUCTURE', name: 'Matrix Permutation Structure & Determinants', passed: structureOk, message: structMsg });

  // 2. CHK_S3_IDENTITY
  const idEl = elements.find(el => el.id === 'e');
  let identityOk = !!idEl;
  let identityMsg = identityOk ? 'Identity element e found' : 'Identity element e missing';
  if (identityOk) {
    const expectedI = S3_REF_ELEMENTS[0].matrix;
    if (!matricesAreEqual(idEl!.matrix, expectedI)) {
      identityOk = false;
      identityMsg = 'Identity matrix does not match standard I';
    }
  }
  results.push({ checkId: 'CHK_S3_IDENTITY', name: 'Identity Element Presence', passed: identityOk, message: identityMsg });

  // 3. CHK_S3_DUPLICATES
  let duplicatesOk = true;
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      if (matricesAreEqual(elements[i].matrix, elements[j].matrix)) {
        duplicatesOk = false;
        break;
      }
    }
  }
  results.push({ checkId: 'CHK_S3_DUPLICATES', name: 'Unique Element Set', passed: duplicatesOk, message: duplicatesOk ? 'All 6 elements are unique' : 'Duplicate matrices detected' });

  // 4. CHK_S3_NON_COMMUTATIVITY
  const s12 = elements.find(el => el.id === 's12')?.matrix;
  const s13 = elements.find(el => el.id === 's13')?.matrix;
  let nonCommutativeOk = false;
  let nonCommMsg = 'Failed to demonstrate non-commutativity';
  if (s12 && s13) {
    const prod1 = multiplyMatrix4x4(s12, s13); // (1 2) o (1 3) = (1 3 2)
    const prod2 = multiplyMatrix4x4(s13, s12); // (1 3) o (1 2) = (1 2 3)
    const c132Mat = elements.find(el => el.id === 'c132')?.matrix;
    const c123Mat = elements.find(el => el.id === 'c123')?.matrix;
    if (c132Mat && c123Mat) {
      const match1 = matricesAreEqual(prod1, c132Mat);
      const match2 = matricesAreEqual(prod2, c123Mat);
      const distinct = !matricesAreEqual(prod1, prod2);
      if (match1 && match2 && distinct) {
        nonCommutativeOk = true;
        nonCommMsg = 'Confirmed: (1 2) o (1 3) = (1 3 2) != (1 3) o (1 2) = (1 2 3)';
      }
    }
  }
  results.push({ checkId: 'CHK_S3_NON_COMMUTATIVITY', name: 'Non-Commutative Composition', passed: nonCommutativeOk, message: nonCommMsg });

  // 5. CHK_S3_INDEPENDENT_CAYLEY
  let cayleyOk = true;
  let cayleyMsg = 'All 36 products conform to independent Cayley reference table';
  for (let i = 0; i < elements.length; i++) {
    for (let j = 0; j < elements.length; j++) {
      const computedProd = multiplyMatrix4x4(elements[i].matrix, elements[j].matrix);
      const expectedIndex = INDEPENDENT_S3_CAYLEY_TABLE[i][j];
      const expectedMatrix = S3_REF_ELEMENTS[expectedIndex].matrix;
      const matchedEl = elements.find(el => matricesAreEqual(el.matrix, computedProd));
      if (!matchedEl || !matricesAreEqual(computedProd, expectedMatrix)) {
        cayleyOk = false;
        cayleyMsg = `Cayley mismatch at index (${i}, ${j}): computed does not match expected table entry ${expectedIndex}`;
        break;
      }
    }
    if (!cayleyOk) break;
  }
  results.push({ checkId: 'CHK_S3_INDEPENDENT_CAYLEY', name: 'Independent Cayley Table Conformance', passed: cayleyOk, message: cayleyMsg });

  // 6. CHK_S3_CLOSURE
  let closureOk = true;
  for (let i = 0; i < elements.length; i++) {
    for (let j = 0; j < elements.length; j++) {
      const prod = multiplyMatrix4x4(elements[i].matrix, elements[j].matrix);
      const found = elements.some(el => matricesAreEqual(el.matrix, prod));
      if (!found) {
        closureOk = false;
        break;
      }
    }
  }
  results.push({ checkId: 'CHK_S3_CLOSURE', name: 'Group Closure', passed: closureOk, message: closureOk ? 'Group is closed under multiplication' : 'Closure violated' });

  // 7. CHK_S3_ASSOCIATIVITY
  let assocOk = true;
  for (let i = 0; i < elements.length; i++) {
    for (let j = 0; j < elements.length; j++) {
      for (let k = 0; k < elements.length; k++) {
        const ab = multiplyMatrix4x4(elements[i].matrix, elements[j].matrix);
        const ab_c = multiplyMatrix4x4(ab, elements[k].matrix);

        const bc = multiplyMatrix4x4(elements[j].matrix, elements[k].matrix);
        const a_bc = multiplyMatrix4x4(elements[i].matrix, bc);

        if (!matricesAreEqual(ab_c, a_bc)) {
          assocOk = false;
          break;
        }
      }
      if (!assocOk) break;
    }
    if (!assocOk) break;
  }
  results.push({ checkId: 'CHK_S3_ASSOCIATIVITY', name: 'Group Associativity', passed: assocOk, message: assocOk ? 'Associativity holds for all 216 triples' : 'Associativity violated' });

  // 8. CHK_S3_INVERSES
  let inversesOk = true;
  for (let i = 0; i < elements.length; i++) {
    let hasInverse = false;
    for (let j = 0; j < elements.length; j++) {
      const prod = multiplyMatrix4x4(elements[i].matrix, elements[j].matrix);
      if (matricesAreEqual(prod, S3_REF_ELEMENTS[0].matrix)) {
        hasInverse = true;
        break;
      }
    }
    if (!hasInverse) {
      inversesOk = false;
      break;
    }
  }
  results.push({ checkId: 'CHK_S3_INVERSES', name: 'Inverse Elements', passed: inversesOk, message: inversesOk ? 'Every element has a valid inverse' : 'Inverse missing for some element' });

  const allPassed = results.every(r => r.passed);
  return { passed: allPassed, results };
}

// =============================================================================
// 3. ADVERSARIAL TEST BATTERY (ADV_S3_01 .. ADV_S3_06)
// =============================================================================

export interface AdversarialTest {
  id: string;
  title: string;
  description: string;
  expectedFailureCheck: string;
  mutatedElements: S3Element[];
}

export function getAdversarialTestCases(): AdversarialTest[] {
  const base = JSON.parse(JSON.stringify(S3_REF_ELEMENTS)) as S3Element[];

  const mut1 = JSON.parse(JSON.stringify(base)) as S3Element[];
  mut1[1].matrix[0][0] = 2.0;

  const mut2 = JSON.parse(JSON.stringify(base)) as S3Element[];
  const tmpM = mut2[4].matrix;
  mut2[4].matrix = mut2[5].matrix;
  mut2[5].matrix = tmpM;

  const mut3 = JSON.parse(JSON.stringify(base)) as S3Element[];
  mut3[0].matrix = JSON.parse(JSON.stringify(mut3[1].matrix));

  const mut4 = JSON.parse(JSON.stringify(base)) as S3Element[];
  mut4[4].matrix = JSON.parse(JSON.stringify(mut4[0].matrix));

  const mut5 = JSON.parse(JSON.stringify(base)) as S3Element[];
  mut5[1].matrix = JSON.parse(JSON.stringify(mut5[0].matrix));

  const mut6 = JSON.parse(JSON.stringify(base)) as S3Element[];
  mut6[3].matrix = [
    [0, -1, 0, 0],
    [1, 0, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
  ];

  return [
    {
      id: 'ADV_S3_01',
      title: 'Invalid Non-Permutation Matrix Injection',
      description: 'Injected scale factor into transposition s12',
      expectedFailureCheck: 'CHK_S3_STRUCTURE',
      mutatedElements: mut1
    },
    {
      id: 'ADV_S3_02',
      title: 'Cayley Table / Non-Commutativity Violation',
      description: 'Swapped 3-cycle representations leading to Cayley mismatch',
      expectedFailureCheck: 'CHK_S3_INDEPENDENT_CAYLEY',
      mutatedElements: mut2
    },
    {
      id: 'ADV_S3_03',
      title: 'Identity Element Omission',
      description: 'Replaced identity element matrix with transposition s12',
      expectedFailureCheck: 'CHK_S3_IDENTITY',
      mutatedElements: mut3
    },
    {
      id: 'ADV_S3_04',
      title: 'Duplicate Element Injection',
      description: 'Collapsed c123 element into identity matrix',
      expectedFailureCheck: 'CHK_S3_DUPLICATES',
      mutatedElements: mut4
    },
    {
      id: 'ADV_S3_05',
      title: 'Inverse Element Omission via Duplicate',
      description: 'Replaced s12 with identity, collapsing inverse set',
      expectedFailureCheck: 'CHK_S3_DUPLICATES',
      mutatedElements: mut5
    },
    {
      id: 'ADV_S3_06',
      title: 'Invalid Foreign Operation Injection',
      description: 'Injected C4 rotation matrix violating S3 closure',
      expectedFailureCheck: 'CHK_S3_CLOSURE',
      mutatedElements: mut6
    }
  ];
}

// =============================================================================
// 4. MAIN TEST RUNNER EXECUTION & REPORT GENERATION
// =============================================================================

export function runFullS3Suite() {
  console.log('====================================================================');
  console.log('SEC PoC-02: INDEPENDENT S3 SYMMETRIC GROUP AUDIT RUNNER');
  console.log('====================================================================');

  const positiveResult = runPositiveBaseline(S3_REF_ELEMENTS);
  console.log(`\n--- [POS_S3] POSITIVE BASELINE TEST: ${positiveResult.passed ? 'PASSED ✅' : 'FAILED ❌'} ---`);
  for (const res of positiveResult.results) {
    const icon = res.passed ? '✅' : '❌';
    console.log(`[${res.checkId}] ${icon} ${res.name} -> ${res.message}`);
  }

  console.log('\n--- [ADV_S3] ADVERSARIAL NEGATIVE TEST BATTERY ---');
  const advTests = getAdversarialTestCases();
  let advPassedCount = 0;

  for (const test of advTests) {
    const res = runPositiveBaseline(test.mutatedElements);
    const failedChecks = res.results.filter(r => !r.passed).map(r => r.checkId);
    const caughtExpected = failedChecks.includes(test.expectedFailureCheck);

    if (caughtExpected) {
      advPassedCount++;
      console.log(`[${test.id}] 🛡️ PASS | Injected: ${test.description} | Expected & Caught: ${test.expectedFailureCheck} | Failed: [${failedChecks.join(', ')}] | Verdict: REJECTED`);
    } else {
      console.log(`[${test.id}] ❌ FAIL | Injected: ${test.description} | Expected: ${test.expectedFailureCheck} | Failed: [${failedChecks.join(', ')}] | Verdict: ACCEPTED (SECURITY FAILURE)`);
    }
  }

  const datasetForDigest = {
    group: 'S3',
    order: 6,
    elements: S3_REF_ELEMENTS.map(e => ({ id: e.id, cycle: e.cycleNotation, matrix: e.matrix })),
    cayleyTable: INDEPENDENT_S3_CAYLEY_TABLE,
    positiveChecks: positiveResult.results
  };

  const digest = computeCryptographicDigest(datasetForDigest);
  console.log('\n====================================================================');
  console.log(`CRYPTOGRAPHIC EVIDENCE SHA-256 DIGEST: ${digest}`);
  console.log(`ADVERSARIAL SUITE SUMMARY: ${advPassedCount} / ${advTests.length} CHECKS PASSED WITH PRECISE ATTRIBUTION`);
  console.log('====================================================================\n');

  return { positiveResult, advPassedCount, totalAdv: advTests.length, digest };
}

runFullS3Suite();
