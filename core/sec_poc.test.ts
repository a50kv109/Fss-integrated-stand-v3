/**
 * SEC PoC-01: Adversarial Reliability & Evidence Chain Test Suite
 * 
 * Features:
 * - Independent Mathematical Reference for C3 group (analytic permutation matrices and Cayley table).
 * - Rigorous Matrix Structural & Finite Validation (NaN, Infinity, dimensions, homogeneous row, orthogonality, determinant).
 * - Metadata vs Matrix Consistency Verification (Rodrigues formula, trace, eigenvector axis).
 * - Orbit-Stabilizer verification on both trivial axis vertex v0 = [1,1,1] and nontrivial off-axis vertex v1 = [1,-1,-1].
 * - Full canonical JSON serialization with recursive key sorting and edge-case normalization.
 * - Comprehensive adversarial battery (ADV_MAT_01..06, ADV_GRP_01..06, ADV_ACT_01..03, ADV_SER_01..04)
 *   with exact failure attribution.
 */

import crypto from 'crypto';
import {
  CANONICAL_TETRAHEDRON,
} from './canonical';
import { applyMatrix4x4, euclideanDistance, computeDeterminant3x3, computeOrthogonalityDelta } from './engine';
import { Matrix4x4, Operation, Point3D } from './types';

// =============================================================================
// 1. INDEPENDENT MATHEMATICAL REFERENCE SPECIFICATION FOR C3
// =============================================================================
// Origin: In R^3 with standard Cartesian basis, a proper rotation by 120° around
// the body diagonal axis [1, 1, 1] acts by cyclic permutation of coordinates:
//   C3(120°): (x, y, z) -> (z, x, y)
// Repeating this transformation gives:
//   C3(240°): (x, y, z) -> (y, z, x)
// And returning to identity:
//   C3(360°) = I: (x, y, z) -> (x, y, z)
// These matrices are written out analytically, independent of any matrix multiplication code.

export const INDEPENDENT_REF_I: Matrix4x4 = [
  [1.0, 0.0, 0.0, 0.0],
  [0.0, 1.0, 0.0, 0.0],
  [0.0, 0.0, 1.0, 0.0],
  [0.0, 0.0, 0.0, 1.0]
];

export const INDEPENDENT_REF_C3_120: Matrix4x4 = [
  [0.0, 0.0, 1.0, 0.0],
  [1.0, 0.0, 0.0, 0.0],
  [0.0, 1.0, 0.0, 0.0],
  [0.0, 0.0, 0.0, 1.0]
];

export const INDEPENDENT_REF_C3_240: Matrix4x4 = [
  [0.0, 1.0, 0.0, 0.0],
  [0.0, 0.0, 1.0, 0.0],
  [1.0, 0.0, 0.0, 0.0],
  [0.0, 0.0, 0.0, 1.0]
];

export const INDEPENDENT_REFS: Matrix4x4[] = [
  INDEPENDENT_REF_I,
  INDEPENDENT_REF_C3_120,
  INDEPENDENT_REF_C3_240
];

// Analytic Cayley Table mapping index pairs (i, j) to target index in [I, C3, C3^2]:
// Index 0: I, Index 1: C3_120, Index 2: C3_240
// Composition convention: prod[i][j] = ops[i] * ops[j]
export const INDEPENDENT_CAYLEY_TABLE: number[][] = [
  [0, 1, 2], // I * (I, C3, C3^2) -> (I, C3, C3^2)
  [1, 2, 0], // C3 * (I, C3, C3^2) -> (C3, C3^2, I)
  [2, 0, 1]  // C3^2 * (I, C3, C3^2) -> (C3^2, I, C3)
];

// Canonical JSON stringification with recursive key sorting and edge-case handling
export function canonicalStringify(obj: any): string {
  if (obj === null) return 'null';
  if (obj === undefined) return 'null';
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

export function invertMatrix4x4(mat: Matrix4x4): Matrix4x4 {
  const invR: Matrix4x4 = [
    [mat[0][0], mat[1][0], mat[2][0], 0],
    [mat[0][1], mat[1][1], mat[2][1], 0],
    [mat[0][2], mat[1][2], mat[2][2], 0],
    [0, 0, 0, 1]
  ];
  const tx = mat[0][3] ?? 0;
  const ty = mat[1][3] ?? 0;
  const tz = mat[2][3] ?? 0;
  const itx = -(invR[0][0] * tx + invR[0][1] * ty + invR[0][2] * tz);
  const ity = -(invR[1][0] * tx + invR[1][1] * ty + invR[1][2] * tz);
  const itz = -(invR[2][0] * tx + invR[2][1] * ty + invR[2][2] * tz);

  invR[0][3] = itx;
  invR[1][3] = ity;
  invR[2][3] = itz;
  return invR;
}

export function matricesEqual(a: Matrix4x4, b: Matrix4x4, eps = 1e-5): boolean {
  if (!a || !b) return false;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const va = a[i]?.[j];
      const vb = b[i]?.[j];
      if (typeof va !== 'number' || typeof vb !== 'number') return false;
      if (!Number.isFinite(va) || !Number.isFinite(vb)) return false;
      if (Math.abs(va - vb) > eps) return false;
    }
  }
  return true;
}

// Rodrigues rotation formula calculation on 3D vector
function rodriguesRotate(v: Point3D, axis: Point3D, angleRad: number): Point3D {
  const len = Math.hypot(axis[0], axis[1], axis[2]);
  if (len < 1e-9) return [...v];
  const u: Point3D = [axis[0] / len, axis[1] / len, axis[2] / len];
  const cosT = Math.cos(angleRad);
  const sinT = Math.sin(angleRad);
  
  // u x v
  const cross: Point3D = [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0]
  ];
  // u . v
  const dot = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];

  return [
    v[0] * cosT + cross[0] * sinT + u[0] * dot * (1.0 - cosT),
    v[1] * cosT + cross[1] * sinT + u[1] * dot * (1.0 - cosT),
    v[2] * cosT + cross[2] * sinT + u[2] * dot * (1.0 - cosT)
  ];
}

export type CheckStatus = 'PASS' | 'FAIL' | 'NOT_RUN';

export interface EvidenceCheckReport {
  checkId: string;
  description: string;
  status: CheckStatus;
  inputDigest: string;
  expected: string;
  actual: string;
}

export interface VerificationResult {
  checks: EvidenceCheckReport[];
  overallVerdict: 'VERIFIED' | 'REJECTED';
}

export function isMatrixComputable(mat: any): boolean {
  if (!mat || !Array.isArray(mat) || mat.length !== 4) return false;
  for (let r = 0; r < 4; r++) {
    if (!Array.isArray(mat[r]) || mat[r].length !== 4) return false;
    for (let c = 0; c < 4; c++) {
      const val = mat[r][c];
      if (typeof val !== 'number' || !Number.isFinite(val)) return false;
    }
  }
  return true;
}

export interface SecVerificationHooks {
  overrideClosure?: (ops: Operation[], defaultResult: boolean) => boolean;
  overrideInverses?: (ops: Operation[], defaultResult: boolean) => boolean;
  overrideMatrixStructure?: (ops: Operation[], defaultResult: boolean) => boolean;
  overrideVertexPermutation?: (ops: Operation[], defaultResult: boolean) => boolean;
  overrideNontrivialOrbit?: (ops: Operation[], defaultResult: boolean) => boolean;
  overrideTrivialOrbit?: (ops: Operation[], defaultResult: boolean) => boolean;
  overrideIdentity?: (ops: Operation[], defaultResult: boolean) => boolean;
  overrideDuplicates?: (ops: Operation[], defaultResult: boolean) => boolean;
  overrideMetadataConsistency?: (ops: Operation[], defaultResult: boolean) => boolean;
  overrideIndependentRef?: (ops: Operation[], defaultResult: boolean) => boolean;
  overrideDigest?: (data: any, defaultDigest: string) => string;
}

// -----------------------------------------------------------------------------
// SEC Execution Engine with Rigorous Adversarial Validation
// -----------------------------------------------------------------------------
export function runSecVerification(ops: Operation[], hooks?: SecVerificationHooks): VerificationResult {
  const checks: EvidenceCheckReport[] = [];
  const rawDigest = computeCryptographicDigest(ops);
  const digest = hooks?.overrideDigest ? hooks.overrideDigest(ops, rawDigest) : rawDigest;

  // Pre-check computability (finite numbers & 4x4 dimensions)
  const allComputable = ops.length > 0 && ops.every(op => isMatrixComputable(op?.matrix4x4));

  // 1. Matrix Structural & Orthogonality Validation
  let structuresValid = true;
  let structErrorMsg = '';

  if (!allComputable) {
    structuresValid = false;
    structErrorMsg = 'One or more operations have malformed matrix dimensions or non-finite entries (NaN/Infinity)';
  } else {
    for (let i = 0; i < ops.length; i++) {
      const mat = ops[i].matrix4x4;

      // Homogeneous last row: [0, 0, 0, 1]
      const lastRowValid = Math.abs(mat[3][0]) < 1e-6 &&
                           Math.abs(mat[3][1]) < 1e-6 &&
                           Math.abs(mat[3][2]) < 1e-6 &&
                           Math.abs(mat[3][3] - 1.0) < 1e-6;
      if (!lastRowValid) {
        structuresValid = false;
        structErrorMsg = `Operation op[${i}] has invalid homogeneous last row: [${mat[3].join(',')}]`;
        break;
      }

      // Translation vector: [0, 0, 0] for point group operations
      const translationZero = Math.abs(mat[0][3]) < 1e-6 &&
                              Math.abs(mat[1][3]) < 1e-6 &&
                              Math.abs(mat[2][3]) < 1e-6;
      if (!translationZero) {
        structuresValid = false;
        structErrorMsg = `Operation op[${i}] has non-zero translation [${mat[0][3]}, ${mat[1][3]}, ${mat[2][3]}]`;
        break;
      }

      // Orthogonality and Determinant
      const orthoDelta = computeOrthogonalityDelta(mat);
      const det = computeDeterminant3x3(mat);
      if (orthoDelta > 1e-5 || Math.abs(det - 1.0) > 1e-5) {
        structuresValid = false;
        structErrorMsg = `Operation op[${i}] failed structure check (orthoDelta=${orthoDelta.toFixed(6)}, det=${det.toFixed(6)}, expected det=+1.0)`;
        break;
      }
    }
  }

  if (hooks?.overrideMatrixStructure) {
    structuresValid = hooks.overrideMatrixStructure(ops, structuresValid);
  }

  checks.push({
    checkId: 'CHK_MATRIX_STRUCTURE',
    description: 'Verify 4x4 dimensions, finite entries, homogeneous row [0,0,0,1], zero translation, orthogonality, and det=+1.0',
    status: structuresValid ? 'PASS' : 'FAIL',
    inputDigest: digest,
    expected: 'Valid affine matrix with finite entries, orthoDelta < 1e-5 and det = +1.0',
    actual: structuresValid ? 'All matrices structurally valid' : structErrorMsg
  });

  // 2. Metadata vs Matrix Transformation Consistency
  let metadataConsistent = true;
  let metaErrorMsg = '';
  if (allComputable) {
    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      const mat = op.matrix4x4;
      if (op.type === 'IDENTITY') {
        if (Math.abs(op.angleDeg) > 1e-6) {
          metadataConsistent = false;
          metaErrorMsg = `op[${i}] declared IDENTITY but angleDeg = ${op.angleDeg}`;
          break;
        }
        const trace = mat[0][0] + mat[1][1] + mat[2][2];
        if (Math.abs(trace - 3.0) > 1e-5) {
          metadataConsistent = false;
          metaErrorMsg = `op[${i}] declared IDENTITY but matrix trace = ${trace.toFixed(4)} (expected 3.0)`;
          break;
        }
      } else if (op.type === 'ROTATION') {
        const rad = (op.angleDeg * Math.PI) / 180.0;
        const expectedTrace = 1.0 + 2.0 * Math.cos(rad);
        const actualTrace = mat[0][0] + mat[1][1] + mat[2][2];
        if (Math.abs(expectedTrace - actualTrace) > 1e-4) {
          metadataConsistent = false;
          metaErrorMsg = `op[${i}] angleDeg=${op.angleDeg} trace mismatch: expected ${expectedTrace.toFixed(4)}, actual ${actualTrace.toFixed(4)}`;
          break;
        }

        // Axis invariance: R * axis = axis
        const axisPt: Point3D = [op.axis[0], op.axis[1], op.axis[2]];
        const transformedAxis = applyMatrix4x4(axisPt, mat);
        if (euclideanDistance(transformedAxis, axisPt) > 1e-4) {
          metadataConsistent = false;
          metaErrorMsg = `op[${i}] declared axis [${axisPt.join(',')}] is not invariant under matrix transformation`;
          break;
        }

        // Test vector direction check via Rodrigues formula
        const testV: Point3D = [1.0, 0.0, 0.0];
        const expectedTestV = rodriguesRotate(testV, axisPt, rad);
        const actualTestV = applyMatrix4x4(testV, mat);
        if (euclideanDistance(expectedTestV, actualTestV) > 1e-4) {
          metadataConsistent = false;
          metaErrorMsg = `op[${i}] rotation orientation mismatch for test vector [1,0,0]: expected [${expectedTestV.map(n=>n.toFixed(3)).join(',')}], got [${actualTestV.map(n=>n.toFixed(3)).join(',')}]`;
          break;
        }
      }
    }
  } else {
    metadataConsistent = false;
    metaErrorMsg = 'Skipped due to non-computable matrix';
  }

  if (hooks?.overrideMetadataConsistency) {
    metadataConsistent = hooks.overrideMetadataConsistency(ops, metadataConsistent);
  }

  checks.push({
    checkId: 'CHK_METADATA_CONSISTENCY',
    description: 'Verify declared operation type, axis, and angleDeg match actual matrix trace, eigenvector, and Rodrigues transform',
    status: metadataConsistent ? 'PASS' : 'FAIL',
    inputDigest: digest,
    expected: 'Declared metadata strictly matches geometric matrix transformation',
    actual: metadataConsistent ? 'Metadata fully consistent with matrices' : metaErrorMsg
  });

  // 3. Identity Check
  let hasIdentity = false;
  if (allComputable) {
    for (const op of ops) {
      if (matricesEqual(op.matrix4x4, INDEPENDENT_REF_I)) {
        hasIdentity = true;
        break;
      }
    }
  }

  if (hooks?.overrideIdentity) {
    hasIdentity = hooks.overrideIdentity(ops, hasIdentity);
  }

  checks.push({
    checkId: 'CHK_IDENTITY',
    description: 'Verify identity element (I3) exists in operation set',
    status: hasIdentity ? 'PASS' : 'FAIL',
    inputDigest: digest,
    expected: 'Identity matrix present in group set',
    actual: hasIdentity ? 'Identity matrix found' : 'Identity matrix missing'
  });

  // 4. Duplicate Check
  let hasDuplicates = false;
  if (allComputable) {
    for (let i = 0; i < ops.length; i++) {
      for (let j = i + 1; j < ops.length; j++) {
        if (matricesEqual(ops[i].matrix4x4, ops[j].matrix4x4)) {
          hasDuplicates = true;
          break;
        }
      }
      if (hasDuplicates) break;
    }
  }

  let duplicatesValid = !hasDuplicates && allComputable;
  if (hooks?.overrideDuplicates) {
    duplicatesValid = hooks.overrideDuplicates(ops, duplicatesValid);
  }

  checks.push({
    checkId: 'CHK_DUPLICATES',
    description: 'Verify no duplicate matrix operations exist in set',
    status: duplicatesValid ? 'PASS' : 'FAIL',
    inputDigest: digest,
    expected: 'No duplicate operations in group set',
    actual: !duplicatesValid ? 'Duplicate matrix detected' : (allComputable ? 'All operations unique' : 'Cannot verify uniqueness on non-computable matrices')
  });

  // 5. Independent Cayley Table Reference & Composition Check
  let conformsToCayley = true;
  let cayleyErrorMsg = '';
  if (allComputable && ops.length === 3) {
    // 5a. Verify each operation matches the independent mathematical reference
    for (let i = 0; i < 3; i++) {
      if (!matricesEqual(ops[i].matrix4x4, INDEPENDENT_REFS[i])) {
        conformsToCayley = false;
        cayleyErrorMsg = `Operation op[${i}] does not match independent mathematical reference INDEPENDENT_REFS[${i}]`;
        break;
      }
    }

    // 5b. Verify binary compositions against independent Cayley table
    if (conformsToCayley) {
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const prod = multiplyMatrix4x4(ops[i].matrix4x4, ops[j].matrix4x4);
          const targetIdx = INDEPENDENT_CAYLEY_TABLE[i][j];
          const targetRefMat = INDEPENDENT_REFS[targetIdx];
          if (!matricesEqual(prod, targetRefMat)) {
            conformsToCayley = false;
            cayleyErrorMsg = `Product of op[${i}] and op[${j}] does not match independent Cayley target index ${targetIdx}`;
            break;
          }
        }
        if (!conformsToCayley) break;
      }
    }

    // 5c. Verify 3 successive rotations of C3 return to I: C3^3 = I
    if (conformsToCayley) {
      const c3_cubed = multiplyMatrix4x4(multiplyMatrix4x4(ops[1].matrix4x4, ops[1].matrix4x4), ops[1].matrix4x4);
      if (!matricesEqual(c3_cubed, INDEPENDENT_REF_I)) {
        conformsToCayley = false;
        cayleyErrorMsg = 'Three successive C3 rotations do not yield Identity';
      }
    }
  } else {
    conformsToCayley = false;
    cayleyErrorMsg = !allComputable ? 'Non-computable matrix structure' : `Operation count (${ops.length}) does not match order 3 of C3`;
  }

  if (hooks?.overrideIndependentRef) {
    conformsToCayley = hooks.overrideIndependentRef(ops, conformsToCayley);
  }

  checks.push({
    checkId: 'CHK_INDEPENDENT_REFERENCE',
    description: 'Verify matrix multiplication against independent analytic Cayley table and C3^3 = I',
    status: conformsToCayley ? 'PASS' : 'FAIL',
    inputDigest: digest,
    expected: 'All operations and compositions conform to independent Cayley reference',
    actual: conformsToCayley ? 'Conforms to independent Cayley reference table (C3^3 = I verified)' : cayleyErrorMsg
  });

  // 6. General Closure Check
  let isClosed = true;
  let closureFailureDetails = '';
  if (allComputable) {
    for (let i = 0; i < ops.length; i++) {
      for (let j = 0; j < ops.length; j++) {
        const prod = multiplyMatrix4x4(ops[i].matrix4x4, ops[j].matrix4x4);
        let found = false;
        for (const target of ops) {
          if (matricesEqual(target.matrix4x4, prod)) {
            found = true;
            break;
          }
        }
        if (!found) {
          isClosed = false;
          closureFailureDetails = `Product of op[${i}] and op[${j}] not found in set`;
          break;
        }
      }
      if (!isClosed) break;
    }
  } else {
    isClosed = false;
    closureFailureDetails = 'Cannot verify closure on non-computable matrices';
  }

  if (hooks?.overrideClosure) {
    isClosed = hooks.overrideClosure(ops, isClosed);
  }

  checks.push({
    checkId: 'CHK_CLOSURE',
    description: 'Verify group closure under binary composition',
    status: isClosed ? 'PASS' : 'FAIL',
    inputDigest: digest,
    expected: 'All compositions within set',
    actual: isClosed ? 'Closure satisfied' : closureFailureDetails
  });

  // 7. Inverse Check
  let hasInverses = true;
  let inverseFailureDetails = '';
  if (allComputable) {
    for (let i = 0; i < ops.length; i++) {
      const invMat = invertMatrix4x4(ops[i].matrix4x4);
      let found = false;
      for (const target of ops) {
        if (matricesEqual(target.matrix4x4, invMat)) {
          found = true;
          break;
        }
      }
      if (!found) {
        hasInverses = false;
        inverseFailureDetails = `Inverse for op[${i}] not found in set`;
        break;
      }
    }
  } else {
    hasInverses = false;
    inverseFailureDetails = 'Cannot verify inverses on non-computable matrices';
  }

  if (hooks?.overrideInverses) {
    hasInverses = hooks.overrideInverses(ops, hasInverses);
  }

  checks.push({
    checkId: 'CHK_INVERSES',
    description: 'Verify existence of inverse element for every operation',
    status: hasInverses ? 'PASS' : 'FAIL',
    inputDigest: digest,
    expected: 'Every element has an inverse in set',
    actual: hasInverses ? 'All inverses present' : inverseFailureDetails
  });

  // 8. Full Tetrahedron Vertex Permutation Symmetry Check (Bijective Permutation)
  let vertexPermutationValid = true;
  let permErrorMsg = '';
  const originalVertices = CANONICAL_TETRAHEDRON.vertices.map(v => v.coords);
  
  if (allComputable) {
    for (let i = 0; i < ops.length; i++) {
      const op = ops[i];
      const transformedVertices = originalVertices.map(v => applyMatrix4x4(v, op.matrix4x4));
      const matchedIndices = new Set<number>();
      for (const tv of transformedVertices) {
        let matchedIdx = -1;
        for (let vi = 0; vi < originalVertices.length; vi++) {
          if (euclideanDistance(tv, originalVertices[vi]) < 1e-4) {
            matchedIdx = vi;
            break;
          }
        }
        if (matchedIdx === -1) {
          vertexPermutationValid = false;
          permErrorMsg = `Operation op[${i}] maps to a point outside tetrahedron vertices`;
          break;
        }
        matchedIndices.add(matchedIdx);
      }
      // Check bijectivity: image must contain all 4 distinct original vertices
      if (vertexPermutationValid && matchedIndices.size !== originalVertices.length) {
        vertexPermutationValid = false;
        permErrorMsg = `Operation op[${i}] is not bijective (maps to only ${matchedIndices.size} distinct vertices)`;
        break;
      }
      if (!vertexPermutationValid) break;
    }
  } else {
    vertexPermutationValid = false;
    permErrorMsg = 'Cannot verify vertex permutation on non-computable matrices';
  }

  if (hooks?.overrideVertexPermutation) {
    vertexPermutationValid = hooks.overrideVertexPermutation(ops, vertexPermutationValid);
  }

  checks.push({
    checkId: 'CHK_VERTEX_PERMUTATION',
    description: 'Verify each operation bijectively permutes the full canonical tetrahedron vertex set',
    status: vertexPermutationValid ? 'PASS' : 'FAIL',
    inputDigest: digest,
    expected: 'All vertices map bijectively to vertices of tetrahedron',
    actual: vertexPermutationValid ? 'Vertex set fully preserved and bijectively permuted' : permErrorMsg
  });

  // 9. Trivial Orbit Check on Axis Vertex v0 = [1, 1, 1]
  let orbit0Valid = false;
  let orbit0Actual = '';
  if (allComputable) {
    const v0 = CANONICAL_TETRAHEDRON.vertices[0].coords;
    const orbitSet0 = new Set<string>();
    let stab0 = 0;
    for (const op of ops) {
      const pt = applyMatrix4x4(v0, op.matrix4x4);
      orbitSet0.add(pt.map(n => Math.round(n * 1e5)).join(','));
      if (euclideanDistance(pt, v0) < 1e-4) stab0++;
    }
    orbit0Valid = (orbitSet0.size === 1 && stab0 === ops.length && orbitSet0.size * stab0 === ops.length);
    orbit0Actual = `|Orb(v0)|=${orbitSet0.size}, |G_v0|=${stab0}, Product=${orbitSet0.size * stab0}`;
  } else {
    orbit0Actual = 'Cannot compute orbit on non-computable matrices';
  }

  if (hooks?.overrideTrivialOrbit) {
    orbit0Valid = hooks.overrideTrivialOrbit(ops, orbit0Valid);
  }

  checks.push({
    checkId: 'CHK_TRIVIAL_ORBIT',
    description: 'Verify Orbit-Stabilizer theorem on rotation axis vertex v0: |Orb(v0)| * |G_v0| == |G|',
    status: orbit0Valid ? 'PASS' : 'FAIL',
    inputDigest: digest,
    expected: `Product equals group order (${ops.length}) with |Orb|=1, |G_x|=3`,
    actual: orbit0Actual
  });

  // 10. Nontrivial Orbit Check on Off-Axis Vertex v1 = [1, -1, -1]
  let nontrivialValid = false;
  let orbit1Actual = '';
  if (allComputable) {
    const v1 = CANONICAL_TETRAHEDRON.vertices[1].coords;
    const expected_v2 = CANONICAL_TETRAHEDRON.vertices[2].coords;
    const expected_v3 = CANONICAL_TETRAHEDRON.vertices[3].coords;

    const orbitPoints: Point3D[] = [];
    const orbitSet1 = new Set<string>();
    let stab1 = 0;
    for (const op of ops) {
      const pt = applyMatrix4x4(v1, op.matrix4x4);
      orbitPoints.push(pt);
      orbitSet1.add(pt.map(n => Math.round(n * 1e5)).join(','));
      if (euclideanDistance(pt, v1) < 1e-4) stab1++;
    }

    // Ensure all 3 points are pairwise distinct by distance > 1e-3
    let pairwiseDistinct = true;
    for (let i = 0; i < orbitPoints.length; i++) {
      for (let j = i + 1; j < orbitPoints.length; j++) {
        if (euclideanDistance(orbitPoints[i], orbitPoints[j]) < 1e-3) {
          pairwiseDistinct = false;
        }
      }
    }

    // Ensure points match theoretical cycle: ops[0]->v1, ops[1]->v2, ops[2]->v3
    const cycleMatchesTheoretical = (
      orbitPoints.length === 3 &&
      euclideanDistance(orbitPoints[0], v1) < 1e-4 &&
      euclideanDistance(orbitPoints[1], expected_v2) < 1e-4 &&
      euclideanDistance(orbitPoints[2], expected_v3) < 1e-4
    );

    const orbit1Size = orbitSet1.size;
    const orbit1Product = orbit1Size * stab1;
    nontrivialValid = (
      orbit1Size === 3 &&
      stab1 === 1 &&
      orbit1Product === ops.length &&
      pairwiseDistinct &&
      cycleMatchesTheoretical
    );

    orbit1Actual = nontrivialValid
      ? `|Orb(v1)|=${orbit1Size} distinct points (v1->v2->v3), |G_v1|=${stab1}, Product=${orbit1Product}`
      : `Failed nontrivial orbit: |Orb|=${orbit1Size}, |G_x|=${stab1}, PairwiseDistinct=${pairwiseDistinct}, MatchesCycle=${cycleMatchesTheoretical}`;
  } else {
    orbit1Actual = 'Cannot compute orbit on non-computable matrices';
  }

  if (hooks?.overrideNontrivialOrbit) {
    nontrivialValid = hooks.overrideNontrivialOrbit(ops, nontrivialValid);
  }

  checks.push({
    checkId: 'CHK_NONTRIVIAL_ORBIT',
    description: 'Verify Orbit-Stabilizer theorem on off-axis vertex v1: |Orb(v1)| == 3, |G_v1| == 1, Product == |G|',
    status: nontrivialValid ? 'PASS' : 'FAIL',
    inputDigest: digest,
    expected: `Distinct 3-point orbit with |Orb(v1)|=3, |G_v1|=1, Product=${ops.length}, cycle (v1->v2->v3->v1)`,
    actual: orbit1Actual
  });

  const allPassed = checks.every(c => c.status === 'PASS');
  return {
    checks,
    overallVerdict: allPassed ? 'VERIFIED' : 'REJECTED'
  };
}

// =============================================================================
// BASELINE C3 GROUP SPECIFICATION
// =============================================================================
export const opI: Operation = {
  id: 'op_identity',
  name: 'Identity Transformation I3',
  type: 'IDENTITY',
  axis: [0.0, 0.0, 1.0],
  angleDeg: 0.0,
  matrix4x4: INDEPENDENT_REF_I
};

export const opC3: Operation = {
  id: 'op_rot_c3_120',
  name: 'C3 Rotation 120° [1,1,1]',
  type: 'ROTATION',
  axis: [1.0, 1.0, 1.0],
  angleDeg: 120.0,
  matrix4x4: INDEPENDENT_REF_C3_120
};

export const opC3_2: Operation = {
  id: 'op_rot_c3_240',
  name: 'C3 Rotation 240° [1,1,1]',
  type: 'ROTATION',
  axis: [1.0, 1.0, 1.0],
  angleDeg: 240.0,
  matrix4x4: INDEPENDENT_REF_C3_240
};

export const baseOperations: Operation[] = [opI, opC3, opC3_2];
export const sourceDigest = computeCryptographicDigest(baseOperations);

// =============================================================================
// TEST SUITE EXECUTION
// =============================================================================
export interface AdversarialTestRecord {
  id: string;
  category: 'MATRIX' | 'GROUP' | 'ACTION' | 'SERIALIZATION';
  injectedDefect: string;
  expectedCheck: string;
  actualFailedChecks: string[];
  verdict: 'VERIFIED' | 'REJECTED';
  passedAttribution: boolean;
  notes: string;
}

export function runFullAdversarialSuite(): {
  positiveResult: VerificationResult;
  adversarialRecords: AdversarialTestRecord[];
} {
  console.log('====================================================================');
  console.log('SEC PoC-01: ADVERSARIAL RELIABILITY AUDIT TEST RUNNER');
  console.log('====================================================================\n');

  console.log(`Source Operations Loaded: ${baseOperations.length} elements (From Independent Reference)`);
  console.log(`Cryptographic SHA-256 Digest: ${sourceDigest}\n`);

  // 1. POSITIVE VERIFICATION
  console.log('--- [POS_01] RUNNING POSITIVE BASELINE TEST ---');
  const positiveResult = runSecVerification(baseOperations);
  positiveResult.checks.forEach(c => {
    const icon = c.status === 'PASS' ? '✅' : '❌';
    console.log(`[${c.checkId}] ${icon} ${c.description}`);
    console.log(`   -> Actual: ${c.actual}`);
  });
  console.log(`Positive Baseline Verdict: ${positiveResult.overallVerdict}\n`);

  const records: AdversarialTestRecord[] = [];

  function recordAdversarial(
    id: string,
    category: 'MATRIX' | 'GROUP' | 'ACTION' | 'SERIALIZATION',
    injectedDefect: string,
    expectedCheck: string,
    res: VerificationResult,
    customVerification?: boolean,
    notes: string = ''
  ) {
    const failedChecks = res.checks.filter(c => c.status === 'FAIL').map(c => c.checkId);
    const passedAttribution = customVerification !== undefined
      ? customVerification
      : (res.overallVerdict === 'REJECTED' && failedChecks.includes(expectedCheck));

    const rec: AdversarialTestRecord = {
      id,
      category,
      injectedDefect,
      expectedCheck,
      actualFailedChecks: failedChecks,
      verdict: res.overallVerdict,
      passedAttribution,
      notes
    };
    records.push(rec);

    const icon = passedAttribution ? '🛡️ PASS' : '⚠️ FAIL';
    console.log(`[${id}] ${icon} | Injected: ${injectedDefect}`);
    console.log(`       Expected: ${expectedCheck} | Actual Failed: [${failedChecks.join(', ')}] | Verdict: ${res.overallVerdict}`);
  }

  console.log('--- [ADV_MAT] CATEGORY A: MATRIX STRUCTURE & ROBUSTNESS ---');

  // ADV_MAT_01: Broken Orthogonality (1.5x scaling)
  const mat01 = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  mat01[1].matrix4x4 = [
    [0.0, 0.0, 1.5, 0.0],
    [1.5, 0.0, 0.0, 0.0],
    [0.0, 1.5, 0.0, 0.0],
    [0.0, 0.0, 0.0, 1.0]
  ];
  recordAdversarial(
    'ADV_MAT_01', 'MATRIX',
    'Linear block scaling by 1.5 (non-isometric)',
    'CHK_MATRIX_STRUCTURE',
    runSecVerification(mat01),
    undefined,
    'Ortho delta exceeds 1e-5; det = 3.375 != 1.0'
  );

  // ADV_MAT_02: Improper Rotation / Reflection (det = -1.0)
  const mat02 = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  mat02[1].matrix4x4 = [
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, -1.0, 0.0],
    [0.0, 0.0, 0.0, 1.0]
  ];
  recordAdversarial(
    'ADV_MAT_02', 'MATRIX',
    'Reflection matrix with det = -1.0',
    'CHK_MATRIX_STRUCTURE',
    runSecVerification(mat02),
    undefined,
    'Fails det = +1.0 requirement'
  );

  // ADV_MAT_03: Invalid Homogeneous Row [0, 0, 1, 1]
  const mat03 = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  mat03[1].matrix4x4[3] = [0.0, 0.0, 1.0, 1.0];
  recordAdversarial(
    'ADV_MAT_03', 'MATRIX',
    'Homogeneous last row corrupted to [0, 0, 1, 1]',
    'CHK_MATRIX_STRUCTURE',
    runSecVerification(mat03),
    undefined,
    'Row 3 entries violate [0,0,0,1]'
  );

  // ADV_MAT_04: Matrix containing NaN
  const mat04 = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  mat04[1].matrix4x4[0][0] = NaN;
  recordAdversarial(
    'ADV_MAT_04', 'MATRIX',
    'Matrix entry injected with NaN',
    'CHK_MATRIX_STRUCTURE',
    runSecVerification(mat04),
    undefined,
    'Strict finite check rejects NaN without runtime crash'
  );

  // ADV_MAT_05: Matrix containing Infinity
  const mat05 = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  mat05[1].matrix4x4[0][2] = Infinity;
  recordAdversarial(
    'ADV_MAT_05', 'MATRIX',
    'Matrix entry injected with Infinity',
    'CHK_MATRIX_STRUCTURE',
    runSecVerification(mat05),
    undefined,
    'Strict finite check rejects Infinity without runtime crash'
  );

  // ADV_MAT_06: Malformed Matrix Dimensions (Jagged Row)
  const mat06 = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  mat06[1].matrix4x4 = [
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0] as any, // 3 entries instead of 4
    [0.0, 0.0, 1.0, 0.0],
    [0.0, 0.0, 0.0, 1.0]
  ];
  recordAdversarial(
    'ADV_MAT_06', 'MATRIX',
    'Malformed row length (3 elements in row 1)',
    'CHK_MATRIX_STRUCTURE',
    runSecVerification(mat06),
    undefined,
    'Dimension validator catches malformed row'
  );

  console.log('\n--- [ADV_GRP] CATEGORY B: GROUP AXIOMS & REFERENCE CONFORMANCE ---');

  // ADV_GRP_01: Missing Identity Element
  const grp01 = [baseOperations[1], baseOperations[2]];
  recordAdversarial(
    'ADV_GRP_01', 'GROUP',
    'Identity element omitted from group set',
    'CHK_IDENTITY',
    runSecVerification(grp01),
    undefined,
    'Detected missing I3'
  );

  // ADV_GRP_02: Duplicate Element Injected
  const grp02 = [baseOperations[0], baseOperations[1], baseOperations[1]];
  recordAdversarial(
    'ADV_GRP_02', 'GROUP',
    'Duplicate C3 rotation injected into set',
    'CHK_DUPLICATES',
    runSecVerification(grp02),
    undefined,
    'Uniqueness check identifies identical matrices'
  );

  // ADV_GRP_03: Missing Inverse (only I and C3)
  const grp03 = [baseOperations[0], baseOperations[1]];
  recordAdversarial(
    'ADV_GRP_03', 'GROUP',
    'Inverse element C3^2 omitted',
    'CHK_INVERSES',
    runSecVerification(grp03),
    undefined,
    'Triggers CHK_INVERSES and CHK_CLOSURE'
  );

  // ADV_GRP_04: Broken Closure (Set with non-group rotation)
  const grp04 = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  // Replace C3 with 90° rotation around z axis
  grp04[1].matrix4x4 = [
    [0.0, -1.0, 0.0, 0.0],
    [1.0,  0.0, 0.0, 0.0],
    [0.0,  0.0, 1.0, 0.0],
    [0.0,  0.0, 0.0, 1.0]
  ];
  recordAdversarial(
    'ADV_GRP_04', 'GROUP',
    'Arbitrary orthogonal rotation (C4_z) injected into set',
    'CHK_CLOSURE',
    runSecVerification(grp04),
    undefined,
    'Binary composition product falls outside set'
  );

  // ADV_GRP_05: Cayley Reference Mismatch (Swapped C3 and C3^2 in order)
  const grp05 = [baseOperations[0], baseOperations[2], baseOperations[1]];
  recordAdversarial(
    'ADV_GRP_05', 'GROUP',
    'C3 and C3^2 swapped relative to independent Cayley reference',
    'CHK_INDEPENDENT_REFERENCE',
    runSecVerification(grp05),
    undefined,
    'Independent reference comparison flags ordering mismatch'
  );

  // ADV_GRP_06: Metadata Mismatch (Declares 120°, matrix is 240°)
  const grp06 = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  grp06[1].matrix4x4 = INDEPENDENT_REF_C3_240; // matrix is 240°, metadata says angleDeg: 120°
  recordAdversarial(
    'ADV_GRP_06', 'GROUP',
    'Declared angleDeg=120°, but matrix is 240° rotation',
    'CHK_METADATA_CONSISTENCY',
    runSecVerification(grp06),
    undefined,
    'Rodrigues test vector formula detects orientation discrepancy'
  );

  console.log('\n--- [ADV_ACT] CATEGORY C: GEOMETRY & GROUP ACTION ON TETRAHEDRON ---');

  // ADV_ACT_01: Translation Offset Violating Tetrahedron Vertices
  const act01 = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  act01[1].matrix4x4 = [
    [0.0, 0.0, 1.0, 0.5],
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 0.0, 1.0]
  ];
  recordAdversarial(
    'ADV_ACT_01', 'ACTION',
    'Translation offset [0.5, 0, 0] added to C3',
    'CHK_VERTEX_PERMUTATION',
    runSecVerification(act01),
    undefined,
    'Transformed vertices miss canonical tetrahedron'
  );

  // ADV_ACT_02: Rotation around Wrong Axis ([0,0,1] instead of [1,1,1])
  const act02 = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  // 120° around [0,0,1]
  const c120 = Math.cos(2 * Math.PI / 3);
  const s120 = Math.sin(2 * Math.PI / 3);
  act02[1].matrix4x4 = [
    [c120, -s120, 0.0, 0.0],
    [s120,  c120, 0.0, 0.0],
    [0.0,   0.0,  1.0, 0.0],
    [0.0,   0.0,  0.0, 1.0]
  ];
  recordAdversarial(
    'ADV_ACT_02', 'ACTION',
    'Rotation axis changed from [1,1,1] to [0,0,1]',
    'CHK_VERTEX_PERMUTATION',
    runSecVerification(act02),
    undefined,
    'Vertices do not map onto tetrahedron vertex set'
  );

  // ADV_ACT_03: Broken Nontrivial Orbit Cycle
  const act03 = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  act03[2].matrix4x4 = INDEPENDENT_REF_I; // replace C3^2 with Identity
  recordAdversarial(
    'ADV_ACT_03', 'ACTION',
    'C3^2 replaced with Identity, collapsing nontrivial orbit to 2 points',
    'CHK_NONTRIVIAL_ORBIT',
    runSecVerification(act03),
    undefined,
    '|Orb(v1)| collapses from 3 to 2, violating orbit-stabilizer theorem'
  );

  console.log('\n--- [ADV_SER] CATEGORY D: CANONICAL SERIALIZATION & SHA-256 ---');

  // ADV_SER_01: Key Order Invariance
  const serObj1 = { id: 'test', type: 'ROTATION', matrix4x4: [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]] };
  const serObj2 = { matrix4x4: [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]], type: 'ROTATION', id: 'test' };
  const d1 = computeCryptographicDigest(serObj1);
  const d2 = computeCryptographicDigest(serObj2);
  const passSer01 = (d1 === d2);
  records.push({
    id: 'ADV_SER_01',
    category: 'SERIALIZATION',
    injectedDefect: 'Object keys scrambled in JSON representation',
    expectedCheck: 'Digest Invariance (d1 === d2)',
    actualFailedChecks: passSer01 ? [] : ['DIGEST_MISMATCH'],
    verdict: passSer01 ? 'VERIFIED' : 'REJECTED',
    passedAttribution: passSer01,
    notes: `Digest identical (${d1.substring(0, 16)}...)`
  });
  console.log(`[ADV_SER_01] ${passSer01 ? '🛡️ PASS' : '⚠️ FAIL'} | Key Permutation Invariance: ${passSer01 ? 'CONFIRMED' : 'FAILED'}`);

  // ADV_SER_02: Mutation Sensitivity (0.0001 delta)
  const opsMutated = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  opsMutated[1].matrix4x4[0][2] = 1.0001;
  const dMutated = computeCryptographicDigest(opsMutated);
  const passSer02 = (sourceDigest !== dMutated);
  records.push({
    id: 'ADV_SER_02',
    category: 'SERIALIZATION',
    injectedDefect: 'Single matrix float modified by +0.0001',
    expectedCheck: 'Digest Sensitivity (sourceDigest !== dMutated)',
    actualFailedChecks: passSer02 ? [] : ['DIGEST_INSENSITIVE'],
    verdict: passSer02 ? 'VERIFIED' : 'REJECTED',
    passedAttribution: passSer02,
    notes: `Original: ${sourceDigest.substring(0, 12)}..., Mutated: ${dMutated.substring(0, 12)}...`
  });
  console.log(`[ADV_SER_02] ${passSer02 ? '🛡️ PASS' : '⚠️ FAIL'} | Matrix Mutation Sensitivity: ${passSer02 ? 'CONFIRMED' : 'FAILED'}`);

  // ADV_SER_03: Array Order Sensitivity
  const opsReordered = [baseOperations[1], baseOperations[0], baseOperations[2]];
  const dReordered = computeCryptographicDigest(opsReordered);
  const passSer03 = (sourceDigest !== dReordered);
  records.push({
    id: 'ADV_SER_03',
    category: 'SERIALIZATION',
    injectedDefect: 'Operations array elements reordered [C3, I, C3^2]',
    expectedCheck: 'Array Order Sensitivity (sourceDigest !== dReordered)',
    actualFailedChecks: passSer03 ? [] : ['ARRAY_ORDER_INSENSITIVE'],
    verdict: passSer03 ? 'VERIFIED' : 'REJECTED',
    passedAttribution: passSer03,
    notes: `Reordered: ${dReordered.substring(0, 12)}...`
  });
  console.log(`[ADV_SER_03] ${passSer03 ? '🛡️ PASS' : '⚠️ FAIL'} | Array Element Order Sensitivity: ${passSer03 ? 'CONFIRMED' : 'FAILED'}`);

  // ADV_SER_04: Edge Cases Normalization (-0, NaN, Infinity, null, undefined)
  const edgeObj1 = { a: -0, b: null, c: undefined, d: [1, 2] };
  const edgeObj2 = { b: null, a: 0, d: [1, 2] };
  const dEdge1 = computeCryptographicDigest(edgeObj1);
  const dEdge2 = computeCryptographicDigest(edgeObj2);
  const passSer04 = (dEdge1 === dEdge2);
  records.push({
    id: 'ADV_SER_04',
    category: 'SERIALIZATION',
    injectedDefect: 'Edge case numeric representations (-0 vs +0, undefined dropped/normalized)',
    expectedCheck: 'Edge Case Invariance',
    actualFailedChecks: passSer04 ? [] : ['EDGE_CASE_MISMATCH'],
    verdict: passSer04 ? 'VERIFIED' : 'REJECTED',
    passedAttribution: passSer04,
    notes: `-0 normalized to 0; undefined treated symmetrically with omitted key`
  });
  console.log(`[ADV_SER_04] ${passSer04 ? '🛡️ PASS' : '⚠️ FAIL'} | Edge Case Normalization: ${passSer04 ? 'CONFIRMED' : 'FAILED'}`);

  // SUMMARY AUDIT METRICS
  const totalTests = records.length;
  const passedTests = records.filter(r => r.passedAttribution).length;
  console.log('\n====================================================================');
  console.log(`ADVERSARIAL SUITE SUMMARY: ${passedTests} / ${totalTests} CHECKS PASSED WITH PRECISE ATTRIBUTION`);
  console.log('====================================================================\n');

  return {
    positiveResult,
    adversarialRecords: records
  };
}

// Execute directly if run via CLI
runFullAdversarialSuite();
