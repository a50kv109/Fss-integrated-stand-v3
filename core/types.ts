export type Point3D = [number, number, number];

export type Matrix4x4 = [
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number]
];

export interface Vertex {
  id: string;
  coords: Point3D;
  type?: string;
}

export interface CanonicalStructure {
  id: string;
  name: string;
  vertices: Vertex[];
  edges: [string, string][];
}

export interface Operation {
  id: string;
  name: string;
  type: string;
  axis?: Point3D;
  angleDeg?: number;
  matrix4x4: Matrix4x4;
}

export type VerificationPredicate = 'PRESERVES_STRUCTURE' | 'PROPER_ROTATION';

export type ExperimentVerdict = 'VERIFIED' | 'REJECTED';

export interface Correspondence {
  originId: string;
  targetId: string;
  delta: number;
  originCoords: Point3D;
  transformedCoords: Point3D;
  targetCoords?: Point3D;
}

export interface Evidence {
  experiment_id: string;
  structure_id: string;
  operation: {
    id: string;
    name: string;
    type: string;
    axis?: Point3D;
    angleDeg?: number;
  };
  predicate: VerificationPredicate;
  epsilon: number;
  orthogonality_epsilon: number;
  is_isometric: boolean;
  orthogonality_delta: number;
  determinant: number;
  determinant_epsilon?: number;
  original_state: Vertex[];
  transformed_state: Vertex[];
  correspondence: Correspondence[];
  max_delta: number;
  mean_delta: number;
  is_bijective: boolean;
  edge_count: number;
  edge_topology_preserved?: boolean;
  verdict: ExperimentVerdict;
  rejection_reason?: string;
  timestamp: string;
}

export interface ExperimentInput {
  structureId?: string;
  operationId: string;
  predicate?: VerificationPredicate;
  epsilon?: number;
  orthogonalityEpsilon?: number;
  determinantEpsilon?: number;
  operation?: Operation;
  structure?: CanonicalStructure;
}
