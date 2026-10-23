# FSS Integrated Research Stand — Testing & Verification Guide

**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `docs/TESTING.md`  
**Classification:** Canonical Testing & Verification Manual  
**Status:** Validated Execution Report  
**Last Updated:** 2026-10-11 (Phase 5A Verification)  

---

## 1. Quick Verification Commands

All tests and validation scripts run in Node.js using `tsx` or npm scripts.

```bash
# 1. Type Check & Static Analysis
npm run lint

# 2. Production Build Verification
npm run build

# 3. EXP-09 Classifier & Matcher Soundness Test Suite
npx tsx core/filter_soundness.test.ts

# 4. EXP-09 Invariant Profiler Test Suite
npx tsx core/operation_set_profile.test.ts

# 5. Core Mathematical Geometry Tests
npx tsx core/dimension.test.ts
npx tsx core/engine.test.ts
npx tsx core/group_properties.test.ts

# 6. Reference Loader & Benchmark Validation
npx tsx core/reference_loader.test.ts
npx tsx core/registry.test.ts
```

---

## 2. Full Test Suite Audit & Execution Status

A complete scan of all 15 test files across the repository was executed directly in the runtime environment.

### Summary:
* **Passing Test Suites:** 15 files (100% PASS, 0 failures)
* **Failing Test Suites:** 0 files (All legacy test debt reconciled)
* **Linter (`tsc --noEmit`):** PASS (0 errors)
* **Build (`vite build`):** PASS (0 errors, clean bundle emitted)

---

### Detailed Test Execution Table:

| Test File | Target Module | Test Coverage | Exit Code | Status | Diagnostic Notes |
|:---|:---|:---|:---:|:---:|:---|
| `core/filter_soundness.test.ts` | `core/operation_set_match.ts` | T1–T10 (Canonical matching, reordering, duplicate multisets, P2 vs P21 separation, edge cases) + S1–S16 extended soundness | **0** | **PASS** | 100% sound across all 8 catalog settings. Zero false negatives. |
| `core/operation_set_profile.test.ts` | `core/operation_set_profile.ts` | T1–T10 (Identity, inversion, rotation vs reflection, duplicate operations mod 1, 8 settings, determinism) | **0** | **PASS** | Exact matrix orders and trace spectra confirmed. |
| `core/dimension.test.ts` | `core/dimension.ts` | 64 affine dimensionality tests: 3D regular tetrahedron, planar 2D, collinear 1D, single point 0D, scale invariance across $10^{-3}$ to $10^3$ | **0** | **PASS** | 64/64 tests passed. Complete scale and translation invariance. |
| `core/engine.test.ts` | `core/engine.ts` | 31 geometric engine tests: M-4B regression, M-5C typing, M-5D topology, M-5F integrity, EXP-02, EXP-03, G-03 | **0** | **PASS** | 31/31 tests passed. |
| `core/group_properties.test.ts` | `core/group_properties.ts` | Matrix orders $\{1, 2, 3, 4, 6\}$, inversion midpoints, unreduced sums vs mod 1, 100-run bit-identical determinism | **0** | **PASS** | Stable setting lookups (`findBySettingId`) verified. |
| `core/reference_loader.test.ts` | `core/reference_loader.ts` | Gemmi benchmark SHA-256 (`f1ee084b...`), origin shift $\vec{x}_0 = (1/4, 1/4, 1/4)$, 8-record catalog comparison | **0** | **PASS** | 7 MATCH, 1 SETTING_MISMATCH (Group 19). |
| `core/registry.test.ts` | `core/registry.ts` | Working catalog initialization, lookup by settingId, lookup by groupNumber, operation completeness | **0** | **PASS** | All 8 settings valid and intact. |
| `core/generator.test.ts` | `core/generator.ts` | Group generators for cyclic and dihedral subgroups | **0** | **PASS** | Valid generator closures. |
| `core/importer.test.ts` | `core/importer.ts` | CIF/JSON crystallographic data import parser | **0** | **PASS** | Schema-compliant parsing. |
| `core/passport_verification.test.ts` | `core/passport_verification.ts` | Verification of mathematical passports against group definitions | **0** | **PASS** | Passport constraints validated. |
| `core/symmetry_adapter.test.ts` | `core/symmetry_adapter.ts` | Type conversions between internal and exchange representations | **0** | **PASS** | Round-trip serialization confirmed. |
| `core/schema/crystallographic_exchange.test.ts` | `core/schema/crystallographic_exchange.ts` | BigInt `ExactRational`, Euclidean GCD, canonical operation key generation, record schema validation | **0** | **PASS** | Exact rational arithmetic verified. |
| `core/tests/SG-002.test.ts` | `core/registry.ts` | Space group No. 2 ($P\bar{1}$) specific symmetry checks | **0** | **PASS** | Inversion center verified. |
| `core/property_evidence.test.ts` | `core/property_evidence.ts` | Evidence-backed property reporting over benchmark records | **0** | **PASS** | Reconciled in Phase 5B: 8/8 reports generated, robust setting lookup. |
| `core/schema/crystallographic_extractor.test.ts` | `core/schema/crystallographic_extractor.ts` | Extractor & artifact validation | **0** | **PASS** | Reconciled in Phase 5B: 8/8 records validated against manifest SHA-256. |

---

## 3. Reconciliation of Legacy Test Debt (Phase 5B)

During Phase 5B, the remaining two test suites with legacy 4-record expectations were fully reconciled to match the 8-setting benchmark catalog:
1. `core/property_evidence.test.ts`: Updated assertion `benchmarkReports.length === 8` and replaced brittle array index `records[2]` with robust predicate lookup `records.find(r => r.spaceGroupNumber === 14)!`.
2. `core/schema/crystallographic_extractor.test.ts`: Updated assertions `manifest.recordCount === 8` and `artifact.records.length === 8`, and replaced index `records[2]` with `records.find(r => r.spaceGroupNumber === 14)!` for negative validation.

No production source code or catalog entries were altered; only the outdated test assumptions were aligned with the 8-record catalog. All 15 suites now pass with exit code 0.

---

## 4. Lint & Build Verification

```bash
$ npm run lint
> fedorov--harmonic-synthesis@0.0.0 lint
> tsc --noEmit
# Exit Code: 0 (Zero type errors)

$ npm run build
> fedorov--harmonic-synthesis@0.0.0 build
> vite build
vite v6.2.0 building for production...
transforming...
✓ 183 modules transformed.
rendering chunks...
computing chunk sizes...
dist/index.html                   0.82 kB │ gzip:  0.44 kB
dist/assets/index-D7Kq3aR1.css    1.24 kB │ gzip:  0.58 kB
dist/assets/index-B1gN82kL.js   612.44 kB │ gzip: 168.32 kB
✓ built in 9.61s
# Exit Code: 0 (Clean production bundle emitted)
```
