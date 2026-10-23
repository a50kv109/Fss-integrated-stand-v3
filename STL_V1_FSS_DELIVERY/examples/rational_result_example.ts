/**
 * Fractional inverse example: det(P)=2 ⇒ rational entries in P^{-1}gP.
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
  [2, 0],
  [0, 1]
]);

const inv = P.inverse();
console.log('P^{-1}[0][0] =', inv.get(0, 0).toString()); // "1/2"

const images = [I, R].map((g) => inv.mul(g).mul(P));
const result = verifyConjugacy({ G: [I, R], P, expected: images });
console.log(result.status, result.detP);
// Expect: CONJUGACY_VERIFIED, detP "2"
