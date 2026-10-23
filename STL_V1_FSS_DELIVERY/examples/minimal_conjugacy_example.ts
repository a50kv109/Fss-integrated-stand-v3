/**
 * Minimal conjugacy example — not a test runner.
 * After integration, import from the host path to core/stl.
 */
import { ExactMatrix, verifyConjugacy } from '../core/stl/index';

const I = ExactMatrix.fromInt([
  [1, 0],
  [0, 1]
]);
const R = ExactMatrix.fromInt([
  [0, -1],
  [1, 0]
]);
const P = ExactMatrix.fromInt([
  [1, 1],
  [0, 1]
]);

const result = verifyConjugacy({ G: [I, R], P });
console.log(result.status, result.detP, result.reason);
// Expect: CONJUGACY_VERIFIED, detP "1"
