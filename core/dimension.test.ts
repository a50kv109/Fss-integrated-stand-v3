import { CANONICAL_TETRAHEDRON } from './canonical';
import { CanonicalStructure, Point3D } from './types';
import {
  analyzeAffineDimension,
  computeBarycenter,
  solveSymmetric3x3Eigenvalues,
  DIMENSION_TOLERANCES,
  DimensionAnalysisResult
} from './dimension';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  ✅ ${message}`);
}

console.log('====================================================');
console.log('RUNNING FSS M-6A.1 AFFINE DIMENSION & ANCHOR FRAME TEST SUITE');
console.log('====================================================\n');

// -----------------------------------------------------------------------------
// TEST 1: Правильный тетраэдр (CANONICAL_TETRAHEDRON)
// -----------------------------------------------------------------------------
console.log('TEST 1: Regular Tetrahedron (CANONICAL_TETRAHEDRON) -> 3D Spatial Frame');
{
  const res = analyzeAffineDimension(CANONICAL_TETRAHEDRON);
  assert(res.affineDimension === 3, `Expected dimension 3, got ${res.affineDimension}`);
  assert(res.conditionStatus === 'WELL_CONDITIONED', `Expected WELL_CONDITIONED, got ${res.conditionStatus}`);
  assert(res.uniqueGeometricCount === 4, `Expected 4 unique geometric vertices, got ${res.uniqueGeometricCount}`);
  assert(!res.hasCoincidentVertices, 'Expected no coincident vertices');
  assert(res.anchorFrame !== null && res.anchorFrame.type === 'SPATIAL', 'Expected SPATIAL anchor frame');
  if (res.anchorFrame && res.anchorFrame.type === 'SPATIAL') {
    assert(res.anchorFrame.vertexIndices.length === 3, 'Expected 3 anchor vertex indices');
    assert(res.anchorFrame.normalizedVolume > 0.1, `Expected substantial normalized volume, got ${res.anchorFrame.normalizedVolume}`);
    console.log(`  Tetrahedron frame indices: [${res.anchorFrame.vertexIds.join(', ')}], normalized volume: ${res.anchorFrame.normalizedVolume.toFixed(4)}`);
  }
  // Barycenter check: canonical tetrahedron vertices are [1,1,1], [1,-1,-1], [-1,1,-1], [-1,-1,1] -> sum is [0,0,0]
  assert(Math.abs(res.barycenter[0]) < 1e-12 && Math.abs(res.barycenter[1]) < 1e-12 && Math.abs(res.barycenter[2]) < 1e-12, 'Barycenter at origin');
  console.log(`✅ TEST 1 PASSED: Regular tetrahedron verified as 3D Spatial.\n`);
}

// -----------------------------------------------------------------------------
// TEST 2: Квадрат в плоскости (z = 0)
// -----------------------------------------------------------------------------
console.log('TEST 2: Planar Square (z = 0) -> 2D Planar Frame + Unit Normal');
{
  const square: CanonicalStructure = {
    id: 'struct_square_xy',
    name: 'Square in XY Plane',
    vertices: [
      { id: 'sq0', coords: [-1.0, -1.0, 0.0] },
      { id: 'sq1', coords: [ 1.0, -1.0, 0.0] },
      { id: 'sq2', coords: [ 1.0,  1.0, 0.0] },
      { id: 'sq3', coords: [-1.0,  1.0, 0.0] }
    ],
    edges: [['sq0', 'sq1'], ['sq1', 'sq2'], ['sq2', 'sq3'], ['sq3', 'sq0']]
  };

  const res = analyzeAffineDimension(square);
  assert(res.affineDimension === 2, `Expected dimension 2, got ${res.affineDimension}`);
  assert(res.conditionStatus === 'WELL_CONDITIONED', `Expected WELL_CONDITIONED, got ${res.conditionStatus}`);
  assert(res.anchorFrame !== null && res.anchorFrame.type === 'PLANAR', 'Expected PLANAR anchor frame');
  if (res.anchorFrame && res.anchorFrame.type === 'PLANAR') {
    assert(res.anchorFrame.vertexIndices.length === 2, 'Expected 2 anchor vertex indices');
    const normal = res.anchorFrame.unitNormal;
    // Normal should be parallel to Z axis [0, 0, 1]
    assert(Math.abs(normal[0]) < 1e-7 && Math.abs(normal[1]) < 1e-7 && Math.abs(Math.abs(normal[2]) - 1.0) < 1e-7, 'Normal aligned with Z-axis');
    console.log(`  Square planar normal: [${normal.map(n => n.toFixed(4)).join(', ')}]`);
  }
  console.log(`✅ TEST 2 PASSED: Planar square verified as 2D Planar.\n`);
}

// -----------------------------------------------------------------------------
// TEST 3: Равносторонний треугольник в произвольной плоскости
// -----------------------------------------------------------------------------
console.log('TEST 3: Equilateral Triangle in 3D Space (Plane x + y + z = 1)');
{
  const triangle: CanonicalStructure = {
    id: 'struct_tri_3d',
    name: 'Equilateral Triangle on x+y+z=1',
    vertices: [
      { id: 't0', coords: [1.0, 0.0, 0.0] },
      { id: 't1', coords: [0.0, 1.0, 0.0] },
      { id: 't2', coords: [0.0, 0.0, 1.0] }
    ],
    edges: [['t0', 't1'], ['t1', 't2'], ['t2', 't0']]
  };

  const res = analyzeAffineDimension(triangle);
  assert(res.affineDimension === 2, `Expected dimension 2, got ${res.affineDimension}`);
  assert(res.conditionStatus === 'WELL_CONDITIONED', `Expected WELL_CONDITIONED, got ${res.conditionStatus}`);
  assert(res.anchorFrame !== null && res.anchorFrame.type === 'PLANAR', 'Expected PLANAR anchor frame');
  if (res.anchorFrame && res.anchorFrame.type === 'PLANAR') {
    const normal = res.anchorFrame.unitNormal;
    // Normal to plane x + y + z = 1 is (1, 1, 1)/sqrt(3) ≈ 0.57735
    const invSqrt3 = 1.0 / Math.sqrt(3.0);
    assert(Math.abs(Math.abs(normal[0]) - invSqrt3) < 1e-5, 'Normal x-component is 1/sqrt(3)');
    assert(Math.abs(Math.abs(normal[1]) - invSqrt3) < 1e-5, 'Normal y-component is 1/sqrt(3)');
    assert(Math.abs(Math.abs(normal[2]) - invSqrt3) < 1e-5, 'Normal z-component is 1/sqrt(3)');
    console.log(`  Triangle unit normal: [${normal.map(n => n.toFixed(4)).join(', ')}]`);
  }
  console.log(`✅ TEST 3 PASSED: Equilateral triangle verified as 2D Planar.\n`);
}

// -----------------------------------------------------------------------------
// TEST 4: Три коллинеарные точки
// -----------------------------------------------------------------------------
console.log('TEST 4: Three Collinear Points -> 1D Collinear, AnchorFrame null');
{
  const collinear: CanonicalStructure = {
    id: 'struct_collinear_01',
    name: 'Collinear Points',
    vertices: [
      { id: 'c0', coords: [-2.0, -1.0, 0.0] },
      { id: 'c1', coords: [ 0.0,  0.0, 0.0] },
      { id: 'c2', coords: [ 2.0,  1.0, 0.0] }
    ],
    edges: [['c0', 'c1'], ['c1', 'c2']]
  };

  const res = analyzeAffineDimension(collinear);
  assert(res.affineDimension === 1, `Expected dimension 1, got ${res.affineDimension}`);
  assert(res.anchorFrame === null, 'Expected null anchor frame for dimension 1 (cannot build finite 3D frame)');
  assert(res.diagnostic.includes('COLLINEAR'), `Diagnostic mentions collinear: "${res.diagnostic}"`);
  console.log(`✅ TEST 4 PASSED: Collinear structure verified as 1D.\n`);
}

// -----------------------------------------------------------------------------
// TEST 5: Одна точка
// -----------------------------------------------------------------------------
console.log('TEST 5: Single Point -> 0D Degenerate');
{
  const singlePoint: CanonicalStructure = {
    id: 'struct_single_point',
    name: 'Single Point',
    vertices: [
      { id: 'p0', coords: [4.2, -7.1, 10.5] }
    ],
    edges: []
  };

  const res = analyzeAffineDimension(singlePoint);
  assert(res.affineDimension === 0, `Expected dimension 0, got ${res.affineDimension}`);
  assert(res.uniqueGeometricCount === 1, `Expected 1 unique point, got ${res.uniqueGeometricCount}`);
  assert(!res.hasCoincidentVertices, 'Single vertex has no duplicate/coincident partners');
  assert(res.conditionStatus === 'DEGENERATE', `Expected DEGENERATE, got ${res.conditionStatus}`);
  assert(res.anchorFrame === null, 'Expected null anchor frame for dimension 0');
  console.log(`✅ TEST 5 PASSED: Single point verified as 0D.\n`);
}

// -----------------------------------------------------------------------------
// TEST 6: Совпадающие координаты разных вершин (Coincident Vertices)
// -----------------------------------------------------------------------------
console.log('TEST 6: Coincident Coordinates of Distinct Vertices -> No Integrity Error, Accurate Accounting');
{
  // 4 vertices, but geometrically 2 pairs of coincident coordinates
  const coincidentPairs: CanonicalStructure = {
    id: 'struct_coincident',
    name: 'Coincident Pairs',
    vertices: [
      { id: 'a1', coords: [1.0, 0.0, 0.0], type: 'TYPE_A' },
      { id: 'a2', coords: [1.0, 0.0, 0.0], type: 'TYPE_B' }, // Coincident with a1
      { id: 'b1', coords: [-1.0, 0.0, 0.0], type: 'TYPE_A' },
      { id: 'b2', coords: [-1.0, 0.0, 0.0], type: 'TYPE_B' }  // Coincident with b1
    ],
    edges: []
  };

  const res = analyzeAffineDimension(coincidentPairs);
  assert(res.vertexCount === 4, `Expected 4 vertices, got ${res.vertexCount}`);
  assert(res.uniqueGeometricCount === 2, `Expected 2 unique geometric locations, got ${res.uniqueGeometricCount}`);
  assert(res.hasCoincidentVertices === true, 'Expected hasCoincidentVertices to be true');
  assert(res.clusters.length === 2, `Expected 2 clusters, got ${res.clusters.length}`);
  assert(res.affineDimension === 1, `Expected collinear dimension 1, got ${res.affineDimension}`);
  assert(res.clusters[0].vertexIds.length === 2, 'Cluster 0 has 2 vertices');
  assert(res.clusters[1].vertexIds.length === 2, 'Cluster 1 has 2 vertices');
  console.log(`  Identified clusters: ${res.clusters.map(c => `[${c.vertexIds.join(', ')}]`).join(', ')}`);
  console.log(`✅ TEST 6 PASSED: Coincident vertices accounted for correctly without error.\n`);
}

// -----------------------------------------------------------------------------
// TEST 7: Почти планарная структура (Almost Planar)
// -----------------------------------------------------------------------------
console.log('TEST 7: Almost Planar Structure -> Diagnostic BORDERLINE / ILL_CONDITIONED');
{
  // A square of size 2.0 with a tiny out-of-plane perturbation z = 5e-3
  // For dimensionEpsilon = 5e-3, this sits right near the boundary
  const almostPlanar: CanonicalStructure = {
    id: 'struct_almost_planar',
    name: 'Almost Planar Structure',
    vertices: [
      { id: 'ap0', coords: [-1.0, -1.0,  5e-3] },
      { id: 'ap1', coords: [ 1.0, -1.0, -5e-3] },
      { id: 'ap2', coords: [ 1.0,  1.0,  5e-3] },
      { id: 'ap3', coords: [-1.0,  1.0, -5e-3] }
    ],
    edges: []
  };

  const res = analyzeAffineDimension(almostPlanar);
  assert(res.conditionStatus === 'ILL_CONDITIONED', `Expected ILL_CONDITIONED, got ${res.conditionStatus}`);
  assert(res.diagnostic.includes('BORDERLINE') || res.diagnostic.includes('planar'), `Diagnostic explains condition: "${res.diagnostic}"`);
  console.log(`  Ratios: r2=${res.dimensionRatios.r2.toExponential(3)}, r3=${res.dimensionRatios.r3.toExponential(3)}`);
  console.log(`  Diagnostic message: ${res.diagnostic}`);
  console.log(`✅ TEST 7 PASSED: Almost planar structure explicitly diagnosed as ILL_CONDITIONED.\n`);
}

// -----------------------------------------------------------------------------
// TEST 8: Одинаковая структура в разных масштабах (Scale Invariance)
// -----------------------------------------------------------------------------
console.log('TEST 8: Scale Invariance across 1e-3, 1.0, and 1e3 Scale Factors');
{
  const scales = [1e-3, 1.0, 1e3];
  const results: DimensionAnalysisResult[] = [];

  for (const s of scales) {
    const scaledTetra: CanonicalStructure = {
      id: `struct_tetra_scale_${s}`,
      name: `Tetrahedron scaled by ${s}`,
      vertices: CANONICAL_TETRAHEDRON.vertices.map(v => ({
        id: v.id,
        coords: [v.coords[0] * s, v.coords[1] * s, v.coords[2] * s] as Point3D
      })),
      edges: [...CANONICAL_TETRAHEDRON.edges]
    };
    results.push(analyzeAffineDimension(scaledTetra));
  }

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    assert(r.affineDimension === 3, `Scale ${scales[i]}: Expected dim 3, got ${r.affineDimension}`);
    assert(r.conditionStatus === 'WELL_CONDITIONED', `Scale ${scales[i]}: Expected WELL_CONDITIONED`);
    // Dimension ratios must be identical within numerical precision
    assert(
      Math.abs(r.dimensionRatios.r2 - results[1].dimensionRatios.r2) < 1e-7,
      `Scale ${scales[i]}: r2 matches base scale (delta: ${Math.abs(r.dimensionRatios.r2 - results[1].dimensionRatios.r2)})`
    );
    assert(
      Math.abs(r.dimensionRatios.r3 - results[1].dimensionRatios.r3) < 1e-7,
      `Scale ${scales[i]}: r3 matches base scale (delta: ${Math.abs(r.dimensionRatios.r3 - results[1].dimensionRatios.r3)})`
    );
    // Anchor frame vertex IDs must be identical
    if (r.anchorFrame && results[1].anchorFrame && r.anchorFrame.type === 'SPATIAL' && results[1].anchorFrame.type === 'SPATIAL') {
      assert(
        JSON.stringify(r.anchorFrame.vertexIds) === JSON.stringify(results[1].anchorFrame.vertexIds),
        `Scale ${scales[i]}: Anchor frame IDs match base scale: [${r.anchorFrame.vertexIds.join(',')}]`
      );
    }
  }
  console.log(`✅ TEST 8 PASSED: Scale invariance strictly verified across 6 orders of magnitude.\n`);
}

// -----------------------------------------------------------------------------
// TEST 9: Одинаковая структура после переноса (Translation Invariance)
// -----------------------------------------------------------------------------
console.log('TEST 9: Translation Invariance under Arbitrary Offset [100.5, -342.1, 88.0]');
{
  const shift: Point3D = [100.5, -342.1, 88.0];
  const translatedTetra: CanonicalStructure = {
    id: 'struct_tetra_translated',
    name: 'Translated Tetrahedron',
    vertices: CANONICAL_TETRAHEDRON.vertices.map(v => ({
      id: v.id,
      coords: [v.coords[0] + shift[0], v.coords[1] + shift[1], v.coords[2] + shift[2]] as Point3D
    })),
    edges: [...CANONICAL_TETRAHEDRON.edges]
  };

  const baseRes = analyzeAffineDimension(CANONICAL_TETRAHEDRON);
  const transRes = analyzeAffineDimension(translatedTetra);

  assert(transRes.affineDimension === baseRes.affineDimension, 'Affine dimension invariant to translation');
  assert(transRes.conditionStatus === baseRes.conditionStatus, 'Condition status invariant to translation');
  // Barycenter shifted by exactly shift
  assert(Math.abs(transRes.barycenter[0] - (baseRes.barycenter[0] + shift[0])) < 1e-10, 'Barycenter x shifted');
  assert(Math.abs(transRes.barycenter[1] - (baseRes.barycenter[1] + shift[1])) < 1e-10, 'Barycenter y shifted');
  assert(Math.abs(transRes.barycenter[2] - (baseRes.barycenter[2] + shift[2])) < 1e-10, 'Barycenter z shifted');

  // Centered coordinates and anchor frame identical
  if (baseRes.anchorFrame && transRes.anchorFrame && baseRes.anchorFrame.type === 'SPATIAL' && transRes.anchorFrame.type === 'SPATIAL') {
    assert(
      JSON.stringify(baseRes.anchorFrame.vertexIds) === JSON.stringify(transRes.anchorFrame.vertexIds),
      'Anchor frame vertex IDs strictly identical after translation'
    );
    for (let k = 0; k < 3; k++) {
      const uBase = baseRes.anchorFrame.centeredVectors[k];
      const uTrans = transRes.anchorFrame.centeredVectors[k];
      assert(
        Math.abs(uBase[0] - uTrans[0]) < 1e-10 &&
        Math.abs(uBase[1] - uTrans[1]) < 1e-10 &&
        Math.abs(uBase[2] - uTrans[2]) < 1e-10,
        `Anchor vector ${k} centered coordinates identical`
      );
    }
  }
  console.log(`✅ TEST 9 PASSED: Translation invariance verified.\n`);
}

// -----------------------------------------------------------------------------
// TEST 10: Детерминированность выбора репера (100 повторных прогонов)
// -----------------------------------------------------------------------------
console.log('TEST 10: Determinism of Anchor Frame Selection Across 100 Runs');
{
  const firstRes = analyzeAffineDimension(CANONICAL_TETRAHEDRON);
  const serializedFirst = JSON.stringify(firstRes);

  let allIdentical = true;
  for (let i = 0; i < 100; i++) {
    const runRes = analyzeAffineDimension(CANONICAL_TETRAHEDRON);
    if (JSON.stringify(runRes) !== serializedFirst) {
      allIdentical = false;
      break;
    }
  }
  assert(allIdentical, '100/100 repeated runs bit-identical and fully deterministic');
  console.log(`✅ TEST 10 PASSED: Determinism verified across 100 runs.\n`);
}

// -----------------------------------------------------------------------------
// TEST 11: А-B-C кластеризация (фиксированный представитель)
// -----------------------------------------------------------------------------
console.log('TEST 11: A-B-C Clustering (Fixed Representative)');
{
  // A close to B (dist 0.6e-6), B close to C (dist 0.6e-6), A-C far (dist 1.2e-6).
  // coincidenceEpsilon = 1e-6.
  // Sorted by ID: a, b, c. Representative is 'a'.
  // 'b' is close to 'a' (0.6e-6 <= 1e-6) -> Joins cluster 'a'.
  // 'c' is NOT close to 'a' (1.2e-6 > 1e-6) -> Creates new cluster 'c'.
  const ABC: CanonicalStructure = {
    id: 'struct_abc_fixed_rep',
    name: 'ABC Fixed Rep',
    vertices: [
      { id: 'a', coords: [0.0, 0.0, 0.0] },
      { id: 'b', coords: [0.6e-6, 0.0, 0.0] },
      { id: 'c', coords: [1.2e-6, 0.0, 0.0] }
    ],
    edges: []
  };

  const res = analyzeAffineDimension(ABC);
  assert(res.clusters.length === 2, `Expected 2 clusters (fixed-rep), got ${res.clusters.length}`);
  assert(res.clusters[0].vertexIds.length === 2, 'Cluster 0 has 2 vertices');
  assert(res.clusters[1].vertexIds.length === 1, 'Cluster 1 has 1 vertex');
  console.log(`✅ TEST 11 PASSED: Fixed representative clustering behavior verified (A-B joined, C separate).\n`);
}

console.log('====================================================');
console.log(`TOTAL M-6A.1 TESTS: ${passedTests}/${totalTests} PASSED SUCCESSFULLY`);
console.log('====================================================');
