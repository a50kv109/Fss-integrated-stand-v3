# STL V1 — API Contract

## Public exports (`core/stl/index.ts`)

| Name | Kind | Description |
|------|------|-------------|
| `ExactScalar` | class | Normalized rational \(p/q\) |
| `ExactMatrix` | class | Exact matrix, dimension 2 or 3 |
| `MatrixDim` | type | `2 \| 3` |
| `matrixSetEquals` | function | Set equality of matrices |
| `matrixSetDiff` | function | Missing/extra keys vs expected set |
| `verifyConjugacy` | function | Main conjugacy verification |
| `StlSession` | class | In-memory session / snapshots |
| `ConjugacyRequest` | interface | Input shape |
| `ConjugacyResult` | interface | Output shape |
| `ConjugacyStatus` | type | Status union |
| `ElementEvidence` | interface | Per-element evidence |
| `Snapshot` | interface | Session snapshot |

## ExactScalar

**Construction:** `new ExactScalar(numerator, denominator = 1)`

Accepted input kinds for numerator/denominator:

- `bigint`
- safe integer `number` (`Number.isSafeInteger`)
- integer digit string (`/^[+-]?\d+$/`)

Rejected: non-finite numbers, non-integers, unsafe integers, invalid strings, zero denominator.

**Invariants:** `den > 0`; \(\gcd(|num|, den) = 1\); zero is `0/1`.

**Operations:** `add`, `sub`, `mul`, `div` (throws on division by zero), `neg`, `equals`, `isZero`, `toString`.

## ExactMatrix

**Construction:**

- `new ExactMatrix(n, data)` — every entry must be `instanceof ExactScalar`
- `ExactMatrix.fromInt(number[][])` — safe integer entries only
- `ExactMatrix.identity(n)`

**Operations:** `mul`, `det`, `inverse` (throws if singular), `equals`, `canonicalKey`, `get`, `toString`.

## verifyConjugacy

```ts
function verifyConjugacy(
  req: ConjugacyRequest | null | undefined
): ConjugacyResult
```

### ConjugacyRequest

| Field | Required | Semantics |
|-------|----------|-----------|
| `G` | yes | Non-empty array of `ExactMatrix`, common dimension 2 or 3 |
| `P` | yes | `ExactMatrix` same dimension as `G` |
| `expected` | no | Array of `ExactMatrix`; compared as a **set** to computed images |
| `pairs` | no | `{ g, gExpected }[]`; independent point checks |
| `maxSize` | no | Soft cap on `|G|` |

### maxSize rules

| Value | Result |
|-------|--------|
| omitted / `undefined` | default **32** |
| `null` | `INVALID_INPUT` |
| non-number, non-finite, non-integer, ≤ 0 | `INVALID_INPUT` |
| positive integer | used as limit; `|G| > maxSize` → `UNSUPPORTED_INPUT` |

### Computation

For each \(g \in G\): \(g' = P^{-1} g P\) (exact).

Singular \(P\) (\(\det P = 0\)) → `INVALID_INPUT`.

### Statuses

| Status | Meaning |
|--------|---------|
| `CONJUGACY_VERIFIED` | Images computed; if `expected`/`pairs` given, they match |
| `REFUTED` | Valid run; expected set or pairs disagree |
| `INVALID_INPUT` | Malformed request, singular \(P\), bad `maxSize`, bad matrices |
| `UNSUPPORTED_INPUT` | Dimension or size outside V1 support |
| `INCONCLUSIVE` | Reserved; not used on happy paths in V1 |

### Equality

- Matrix equality: entrywise exact rational equality after normalization
- Set equality: equality of sets of `canonicalKey()` strings (order and duplicates ignored)

### Non-guarantees

- `CONJUGACY_VERIFIED` does **not** mean \(G\) is a group
- Does not prove Euclidean conjugacy unless \(P\) is orthogonal (not checked in V1)
- Does not discover \(P\)

## StlSession

```ts
class StlSession {
  run(req: ConjugacyRequest | null | undefined, id?: string): Snapshot
  snapshots(): readonly Snapshot[]
}
```

- Never throws solely because the request is null/undefined or `G` is null
- `requestSummary` is built via safe `summarizeRequest`
- History is **in-memory only** (no persistence framework)

## Errors vs statuses

Arithmetic failures during inverse of a non-singular path are converted to `INVALID_INPUT` with a reason string. Constructor-level bad scalars throw `Error` (caller / tests catch). Prefer validated `ExactMatrix.fromInt` for user-facing paths.
