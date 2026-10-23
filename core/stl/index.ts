/**
 * STL V1 — Symmetry Transformation Lab (exact matrix conjugacy).
 * Independent module; does not modify matcher/registry/classifier.
 */
export { ExactScalar } from './exact_scalar';
export { ExactMatrix, matrixSetEquals, matrixSetDiff } from './exact_matrix';
export type { MatrixDim } from './exact_matrix';
export {
  verifyConjugacy,
  StlSession
} from './conjugacy';
export type {
  ConjugacyStatus,
  ConjugacyRequest,
  ConjugacyResult,
  ElementEvidence,
  Snapshot
} from './conjugacy';
