# STL V1 — Symmetry Transformation Lab

**Status:** HARDENED WITH LIMITATIONS  
**Purpose:** Exact matrix conjugacy verification for the Fedorov Symmetry Stand (FSS) research stack.

## What it does

Given a finite set of square matrices \(G\) and a user-supplied invertible change-of-basis matrix \(P\), STL V1 computes

\[
g' = P^{-1} g P
\]

for every \(g \in G\) using **exact rational arithmetic**, then optionally compares the image set to an expected set and/or checks explicit element pairs.

## What it does **not** do

- Search for an unknown conjugating matrix \(P\)
- Prove that \(G\) is a group
- Origin-shift / affine crystallographic translation analysis
- Geometry discovery or Euclidean figure symmetry
- Abstract group-isomorphism search
- GCL (group closure) gateway
- Writes to FSS registry, matcher, or classifier

## Supported dimensions

- **2×2** and **3×3** only
- Mixed dimensions in one request → `INVALID_INPUT` / `UNSUPPORTED_INPUT`

## Exact-arithmetic model

- Scalars: normalized rationals \(p/q\) (`ExactScalar`), denominator \(> 0\), reduced by GCD
- Integers in intermediate products: **BigInt**
- JavaScript `number` inputs must be **safe integers**; large values via `bigint` or digit strings
- No float/epsilon in mathematical verdicts

## Public entry points

| Export | Role |
|--------|------|
| `ExactScalar` | Exact rational scalar |
| `ExactMatrix` | Exact \(n\times n\) matrix (\(n\in\{2,3\}\)) |
| `verifyConjugacy` | Main conjugacy API |
| `StlSession` | In-memory experiment history |
| `matrixSetEquals` / `matrixSetDiff` | Set comparison helpers |

Import example:

```ts
import { ExactMatrix, verifyConjugacy } from './core/stl';
```

## How to run tests

From a project that has TypeScript tooling (`tsx` or equivalent):

```bash
npx tsx core/stl/conjugacy.test.ts
```

Or from this package after copying `core/stl/` into an FSS tree:

```bash
npx tsx path/to/core/stl/conjugacy.test.ts
```

There is no bundled `node_modules`. Dependencies are those of the host FSS project.

## Verification status

| Check | Status |
|-------|--------|
| Source contract (maxSize null, pairs, expected) | Implemented in checkpoint source |
| JS mirror of conjugacy + input safety | PASS (historical sessions) |
| Native TypeScript test run | Environment-dependent; must be re-run in receiving project |
| Full FSS build / regression | Not claimed for this package |

See `VERIFICATION_REPORT.md` and `CHECKPOINT_V1.md`.

## Package layout

See directory tree in the delivery ZIP root. Integration steps: **`INTEGRATION_GUIDE.md`**.
