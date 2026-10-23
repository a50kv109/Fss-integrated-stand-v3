/**
 * STL V1 conjugacy tests (T1–T7 + arithmetic helpers).
 * Run: npx tsx core/stl/conjugacy.test.ts
 */
import { ExactScalar } from './exact_scalar';
import { ExactMatrix, matrixSetEquals } from './exact_matrix';
import { verifyConjugacy, StlSession, ConjugacyRequest } from './conjugacy';

let passed = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
  passed++;
}

function mat2(a: number, b: number, c: number, d: number): ExactMatrix {
  return ExactMatrix.fromInt([
    [a, b],
    [c, d]
  ]);
}

function mat3(rows: number[][]): ExactMatrix {
  return ExactMatrix.fromInt(rows);
}

// ---------- Exact arithmetic unit checks ----------
{
  const a = new ExactScalar(2, 4); // -> 1/2
  assert(a.toString() === '1/2', 'normalize 2/4 -> 1/2');
  const b = new ExactScalar(-2, -4);
  assert(b.toString() === '1/2', 'normalize sign');
  const z = new ExactScalar(0, 5);
  assert(z.toString() === '0', 'zero canonical');
  const s = new ExactScalar(1, 2).add(new ExactScalar(1, 3));
  assert(s.toString() === '5/6', '1/2+1/3=5/6');
  const p = new ExactScalar(1, 2).mul(new ExactScalar(2, 3));
  assert(p.toString() === '1/3', 'mul');
  try {
    new ExactScalar(1, 2).div(ExactScalar.zero());
    assert(false, 'div by zero should throw');
  } catch {
    assert(true, 'div by zero throws');
  }
}

// det / inverse 2x2
{
  const P = mat2(1, 1, 0, 1);
  assert(P.det().toString() === '1', 'det P shear = 1');
  const inv = P.inverse();
  assert(inv.get(0, 0).toString() === '1', 'inv00');
  assert(inv.get(0, 1).toString() === '-1', 'inv01');
  assert(inv.get(1, 0).toString() === '0', 'inv10');
  assert(inv.get(1, 1).toString() === '1', 'inv11');
  const I = P.mul(inv);
  assert(I.equals(ExactMatrix.identity(2)), 'P*P^{-1}=I');
}

// fractional inverse det=2
{
  const P = mat2(2, 0, 0, 1);
  assert(P.det().toString() === '2', 'det=2');
  const inv = P.inverse();
  assert(inv.get(0, 0).toString() === '1/2', 'inv has 1/2');
  assert(inv.get(1, 1).toString() === '1', 'inv11=1');
}

// ---------- D4 generators and full group (independently derived for T1) ----------
// D4 = <R,S | R^4=I, S^2=I, SRS=R^{-1}>
const I2 = mat2(1, 0, 0, 1);
const R = mat2(0, -1, 1, 0);
const R2 = mat2(-1, 0, 0, -1);
const R3 = mat2(0, 1, -1, 0);
const S = mat2(1, 0, 0, -1);
const RS = R.mul(S); // [[0,1],[1,0]]
const R2S = R2.mul(S); // [[-1,0],[0,1]]
const R3S = R3.mul(S); // [[0,-1],[-1,0]]

const D4 = [I2, R, R2, R3, S, RS, R2S, R3S];
assert(D4.length === 8, 'D4 has 8 elements');

// relations smoke
assert(R.mul(R).mul(R).mul(R).equals(I2), 'R^4=I');
assert(S.mul(S).equals(I2), 'S^2=I');
const Rinv = R3; // R^{-1}=R^3
assert(S.mul(R).mul(S).equals(Rinv), 'SRS=R^{-1}');

const P = mat2(1, 1, 0, 1); // shear, det=1
const invP = P.inverse();

function conj(g: ExactMatrix): ExactMatrix {
  return invP.mul(g).mul(P);
}

const D4image = D4.map(conj);

// T1 — conjugacy with expected set
{
  const res = verifyConjugacy({ G: D4, P, expected: D4image });
  assert(res.status === 'CONJUGACY_VERIFIED', `T1 status=${res.status} ${res.reason}`);
  assert(res.detP === '1', 'T1 detP');
  assert(res.setMatch === true, 'T1 setMatch');
  assert(res.images.length === 8, 'T1 8 images');
  // Label: fixture independently derived from standard D4 presentation (not claimed as recovered binary from EXPERIMENT 01 archive)
  console.log('T1 PASS (D4 conjugacy, independently derived fixture)');
}

// T2 — singular P
{
  const P0 = mat2(1, 2, 2, 4); // det=0
  const res = verifyConjugacy({ G: [I2, R], P: P0 });
  assert(res.status === 'INVALID_INPUT', `T2 status=${res.status}`);
  assert(res.detP === '0', 'T2 det=0');
  assert(res.reason.includes('singular') || res.reason.includes('det'), 'T2 reason');
  console.log('T2 PASS (singular P)');
}

// T3 — expected differs
{
  const wrong = [I2, R]; // not full image
  const res = verifyConjugacy({ G: D4, P, expected: wrong });
  assert(res.status === 'REFUTED', `T3 status=${res.status}`);
  assert(res.setMatch === false, 'T3 setMatch false');
  assert((res.missing && res.missing.length > 0) || (res.extra && res.extra.length > 0), 'T3 diff evidence');
  console.log('T3 PASS (expected mismatch REFUTED)');
}

// T4 — permutation invariance
{
  const shuffled = [...D4image].reverse();
  const res = verifyConjugacy({ G: D4, P, expected: shuffled });
  assert(res.status === 'CONJUGACY_VERIFIED', `T4 status=${res.status}`);
  assert(matrixSetEquals(D4image, shuffled), 'T4 set equals');
  console.log('T4 PASS (order independent)');
}

// T5 — fractional entries (det P = 2)
{
  const Pf = mat2(2, 0, 0, 1);
  const Gf = [I2, R, R2, R3];
  const invPf = Pf.inverse();
  const expectedF = Gf.map(g => invPf.mul(g).mul(Pf));
  // image of R should involve halves possibly
  const res = verifyConjugacy({ G: Gf, P: Pf, expected: expectedF });
  assert(res.status === 'CONJUGACY_VERIFIED', `T5 status=${res.status} ${res.reason}`);
  assert(res.detP === '2', 'T5 det=2');
  // ensure at least one fractional entry appears in inv or image path
  assert(invPf.get(0, 0).toString() === '1/2', 'T5 inv has 1/2');
  console.log('T5 PASS (rational inverse)');
}

// T6 — non-group set still conjugacy-ok; no auto group claim
{
  const nonGroup = [I2, R]; // missing R2,R3 — not closed
  const images = nonGroup.map(conj);
  const res = verifyConjugacy({ G: nonGroup, P, expected: images });
  assert(res.status === 'CONJUGACY_VERIFIED', `T6 conjugacy status=${res.status}`);
  assert(
    res.limits.some(l => l.includes('does not prove that G is a group')),
    'T6 limits mention not a group proof'
  );
  console.log('T6 PASS (conjugacy without group claim)');
}

// T7 — unsupported / mixed dimensions
{
  const m3 = mat3([
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ]);
  const resMix = verifyConjugacy({ G: [I2 as ExactMatrix, m3], P: I2 });
  assert(
    resMix.status === 'INVALID_INPUT' || resMix.status === 'UNSUPPORTED_INPUT',
    `T7 mix status=${resMix.status}`
  );
  // n=1 via manual hack — use invalid construction
  let threw = false;
  try {
    ExactMatrix.fromInt([[1]]);
  } catch {
    threw = true;
  }
  assert(threw, 'T7 n=1 rejected at construction');
  console.log('T7 PASS (dimension policy)');
}

// Session history
{
  const session = new StlSession();
  session.run({ G: [I2], P });
  session.run({ G: [I2, R], P });
  assert(session.snapshots().length === 2, 'session history length');
  console.log('Session history PASS');
}

// 3×3 identity conjugacy smoke
{
  const I3 = ExactMatrix.identity(3);
  const P3 = mat3([
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 1]
  ]);
  const res = verifyConjugacy({ G: [I3], P: P3, expected: [I3] });
  assert(res.status === 'CONJUGACY_VERIFIED', `3x3 status=${res.status}`);
  console.log('3x3 smoke PASS');
}

// ---------- Edge-case hardening ----------
{
  // Unsafe number rejected
  let threw = false;
  try {
    new ExactScalar(Number.MAX_SAFE_INTEGER + 1);
  } catch {
    threw = true;
  }
  assert(threw, 'H1 unsafe number rejected');

  // Non-integer number rejected
  threw = false;
  try {
    new ExactScalar(1.5);
  } catch {
    threw = true;
  }
  assert(threw, 'H1b non-integer number rejected');

  // Large exact via bigint
  const big = new ExactScalar(9007199254740993n); // > MAX_SAFE_INTEGER
  assert(big.toString() === '9007199254740993', 'H2 bigint exact');

  // Large exact via string
  const bigS = new ExactScalar('9007199254740993');
  assert(bigS.equals(big), 'H2 string exact');

  // Invalid first G entry -> INVALID_INPUT not throw
  const resBad = verifyConjugacy({
    G: [{ not: 'matrix' } as unknown as ExactMatrix],
    P: I2
  });
  assert(resBad.status === 'INVALID_INPUT', `H3 status=${resBad.status}`);
  assert(resBad.reason.includes('not ExactMatrix'), 'H3 reason');

  // Malformed pairs
  const resPairs = verifyConjugacy({
    G: [I2],
    P: I2,
    pairs: 'nope' as unknown as { g: ExactMatrix; gExpected: ExactMatrix }[]
  });
  assert(resPairs.status === 'INVALID_INPUT', `H4 pairs status=${resPairs.status}`);

  const resPairs2 = verifyConjugacy({
    G: [I2],
    P: I2,
    pairs: [{ g: I2, gExpected: null as unknown as ExactMatrix }]
  });
  assert(resPairs2.status === 'INVALID_INPUT', `H4b pair matrix status=${resPairs2.status}`);

  // Invalid maxSize
  const resMax = verifyConjugacy({ G: [I2], P: I2, maxSize: -1 });
  assert(resMax.status === 'INVALID_INPUT', `H5 maxSize status=${resMax.status}`);
  const resMax2 = verifyConjugacy({ G: [I2], P: I2, maxSize: 1.5 });
  assert(resMax2.status === 'INVALID_INPUT', `H5b maxSize float status=${resMax2.status}`);
  const resMaxNull = verifyConjugacy({
    G: [I2],
    P: I2,
    maxSize: null as unknown as number
  });
  assert(resMaxNull.status === 'INVALID_INPUT', `H5c maxSize null status=${resMaxNull.status}`);
  const resMaxUndef = verifyConjugacy({ G: [I2], P: I2 });
  assert(resMaxUndef.status === 'CONJUGACY_VERIFIED', `H5d maxSize undefined uses default`);

  // Invalid matrix scalar entry
  let matrixThrew = false;
  try {
    // force bad entry past fromInt
    new ExactMatrix(2, [
      [ExactScalar.one(), ExactScalar.zero()],
      [ExactScalar.zero(), 'x' as unknown as ExactScalar]
    ]);
  } catch {
    matrixThrew = true;
  }
  assert(matrixThrew, 'H6 bad ExactScalar entry rejected');

  console.log('Hardening tests PASS');
}


// ---------- Final input safety ----------
{
  const rNull = verifyConjugacy(null as unknown as ConjugacyRequest);
  assert(rNull.status === 'INVALID_INPUT', `S1 null status=${rNull.status}`);
  assert(rNull.reason.includes('non-null object'), 'S1 reason');

  const rUndef = verifyConjugacy(undefined as unknown as ConjugacyRequest);
  assert(rUndef.status === 'INVALID_INPUT', `S2 undefined status=${rUndef.status}`);

  const session = new StlSession();
  const snap = session.run({ G: null as unknown as ExactMatrix[], P: null as unknown as ExactMatrix });
  assert(snap.result.status === 'INVALID_INPUT', `S3 session status=${snap.result.status}`);
  assert(typeof snap.requestSummary === 'string', 'S3 summary is string');
  assert(session.snapshots().length === 1, 'S3 history recorded');

  const rMissingG = verifyConjugacy({ P: I2 } as unknown as ConjugacyRequest);
  assert(rMissingG.status === 'INVALID_INPUT', `S4 missing G status=${rMissingG.status}`);

  console.log('Input safety tests PASS');
}


console.log(`\nALL STL V1 conjugacy tests passed (${passed} assertions).`);
