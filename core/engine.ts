import {
  Point3D,
  Matrix4x4,
  Vertex,
  Evidence,
  ExperimentInput,
  Correspondence,
  ExperimentVerdict,
  CanonicalStructure
} from './types';
import { CANONICAL_STRUCTURES, CANONICAL_OPERATIONS } from './canonical';

export const DEFAULT_VERIFICATION_EPSILON = 1e-5;
export const DEFAULT_ORTHOGONALITY_EPSILON = 1e-5;
export const DEFAULT_DETERMINANT_EPSILON = 1e-5;

/**
 * Pure 4x4 matrix multiplication with homogeneous 3D point:
 * p' = M * [x, y, z, 1]^T
 */
export function applyMatrix4x4(point: Point3D, mat: Matrix4x4): Point3D {
  const x = point[0];
  const y = point[1];
  const z = point[2];
  const w = 1.0;

  const rx = mat[0][0] * x + mat[0][1] * y + mat[0][2] * z + mat[0][3] * w;
  const ry = mat[1][0] * x + mat[1][1] * y + mat[1][2] * z + mat[1][3] * w;
  const rz = mat[2][0] * x + mat[2][1] * y + mat[2][2] * z + mat[2][3] * w;
  const rw = mat[3][0] * x + mat[3][1] * y + mat[3][2] * z + mat[3][3] * w;

  const invW = rw !== 0 ? 1.0 / rw : 1.0;
  return [rx * invW, ry * invW, rz * invW];
}

/**
 * Computes maximum Chebyshev deviation from identity for Q^T * Q:
 * delta_orth = max_{i, j in 0..2} |(Q^T * Q)_{ij} - delta_{ij}|
 * where Q is the 3x3 linear sub-block of the 4x4 affine matrix.
 */
export function computeOrthogonalityDelta(mat: Matrix4x4): number {
  let maxDeviation = 0.0;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let sum = 0.0;
      for (let k = 0; k < 3; k++) {
        // (Q^T)_{ik} = mat[k][i]
        // Q_{kj} = mat[k][j]
        sum += mat[k][i] * mat[k][j];
      }
      const expected = i === j ? 1.0 : 0.0;
      const diff = Math.abs(sum - expected);
      if (diff > maxDeviation) {
        maxDeviation = diff;
      }
    }
  }

  return maxDeviation;
}

/**
 * Computes the determinant of the 3x3 linear sub-block of a 4x4 matrix:
 * det(Q) = a*(e*k - f*h) - b*(d*k - f*g) + c*(d*h - e*g)
 */
export function computeDeterminant3x3(mat: Matrix4x4): number {
  const a = mat[0][0], b = mat[0][1], c = mat[0][2];
  const d = mat[1][0], e = mat[1][1], f = mat[1][2];
  const g = mat[2][0], h = mat[2][1], k = mat[2][2];

  return a * (e * k - f * h) - b * (d * k - f * g) + c * (d * h - e * g);
}

/**
 * Euclidean L2 distance in R^3
 */
export function euclideanDistance(a: Point3D, b: Point3D): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Evaluates semantic type compatibility between origin and target vertices.
 * 
 * Rules:
 * - Untyped compatibility: if neither vertex declares a type, they are compatible.
 * - Exact type equality: when both declare a type, require exact string equality.
 * - Explicit type boundary: a vertex with an explicit type must not map to an untyped vertex or a different explicit type.
 */
export function areVertexTypesCompatible(originType?: string, targetType?: string): boolean {
  if (originType === undefined && targetType === undefined) {
    return true;
  }
  if (originType !== undefined && targetType !== undefined) {
    return originType === targetType;
  }
  return false;
}

export type StructureValidationErrorType =
  | 'MALFORMED_STRUCTURE'
  | 'DUPLICATE_VERTEX_ID'
  | 'UNKNOWN_VERTEX_IN_EDGE'
  | 'SELF_LOOP_EDGE';

export interface StructureValidationResult {
  isValid: boolean;
  errorType?: StructureValidationErrorType;
  errorMessage?: string;
}

/**
 * Validates the structural integrity of a CanonicalStructure before geometric checks:
 * 1. Unique vertex IDs (DUPLICATE_VERTEX_ID)
 * 2. Edges referencing valid, declared vertices (UNKNOWN_VERTEX_IN_EDGE)
 * 3. No self-loops [v, v] (SELF_LOOP_EDGE)
 */
export function validateStructureIntegrity(structure: CanonicalStructure): StructureValidationResult {
  if (!structure || !Array.isArray(structure.vertices)) {
    return {
      isValid: false,
      errorType: 'MALFORMED_STRUCTURE',
      errorMessage: 'MALFORMED_STRUCTURE: Structure vertices must be an array.'
    };
  }

  // 1. Check vertex ID uniqueness
  const seenVertexIds = new Set<string>();
  for (const v of structure.vertices) {
    if (!v || typeof v.id !== 'string') {
      return {
        isValid: false,
        errorType: 'MALFORMED_STRUCTURE',
        errorMessage: 'MALFORMED_STRUCTURE: Vertex missing or invalid id.'
      };
    }
    if (seenVertexIds.has(v.id)) {
      return {
        isValid: false,
        errorType: 'DUPLICATE_VERTEX_ID',
        errorMessage: `DUPLICATE_VERTEX_ID: Multiple vertices declare the identifier '${v.id}'.`
      };
    }
    seenVertexIds.add(v.id);
  }

  // 2. Check edges if declared
  const edges = structure.edges || [];
  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    if (!edge || !Array.isArray(edge) || edge.length !== 2) {
      return {
        isValid: false,
        errorType: 'MALFORMED_STRUCTURE',
        errorMessage: `MALFORMED_STRUCTURE: Edge at index ${i} is not a valid 2-tuple.`
      };
    }

    const [u, v] = edge;

    // Check self-loop
    if (u === v) {
      return {
        isValid: false,
        errorType: 'SELF_LOOP_EDGE',
        errorMessage: `SELF_LOOP_EDGE: Edge at index ${i} is a self-loop with endpoint '${u}'.`
      };
    }

    // Check endpoints exist in declared vertices
    if (!seenVertexIds.has(u)) {
      return {
        isValid: false,
        errorType: 'UNKNOWN_VERTEX_IN_EDGE',
        errorMessage: `UNKNOWN_VERTEX_IN_EDGE: Edge at index ${i} references undeclared vertex '${u}'.`
      };
    }
    if (!seenVertexIds.has(v)) {
      return {
        isValid: false,
        errorType: 'UNKNOWN_VERTEX_IN_EDGE',
        errorMessage: `UNKNOWN_VERTEX_IN_EDGE: Edge at index ${i} references undeclared vertex '${v}'.`
      };
    }
  }

  return { isValid: true };
}

/**
 * THE DETERMINISTIC VERIFICATION ENGINE
 * 
 * Executes:
 * VALIDATE STRUCTURE INTEGRITY -> ISOMETRY CHECK -> TRANSFORM -> PUSHFORWARD MATCHING -> VERIFY -> EVIDENCE
 * 
 * Predicates:
 * - PRESERVES_STRUCTURE: Q^T*Q ≈ I and Q(V) ≈ V (allows det = ±1)
 * - PROPER_ROTATION: PRESERVES_STRUCTURE and det(Q) = +1 (proper rotations only)
 */
export function runSymmetryExperiment(input: ExperimentInput): Evidence {
  const structure = input.structure || (input.structureId ? CANONICAL_STRUCTURES[input.structureId] : undefined);
  if (!structure) {
    throw new Error(`Canonical structure '${input.structureId || 'undefined'}' not found or no structure provided.`);
  }

  const operation = input.operation || CANONICAL_OPERATIONS[input.operationId];
  if (!operation) {
    throw new Error(`Canonical operation '${input.operationId}' not found.`);
  }

  const predicate = input.predicate || 'PRESERVES_STRUCTURE';

  const epsilon = input.epsilon !== undefined && input.epsilon > 0
    ? input.epsilon
    : DEFAULT_VERIFICATION_EPSILON;

  const orthEpsilon = input.orthogonalityEpsilon !== undefined && input.orthogonalityEpsilon > 0
    ? input.orthogonalityEpsilon
    : DEFAULT_ORTHOGONALITY_EPSILON;

  const detEpsilon = input.determinantEpsilon !== undefined && input.determinantEpsilon > 0
    ? input.determinantEpsilon
    : DEFAULT_DETERMINANT_EPSILON;

  const timestamp = new Date().toISOString();
  const experimentId = `exp_${structure.id}_${operation.id}_${Date.now()}`;
  const originalEdges = structure.edges || [];
  const edgeCount = originalEdges.length;

  // 0. STRUCTURAL INTEGRITY VALIDATION
  const validation = validateStructureIntegrity(structure);
  if (!validation.isValid) {
    const rawVertices = Array.isArray(structure.vertices) ? structure.vertices : [];
    return {
      experiment_id: experimentId,
      structure_id: structure.id,
      operation: {
        id: operation.id,
        name: operation.name,
        type: operation.type,
        axis: operation.axis,
        angleDeg: operation.angleDeg
      },
      predicate,
      epsilon,
      orthogonality_epsilon: orthEpsilon,
      is_isometric: false,
      orthogonality_delta: 0.0,
      determinant: 0.0,
      determinant_epsilon: detEpsilon,
      original_state: rawVertices,
      transformed_state: [],
      correspondence: [],
      max_delta: 0.0,
      mean_delta: 0.0,
      is_bijective: false,
      edge_count: edgeCount,
      edge_topology_preserved: edgeCount > 0 ? false : undefined,
      verdict: 'REJECTED',
      rejection_reason: validation.errorMessage || validation.errorType,
      timestamp
    };
  }

  // 1. ISOMETRY & DETERMINANT EVALUATION
  const orthDelta = computeOrthogonalityDelta(operation.matrix4x4);
  const isIsometric = orthDelta <= orthEpsilon;
  const detQ = computeDeterminant3x3(operation.matrix4x4);

  // Compute original state and transformed state V' = Q(V)
  const originalState: Vertex[] = structure.vertices.map(v => ({
    id: v.id,
    coords: [...v.coords] as Point3D,
    type: v.type
  }));

  const transformedState: Vertex[] = originalState.map(v => ({
    id: v.id,
    coords: applyMatrix4x4(v.coords, operation.matrix4x4),
    type: v.type
  }));

  // If not isometric, reject immediately prior to symmetry/vertex permutation check
  if (!isIsometric) {
    return {
      experiment_id: experimentId,
      structure_id: structure.id,
      operation: {
        id: operation.id,
        name: operation.name,
        type: operation.type,
        axis: operation.axis,
        angleDeg: operation.angleDeg
      },
      predicate,
      epsilon,
      orthogonality_epsilon: orthEpsilon,
      is_isometric: false,
      orthogonality_delta: orthDelta,
      determinant: detQ,
      determinant_epsilon: detEpsilon,
      original_state: originalState,
      transformed_state: transformedState,
      correspondence: [],
      max_delta: orthDelta,
      mean_delta: orthDelta,
      is_bijective: false,
      edge_count: edgeCount,
      edge_topology_preserved: edgeCount > 0 ? false : undefined,
      verdict: 'REJECTED',
      rejection_reason: `TRANSFORMATION_NOT_ISOMETRIC (orthogonality delta: ${orthDelta.toFixed(8)} > tolerance: ${orthEpsilon.toFixed(8)})`,
      timestamp
    };
  }

  // 2. PUSHFORWARD VERTEX MATCHING: Q(v_i) ≈ v_{pi(i)}
  // Use bipartite matching to find a bijection
  const numVertices = originalState.length;
  const distMatrix: number[][] = Array.from({ length: numVertices }, () => Array(numVertices).fill(0));
  const compatibilityMatrix: boolean[][] = Array.from({ length: numVertices }, () => Array(numVertices).fill(false));

  for (let i = 0; i < numVertices; i++) {
    for (let j = 0; j < numVertices; j++) {
      distMatrix[i][j] = euclideanDistance(transformedState[i].coords, originalState[j].coords);
      compatibilityMatrix[i][j] = areVertexTypesCompatible(originalState[i].type, originalState[j].type);
    }
  }

  // Find a matching using backtracking/augmenting paths
  const match = new Array(numVertices).fill(-1); // match[target] = origin
  const used = new Array(numVertices).fill(false);

  function canMatch(u: number): boolean {
    for (let v = 0; v < numVertices; v++) {
      if (!used[v] && compatibilityMatrix[u][v] && distMatrix[u][v] <= epsilon) {
        used[v] = true;
        if (match[v] === -1 || canMatch(match[v])) {
          match[v] = u;
          return true;
        }
      }
    }
    return false;
  }

  let isBijective = true;
  for (let i = 0; i < numVertices; i++) {
    used.fill(false);
    if (!canMatch(i)) {
      isBijective = false;
      break;
    }
  }

  // Calculate correspondence
  const correspondence: Correspondence[] = [];
  let maxDelta = 0.0;
  let sumDelta = 0.0;

  if (isBijective) {
    for (let v = 0; v < numVertices; v++) {
      const u = match[v];
      const dist = distMatrix[u][v];
      
      correspondence.push({
        originId: originalState[u].id,
        targetId: originalState[v].id,
        delta: dist,
        originCoords: originalState[u].coords,
        transformedCoords: transformedState[u].coords,
        targetCoords: originalState[v].coords
      });
      
      if (dist > maxDelta) maxDelta = dist;
      sumDelta += dist;
    }
  }
  
  const meanDelta = numVertices > 0 ? sumDelta / numVertices : 0.0;

  // 3. GLOBAL BIJECTIVITY, TYPING & PREDICATE VERIFICATION

  // Build vertex mapping dictionary for fast lookup: originId -> targetId
  const vertexMapping = new Map<string, string>();
  for (const c of correspondence) {
    vertexMapping.set(c.originId, c.targetId);
  }

  // Canonical undirected edge set helper
  const makeCanonicalEdgeKey = (u: string, v: string) => (u < v ? `${u}--${v}` : `${v}--${u}`);

  const originalEdgeSet = new Set<string>();
  for (const [u, v] of originalEdges) {
    originalEdgeSet.add(makeCanonicalEdgeKey(u, v));
  }

  let edgeMismatch: {
    originEdge: [string, string];
    mappedEdge: [string, string];
  } | null = null;

  if (originalEdges.length > 0) {
    for (const [u, v] of originalEdges) {
      const mappedU = vertexMapping.get(u);
      const mappedV = vertexMapping.get(v);

      if (!mappedU || !mappedV) {
        // One of the endpoints didn't map (e.g. correspondence failed)
        edgeMismatch = {
          originEdge: [u, v],
          mappedEdge: [mappedU || 'unknown', mappedV || 'unknown']
        };
        break;
      }

      const mappedKey = makeCanonicalEdgeKey(mappedU, mappedV);
      if (!originalEdgeSet.has(mappedKey)) {
        edgeMismatch = {
          originEdge: [u, v],
          mappedEdge: [mappedU, mappedV]
        };
        break;
      }
    }
  }

  let verdict: ExperimentVerdict = 'REJECTED';
  let rejectionReason: string | undefined = undefined;

  if (!isBijective) {
    rejectionReason = `NON_BIJECTIVE_VERTEX_MAPPING (could not map all vertices bijectively)`;
  } else if (maxDelta > epsilon) {
    rejectionReason = `VERTICES_NOT_PRESERVED (max delta: ${maxDelta.toFixed(8)} > tolerance: ${epsilon.toFixed(8)})`;
  } else if (edgeMismatch) {
    rejectionReason = `EDGE_TOPOLOGY_NOT_PRESERVED (transformed edge (${edgeMismatch.mappedEdge[0]}, ${edgeMismatch.mappedEdge[1]}) of original edge (${edgeMismatch.originEdge[0]}, ${edgeMismatch.originEdge[1]}) is not in declared edges)`;
  } else if (predicate === 'PROPER_ROTATION') {
    // Requires structure preservation AND det(Q) = +1
    const isProperRotation = Math.abs(detQ - 1.0) <= detEpsilon;
    if (isProperRotation) {
      verdict = 'VERIFIED';
    } else {
      rejectionReason = `IMPROPER_OPERATION_NOT_PROPER_ROTATION (det = ${detQ.toFixed(8)}, requires det = +1.0 for PROPER_ROTATION)`;
    }
  } else {
    // PRESERVES_STRUCTURE
    verdict = 'VERIFIED';
  }

  // 4. EVIDENCE
  const edgeTopologyPreserved =
    edgeCount === 0 ? undefined : edgeMismatch === null;

  return {
    experiment_id: experimentId,
    structure_id: structure.id,
    operation: {
      id: operation.id,
      name: operation.name,
      type: operation.type,
      axis: operation.axis,
      angleDeg: operation.angleDeg
    },
    predicate,
    epsilon,
    orthogonality_epsilon: orthEpsilon,
    is_isometric: true,
    orthogonality_delta: orthDelta,
    determinant: detQ,
    determinant_epsilon: detEpsilon,
    original_state: originalState,
    transformed_state: transformedState,
    correspondence,
    max_delta: maxDelta,
    mean_delta: meanDelta,
    is_bijective: isBijective,
    edge_count: edgeCount,
    edge_topology_preserved: edgeTopologyPreserved,
    verdict,
    rejection_reason: rejectionReason,
    timestamp
  };
}
