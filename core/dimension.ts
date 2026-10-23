import { Point3D, Vertex, CanonicalStructure } from './types';
import { euclideanDistance } from './engine';

/**
 * Explicit numerical tolerances and thresholds for Affine Dimension Analysis
 */
export const DIMENSION_TOLERANCES = {
  /** Tolerance to consider two vertices geometrically coincident in R^3 */
  COINCIDENCE_EPSILON: 1e-6,
  /** Absolute maximum radius below which all vertices are at barycenter (dim 0) */
  ZERO_RADIUS_EPSILON: 1e-7,
  /** Relative eigenvalue ratio threshold (lambda_i / lambda_1) to determine rank */
  DIMENSION_EPSILON: 1e-4,
  /** Borderline uncertainty factor: eigenvalues within [eps/factor, eps*factor] are ill-conditioned */
  BORDERLINE_FACTOR: 10.0,
  /** Minimum normalized cross product / triple product for frame linear independence */
  INDEPENDENCE_EPSILON: 1e-3
} as const;

export type AffineDimension = 0 | 1 | 2 | 3;

export type ConditionStatus =
  | 'WELL_CONDITIONED'
  | 'ILL_CONDITIONED'
  | 'DEGENERATE';

export interface GeometricCluster {
  representativeCoords: Point3D;
  vertexIds: string[];
}

export interface PlanarAnchorFrame {
  type: 'PLANAR';
  /** Indices in original vertex array of the 2 chosen linearly independent points */
  vertexIndices: [number, number];
  vertexIds: [string, string];
  /** Centered vectors u1 = v1 - c, u2 = v2 - c */
  centeredVectors: [Point3D, Point3D];
  /** Unit normal vector n = (u1 x u2) / ||u1 x u2|| */
  unitNormal: Point3D;
}

export interface SpatialAnchorFrame {
  type: 'SPATIAL';
  /** Indices in original vertex array of the 3 chosen linearly independent points */
  vertexIndices: [number, number, number];
  vertexIds: [string, string, string];
  /** Centered vectors u1 = v1 - c, u2 = v2 - c, u3 = v3 - c */
  centeredVectors: [Point3D, Point3D, Point3D];
  /** Normalized scalar triple product |(u1 x u2) . u3| / (||u1|| * ||u2|| * ||u3||) */
  normalizedVolume: number;
}

export type AnchorFrame = PlanarAnchorFrame | SpatialAnchorFrame | null;

export interface DimensionAnalysisResult {
  /** Total vertex count */
  vertexCount: number;
  /** Number of geometrically distinct positions */
  uniqueGeometricCount: number;
  /** Whether the structure contains distinct vertices sharing the same coordinates */
  hasCoincidentVertices: boolean;
  /** Clusters of geometrically coincident vertices */
  clusters: GeometricCluster[];
  /** Barycenter c = (1/N) * sum(v_i) */
  barycenter: Point3D;
  /** Maximum distance from barycenter */
  maxRadius: number;
  /** Root-mean-square radius */
  rmsRadius: number;
  /** Sorted eigenvalues of normalized covariance tensor (lambda1 >= lambda2 >= lambda3 >= 0) */
  eigenvalues: [number, number, number];
  /** Dimension ratios: [lambda2/lambda1, lambda3/lambda1] */
  dimensionRatios: {
    r2: number;
    r3: number;
  };
  /** Computed affine dimension (0, 1, 2, or 3) */
  affineDimension: AffineDimension;
  /** Numerical conditioning status */
  conditionStatus: ConditionStatus;
  /** Diagnostic reason or warnings */
  diagnostic: string;
  /** Robust anchor frame if dimension is 2 or 3; null for 0 or 1 */
  anchorFrame: AnchorFrame;
}

export interface DimensionAnalyzerOptions {
  coincidenceEpsilon?: number;
  zeroRadiusEpsilon?: number;
  dimensionEpsilon?: number;
  borderlineFactor?: number;
  independenceEpsilon?: number;
}

/**
 * Computes barycenter c = (1/N) * sum(coords)
 */
export function computeBarycenter(vertices: Vertex[]): Point3D {
  if (vertices.length === 0) {
    return [0.0, 0.0, 0.0];
  }
  let sx = 0.0;
  let sy = 0.0;
  let sz = 0.0;
  for (const v of vertices) {
    sx += v.coords[0];
    sy += v.coords[1];
    sz += v.coords[2];
  }
  const n = vertices.length;
  return [sx / n, sy / n, sz / n];
}

/**
 * Cross product of two 3D vectors
 */
export function vectorCross(a: Point3D, b: Point3D): Point3D {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

/**
 * Dot product of two 3D vectors
 */
export function vectorDot(a: Point3D, b: Point3D): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Vector Euclidean L2 norm
 */
export function vectorNorm(v: Point3D): number {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

/**
 * Normalizes vector to unit length
 */
export function vectorNormalize(v: Point3D, eps = 1e-12): Point3D {
  const norm = vectorNorm(v);
  if (norm < eps) {
    return [0.0, 0.0, 0.0];
  }
  return [v[0] / norm, v[1] / norm, v[2] / norm];
}

/**
 * Solves eigenvalues of 3x3 real symmetric matrix analytically using Cardano's formula.
 * Matrix represented as 3x3 2D array.
 * Guaranteed to return [lambda1, lambda2, lambda3] in descending order with lambda_i >= 0 for PSD.
 */
export function solveSymmetric3x3Eigenvalues(M: number[][]): [number, number, number] {
  const m00 = M[0][0], m01 = M[0][1], m02 = M[0][2];
  const m11 = M[1][1], m12 = M[1][2];
  const m22 = M[2][2];

  // Trace
  const tr = m00 + m11 + m22;
  const q = tr / 3.0;

  // Deviation elements
  const a00 = m00 - q;
  const a11 = m11 - q;
  const a22 = m22 - q;

  // p^2 = (Tr(A^2)) / 6
  const p2 = (
    a00 * a00 + a11 * a11 + a22 * a22 +
    2.0 * (m01 * m01 + m02 * m02 + m12 * m12)
  ) / 6.0;

  if (p2 <= 1e-15) {
    // All eigenvalues approximately equal to q
    const val = Math.max(0.0, q);
    return [val, val, val];
  }

  const p = Math.sqrt(p2);

  // B = (1/p) * (M - q*I)
  const b00 = a00 / p;
  const b11 = a11 / p;
  const b22 = a22 / p;
  const b01 = m01 / p;
  const b02 = m02 / p;
  const b12 = m12 / p;

  // det(B) / 2
  const detB = (
    b00 * (b11 * b22 - b12 * b12) -
    b01 * (b01 * b22 - b12 * b02) +
    b02 * (b01 * b12 - b11 * b02)
  );

  let r = detB / 2.0;
  if (r <= -1.0) r = -1.0;
  if (r >= 1.0) r = 1.0;

  const phi = Math.acos(r) / 3.0;

  // Eigenvalues in descending order
  const eig1 = q + 2.0 * p * Math.cos(phi);
  const eig3 = q + 2.0 * p * Math.cos(phi + (2.0 * Math.PI / 3.0));
  const eig2 = 3.0 * q - eig1 - eig3;

  const res: [number, number, number] = [
    Math.max(0.0, eig1),
    Math.max(0.0, eig2),
    Math.max(0.0, eig3)
  ];
  res.sort((a, b) => b - a);
  return res;
}

/**
 * Identifies clusters of geometrically coincident vertices within coincidenceEpsilon.
 * Semantic: Connected components (transitive closure of coincidence relation).
 * Result is deterministic, independent of vertex order.
 */
export function clusterVertices(
  vertices: Vertex[],
  coincidenceEpsilon: number
): GeometricCluster[] {
  // Sort by ID to ensure deterministic processing order
  const sorted = [...vertices].sort((a, b) => a.id.localeCompare(b.id));
  const clusters: GeometricCluster[] = [];

  for (const v of sorted) {
    let matchedCluster: GeometricCluster | null = null;
    for (const c of clusters) {
      if (euclideanDistance(v.coords, c.representativeCoords) <= coincidenceEpsilon) {
        matchedCluster = c;
        break;
      }
    }
    if (matchedCluster) {
      matchedCluster.vertexIds.push(v.id);
    } else {
      clusters.push({
        representativeCoords: [...v.coords] as Point3D,
        vertexIds: [v.id]
      });
    }
  }

  return clusters;
}

/**
 * Selects an anchor frame deterministically from centered vertices.
 * For Dim 3: selects 3 linearly independent centered vertex vectors maximizing volume.
 * For Dim 2: selects 2 linearly independent centered vertex vectors maximizing cross product norm, plus unit normal.
 * For Dim 0 and 1: returns null with diagnostic.
 */
export function buildAnchorFrame(
  vertices: Vertex[],
  centered: Point3D[],
  dim: AffineDimension,
  independenceEpsilon: number
): AnchorFrame {
  if (dim < 2) {
    return null;
  }

  // Deterministic candidate list: sort unique vertex indices by distance from barycenter desc, then coords, then id
  const indexedList = vertices.map((v, idx) => ({
    idx,
    id: v.id,
    u: centered[idx],
    norm: vectorNorm(centered[idx])
  }));

  // Exclude vertices too close to barycenter
  const nonZeroCandidates = indexedList.filter(item => item.norm > 1e-7);

  if (nonZeroCandidates.length < dim) {
    return null;
  }

  // Sort deterministically
  nonZeroCandidates.sort((a, b) => {
    if (Math.abs(b.norm - a.norm) > 1e-9) return b.norm - a.norm;
    if (Math.abs(a.u[0] - b.u[0]) > 1e-9) return a.u[0] - b.u[0];
    if (Math.abs(a.u[1] - b.u[1]) > 1e-9) return a.u[1] - b.u[1];
    if (Math.abs(a.u[2] - b.u[2]) > 1e-9) return a.u[2] - b.u[2];
    return a.id.localeCompare(b.id);
  });

  // Pick first anchor vector (furthest from barycenter)
  const first = nonZeroCandidates[0];
  const u1 = first.u;
  const n1 = vectorNormalize(u1);

  // Pick second anchor vector maximizing ||n1 x n2||
  let bestSecond: typeof nonZeroCandidates[0] | null = null;
  let maxCrossNorm = 0.0;

  for (let i = 1; i < nonZeroCandidates.length; i++) {
    const cand = nonZeroCandidates[i];
    const nCand = vectorNormalize(cand.u);
    const cross = vectorCross(n1, nCand);
    const crossNorm = vectorNorm(cross);
    if (crossNorm > maxCrossNorm) {
      maxCrossNorm = crossNorm;
      bestSecond = cand;
    }
  }

  if (!bestSecond || maxCrossNorm < independenceEpsilon) {
    return null;
  }

  const u2 = bestSecond.u;

  if (dim === 2) {
    // 2D Frame: [u1, u2] + canonical unit normal
    const cross = vectorCross(u1, u2);
    let normal = vectorNormalize(cross);

    // Canonical sign convention for normal: first non-zero component > 0
    if (
      normal[0] < -1e-7 ||
      (Math.abs(normal[0]) <= 1e-7 && normal[1] < -1e-7) ||
      (Math.abs(normal[0]) <= 1e-7 && Math.abs(normal[1]) <= 1e-7 && normal[2] < -1e-7)
    ) {
      normal = [-normal[0], -normal[1], -normal[2]];
    }

    return {
      type: 'PLANAR',
      vertexIndices: [first.idx, bestSecond.idx],
      vertexIds: [first.id, bestSecond.id],
      centeredVectors: [u1, u2],
      unitNormal: normal
    };
  }

  // Dim === 3: Pick third anchor vector maximizing normalized scalar triple product
  const n2 = vectorNormalize(u2);
  const cross12 = vectorCross(n1, n2); // magnitude is maxCrossNorm

  let bestThird: typeof nonZeroCandidates[0] | null = null;
  let maxTripleProduct = 0.0;

  for (let i = 1; i < nonZeroCandidates.length; i++) {
    const cand = nonZeroCandidates[i];
    if (cand.idx === bestSecond.idx) continue;
    const nCand = vectorNormalize(cand.u);
    const triple = Math.abs(vectorDot(cross12, nCand));
    if (triple > maxTripleProduct) {
      maxTripleProduct = triple;
      bestThird = cand;
    }
  }

  if (!bestThird || maxTripleProduct < independenceEpsilon) {
    return null;
  }

  return {
    type: 'SPATIAL',
    vertexIndices: [first.idx, bestSecond.idx, bestThird.idx],
    vertexIds: [first.id, bestSecond.id, bestThird.id],
    centeredVectors: [u1, u2, bestThird.u],
    normalizedVolume: maxTripleProduct
  };
}

/**
 * Main M-6A.1 Affine Dimension & Anchor Frame Analyzer.
 * 
 * Computes:
 * 1. Barycenter c and centered coordinates u_i = v_i - c.
 * 2. Characteristic max and RMS radii.
 * 3. Scale-normalized covariance matrix M = (1/N) * sum( (u_i / R_max) (u_i / R_max)^T ).
 * 4. Eigenvalues of M to determine scale- and translation-invariant affine dimension (0, 1, 2, 3).
 * 5. Robustness / conditioning diagnostics (WELL_CONDITIONED, ILL_CONDITIONED, DEGENERATE).
 * 6. Deterministic, stable anchor frame for dim 2 and 3.
 */
export function analyzeAffineDimension(
  structure: CanonicalStructure,
  options?: DimensionAnalyzerOptions
): DimensionAnalysisResult {
  const coincidenceEps = options?.coincidenceEpsilon ?? DIMENSION_TOLERANCES.COINCIDENCE_EPSILON;
  const zeroRadiusEps = options?.zeroRadiusEpsilon ?? DIMENSION_TOLERANCES.ZERO_RADIUS_EPSILON;
  const dimEps = options?.dimensionEpsilon ?? DIMENSION_TOLERANCES.DIMENSION_EPSILON;
  const borderlineFactor = options?.borderlineFactor ?? DIMENSION_TOLERANCES.BORDERLINE_FACTOR;
  const independenceEps = options?.independenceEpsilon ?? DIMENSION_TOLERANCES.INDEPENDENCE_EPSILON;

  const vertices = structure.vertices || [];
  const vertexCount = vertices.length;

  if (vertexCount === 0) {
    return {
      vertexCount: 0,
      uniqueGeometricCount: 0,
      hasCoincidentVertices: false,
      clusters: [],
      barycenter: [0.0, 0.0, 0.0],
      maxRadius: 0.0,
      rmsRadius: 0.0,
      eigenvalues: [0.0, 0.0, 0.0],
      dimensionRatios: { r2: 0.0, r3: 0.0 },
      affineDimension: 0,
      conditionStatus: 'DEGENERATE',
      diagnostic: 'DEGENERATE: Structure contains 0 vertices.',
      anchorFrame: null
    };
  }

  // 1. Barycenter & Centering
  const barycenter = computeBarycenter(vertices);
  const centered: Point3D[] = vertices.map(v => [
    v.coords[0] - barycenter[0],
    v.coords[1] - barycenter[1],
    v.coords[2] - barycenter[2]
  ]);

  // 2. Radii
  let maxRadius = 0.0;
  let sumSqRadius = 0.0;
  for (const u of centered) {
    const d = vectorNorm(u);
    if (d > maxRadius) maxRadius = d;
    sumSqRadius += d * d;
  }
  const rmsRadius = Math.sqrt(sumSqRadius / vertexCount);

  // 3. Geometric Clustering for Coincident Coordinates
  const clusters = clusterVertices(vertices, coincidenceEps);
  const uniqueGeometricCount = clusters.length;
  const hasCoincidentVertices = vertexCount > uniqueGeometricCount;

  // If all points are within zeroRadiusEps or only 1 unique geometric point
  if (uniqueGeometricCount <= 1 || maxRadius < zeroRadiusEps) {
    const diagMsg = vertexCount === 1
      ? 'SINGLE_POINT: Exactly one geometric vertex (dimension 0).'
      : `COINCIDENT_SINGLE_POINT: Structure contains ${vertexCount} vertices coincident at single geometric location (dimension 0).`;

    return {
      vertexCount,
      uniqueGeometricCount,
      hasCoincidentVertices,
      clusters,
      barycenter,
      maxRadius,
      rmsRadius,
      eigenvalues: [0.0, 0.0, 0.0],
      dimensionRatios: { r2: 0.0, r3: 0.0 },
      affineDimension: 0,
      conditionStatus: 'DEGENERATE',
      diagnostic: diagMsg,
      anchorFrame: null
    };
  }

  // 4. Normalized Covariance Tensor M = (1/N) * sum( u_norm * u_norm^T )
  // Normalization by maxRadius guarantees scale invariance
  const M: number[][] = [
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0]
  ];

  for (const u of centered) {
    const nx = u[0] / maxRadius;
    const ny = u[1] / maxRadius;
    const nz = u[2] / maxRadius;

    M[0][0] += nx * nx;
    M[0][1] += nx * ny;
    M[0][2] += nx * nz;

    M[1][0] += ny * nx;
    M[1][1] += ny * ny;
    M[1][2] += ny * nz;

    M[2][0] += nz * nx;
    M[2][1] += nz * ny;
    M[2][2] += nz * nz;
  }

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      M[r][c] /= vertexCount;
    }
  }

  // 5. Eigenvalues of M (descending lambda1 >= lambda2 >= lambda3 >= 0)
  const eigenvalues = solveSymmetric3x3Eigenvalues(M);
  const lambda1 = eigenvalues[0];
  const lambda2 = eigenvalues[1];
  const lambda3 = eigenvalues[2];

  const r2 = lambda1 > 1e-15 ? lambda2 / lambda1 : 0.0;
  const r3 = lambda1 > 1e-15 ? lambda3 / lambda1 : 0.0;

  // 6. Dimension Determination & Conditioning
  let affineDimension: AffineDimension;
  let conditionStatus: ConditionStatus = 'WELL_CONDITIONED';
  let diagnostic = '';

  const lowerBoundBorderline = dimEps / borderlineFactor;
  const upperBoundBorderline = dimEps * borderlineFactor;

  if (r2 < dimEps) {
    affineDimension = 1;
    if (r2 >= lowerBoundBorderline) {
      conditionStatus = 'ILL_CONDITIONED';
      diagnostic = `BORDERLINE_COLLINEAR: r2 (${r2.toExponential(3)}) is near dimension threshold (${dimEps.toExponential(3)}).`;
    } else {
      diagnostic = `COLLINEAR: 1D linear structure along dominant axis (r2=${r2.toExponential(3)} < threshold).`;
    }
  } else if (r3 < dimEps) {
    affineDimension = 2;
    if (r3 >= lowerBoundBorderline) {
      conditionStatus = 'ILL_CONDITIONED';
      diagnostic = `BORDERLINE_PLANAR: r3 (${r3.toExponential(3)}) is near planar threshold (${dimEps.toExponential(3)}). Almost planar structure.`;
    } else {
      diagnostic = `PLANAR: 2D planar structure (r2=${r2.toExponential(3)}, r3=${r3.toExponential(3)} < threshold).`;
    }
  } else {
    affineDimension = 3;
    if (r3 <= upperBoundBorderline) {
      conditionStatus = 'ILL_CONDITIONED';
      diagnostic = `BORDERLINE_SPATIAL: r3 (${r3.toExponential(3)}) is near planar boundary (${dimEps.toExponential(3)}).`;
    } else {
      diagnostic = `SPATIAL: 3D spatial structure (r2=${r2.toExponential(3)}, r3=${r3.toExponential(3)}).`;
    }
  }

  // 7. Deterministic Anchor Frame Construction
  const anchorFrame = buildAnchorFrame(vertices, centered, affineDimension, independenceEps);

  if (affineDimension >= 2 && !anchorFrame) {
    conditionStatus = 'ILL_CONDITIONED';
    diagnostic += ` [WARNING: Failed to construct stable anchor frame with independence threshold ${independenceEps}]`;
  }

  return {
    vertexCount,
    uniqueGeometricCount,
    hasCoincidentVertices,
    clusters,
    barycenter,
    maxRadius,
    rmsRadius,
    eigenvalues,
    dimensionRatios: { r2, r3 },
    affineDimension,
    conditionStatus,
    diagnostic,
    anchorFrame
  };
}
