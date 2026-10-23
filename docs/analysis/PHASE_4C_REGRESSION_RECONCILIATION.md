# FSS — PHASE 4C: REGRESSION TEST DEBT RECONCILIATION REPORT

**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `PHASE_4C_REGRESSION_RECONCILIATION.md`  
**Phase:** 4C — Regression Test Debt Reconciliation  
**Mode:** CONTROLLED TEST-MAINTENANCE EXECUTION  
**Date:** 2026-10-11  

---

## 1. Original Failures & Root Cause Analysis

Prior to this phase, two test files in the baseline suite were failing (`TD-01` technical debt) following the Stage A crystallographic expansion from 4 to 8 space group settings:

### A. `core/reference_loader.test.ts`
- **Original Failure:** Line 30 assertion failure: `❌ ASSERTION FAILED: Manifest must declare 4 records` (exit code 1).
- **Root Cause:** In Stage A, the canonical benchmark fixture `data/crystallography/gemmi_benchmark_4.json` was expanded from 4 to 8 space group settings (`P1`, `P-1`, `P2`, `P21`, `C2`, `Cc`, `P21/c`, `P212121`), and its manifest was correctly updated to declare `"recordCount": 8`. However, `reference_loader.test.ts` retained stale legacy hardcoded assertions asserting `recordCount === 4` and `reports.length === 4`.

### B. `core/group_properties.test.ts`
- **Original Failure:** Line 83 assertion failure: `❌ ASSERTION FAILED: P21/c must have inversion` (exit code 1).
- **Root Cause:** The test relied on fragile positional array indexing (`artifact.records[2]`) assuming `records[2]` was monoclinic centrosymmetric group No. 14 (`P21/c`). After expanding the fixture to 8 settings, `records[2]` became non-centrosymmetric group No. 3 (`P2`), while `P21/c` was shifted to index 6. Consequently, `records[2]` possessed no inversion operation ($W = -I_3$), causing the centrosymmetry check to fail. Furthermore, tests 6 and 10 were also erroneously referencing `records[2]` under the assumption that it was `P21/c`.

---

## 2. Exact Test Changes & Maintenance Modifications

In strict adherence to the Phase 4C mandate, **zero production source files** were changed. Only the two test files were maintained to reconcile stale assumptions with the canonical 8-setting benchmark fixture.

### A. Changes to `core/reference_loader.test.ts`
1. **Manifest & Record Count Reconciled:**
   - Updated manifest record count expectation from `4` to `8` (`assert(artifact.manifest.recordCount === 8)`).
   - Updated records array length assertion from `4` to `8` (`assert(artifact.records.length === 8)`).
   - Added dynamic consistency assertion: `assert(artifact.manifest.recordCount === artifact.records.length)`.
2. **Comparator Report Count Reconciled:**
   - Updated comparator report count assertion from `4` to `8` (`assert(reports.length === 8)`).
   - Added consistency check: `assert(reports.length === artifact.records.length)`.

### B. Changes to `core/group_properties.test.ts`
1. **Replaced Positional Indexing with Stable Keyed Lookups:**
   - Replaced `records[0]`, `records[1]`, `records[2]`, `records[3]` with deterministic lookups by unique setting identifier:
     ```typescript
     const recordP1 = artifact.records.find(r => r.settingId === 'P1')!;
     const recordP_1 = artifact.records.find(r => r.settingId === 'P-1')!;
     const recordP21c = artifact.records.find(r => r.settingId === 'P21/c')!;
     const recordP212121 = artifact.records.find(r => r.settingId === 'P212121')!;
     ```
   - Added explicit existence and space-group number assertions (`recordP21c.spaceGroupNumber === 14`, `recordP212121.spaceGroupNumber === 19`).
2. **Deterministic & Permutation Test Targeting:**
   - Updated Test 6 (100-run determinism) to test `recordP21c` explicitly instead of `records[2]`.
   - Updated Test 10 (permutation invariance) to permute `recordP21c` operations explicitly instead of `records[2]`.

---

## 3. Preservation of Test Strength & Mathematical Invariants

None of the test checks were weakened, softened, or skipped:
1. **Full Verification Maintained:** All mathematical assertions for inversion detection, exact midpoint calculation $\frac{1}{2}(I+W)x_0$, matrix order calculation under the crystallographic restriction $\{1, 2, 3, 4, 6\}$, affine powers $(W, w)^k$, distinction between unreduced translation lattice vectors and modulo 1 reduction, and off-origin pure rotation discrimination remain active and strictly enforced.
2. **Centrosymmetry of $P2_1/c$ Proved:** The test now accesses the genuine $P2_1/c$ record (group 14), proving that operation index 2 is indeed inversion $W = -I_3, w = (0, 0, 0)$ and that the $2_1$ screw axis ($w = (0, 1/2, 1/2)$) and $c$-glide plane ($w = (0, 1/2, 1/2)$) yield exact unreduced translation sums $(0, 1, 0)$ and $(0, 0, 1)$ respectively.
3. **Canonical SHA-256 Intact:** The reference artifact loader continues to verify the exact canonical SHA-256 hash (`f1ee084b...`) of the 8-setting benchmark artifact from Gemmi source.

---

## 4. Actual Verification Results (All 7 Mandated Commands)

All seven commands were executed directly in the environment with their actual exit statuses and outputs recorded:

| No. | Verification Command | Exit Code | Status | Output Summary / Findings |
|:---:|:---|:---:|:---:|:---|
| 1 | `npx tsx core/reference_loader.test.ts` | **0** | **PASS** | KB-13A loader tests passed. Successfully loaded artifact with canonical SHA-256 `f1ee084b36c8fb...`. Negative loader tests passed. Origin shift equivalence verified ($x_0 = (1/4, 1/4, 1/4)$ for group 19). All 8 benchmark comparator reports produced (7 MATCH, 1 SETTING_MISMATCH). |
| 2 | `npx tsx core/group_properties.test.ts` | **0** | **PASS** | KB-14 derived group properties tests passed 100%. Matrix orders 1, 2, 3, 4, 6 verified. Inversion and exact midpoint computation passed. Affine powers $(W, w)^k$ verified. Unreduced translation vs mod 1 verified. 100/100 determinism runs bit-identical. Permutation invariance verified. |
| 3 | `npx tsx core/operation_set_profile.test.ts` | **0** | **PASS** | EXP-09 profile tests passed 100%. T1 (identity), T2 (inversion), T3 (rotation vs mirror), T6b (multiset deduplication with duplicates), T7a (permutation invariance), T7b (periodic lattice invariance mod 1), T5 (all 8 registered space group profiles), T8 (empty input), T9 (malformed input), T10 (100-run determinism). |
| 4 | `npx tsx core/dimension.test.ts` | **0** | **PASS** | M-6A.1 affine dimension test suite passed 64/64 tests. Tetrahedron 3D spatial, square 2D planar, triangle 2D, collinear 1D, single point 0D, coincident clustering, scale invariance across $10^{-3}$ to $10^3$, translation invariance, 100-run determinism. |
| 5 | `npx tsx core/engine.test.ts` | **0** | **PASS** | 31/31 tests passed successfully across M-4B regression (7/7), M-5C semantic typing (4/4), M-5D edge topology (4/4), M-5F structural integrity (7/7), EXP-02, EXP-03, and G-03 counterexample verification. |
| 6 | `npm run lint` | **0** | **PASS** | `tsc --noEmit` executed with 0 errors across the entire codebase. |
| 7 | `npm run build` | **0** | **PASS** | Vite production build completed in 10.86s without errors (`dist/index.html` and chunks emitted cleanly). |

---

## 5. Scope & Integrity Confirmation

- **Production Modules Modified:** **NONE (0 files).**
- **Registry (`core/registry.ts`) Modified:** **NO (0 lines changed).** All 8 space group records, their exact generators, and their explicit provenance annotations remain untouched.
- **Engine / Dimension Modules Modified:** **NO.**
- **Operation Profile Module Modified:** **NO.**
- **UI / Application Components Modified:** **NO.**

---

## 6. Remaining Risks & Observations

1. **Test Runner Parity:** The project's documented test runner is `npx tsx` (`TESTING.md`). Running via `bun test` requires adapting `process.exit(1)` assertions to bun's native test runner expectations if `bun test` is ever adopted as the primary runner; however, using the standard project runner `npx tsx` passes 100% cleanly across all suites.
2. **Baseline Cleanliness:** The entire mathematical core, reference loader, property derivation engine, and new operation profile module are now 100% green and synchronized with the 8-setting crystallographic catalog.

---

## 7. Final Status

```
TEST FIXES APPLIED: YES
REFERENCE LOADER TEST: PASS
GROUP PROPERTIES TEST: PASS
PROFILE TEST: PASS
DIMENSION TEST: PASS
ENGINE TEST: PASS
LINT: PASS
BUILD: PASS
PRODUCTION CODE CHANGED: NO
REGISTRY CHANGED: NO
NEXT STEP PROPOSED — NOT EXECUTED: Step 2 — Integrate GROK Candidate Matcher (core/operation_set_match.ts and core/filter_soundness.test.ts) adapted to query the 8-setting catalog.
```
