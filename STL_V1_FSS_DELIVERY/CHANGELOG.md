# STL V1 — Changelog

## 1.0.0-checkpoint (delivery baseline)

**Baseline:** `fss-stl-v1-checkpoint.zip`

### Features

- Exact conjugacy \(g' = P^{-1}gP\) for 2×2 and 3×3
- ExactScalar / ExactMatrix with BigInt-backed rationals
- `verifyConjugacy`, set `expected`, independent `pairs`
- `StlSession` with safe summary for invalid requests
- Input validation (null request, bad G, singular P, maxSize policy)

### Contract micro-patches included in baseline

- Request `null`/`undefined` → `INVALID_INPUT` (no throw)
- `StlSession.run` safe `summarizeRequest`
- `maxSize === undefined` → 32; explicit `null` → `INVALID_INPUT`
- Hardening: unsafe numbers, pairs shape, matrix entry types

### Packaging (this delivery)

- Added delivery documentation: README, API_CONTRACT, INTEGRATION_GUIDE, VERIFICATION_REPORT, TEST_MATRIX, examples, verify-package.sh
- **No intentional rewrite** of mathematical core beyond checkpoint sources

### Unresolved / external

- Native TS suite and full FSS build must be confirmed in receiving Remix
- GCL gateway still out of scope
