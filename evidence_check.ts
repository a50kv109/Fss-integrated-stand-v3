import { analyzeAffineDimension, clusterVertices, DIMENSION_TOLERANCES } from './core/dimension';
import { CANONICAL_TETRAHEDRON } from './core/canonical';
import { CanonicalStructure, Point3D } from './core/types';

// 1. Scale Tests
console.log('--- SCALE TESTS ---');
const scales = [1e-9, 1.0, 1e9];
for (const s of scales) {
  const scaled = {
    ...CANONICAL_TETRAHEDRON,
    vertices: CANONICAL_TETRAHEDRON.vertices.map(v => ({
      ...v,
      coords: v.coords.map(c => c * s) as Point3D
    }))
  };
  const res = analyzeAffineDimension(scaled);
  console.log(`Scale ${s}: Dim=${res.affineDimension}, Status=${res.conditionStatus}`);
}

// 2. Clustering Permutations (A-B close, B-C close, A-C far)
console.log('\n--- CLUSTERING PERMUTATIONS ---');
const baseCoords = {
  a: [0.0, 0.0, 0.0] as Point3D,
  b: [0.6e-6, 0.0, 0.0] as Point3D,
  c: [1.2e-6, 0.0, 0.0] as Point3D
};

const perms = [
  ['a', 'b', 'c'], ['a', 'c', 'b'],
  ['b', 'a', 'c'], ['b', 'c', 'a'],
  ['c', 'a', 'b'], ['c', 'b', 'a']
];

for (const p of perms) {
  const vertices = p.map(id => ({ id, coords: baseCoords[id as keyof typeof baseCoords] }));
  const clusters = clusterVertices(vertices, DIMENSION_TOLERANCES.COINCIDENCE_EPSILON);
  console.log(`Permutation ${p.join('')}: ${clusters.map(c => `[${c.vertexIds.join('')}]`).join(' ')}`);
}

// 3. Transformation Invariance
console.log('\n--- TRANSFORMATION INVARIANCE ---');
const rotated = {
  ...CANONICAL_TETRAHEDRON,
  vertices: CANONICAL_TETRAHEDRON.vertices.map(v => ({
    ...v,
    // Simple 90 deg rotation around Z
    coords: [-v.coords[1], v.coords[0], v.coords[2]] as Point3D
  }))
};
const resBase = analyzeAffineDimension(CANONICAL_TETRAHEDRON);
const resRot = analyzeAffineDimension(rotated);
console.log(`Base Dim: ${resBase.affineDimension}, Rotated Dim: ${resRot.affineDimension}`);
console.log(`Barycenter Base: ${resBase.barycenter.map(c => c.toFixed(2))}, Rotated: ${resRot.barycenter.map(c => c.toFixed(2))}`);
