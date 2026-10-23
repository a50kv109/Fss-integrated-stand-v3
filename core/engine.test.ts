import {
  runSymmetryExperiment,
  computeDeterminant3x3,
  computeOrthogonalityDelta,
  validateStructureIntegrity
} from './engine';
import {
  CANONICAL_TETRAHEDRON,
  OPERATION_IDENTITY,
  OPERATION_C3_120,
  OPERATION_NEGATIVE_45,
  OPERATION_REFLECTION_XY,
  CANONICAL_STRUCTURES
} from './canonical';
import { Operation, Matrix4x4, Point3D } from './types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('====================================================');
console.log('RUNNING REGRESSION & PROPER_ROTATION TEST SUITE (M-4B)');
console.log('====================================================\n');

// -----------------------------------------------------------------------------
// TEST 0: Unit tests for computeDeterminant3x3
// -----------------------------------------------------------------------------
console.log('TEST 0: Unit tests for computeDeterminant3x3 on known matrices...');
const matI3: Matrix4x4 = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1]
];
const matRefl: Matrix4x4 = [
  [0, 1, 0, 0],
  [1, 0, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1]
];
const matInv: Matrix4x4 = [
  [-1, 0, 0, 0],
  [0, -1, 0, 0],
  [0, 0, -1, 0],
  [0, 0, 0, 1]
];
const matC3: Matrix4x4 = [
  [0, 0, 1, 0],
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 0, 1]
];

assert(Math.abs(computeDeterminant3x3(matI3) - 1.0) < 1e-9, 'det(I3) must be +1.0');
assert(Math.abs(computeDeterminant3x3(matRefl) - (-1.0)) < 1e-9, 'det(Reflection) must be -1.0');
assert(Math.abs(computeDeterminant3x3(matInv) - (-1.0)) < 1e-9, 'det(-I3) must be -1.0');
assert(Math.abs(computeDeterminant3x3(matC3) - 1.0) < 1e-9, 'det(C3) must be +1.0');
console.log('  det(I3) =', computeDeterminant3x3(matI3));
console.log('  det(Reflection_xy) =', computeDeterminant3x3(matRefl));
console.log('  det(-I3) =', computeDeterminant3x3(matInv));
console.log('  det(C3_120) =', computeDeterminant3x3(matC3));
console.log('✅ TEST 0 PASSED: Determinant computation verified on all known matrix classes.\n');

// -----------------------------------------------------------------------------
// TEST 1: Identity I3 under both predicates
// -----------------------------------------------------------------------------
console.log('TEST 1: Identity I3 (PRESERVES_STRUCTURE and PROPER_ROTATION)...');
const idStruct = runSymmetryExperiment({
  structureId: CANONICAL_TETRAHEDRON.id,
  operationId: OPERATION_IDENTITY.id,
  predicate: 'PRESERVES_STRUCTURE'
});
const idProper = runSymmetryExperiment({
  structureId: CANONICAL_TETRAHEDRON.id,
  operationId: OPERATION_IDENTITY.id,
  predicate: 'PROPER_ROTATION'
});

assert(idStruct.verdict === 'VERIFIED', 'Identity must be VERIFIED for PRESERVES_STRUCTURE');
assert(idProper.verdict === 'VERIFIED', 'Identity must be VERIFIED for PROPER_ROTATION');
assert(idStruct.determinant === 1.0, 'Identity det must be +1.0');
assert(idStruct.is_isometric === true, 'Identity must be isometric');
console.log('  PRESERVES_STRUCTURE:', idStruct.verdict, '| det =', idStruct.determinant);
console.log('  PROPER_ROTATION:    ', idProper.verdict, '| det =', idProper.determinant);
console.log('✅ TEST 1 PASSED: Identity verified for both predicates.\n');

// -----------------------------------------------------------------------------
// TEST 2: Rotation 120° around [1,1,1] under both predicates
// -----------------------------------------------------------------------------
console.log('TEST 2: C3 120° Rotation (PRESERVES_STRUCTURE and PROPER_ROTATION)...');
const c3Struct = runSymmetryExperiment({
  structureId: CANONICAL_TETRAHEDRON.id,
  operationId: OPERATION_C3_120.id,
  predicate: 'PRESERVES_STRUCTURE'
});
const c3Proper = runSymmetryExperiment({
  structureId: CANONICAL_TETRAHEDRON.id,
  operationId: OPERATION_C3_120.id,
  predicate: 'PROPER_ROTATION'
});

assert(c3Struct.verdict === 'VERIFIED', 'C3 must be VERIFIED for PRESERVES_STRUCTURE');
assert(c3Proper.verdict === 'VERIFIED', 'C3 must be VERIFIED for PROPER_ROTATION');
assert(c3Struct.determinant === 1.0, 'C3 det must be +1.0');
assert(c3Struct.max_delta <= 1e-5, 'C3 max delta must be 0');
assert(c3Struct.is_bijective === true, 'C3 must be bijective');

// Verify Pushforward direction
const c3v1 = c3Struct.correspondence.find(c => c.originId === 'v1')!;
const c3v2 = c3Struct.correspondence.find(c => c.originId === 'v2')!;
const c3v3 = c3Struct.correspondence.find(c => c.originId === 'v3')!;
assert(c3v1.targetId === 'v2', 'v1 must map to v2');
assert(c3v2.targetId === 'v3', 'v2 must map to v3');
assert(c3v3.targetId === 'v1', 'v3 must map to v1');

console.log('  PRESERVES_STRUCTURE:', c3Struct.verdict, '| det =', c3Struct.determinant);
console.log('  PROPER_ROTATION:    ', c3Proper.verdict, '| det =', c3Proper.determinant);
console.log('  Pushforward Cycle:  v0->v0, v1->v2, v2->v3, v3->v1');
console.log('✅ TEST 2 PASSED: C3 120° verified for both predicates.\n');

// -----------------------------------------------------------------------------
// TEST 3: Rotation 45° around [1,1,1] (asymmetric control)
// -----------------------------------------------------------------------------
console.log('TEST 3: Rotation 45° Asymmetric Control (both predicates REJECTED)...');
const rot45Struct = runSymmetryExperiment({
  structureId: CANONICAL_TETRAHEDRON.id,
  operationId: OPERATION_NEGATIVE_45.id,
  predicate: 'PRESERVES_STRUCTURE'
});
const rot45Proper = runSymmetryExperiment({
  structureId: CANONICAL_TETRAHEDRON.id,
  operationId: OPERATION_NEGATIVE_45.id,
  predicate: 'PROPER_ROTATION'
});

assert(rot45Struct.verdict === 'REJECTED', '45° must be REJECTED for PRESERVES_STRUCTURE');
assert(rot45Proper.verdict === 'REJECTED', '45° must be REJECTED for PROPER_ROTATION');
assert(rot45Struct.determinant === 1.0, '45° rotation is in SO(3), det must be +1.0');
console.log('  Reason:', rot45Struct.rejection_reason);
assert(
  rot45Struct.rejection_reason !== undefined && (
    rot45Struct.rejection_reason.includes('VERTICES_NOT_PRESERVED') ||
    rot45Struct.rejection_reason.includes('NON_BIJECTIVE_VERTEX_MAPPING')
  ),
  'Rejection reason must be VERTICES_NOT_PRESERVED or NON_BIJECTIVE_VERTEX_MAPPING'
);
console.log('  PRESERVES_STRUCTURE:', rot45Struct.verdict, '| Reason:', rot45Struct.rejection_reason);
console.log('  PROPER_ROTATION:    ', rot45Proper.verdict, '| Reason:', rot45Proper.rejection_reason);
console.log('✅ TEST 3 PASSED: 45° rotation correctly rejected by both predicates.\n');

// -----------------------------------------------------------------------------
// TEST 4: Mirror Reflection x = y (PRESERVES_STRUCTURE: VERIFIED, PROPER_ROTATION: REJECTED)
// -----------------------------------------------------------------------------
console.log('TEST 4: Mirror Reflection x=y (Differentiating Structure from Proper Rotation)...');
const reflStruct = runSymmetryExperiment({
  structureId: CANONICAL_TETRAHEDRON.id,
  operationId: OPERATION_REFLECTION_XY.id,
  predicate: 'PRESERVES_STRUCTURE'
});
const reflProper = runSymmetryExperiment({
  structureId: CANONICAL_TETRAHEDRON.id,
  operationId: OPERATION_REFLECTION_XY.id,
  predicate: 'PROPER_ROTATION'
});

console.log('  PRESERVES_STRUCTURE:', reflStruct.verdict, '| det =', reflStruct.determinant);
console.log('  PROPER_ROTATION:    ', reflProper.verdict, '| det =', reflProper.determinant);
console.log('  Rejection Reason:   ', reflProper.rejection_reason);

assert(reflStruct.verdict === 'VERIFIED', 'Mirror reflection must be VERIFIED for PRESERVES_STRUCTURE');
assert(reflProper.verdict === 'REJECTED', 'Mirror reflection must be REJECTED for PROPER_ROTATION');
assert(reflStruct.determinant === -1.0, 'Mirror reflection det must be -1.0');
assert(reflStruct.is_isometric === true, 'Mirror reflection must be isometric');
assert(reflStruct.max_delta <= 1e-5, 'Mirror reflection max delta must be 0');
assert(
  reflProper.rejection_reason !== undefined && reflProper.rejection_reason.includes('IMPROPER_OPERATION_NOT_PROPER_ROTATION'),
  'PROPER_ROTATION rejection reason must explicitly indicate improper orientation / det != +1'
);

// Verify Pushforward transposition:
const reflV0 = reflStruct.correspondence.find(c => c.originId === 'v0')!;
const reflV1 = reflStruct.correspondence.find(c => c.originId === 'v1')!;
const reflV2 = reflStruct.correspondence.find(c => c.originId === 'v2')!;
const reflV3 = reflStruct.correspondence.find(c => c.originId === 'v3')!;

assert(reflV0.targetId === 'v0', 'v0 must map to v0 (fixed point)');
assert(reflV1.targetId === 'v2', 'v1 must map to v2');
assert(reflV2.targetId === 'v1', 'v2 must map to v1');
assert(reflV3.targetId === 'v3', 'v3 must map to v3 (fixed point)');
console.log('  Pushforward Transposition: v0->v0, v1->v2, v2->v1, v3->v3');
console.log('✅ TEST 4 PASSED: Mirror reflection verified as structural symmetry but rejected as proper rotation.\n');

// -----------------------------------------------------------------------------
// TEST 5: Central Inversion -I3 (both predicates REJECTED)
// -----------------------------------------------------------------------------
console.log('TEST 5: Central Inversion -I3 (both predicates REJECTED)...');
const inversionOp: Operation = {
  id: 'op_inversion_test',
  name: 'Central Inversion -I3',
  type: 'INVERSION',
  matrix4x4: [
    [-1,  0,  0, 0],
    [ 0, -1,  0, 0],
    [ 0,  0, -1, 0],
    [ 0,  0,  0, 1]
  ]
};

const invStruct = runSymmetryExperiment({
  structureId: CANONICAL_TETRAHEDRON.id,
  operationId: inversionOp.id,
  operation: inversionOp,
  predicate: 'PRESERVES_STRUCTURE'
});
const invProper = runSymmetryExperiment({
  structureId: CANONICAL_TETRAHEDRON.id,
  operationId: inversionOp.id,
  operation: inversionOp,
  predicate: 'PROPER_ROTATION'
});

assert(invStruct.verdict === 'REJECTED', 'Central inversion must be REJECTED for PRESERVES_STRUCTURE');
assert(invProper.verdict === 'REJECTED', 'Central inversion must be REJECTED for PROPER_ROTATION');
assert(invStruct.determinant === -1.0, 'det(-I3) must be -1.0');
assert(invStruct.is_isometric === true, 'Central inversion is an orthogonal isometry');
console.log('  Max Delta:', invStruct.max_delta);
assert(invStruct.max_delta >= 2.0 || invStruct.verdict === 'REJECTED', 'Inverted vertices deviate by 2.0 or it was rejected');
assert(
  invStruct.rejection_reason !== undefined && invStruct.rejection_reason.includes('NON_BIJECTIVE_VERTEX_MAPPING'),
  'Rejection reason must be NON_BIJECTIVE_VERTEX_MAPPING'
);
console.log('  PRESERVES_STRUCTURE:', invStruct.verdict, '| Reason:', invStruct.rejection_reason);
console.log('  PROPER_ROTATION:    ', invProper.verdict, '| Reason:', invProper.rejection_reason);
console.log('✅ TEST 5 PASSED: Central inversion correctly rejected by both predicates.\n');

// -----------------------------------------------------------------------------
// TEST 6: Non-isometric compression (both predicates REJECTED by Isometry Guard)
// -----------------------------------------------------------------------------
console.log('TEST 6: Non-isometric compression diag(0.5, 1, 1)...');
const nonIsoOp: Operation = {
  id: 'op_non_iso_test',
  name: 'Non-isometric Compression diag(0.5, 1, 1)',
  type: 'AFFINE',
  matrix4x4: [
    [0.5, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0],
    [0.0, 0.0, 0.0, 1.0]
  ]
};

const nonIsoStruct = runSymmetryExperiment({
  structureId: CANONICAL_TETRAHEDRON.id,
  operationId: nonIsoOp.id,
  operation: nonIsoOp,
  predicate: 'PRESERVES_STRUCTURE'
});
const nonIsoProper = runSymmetryExperiment({
  structureId: CANONICAL_TETRAHEDRON.id,
  operationId: nonIsoOp.id,
  operation: nonIsoOp,
  predicate: 'PROPER_ROTATION'
});

assert(nonIsoStruct.verdict === 'REJECTED', 'Non-isometric must be REJECTED for PRESERVES_STRUCTURE');
assert(nonIsoProper.verdict === 'REJECTED', 'Non-isometric must be REJECTED for PROPER_ROTATION');
assert(nonIsoStruct.is_isometric === false, 'Must violate isometry');
assert(nonIsoStruct.determinant === 0.5, 'det for diag(0.5, 1, 1) must be 0.5');
assert(
  nonIsoStruct.rejection_reason !== undefined && nonIsoStruct.rejection_reason.includes('TRANSFORMATION_NOT_ISOMETRIC'),
  'Rejection reason must explicitly specify isometry violation'
);
console.log('  PRESERVES_STRUCTURE:', nonIsoStruct.verdict, '| Reason:', nonIsoStruct.rejection_reason);
console.log('  PROPER_ROTATION:    ', nonIsoProper.verdict, '| Reason:', nonIsoProper.rejection_reason);
console.log('✅ TEST 6 PASSED: Non-isometric compression rejected prior to symmetry checks.\n');

// -----------------------------------------------------------------------------
// TEST 7: Reproducibility & Determinism (100 repetitions)
// -----------------------------------------------------------------------------
console.log('TEST 7: Determinism check across 100 runs...');
for (let i = 0; i < 100; i++) {
  const ev1 = runSymmetryExperiment({
    structureId: CANONICAL_TETRAHEDRON.id,
    operationId: OPERATION_REFLECTION_XY.id,
    predicate: 'PRESERVES_STRUCTURE'
  });
  const ev2 = runSymmetryExperiment({
    structureId: CANONICAL_TETRAHEDRON.id,
    operationId: OPERATION_REFLECTION_XY.id,
    predicate: 'PROPER_ROTATION'
  });
  assert(ev1.verdict === 'VERIFIED', `Run ${i} failed reflStruct verdict`);
  assert(ev2.verdict === 'REJECTED', `Run ${i} failed reflProper verdict`);
  assert(ev1.determinant === -1.0, `Run ${i} divergent det`);
}
console.log('✅ TEST 7 PASSED: Determinism verified across 100 runs.\n');

console.log('====================================================');
console.log('ALL M-4B REGRESSION TESTS PASSED SUCCESSFULLY (7/7)');
console.log('====================================================\n');

// =============================================================================
// M-5C TEST SUITE: STRICT SEMANTIC TYPE PRESERVATION
// =============================================================================
console.log('====================================================');
console.log('RUNNING M-5C SEMANTIC TYPE PRESERVATION TESTS');
console.log('====================================================\n');

import { CanonicalStructure } from './types';

// -----------------------------------------------------------------------------
// TEST 8 (M-5C.A): Untyped tetrahedron regression confirmation
// -----------------------------------------------------------------------------
console.log('TEST 8 (M-5C.A): Verify untyped vertices have type === undefined and preserve M-4B behavior...');
CANONICAL_TETRAHEDRON.vertices.forEach(v => {
  assert(v.type === undefined, `Vertex ${v.id} in CANONICAL_TETRAHEDRON must be untyped`);
});
const untypedExp = runSymmetryExperiment({
  structureId: CANONICAL_TETRAHEDRON.id,
  operationId: OPERATION_C3_120.id,
  predicate: 'PROPER_ROTATION'
});
assert(untypedExp.verdict === 'VERIFIED', 'Untyped C3 experiment must be VERIFIED');
assert(untypedExp.rejection_reason === undefined, 'Untyped C3 experiment must have no rejection reason');
console.log('✅ TEST 8 PASSED: Untyped vertices remain fully compatible with M-4B.\n');

// -----------------------------------------------------------------------------
// TEST 9 (M-5C.B): Geometrically coincident vertices with different explicit types
// -----------------------------------------------------------------------------
console.log('TEST 9 (M-5C.B): Geometrically coincident vertices with different explicit types...');
const opReflX: Operation = {
  id: 'op_test_refl_x',
  name: 'Reflection across YZ (x -> -x)',
  type: 'REFLECTION',
  matrix4x4: [
    [-1, 0, 0, 0],
    [ 0, 1, 0, 0],
    [ 0, 0, 1, 0],
    [ 0, 0, 0, 1]
  ]
};

// Coincident vertices at [1, 0, 0] with different types; only LAYER_ALPHA exists at [-1, 0, 0]
const structCoincidentMismatch: CanonicalStructure = {
  id: 'struct_test_coincident_mismatch',
  name: 'Coincident Mismatch Test Structure',
  vertices: [
    { id: 'cA_1', coords: [ 1.0, 0.0, 0.0], type: 'LAYER_ALPHA' },
    { id: 'cB_1', coords: [ 1.0, 0.0, 0.0], type: 'LAYER_BETA' }, // Coincident with cA_1 at [1, 0, 0]
    { id: 'cA_2', coords: [-1.0, 0.0, 0.0], type: 'LAYER_ALPHA' }  // Target at [-1, 0, 0]
  ],
  edges: []
};
CANONICAL_STRUCTURES[structCoincidentMismatch.id] = structCoincidentMismatch;

const coincidentExp = runSymmetryExperiment({
  structureId: structCoincidentMismatch.id,
  operationId: opReflX.id,
  operation: opReflX,
  predicate: 'PRESERVES_STRUCTURE'
});

assert(coincidentExp.verdict === 'REJECTED', 'Coincident mismatch must be REJECTED');
assert(
  coincidentExp.rejection_reason !== undefined && (
    coincidentExp.rejection_reason.includes('SEMANTIC_TYPE_MISMATCH') ||
    coincidentExp.rejection_reason.includes('NON_BIJECTIVE_VERTEX_MAPPING')
  ),
  `Rejection reason must be SEMANTIC_TYPE_MISMATCH or NON_BIJECTIVE_VERTEX_MAPPING, got: ${coincidentExp.rejection_reason}`
);
console.log('  Verdict:         ', coincidentExp.verdict);
console.log('  Rejection Reason:', coincidentExp.rejection_reason);
console.log('✅ TEST 9 PASSED: Geometrically coincident vertices with different types correctly rejected.\n');

// -----------------------------------------------------------------------------
// TEST 10 (M-5C.C): Vertices with matching explicit types (coincident & non-coincident)
// -----------------------------------------------------------------------------
console.log('TEST 10 (M-5C.C): Vertices with matching explicit types...');

// Coincident pairs at both [1, 0, 0] and [-1, 0, 0] with matching types on both sides
const structCoincidentMatched: CanonicalStructure = {
  id: 'struct_test_coincident_matched',
  name: 'Coincident Matched Structure',
  vertices: [
    { id: 'a1', coords: [ 1.0, 0.0, 0.0], type: 'ALPHA' },
    { id: 'b1', coords: [ 1.0, 0.0, 0.0], type: 'BETA' },  // Coincident with a1 at [1, 0, 0]
    { id: 'a2', coords: [-1.0, 0.0, 0.0], type: 'ALPHA' },
    { id: 'b2', coords: [-1.0, 0.0, 0.0], type: 'BETA' }   // Coincident with a2 at [-1, 0, 0]
  ],
  edges: []
};
CANONICAL_STRUCTURES[structCoincidentMatched.id] = structCoincidentMatched;

const matchedExp = runSymmetryExperiment({
  structureId: structCoincidentMatched.id,
  operationId: opReflX.id,
  operation: opReflX,
  predicate: 'PRESERVES_STRUCTURE'
});

assert(matchedExp.verdict === 'VERIFIED', 'Matched typed structure must be VERIFIED');
assert(matchedExp.is_bijective === true, 'Matching must remain bijective without collapsing coincident vertices');
assert(matchedExp.max_delta <= 1e-5, 'Matching max delta must be 0');
assert(matchedExp.correspondence.length === 4, 'Must have 4 correspondences');

// Verify each typed vertex mapped strictly to its own type
matchedExp.correspondence.forEach(c => {
  const originVert = structCoincidentMatched.vertices.find(v => v.id === c.originId)!;
  const targetVert = structCoincidentMatched.vertices.find(v => v.id === c.targetId)!;
  assert(originVert.type === targetVert.type, `Correspondence ${c.originId}->${c.targetId} violated type equality`);
});

console.log('  Verdict:     ', matchedExp.verdict);
console.log('  Is Bijective:', matchedExp.is_bijective, '(4/4 distinct targets)');
console.log('  Correspondences:');
matchedExp.correspondence.forEach(c => {
  console.log(`    ${c.originId} -> ${c.targetId} (delta: ${c.delta.toFixed(8)})`);
});
console.log('✅ TEST 10 PASSED: Typed vertices preserve bijectivity and match only same-type targets.\n');

// -----------------------------------------------------------------------------
// TEST 11 (M-5C.D): Determinism across repeated typed experiments
// -----------------------------------------------------------------------------
console.log('TEST 11 (M-5C.D): Determinism across 100 repeated typed experiments...');
for (let i = 0; i < 100; i++) {
  const resReject = runSymmetryExperiment({
    structureId: structCoincidentMismatch.id,
    operationId: opReflX.id,
    operation: opReflX,
    predicate: 'PRESERVES_STRUCTURE'
  });
  const resVerify = runSymmetryExperiment({
    structureId: structCoincidentMatched.id,
    operationId: opReflX.id,
    operation: opReflX,
    predicate: 'PRESERVES_STRUCTURE'
  });

  assert(resReject.verdict === 'REJECTED', `Run ${i} failed reject verdict`);
  assert(resVerify.verdict === 'VERIFIED', `Run ${i} failed verify verdict`);
  assert(
    resReject.rejection_reason === coincidentExp.rejection_reason,
    `Run ${i} produced divergent rejection reason`
  );
  assert(resVerify.max_delta === matchedExp.max_delta, `Run ${i} produced divergent max delta`);
}
console.log('✅ TEST 11 PASSED: 100/100 runs bit-identical and fully deterministic.\n');

console.log('====================================================');
console.log('ALL M-5C SEMANTIC TYPE TESTS PASSED (4/4)');
console.log('====================================================\n');

// =============================================================================
// M-5D TESTS: EDGE TOPOLOGY PRESERVATION
// =============================================================================
console.log('====================================================');
console.log('RUNNING EDGE TOPOLOGY PRESERVATION TEST SUITE (M-5D)');
console.log('====================================================\n');

// -----------------------------------------------------------------------------
// TEST 12 (M-5D.1): Preserving connectivity under valid symmetry
// Regular tetrahedron with 6 explicit edges under 120-deg rotation (C3)
// -----------------------------------------------------------------------------
console.log('TEST 12 (M-5D.1): Regular tetrahedron with 6 edges under C3 rotation (connectivity preserved)...');
const resTetraC3 = runSymmetryExperiment({
  structureId: CANONICAL_TETRAHEDRON.id,
  operationId: OPERATION_C3_120.id,
  predicate: 'PROPER_ROTATION'
});
assert(resTetraC3.verdict === 'VERIFIED', 'Canonical tetrahedron with 6 edges must be VERIFIED under C3');
assert(resTetraC3.rejection_reason === undefined, 'Must not reject canonical tetrahedron edge topology');
console.log('  Verdict:         ', resTetraC3.verdict);
console.log('  Is Isometric:    ', resTetraC3.is_isometric);
console.log('  Edges Preserved:  All 6 edges permuted within canonical tetrahedron edge graph');
console.log('✅ TEST 12 PASSED: Symmetrical tetrahedron with full edge set preserves edge topology under rotation.\n');

// -----------------------------------------------------------------------------
// TEST 13 (M-5D.2): Broken edge topology on geometric invariant
// Square vertices in xy-plane: v0(-1,-1), v1(1,-1), v2(1,1), v3(-1,1)
// 90-degree rotation maps vertices onto themselves geometrically:
// v0->v1, v1->v2, v2->v3, v3->v0
// Case A: Asymmetric edges [v0, v1] and [v1, v2] (L-shape graph, no other edges)
// Under 90 deg:
// (v0, v1) -> (v1, v2) (preserved)
// (v1, v2) -> (v2, v3) (NOT in declared edges!)
// -----------------------------------------------------------------------------
console.log('TEST 13 (M-5D.2): Geometric invariant with asymmetric edge connectivity (broken edge topology)...');
const opRot90Z: Operation = {
  id: 'op_rot_z_90',
  name: '90° Rotation along Z-axis',
  type: 'ROTATION',
  axis: [0, 0, 1],
  angleDeg: 90,
  matrix4x4: [
    [0, -1, 0, 0],
    [1, 0, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
  ]
};

const structBrokenEdges: CanonicalStructure = {
  id: 'struct_square_asymmetric_edges',
  name: 'Square vertices with asymmetric L-path edge set',
  vertices: [
    { id: 'v0', coords: [-1, -1, 0] },
    { id: 'v1', coords: [1, -1, 0] },
    { id: 'v2', coords: [1, 1, 0] },
    { id: 'v3', coords: [-1, 1, 0] }
  ],
  edges: [
    ['v0', 'v1'],
    ['v1', 'v2']
  ]
};

CANONICAL_STRUCTURES[structBrokenEdges.id] = structBrokenEdges;

const resBrokenEdges = runSymmetryExperiment({
  structureId: structBrokenEdges.id,
  operationId: opRot90Z.id,
  operation: opRot90Z,
  predicate: 'PROPER_ROTATION'
});

assert(resBrokenEdges.verdict === 'REJECTED', 'Must reject when edge topology is broken');
assert(resBrokenEdges.is_bijective === true, 'Vertices must map bijectively');
assert(resBrokenEdges.max_delta <= 1e-9, 'Vertices must match geometrically with delta 0');
assert(
  resBrokenEdges.rejection_reason !== undefined &&
    resBrokenEdges.rejection_reason.includes('EDGE_TOPOLOGY_NOT_PRESERVED'),
  `Rejection reason must be EDGE_TOPOLOGY_NOT_PRESERVED, got: ${resBrokenEdges.rejection_reason}`
);
console.log('  Verdict:          ', resBrokenEdges.verdict);
console.log('  Rejection reason: ', resBrokenEdges.rejection_reason);
console.log('  Vertex Bijection: ', resBrokenEdges.is_bijective, '(bijective, but graph broken)');
console.log('✅ TEST 13 PASSED: Edge asymmetry correctly causes EDGE_TOPOLOGY_NOT_PRESERVED rejection.\n');

// -----------------------------------------------------------------------------
// TEST 14 (M-5D.3): Backward compatibility with empty or absent edges
// Same square vertices with empty edge set [] and full cycle [4 edges]
// -----------------------------------------------------------------------------
console.log('TEST 14 (M-5D.3): Backward compatibility with empty edges and complete symmetric edge cycle...');
const structNoEdges: CanonicalStructure = {
  id: 'struct_square_no_edges',
  name: 'Square vertices with empty edges',
  vertices: [
    { id: 'v0', coords: [-1, -1, 0] },
    { id: 'v1', coords: [1, -1, 0] },
    { id: 'v2', coords: [1, 1, 0] },
    { id: 'v3', coords: [-1, 1, 0] }
  ],
  edges: []
};

const structFullCycleEdges: CanonicalStructure = {
  id: 'struct_square_full_cycle',
  name: 'Square vertices with complete 4-cycle edges',
  vertices: [
    { id: 'v0', coords: [-1, -1, 0] },
    { id: 'v1', coords: [1, -1, 0] },
    { id: 'v2', coords: [1, 1, 0] },
    { id: 'v3', coords: [-1, 1, 0] }
  ],
  edges: [
    ['v0', 'v1'],
    ['v1', 'v2'],
    ['v2', 'v3'],
    ['v3', 'v0']
  ]
};

CANONICAL_STRUCTURES[structNoEdges.id] = structNoEdges;
CANONICAL_STRUCTURES[structFullCycleEdges.id] = structFullCycleEdges;

const resNoEdges = runSymmetryExperiment({
  structureId: structNoEdges.id,
  operationId: opRot90Z.id,
  operation: opRot90Z,
  predicate: 'PROPER_ROTATION'
});
assert(resNoEdges.verdict === 'VERIFIED', 'Square with no edges must VERIFY under 90-deg rotation');

const resFullCycle = runSymmetryExperiment({
  structureId: structFullCycleEdges.id,
  operationId: opRot90Z.id,
  operation: opRot90Z,
  predicate: 'PROPER_ROTATION'
});
assert(resFullCycle.verdict === 'VERIFIED', 'Square with symmetric 4-cycle must VERIFY under 90-deg rotation');
console.log('  Empty edges verdict:      ', resNoEdges.verdict);
console.log('  Full 4-cycle edges verdict:', resFullCycle.verdict);
console.log('✅ TEST 14 PASSED: Empty edges vacuously preserved; symmetric cycles verified successfully.\n');

// -----------------------------------------------------------------------------
// TEST 15 (M-5D.4): Determinism across repeated edge experiments
// -----------------------------------------------------------------------------
console.log('TEST 15 (M-5D.4): Determinism across 100 repeated edge experiments...');
for (let i = 0; i < 100; i++) {
  const rBroken = runSymmetryExperiment({
    structureId: structBrokenEdges.id,
    operationId: opRot90Z.id,
    operation: opRot90Z,
    predicate: 'PROPER_ROTATION'
  });
  const rCycle = runSymmetryExperiment({
    structureId: structFullCycleEdges.id,
    operationId: opRot90Z.id,
    operation: opRot90Z,
    predicate: 'PROPER_ROTATION'
  });

  assert(rBroken.verdict === 'REJECTED', `Run ${i} failed reject verdict`);
  assert(rCycle.verdict === 'VERIFIED', `Run ${i} failed verify verdict`);
  assert(
    rBroken.rejection_reason === resBrokenEdges.rejection_reason,
    `Run ${i} produced divergent edge rejection reason`
  );
}
console.log('✅ TEST 15 PASSED: 100/100 runs bit-identical and fully deterministic.\n');

console.log('====================================================');
console.log('ALL M-5D EDGE TOPOLOGY TESTS PASSED (4/4)');
console.log('====================================================\n');

// =============================================================================
// M-5F TESTS: STRUCTURAL INTEGRITY VALIDATION & EVIDENCE ENRICHMENT
// =============================================================================
console.log('====================================================');
console.log('RUNNING STRUCTURAL INTEGRITY & EVIDENCE TEST SUITE (M-5F)');
console.log('====================================================\n');

// -----------------------------------------------------------------------------
// TEST 16 (M-5F.1): Unknown vertex in edge -> UNKNOWN_VERTEX_IN_EDGE
// -----------------------------------------------------------------------------
console.log('TEST 16 (M-5F.1): Edge referencing undeclared vertex (UNKNOWN_VERTEX_IN_EDGE)...');
const structUnknownVertex: CanonicalStructure = {
  id: 'struct_err_unknown_vertex',
  name: 'Structure with edge referencing non-existent vertex',
  vertices: [
    { id: 'v0', coords: [0, 0, 0] },
    { id: 'v1', coords: [1, 0, 0] }
  ],
  edges: [
    ['v0', 'v_ghost']
  ]
};
CANONICAL_STRUCTURES[structUnknownVertex.id] = structUnknownVertex;

const valUnknown = validateStructureIntegrity(structUnknownVertex);
assert(valUnknown.isValid === false, 'Validator must reject unknown vertex in edge');
assert(valUnknown.errorType === 'UNKNOWN_VERTEX_IN_EDGE', `Expected UNKNOWN_VERTEX_IN_EDGE, got ${valUnknown.errorType}`);

const expUnknown = runSymmetryExperiment({
  structureId: structUnknownVertex.id,
  operationId: OPERATION_IDENTITY.id,
  predicate: 'PRESERVES_STRUCTURE'
});
assert(expUnknown.verdict === 'REJECTED', 'Must reject structure with undeclared vertex');
assert(
  expUnknown.rejection_reason !== undefined &&
    expUnknown.rejection_reason.includes('UNKNOWN_VERTEX_IN_EDGE'),
  `Rejection reason must be UNKNOWN_VERTEX_IN_EDGE, got: ${expUnknown.rejection_reason}`
);
assert(expUnknown.edge_count === 1, 'Edge count must be 1');
assert(expUnknown.edge_topology_preserved === false, 'edge_topology_preserved must be false on invalid edge');
console.log('  Verdict:          ', expUnknown.verdict);
console.log('  Rejection reason: ', expUnknown.rejection_reason);
console.log('  Edge count:       ', expUnknown.edge_count);
console.log('✅ TEST 16 PASSED: Undeclared vertex in edge rejected cleanly with UNKNOWN_VERTEX_IN_EDGE.\n');

// -----------------------------------------------------------------------------
// TEST 17 (M-5F.2): Self-loop edge ['v0', 'v0'] -> SELF_LOOP_EDGE
// -----------------------------------------------------------------------------
console.log('TEST 17 (M-5F.2): Self-loop edge [v0, v0] (SELF_LOOP_EDGE)...');
const structSelfLoop: CanonicalStructure = {
  id: 'struct_err_self_loop',
  name: 'Structure with self-loop edge',
  vertices: [
    { id: 'v0', coords: [0, 0, 0] },
    { id: 'v1', coords: [1, 0, 0] }
  ],
  edges: [
    ['v0', 'v0']
  ]
};
CANONICAL_STRUCTURES[structSelfLoop.id] = structSelfLoop;

const valSelfLoop = validateStructureIntegrity(structSelfLoop);
assert(valSelfLoop.isValid === false, 'Validator must reject self-loop edge');
assert(valSelfLoop.errorType === 'SELF_LOOP_EDGE', `Expected SELF_LOOP_EDGE, got ${valSelfLoop.errorType}`);

const expSelfLoop = runSymmetryExperiment({
  structureId: structSelfLoop.id,
  operationId: OPERATION_IDENTITY.id,
  predicate: 'PRESERVES_STRUCTURE'
});
assert(expSelfLoop.verdict === 'REJECTED', 'Must reject self-loop edge');
assert(
  expSelfLoop.rejection_reason !== undefined &&
    expSelfLoop.rejection_reason.includes('SELF_LOOP_EDGE'),
  `Rejection reason must be SELF_LOOP_EDGE, got: ${expSelfLoop.rejection_reason}`
);
console.log('  Verdict:          ', expSelfLoop.verdict);
console.log('  Rejection reason: ', expSelfLoop.rejection_reason);
console.log('✅ TEST 17 PASSED: Self-loop edge rejected cleanly with SELF_LOOP_EDGE.\n');

// -----------------------------------------------------------------------------
// TEST 18 (M-5F.3): Duplicate vertex IDs -> DUPLICATE_VERTEX_ID
// -----------------------------------------------------------------------------
console.log('TEST 18 (M-5F.3): Duplicate vertex identifiers (DUPLICATE_VERTEX_ID)...');
const structDuplicateVertex: CanonicalStructure = {
  id: 'struct_err_duplicate_vertex',
  name: 'Structure with duplicate vertex IDs',
  vertices: [
    { id: 'v0', coords: [0, 0, 0] },
    { id: 'v0', coords: [1, 0, 0] }
  ],
  edges: []
};
CANONICAL_STRUCTURES[structDuplicateVertex.id] = structDuplicateVertex;

const valDup = validateStructureIntegrity(structDuplicateVertex);
assert(valDup.isValid === false, 'Validator must reject duplicate vertex ID');
assert(valDup.errorType === 'DUPLICATE_VERTEX_ID', `Expected DUPLICATE_VERTEX_ID, got ${valDup.errorType}`);

const expDup = runSymmetryExperiment({
  structureId: structDuplicateVertex.id,
  operationId: OPERATION_IDENTITY.id,
  predicate: 'PRESERVES_STRUCTURE'
});
assert(expDup.verdict === 'REJECTED', 'Must reject duplicate vertex ID');
assert(
  expDup.rejection_reason !== undefined &&
    expDup.rejection_reason.includes('DUPLICATE_VERTEX_ID'),
  `Rejection reason must be DUPLICATE_VERTEX_ID, got: ${expDup.rejection_reason}`
);
console.log('  Verdict:          ', expDup.verdict);
console.log('  Rejection reason: ', expDup.rejection_reason);
console.log('✅ TEST 18 PASSED: Duplicate vertex identifiers rejected with DUPLICATE_VERTEX_ID.\n');

// -----------------------------------------------------------------------------
// TEST 19 (M-5F.4): Tetrahedron with 6 edges: edge_count === 6, edge_topology_preserved === true
// -----------------------------------------------------------------------------
console.log('TEST 19 (M-5F.4): Canonical tetrahedron evidence enrichment (edge_count === 6, preserved === true)...');
const expTetraEnriched = runSymmetryExperiment({
  structureId: CANONICAL_TETRAHEDRON.id,
  operationId: OPERATION_C3_120.id,
  predicate: 'PROPER_ROTATION'
});
assert(expTetraEnriched.verdict === 'VERIFIED', 'Tetrahedron must be VERIFIED');
assert(expTetraEnriched.edge_count === 6, `Tetrahedron must have edge_count === 6, got ${expTetraEnriched.edge_count}`);
assert(
  expTetraEnriched.edge_topology_preserved === true,
  `Tetrahedron must have edge_topology_preserved === true, got ${expTetraEnriched.edge_topology_preserved}`
);
console.log('  Verdict:                 ', expTetraEnriched.verdict);
console.log('  Edge count:              ', expTetraEnriched.edge_count);
console.log('  Edge topology preserved: ', expTetraEnriched.edge_topology_preserved);
console.log('✅ TEST 19 PASSED: Explicit 6 edges confirmed and edge_topology_preserved === true in Evidence.\n');

// -----------------------------------------------------------------------------
// TEST 20 (M-5F.5): Structure without edges: edge_count === 0, edge_topology_preserved === undefined
// -----------------------------------------------------------------------------
console.log('TEST 20 (M-5F.5): Structure with empty edges (edge_count === 0, edge_topology_preserved === undefined)...');
const expNoEdgesEnriched = runSymmetryExperiment({
  structureId: structNoEdges.id,
  operationId: opRot90Z.id,
  operation: opRot90Z,
  predicate: 'PROPER_ROTATION'
});
assert(expNoEdgesEnriched.verdict === 'VERIFIED', 'Square with no edges must VERIFY');
assert(expNoEdgesEnriched.edge_count === 0, `Expected edge_count === 0, got ${expNoEdgesEnriched.edge_count}`);
assert(
  expNoEdgesEnriched.edge_topology_preserved === undefined,
  `Expected edge_topology_preserved === undefined, got ${expNoEdgesEnriched.edge_topology_preserved}`
);
console.log('  Verdict:                 ', expNoEdgesEnriched.verdict);
console.log('  Edge count:              ', expNoEdgesEnriched.edge_count);
console.log('  Edge topology preserved: ', expNoEdgesEnriched.edge_topology_preserved, '(undefined / not checked)');
console.log('✅ TEST 20 PASSED: Absence of edges explicitly reflected as undefined without claiming preservation.\n');

// -----------------------------------------------------------------------------
// TEST 21 (M-5F.6): Topology violation under geometrically valid mapping
// -----------------------------------------------------------------------------
console.log('TEST 21 (M-5F.6): Topology violation under geometric invariance (edge_count === 2, preserved === false)...');
const expBrokenEnriched = runSymmetryExperiment({
  structureId: structBrokenEdges.id,
  operationId: opRot90Z.id,
  operation: opRot90Z,
  predicate: 'PROPER_ROTATION'
});
assert(expBrokenEnriched.verdict === 'REJECTED', 'Broken edge topology must reject');
assert(expBrokenEnriched.edge_count === 2, `Expected edge_count === 2, got ${expBrokenEnriched.edge_count}`);
assert(
  expBrokenEnriched.edge_topology_preserved === false,
  `Expected edge_topology_preserved === false, got ${expBrokenEnriched.edge_topology_preserved}`
);
assert(
  expBrokenEnriched.rejection_reason !== undefined &&
    expBrokenEnriched.rejection_reason.includes('EDGE_TOPOLOGY_NOT_PRESERVED'),
  `Expected EDGE_TOPOLOGY_NOT_PRESERVED, got: ${expBrokenEnriched.rejection_reason}`
);
console.log('  Verdict:                 ', expBrokenEnriched.verdict);
console.log('  Edge count:              ', expBrokenEnriched.edge_count);
console.log('  Edge topology preserved: ', expBrokenEnriched.edge_topology_preserved);
console.log('  Rejection reason:        ', expBrokenEnriched.rejection_reason);
console.log('✅ TEST 21 PASSED: Edge topology violation correctly records edge_topology_preserved === false.\n');

// -----------------------------------------------------------------------------
// TEST 22 (M-5F.7): Determinism across repeated integrity & enriched edge experiments
// -----------------------------------------------------------------------------
console.log('TEST 22 (M-5F.7): Determinism across 100 repeated integrity & enriched experiments...');
for (let i = 0; i < 100; i++) {
  const rUnknown = runSymmetryExperiment({
    structureId: structUnknownVertex.id,
    operationId: OPERATION_IDENTITY.id,
    predicate: 'PRESERVES_STRUCTURE'
  });
  const rTetra = runSymmetryExperiment({
    structureId: CANONICAL_TETRAHEDRON.id,
    operationId: OPERATION_C3_120.id,
    predicate: 'PROPER_ROTATION'
  });
  const rEmpty = runSymmetryExperiment({
    structureId: structNoEdges.id,
    operationId: opRot90Z.id,
    operation: opRot90Z,
    predicate: 'PROPER_ROTATION'
  });

  assert(rUnknown.verdict === 'REJECTED', `Run ${i} failed unknown vertex rejection`);
  assert(rTetra.verdict === 'VERIFIED', `Run ${i} failed tetra verify`);
  assert(rEmpty.verdict === 'VERIFIED', `Run ${i} failed empty verify`);
  assert(rTetra.edge_count === 6 && rTetra.edge_topology_preserved === true, `Run ${i} tetra edge divergence`);
  assert(rEmpty.edge_count === 0 && rEmpty.edge_topology_preserved === undefined, `Run ${i} empty edge divergence`);
}
console.log('✅ TEST 22 PASSED: 100/100 runs bit-identical and fully deterministic.\n');

// -----------------------------------------------------------------------------
// TEST 23 (EXP-02): Registry-Free Structure Input
// -----------------------------------------------------------------------------
console.log('TEST 23 (EXP-02): Registry-Free Structure Input...');
const registryFreeTetra = { ...CANONICAL_TETRAHEDRON, id: 'registry_free_tetra' };
const resRegistryFree = runSymmetryExperiment({
  structure: registryFreeTetra,
  operationId: OPERATION_C3_120.id,
  predicate: 'PROPER_ROTATION'
});
assert(resRegistryFree.verdict === 'VERIFIED', 'Registry-free tetrahedron must be VERIFIED');
assert(resRegistryFree.structure_id === 'registry_free_tetra', 'Structure ID must match');
console.log('  Verdict:         ', resRegistryFree.verdict);
console.log('✅ TEST 23 PASSED: Registry-free structure input verified.\n');

// -----------------------------------------------------------------------------
// TEST 24 (EXP-02): Legacy API
// -----------------------------------------------------------------------------
console.log('TEST 24 (EXP-02): Legacy API...');
const resLegacy = runSymmetryExperiment({
  structureId: CANONICAL_TETRAHEDRON.id,
  operationId: OPERATION_C3_120.id,
  predicate: 'PROPER_ROTATION'
});
assert(resLegacy.verdict === 'VERIFIED', 'Legacy API tetrahedron must be VERIFIED');
console.log('✅ TEST 24 PASSED: Legacy API works.\n');

// -----------------------------------------------------------------------------
// TEST 25 (EXP-02): Missing Structure
// -----------------------------------------------------------------------------
console.log('TEST 25 (EXP-02): Missing Structure (Error Expected)...');
let caughtError = false;
try {
  runSymmetryExperiment({
    operationId: OPERATION_C3_120.id,
    predicate: 'PROPER_ROTATION'
  } as any);
} catch (e) {
  caughtError = true;
  console.log('  Caught expected error:', (e as Error).message);
}
assert(caughtError, 'Expected error when no structure/structureId provided');
console.log('✅ TEST 25 PASSED: Missing structure causes error.\n');

// -----------------------------------------------------------------------------
// TEST 26 (EXP-02): Both structures
// -----------------------------------------------------------------------------
console.log('TEST 26 (EXP-02): Both structures (Should be valid)...');
const resBoth = runSymmetryExperiment({
  structure: registryFreeTetra,
  structureId: CANONICAL_TETRAHEDRON.id,
  operationId: OPERATION_C3_120.id,
  predicate: 'PROPER_ROTATION'
});
assert(resBoth.verdict === 'VERIFIED', 'Both structure/structureId should be VERIFIED');
assert(resBoth.structure_id === registryFreeTetra.id, 'structure takes precedence');
console.log('✅ TEST 26 PASSED: Both structures handled correctly (structure takes precedence).\n');

// -----------------------------------------------------------------------------
// TEST 27 (EXP-02): Immutability Check
// -----------------------------------------------------------------------------
console.log('TEST 27 (EXP-02): Immutability Check...');
const immutabilityTetra = JSON.parse(JSON.stringify(CANONICAL_TETRAHEDRON));
runSymmetryExperiment({
  structure: immutabilityTetra,
  operationId: OPERATION_C3_120.id,
  predicate: 'PROPER_ROTATION'
});
assert(JSON.stringify(immutabilityTetra) === JSON.stringify(CANONICAL_TETRAHEDRON), 'Structure should not be mutated');
console.log('✅ TEST 27 PASSED: Immutability preserved.\n');

// -----------------------------------------------------------------------------
// TEST 28-30 (EXP-03): Symmetry under Deformation
// -----------------------------------------------------------------------------
console.log('TEST 28-30 (EXP-03): Symmetry under Deformation...');

// S0: Regular tetrahedron (already defined)
const S0 = CANONICAL_TETRAHEDRON;

// S1: Symmetric deformation of S0 (stretching along [1,1,1])
const S1: CanonicalStructure = {
  ...S0,
  id: 'struct_tetra_S1_symmetric',
  vertices: S0.vertices.map(v => ({
    ...v,
    coords: [v.coords[0] * 1.1, v.coords[1] * 1.1, v.coords[2] * 1.1] as Point3D // Symmetric scale
  }))
};

// S2: Asymmetric deformation of S0 (stretching v0 only)
const S2: CanonicalStructure = {
  ...S0,
  id: 'struct_tetra_S2_asymmetric',
  vertices: S0.vertices.map(v => ({
    ...v,
    coords: v.id === 'v0' ? [v.coords[0] * 1.5, v.coords[1], v.coords[2]] : [...v.coords] as Point3D
  }))
};

const opC3 = OPERATION_C3_120;

// Test S0
const resS0 = runSymmetryExperiment({ structure: S0, operationId: opC3.id, predicate: 'PROPER_ROTATION' });
console.log('  S0 (Regular) verdict:', resS0.verdict);
assert(resS0.verdict === 'VERIFIED', 'S0 should be VERIFIED');

// Test S1
const resS1 = runSymmetryExperiment({ structure: S1, operationId: opC3.id, predicate: 'PROPER_ROTATION' });
console.log('  S1 (Symmetric Def) verdict:', resS1.verdict);
assert(resS1.verdict === 'VERIFIED', 'S1 should be VERIFIED');

// Test S2
const resS2 = runSymmetryExperiment({ structure: S2, operationId: opC3.id, predicate: 'PROPER_ROTATION' });
console.log('  S2 (Asymmetric Def) verdict:', resS2.verdict);
assert(resS2.verdict === 'REJECTED', 'S2 should be REJECTED');

console.log('✅ TEST 28-30 PASSED: Symmetry under deformation analyzed.\n');

// -----------------------------------------------------------------------------
// TEST 31 (G-03): Global Vertex Correspondence
// -----------------------------------------------------------------------------
console.log('TEST 31 (G-03): Global Vertex Correspondence (Correct Counterexample)...');
const structG03: CanonicalStructure = {
  id: 'struct_g03_counterexample',
  name: 'G-03 Global Vertex Correspondence Counterexample',
  vertices: [
    { id: 'A', coords: [0, 0, 0], type: 'TYPE_X' },
    { id: 'B', coords: [1, 0, 0], type: 'TYPE_X' }
  ],
  edges: []
};
CANONICAL_STRUCTURES[structG03.id] = structG03;

const opG03: Operation = {
  id: 'op_g03_test',
  name: 'G-03 Test Operation',
  type: 'AFFINE',
  matrix4x4: [
    [0.3, 0, 0, 0.6], // A->(0.6,0,0), B->(0.3+0.6,0,0)=(0.9,0,0)
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1]
  ]
};

const resG03 = runSymmetryExperiment({
  structure: structG03,
  operation: opG03,
  operationId: opG03.id,
  predicate: 'PRESERVES_STRUCTURE',
  epsilon: 0.65,
  orthogonalityEpsilon: 10.0 // Bypass isometry check
});

console.log('  Verdict:', resG03.verdict);
console.log('  Is Bijective:', resG03.is_bijective);
console.log('  Max Delta:', resG03.max_delta);

assert(resG03.verdict === 'VERIFIED', 'G-03 should be VERIFIED');
assert(resG03.is_bijective === true, 'G-03 should be bijective');
assert(resG03.max_delta <= 0.6, 'Max delta should be <= 0.6');
console.log('✅ TEST 31 PASSED: G-03 Test executed and verified.\n');
