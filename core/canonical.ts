import { CanonicalStructure, Operation, Point3D, Matrix4x4 } from './types';

/**
 * Helper to build an exact 4x4 Rodrigues rotation matrix
 * around an arbitrary 3D axis by angle in degrees.
 */
export function buildRotationMatrix(axis: Point3D, angleDeg: number): Matrix4x4 {
  const angleRad = (angleDeg * Math.PI) / 180;
  const len = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
  if (len === 0) {
    throw new Error('Axis cannot be zero length');
  }

  const ux = axis[0] / len;
  const uy = axis[1] / len;
  const uz = axis[2] / len;

  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const oneMinusCos = 1.0 - cos;

  return [
    [
      cos + ux * ux * oneMinusCos,
      ux * uy * oneMinusCos - uz * sin,
      ux * uz * oneMinusCos + uy * sin,
      0.0
    ],
    [
      uy * ux * oneMinusCos + uz * sin,
      cos + uy * uy * oneMinusCos,
      uy * uz * oneMinusCos - ux * sin,
      0.0
    ],
    [
      uz * ux * oneMinusCos - uy * sin,
      uz * uy * oneMinusCos + ux * sin,
      cos + uz * uz * oneMinusCos,
      0.0
    ],
    [0.0, 0.0, 0.0, 1.0]
  ];
}

/**
 * 1. CANONICAL STRUCTURE: Regular Tetrahedron
 * Centered at (0, 0, 0) in R^3.
 * Edge length = sqrt(8) ≈ 2.828427.
 */
export const CANONICAL_TETRAHEDRON: CanonicalStructure = {
  id: 'struct_tetra_01',
  name: 'Regular Tetrahedron',
  vertices: [
    { id: 'v0', coords: [ 1.0,  1.0,  1.0] }, // Lies on the [1, 1, 1] rotation axis
    { id: 'v1', coords: [ 1.0, -1.0, -1.0] },
    { id: 'v2', coords: [-1.0,  1.0, -1.0] },
    { id: 'v3', coords: [-1.0, -1.0,  1.0] }
  ],
  edges: [
    ['v0', 'v1'],
    ['v0', 'v2'],
    ['v0', 'v3'],
    ['v1', 'v2'],
    ['v2', 'v3'],
    ['v3', 'v1']
  ]
};

/**
 * 2. POSITIVE OPERATION: C3 Rotation (120 deg, axis [1, 1, 1])
 * Cyclic permutation: (x, y, z) -> (z, x, y).
 */
export const OPERATION_C3_120: Operation = {
  id: 'op_rot_c3_120',
  name: 'C3 Rotation 120° [1,1,1]',
  type: 'ROTATION',
  axis: [1.0, 1.0, 1.0],
  angleDeg: 120.0,
  matrix4x4: [
    [0.0, 0.0, 1.0, 0.0],
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 0.0, 1.0]
  ]
};

/**
 * 3. NEGATIVE CONTROL: Rotation 45 deg, axis [1, 1, 1]
 * Expected to break the tetrahedral vertex correspondence.
 */
export const OPERATION_NEGATIVE_45: Operation = {
  id: 'op_rot_neg_45',
  name: 'Asymmetric Control 45° [1,1,1]',
  type: 'ROTATION',
  axis: [1.0, 1.0, 1.0],
  angleDeg: 45.0,
  matrix4x4: buildRotationMatrix([1.0, 1.0, 1.0], 45.0)
};

/**
 * 4. IDENTITY OPERATION: I3
 * Canonical orthogonal transformation preserving the tetrahedron.
 */
export const OPERATION_IDENTITY: Operation = {
  id: 'op_identity',
  name: 'Identity Transformation I3',
  type: 'IDENTITY',
  axis: [0.0, 0.0, 1.0],
  angleDeg: 0.0,
  matrix4x4: [
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0],
    [0.0, 0.0, 0.0, 1.0]
  ]
};

/**
 * 5. MIRROR REFLECTION: Plane x = y
 * Canonical reflection plane (sigma_d) preserving the tetrahedron.
 * Inverts chirality: det(Q) = -1.
 */
export const OPERATION_REFLECTION_XY: Operation = {
  id: 'op_reflection_xy',
  name: 'Mirror Reflection Plane x=y',
  type: 'REFLECTION',
  matrix4x4: [
    [0.0, 1.0, 0.0, 0.0],
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 0.0, 1.0, 0.0],
    [0.0, 0.0, 0.0, 1.0]
  ]
};

export const CANONICAL_STRUCTURES: Record<string, CanonicalStructure> = {
  [CANONICAL_TETRAHEDRON.id]: CANONICAL_TETRAHEDRON
};

export const CANONICAL_OPERATIONS: Record<string, Operation> = {
  [OPERATION_C3_120.id]: OPERATION_C3_120,
  [OPERATION_NEGATIVE_45.id]: OPERATION_NEGATIVE_45,
  [OPERATION_IDENTITY.id]: OPERATION_IDENTITY,
  [OPERATION_REFLECTION_XY.id]: OPERATION_REFLECTION_XY
};
