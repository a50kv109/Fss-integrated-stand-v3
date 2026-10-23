/**
 * Invalid-input examples — controlled statuses, not uncaught throws for request shape.
 */
import { ExactMatrix, verifyConjugacy, StlSession } from '../core/stl/index';

const I = ExactMatrix.fromInt([
  [1, 0],
  [0, 1]
]);

console.log('null request:', verifyConjugacy(null).status);
// INVALID_INPUT

console.log('singular P:', verifyConjugacy({
  G: [I],
  P: ExactMatrix.fromInt([
    [1, 2],
    [2, 4]
  ])
}).status);
// INVALID_INPUT

console.log('maxSize null:', verifyConjugacy({
  G: [I],
  P: I,
  maxSize: null as unknown as number
}).status);
// INVALID_INPUT

const session = new StlSession();
const snap = session.run({ G: null as unknown as ExactMatrix[], P: null as unknown as ExactMatrix });
console.log('session bad request:', snap.result.status, snap.requestSummary);
// INVALID_INPUT + safe summary string
