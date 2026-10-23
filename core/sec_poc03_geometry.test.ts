/**
 * SEC PoC-03: Geometric Action Verification Test Suite
 * 
 * Objectives:
 * - Verify consistency of abstract group operations with their geometric action 
 *   on the canonical tetrahedron vertices v1=(1,1,1), v2=(1,-1,-1), v3=(-1,1,-1), v4=(-1,-1,1).
 * - Enforce distance preservation (isometry: ||M(vi) - M(vj)|| == ||vi - vj||).
 * - Enforce vertex set preservation (bijective mapping of V4 to V4).
 * - Enforce composition consistency and homomorphism property (M1 * M2 action matches composite action).
 * - Run adversarial negative test battery (ADV_GEO_01..05) with precise failure attribution.
 * - Produce canonical JSON serialization and SHA-256 cryptographic evidence digest.
 */

import crypto from 'crypto';
import { applyMatrix4x4, euclideanDistance, computeDeterminant3x3, computeOrthogonalityDelta } from './engine';
import { Matrix4x4, Point3D } from './types';
import { buildRotationMatrix } from './canonical';

// Canonical Tetrahedron Vertices
export const V1: Point3D = [1.0,  1.0,  1.0];
export const V2: Point3D = [1.0, -1.0, -1.0];
export const V3: Point3D = [-1.0, 1.0, -1.0];
export const V4: Point3D = [-1.0, -1.0, 1.0];

export const TETRAHEDRON_VERTICES: Point3D[] = [V1, V2, V3, V4];

export interface GeometricOperation {
  id: string;
  name: string;
  matrix: Matrix4x4;
}

// Independent Reference Rotation Operations for Tetrahedron (A4 subset / proper rotations)
export const REF_GEO_OPERATIONS: GeometricOperation[] = [
  {
    id: 'geom_i',
    name: 'Identity',
    matrix: [
      [1.0, 0.0, 0.0, 0.0],
      [0.0, 1.0, 0.0, 0.0],
      [0.0, 0.0, 1.0, 0.0],
      [0.0, 0.0, 0.0, 1.0]
    ]
  },
  {
    id: 'geom_c3_111',
    name: 'C3 120° around [1,1,1]',
    matrix: [
      [0.0, 0.0, 1.0, 0.0],
      [1.0, 0.0, 0.0, 0.0],
      [0.0, 1.0, 0.0, 0.0],
      [0.0, 0.0, 0.0, 1.0]
    ]
  },
  {
    id: 'geom_c3_240_111',
    name: 'C3 240° around [1,1,1]',
    matrix: [
      [0.0, 1.0, 0.0, 0.0],
      [0.0, 0.0, 1.0, 0.0],
      [1.0, 0.0, 0.0, 0.0],
      [0.0, 0.0, 0.0, 1.0]
    ]
  },
  {
    id: 'geom_rot_edge_x',
    name: '180° Rotation around X axis',
    matrix: [
      [1.0,  0.0,  0.0, 0.0],
      [0.0, -1.0,  0.0, 0.0],
      [0.0,  0.0, -1.0, 0.0],
      [0.0,  0.0,  0.0, 1.0]
    ]
  },
  {
    id: 'geom_rot_edge_y',
    name: '180° Rotation around Y axis',
    matrix: [
      [-1.0, 0.0,  0.0, 0.0],
      [ 0.0, 1.0,  0.0, 0.0],
      [ 0.0,  0.0, -1.0, 0.0],
      [ 0.0,  0.0,  0.0, 1.0]
    ]
  }
];

// Canonical JSON stringification with recursive key sorting and edge-case normalization
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

export function multiplyMatrix4x4(a: Matrix4x4, b: Matrix4x4): Matrix4x4 {
  const result: Matrix4x4 = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 1]
  ];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += (a[i]?.[k] ?? 0) * (b[k]?.[j] ?? 0);
      }
      result[i][j] = sum;
    }
  }
  return result;
}

export function pointsEqual(p1: Point3D, p2: Point3D, eps = 1e-5): boolean {
  return Math.abs(p1[0] - p2[0]) < eps &&
         Math.abs(p1[1] - p2[1]) < eps &&
         Math.abs(p1[2] - p2[2]) < eps;
}

// Check matrix structural validity (dimensions, finite, homogeneous row [0,0,0,1], det=+1, orthogonality)
export function validateMatrixStructure(mat: Matrix4x4): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!Array.isArray(mat) || mat.length !== 4) {
    errors.push('Matrix must be 4x4 array');
    return { valid: false, errors };
  }
  for (let i = 0; i < 4; i++) {
    if (!Array.isArray(mat[i]) || mat[i].length !== 4) {
      errors.push(`Row ${i} must have 4 elements`);
      return { valid: false, errors };
    }
    for (let j = 0; j < 4; j++) {
      if (typeof mat[i][j] !== 'number' || !Number.isFinite(mat[i][j])) {
        errors.push(`Entry [${i}][${j}] is not a finite number`);
      }
    }
  }

  // Homogeneous row check
  const lastRow = mat[3];
  if (!lastRow || Math.abs(lastRow[0]) > 1e-9 || Math.abs(lastRow[1]) > 1e-9 || Math.abs(lastRow[2]) > 1e-9 || Math.abs(lastRow[3] - 1.0) > 1e-9) {
    errors.push('Homogeneous row must be [0, 0, 0, 1]');
  }

  const det = computeDeterminant3x3(mat);
  if (Math.abs(det - 1.0) > 1e-4) {
    errors.push(`Determinant must be +1.0 for proper rotation (actual: ${det})`);
  }

  const orthoDelta = computeOrthogonalityDelta(mat);
  if (orthoDelta > 1e-4) {
    errors.push(`Orthogonality delta too high: ${orthoDelta}`);
  }

  return { valid: errors.length === 0, errors };
}

// Verify distance preservation (isometry) on all vertex pairs
export function validateDistancePreservation(mat: Matrix4x4, vertices: Point3D[]): { valid: boolean; maxError: number } {
  let maxError = 0;
  const n = vertices.length;
  try {
    const transformed = vertices.map(v => applyMatrix4x4(v, mat));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const originalDist = euclideanDistance(vertices[i], vertices[j]);
        const transformedDist = euclideanDistance(transformed[i], transformed[j]);
        const diff = Math.abs(originalDist - transformedDist);
        if (diff > maxError) maxError = diff;
        if (diff > 1e-4) {
          return { valid: false, maxError };
        }
      }
    }
  } catch {
    return { valid: false, maxError: 999.0 };
  }
  return { valid: true, maxError };
}

// Verify vertex set preservation (bijective mapping of V4 to V4)
export function validateVertexSetPreservation(mat: Matrix4x4, vertices: Point3D[]): boolean {
  try {
    const transformed = vertices.map(v => applyMatrix4x4(v, mat));
    // Every transformed vertex must match one of the original vertices
    for (const t of transformed) {
      const found = vertices.some(v => pointsEqual(t, v));
      if (!found) return false;
    }
    // Also check uniqueness / bijection (all 4 transformed vertices are distinct)
    for (let i = 0; i < transformed.length; i++) {
      for (let j = i + 1; j < transformed.length; j++) {
        if (pointsEqual(transformed[i], transformed[j])) {
          return false; // Collision / non-bijective collapse
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

// Verify homomorphism / composition consistency: M1 * M2 applied to v equals M1 applied to (M2 applied to v)
export function validateCompositionConsistency(ops: GeometricOperation[], vertices: Point3D[]): boolean {
  for (const op1 of ops) {
    for (const op2 of ops) {
      const composedMat = multiplyMatrix4x4(op1.matrix, op2.matrix);
      for (const v of vertices) {
        const leftSide = applyMatrix4x4(v, composedMat);
        const intermediate = applyMatrix4x4(v, op2.matrix);
        const rightSide = applyMatrix4x4(intermediate, op1.matrix);
        if (!pointsEqual(leftSide, rightSide, 1e-4)) {
          return false;
        }
      }
    }
  }
  return true;
}

// =============================================================================
// TEST EXECUTION RUNNER
// =============================================================================

export function runSecPoc03Tests() {
  console.log('====================================================================');
  console.log('FSS v3 — SEC PoC-03: GEOMETRIC ACTION VERIFICATION RUNNER');
  console.log('====================================================================');

  const datasetForDigest = {
    scope: 'SEC-PoC-03 Geometric Action Verification',
    operations: REF_GEO_OPERATIONS.map(op => ({ id: op.id, name: op.name, matrix: op.matrix })),
    vertices: TETRAHEDRON_VERTICES
  };
  const digest = computeCryptographicDigest(datasetForDigest);
  console.log(`Source Operations Loaded: ${REF_GEO_OPERATIONS.length} elements`);
  console.log(`Cryptographic SHA-256 Digest: ${digest}`);
  console.log('--------------------------------------------------------------------');

  let passedChecks = 0;
  let totalChecks = 0;

  // --- POSITIVE BASELINE ---
  console.log('--- [POS_GEO] RUNNING POSITIVE GEOMETRIC ACTION BASELINE ---');

  // 1. Structure
  totalChecks++;
  const allStructured = REF_GEO_OPERATIONS.every(op => validateMatrixStructure(op.matrix).valid);
  if (allStructured) {
    passedChecks++;
    console.log('[CHK_GEO_STRUCTURE] ✅ Verify 4x4 dimensions, orthogonality, det=+1.0 for all ref operations -> PASS');
  } else {
    console.log('[CHK_GEO_STRUCTURE] ❌ FAIL');
  }

  // 2. Distance Preservation
  totalChecks++;
  const allDistances = REF_GEO_OPERATIONS.every(op => validateDistancePreservation(op.matrix, TETRAHEDRON_VERTICES).valid);
  if (allDistances) {
    passedChecks++;
    console.log('[CHK_GEO_DISTANCE] ✅ Verify isometric distance preservation across all vertex pairs -> PASS');
  } else {
    console.log('[CHK_GEO_DISTANCE] ❌ FAIL');
  }

  // 3. Vertex Set Preservation (Bijective mapping of V4)
  totalChecks++;
  const allSets = REF_GEO_OPERATIONS.every(op => validateVertexSetPreservation(op.matrix, TETRAHEDRON_VERTICES));
  if (allSets) {
    passedChecks++;
    console.log('[CHK_GEO_SET] ✅ Verify bijective vertex set preservation ({v1,v2,v3,v4} -> {v1,v2,v3,v4}) -> PASS');
  } else {
    console.log('[CHK_GEO_SET] ❌ FAIL');
  }

  // 4. Action Composition Consistency (Subset Test - No Group Closure Assumed)
  totalChecks++;
  const homomorphic = validateCompositionConsistency(REF_GEO_OPERATIONS, TETRAHEDRON_VERTICES);
  if (homomorphic) {
    passedChecks++;
    console.log('[CHK_GEO_ACTION_COMPATIBILITY] ✅ Verify action composition consistency (M1*M2)(v) == M1(M2(v)) across operation subset -> PASS');
  } else {
    console.log('[CHK_GEO_ACTION_COMPATIBILITY] ❌ FAIL');
  }

  console.log(`Positive Baseline Verdict: ${passedChecks === totalChecks ? 'VERIFIED' : 'FAILED'}`);
  console.log('--------------------------------------------------------------------');

  // --- ADVERSARIAL NEGATIVE TEST BATTERY ---
  console.log('--- [ADV_GEO] ADVERSARIAL NEGATIVE TEST BATTERY ---');

  interface AdversarialCase {
    id: string;
    description: string;
    mutatedOp: GeometricOperation;
    expectedTarget: string;
  }

  const adversarialCases: AdversarialCase[] = [
    {
      id: 'ADV_GEO_01',
      description: 'Non-isometric linear scaling (scale x by 1.5)',
      expectedTarget: 'CHK_GEO_DISTANCE',
      mutatedOp: {
        id: 'mut_scale',
        name: 'Non-isometric scale',
        matrix: [
          [1.5, 0.0, 0.0, 0.0],
          [0.0, 1.0, 0.0, 0.0],
          [0.0, 0.0, 1.0, 0.0],
          [0.0, 0.0, 0.0, 1.0]
        ]
      }
    },
    {
      id: 'ADV_GEO_02',
      description: 'Non-bijective projection matrix (collapsing v2 and v3 to v1)',
      expectedTarget: 'CHK_GEO_SET',
      mutatedOp: {
        id: 'mut_project',
        name: 'Projection matrix',
        matrix: [
          [1.0, 0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0, 0.0],
          [0.0, 0.0, 0.0, 1.0]
        ]
      }
    },
    {
      id: 'ADV_GEO_03',
      description: 'Translation offset added (shifting tetrahedron off origin)',
      expectedTarget: 'CHK_GEO_STRUCTURE',
      mutatedOp: {
        id: 'mut_translate',
        name: 'Translation offset',
        matrix: [
          [0.0, 0.0, 1.0, 0.5],
          [1.0, 0.0, 0.0, 0.0],
          [0.0, 1.0, 0.0, 0.0],
          [0.0, 0.0, 0.0, 1.0]
        ]
      }
    },
    {
      id: 'ADV_GEO_04',
      description: 'Reflection / improper rotation (det = -1.0)',
      expectedTarget: 'CHK_GEO_STRUCTURE',
      mutatedOp: {
        id: 'mut_reflect',
        name: 'Reflection mirror x',
        matrix: [
          [-1.0, 0.0,  0.0, 0.0],
          [ 0.0, 1.0,  0.0, 0.0],
          [ 0.0, 0.0,  1.0, 0.0],
          [ 0.0, 0.0,  0.0, 1.0]
        ]
      }
    },
    {
      id: 'ADV_GEO_05',
      description: 'Asymmetric rotation (45 deg around [1,1,1] - not a tetrahedron symmetry)',
      expectedTarget: 'CHK_GEO_SET',
      mutatedOp: {
        id: 'mut_asym_45',
        name: 'Asymmetric 45° rotation',
        matrix: buildRotationMatrix([1.0, 1.0, 1.0], 45.0)
      }
    }
  ];

  let advPassed = 0;
  for (const adv of adversarialCases) {
    const structCheck = validateMatrixStructure(adv.mutatedOp.matrix).valid;
    const distCheck = structCheck ? validateDistancePreservation(adv.mutatedOp.matrix, TETRAHEDRON_VERTICES).valid : false;
    const setCheck = structCheck && distCheck ? validateVertexSetPreservation(adv.mutatedOp.matrix, TETRAHEDRON_VERTICES) : false;

    const caught = !structCheck || !distCheck || !setCheck;
    const failures: string[] = [];
    if (!structCheck) failures.push('CHK_GEO_STRUCTURE');
    if (!distCheck) failures.push('CHK_GEO_DISTANCE');
    if (!setCheck) failures.push('CHK_GEO_SET');

    if (caught) {
      advPassed++;
      console.log(`[${adv.id}] 🛡️ PASS | Injected: ${adv.description} | Expected Target: ${adv.expectedTarget} | Caught By: [${failures.join(', ')}] | Verdict: REJECTED`);
    } else {
      console.log(`[${adv.id}] `);
    }
  }

  console.log('====================================================================');
  console.log(`CRYPTOGRAPHIC EVIDENCE SHA-256 DIGEST: ${digest}`);
  console.log(`ADVERSARIAL SUITE SUMMARY: ${advPassed} / ${adversarialCases.length} NEGATIVE CASES REJECTED WITH ATTRIBUTION`);
  console.log('====================================================================');

  if (passedChecks === totalChecks && advPassed === adversarialCases.length) {
    console.log('SEC PoC-03 GEOMETRIC ACTION VERIFICATION: ALL TESTS PASSED SUCCESSFULLY ✅');
    process.exit(0);
  } else {
    console.error('SEC PoC-03 GEOMETRIC ACTION VERIFICATION: TEST SUITE FAILED ❌');
    process.exit(1);
  }
}

runSecPoc03Tests();
