# STL V1 — Symmetry Transformation Lab

Exact matrix conjugacy: `g' = P^{-1} g P` for user-supplied `P`.

## Scope

- Dimensions: 2×2 and 3×3
- Exact rational arithmetic (normalized p/q with BigInt intermediates)
- Statuses: `CONJUGACY_VERIFIED` | `REFUTED` | `INVALID_INPUT` | `UNSUPPORTED_INPUT` | `INCONCLUSIVE`
- Does **not** search for P, prove that G is a group, or write to the FSS registry
- Does **not** use `engine.ts` float geometry or `canonicalOperationKey` for equality

## Usage

```ts
import { ExactMatrix, verifyConjugacy } from './index';

const G = [ExactMatrix.fromInt([[1,0],[0,1]]), ExactMatrix.fromInt([[0,-1],[1,0]])];
const P = ExactMatrix.fromInt([[1,1],[0,1]]);
const result = verifyConjugacy({ G, P });
// result.status === 'CONJUGACY_VERIFIED' when images compute successfully
```

## Tests

```bash
npx tsx core/stl/conjugacy.test.ts
```

Tests T1–T7 cover D4 conjugacy, singular P, set mismatch, order independence, rational inverse, non-group input, and dimension policy.

## Files

- `exact_scalar.ts` — normalized rationals
- `exact_matrix.ts` — 2×2 / 3×3 exact matrices, det, inverse, set equality
- `conjugacy.ts` — `verifyConjugacy`, in-memory `StlSession`
- `conjugacy.test.ts` — automated checks

## Contract notes (V1 checkpoint)

- `maxSize` omitted (`undefined`) → default **32**.
- Explicit `null`, non-number, non-finite, non-integer, or non-positive `maxSize` → **INVALID_INPUT**.
- `expected`: set equality (order and multiplicity ignored).
- `pairs`: independent point checks; `pair.g` need not be a member of `G`.
- Successful conjugacy does **not** prove that `G` is a group.
