# FSS — PHASE 4D: CONTROLLED CANDIDATE MATCHER INTEGRATION REPORT

**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `PHASE_4D_MATCHER_INTEGRATION.md`  
**Phase:** 4D — Controlled Candidate Matcher Integration  
**Mode:** BOUNDED IMPLEMENTATION & MATHEMATICAL EVIDENCE VERIFICATION  
**Date:** 2026-10-11  

---

## 1. Initial Contracts & Adaptation Decisions

### A. Contract Compatibility Analysis

| Contract Domain | GROK Original Contract | Studio FSS Contract | Adaptation Decision in `core/operation_set_match.ts` | Semantic Risk Analysis |
|:---|:---|:---|:---|:---|
| **Rational Arithmetic** | `{ numerator, denominator }` | `Rational` & `ExactRational` (BigInt-backed, `Number.isSafeInteger`) | Directly utilize Studio's `ExactRational` and `canonicalOperationKey` from `core/schema/crystallographic_exchange.ts`. | **None.** Studio guarantees exact Euclidean BigInt GCD without floating-point precision loss. |
| **Canonical Operation Key** | Stringified matrix and translation mod 1 | `${JSON.stringify(W)}\|${w.map(mod1).join(',')}` | Directly reuse `canonicalOperationKey(op)` from `core/schema/crystallographic_exchange.ts`. | **None.** Periodic lattice invariance ($w + \mathbb{Z}^3 \equiv w$) preserved 100%. |
| **Catalog Scope** | 4 settings (`P1`, `P-1`, `P21/c`, `P212121`) | 8 settings (`P1`, `P-1`, `P2`, `P21`, `C2`, `Cc`, `P21/c`, `P212121`) | Adapt matcher to query all 8 registered settings in `core/registry.ts`, while supporting arbitrary custom catalog arrays. | **None.** Cleanly resolves monoclinic additions ($C2, Cc, P2, P21$) without modifying `core/registry.ts`. |
| **Duplicate Operations** | Set deduplication | Set vs Multiset distinguished via `totalCount`, `distinctCount`, `hasDuplicates` | Matcher evaluates both distinct set equality (`isExactSetMatch`) and multiset fidelity (`isExactMultisetMatch`), explicitly logging duplicate counts in report notes. | **None.** Prevents silent data alteration or false assumptions about multiset uniqueness. |
| **Origin Shift Awareness** | Informal mention for Group 19 | `OriginShiftAnalyzer.verifyEquivalenceUnderShift` | If canonical key set equality fails, evaluate exact equivalence under origin shift $x_0 = (1/4, 1/4, 1/4)$ and emit `SETTING_MISMATCH` instead of rejecting or guessing. | **None.** Accurately distinguishes identical settings from origin-shifted ITA Volume A choices. |

---

## 2. Modified & Created Files Summary

In strict compliance with the Phase 4D scope constraints:
- **Files Created:**
  1. `core/operation_set_match.ts` (Isolated two-stage candidate filter and strict canonical matcher).
  2. `core/filter_soundness.test.ts` (Comprehensive soundness and classification test suite covering T1–T10 and 16 extended scenarios).
  3. `docs/analysis/PHASE_4D_MATCHER_INTEGRATION.md` (This analytical report).
- **Files Modified in Production:** **NONE (0 files).**
  - `core/engine.ts`: UNCHANGED.
  - `core/dimension.ts`: UNCHANGED.
  - `core/group_properties.ts`: UNCHANGED.
  - `core/schema/crystallographic_exchange.ts`: UNCHANGED.
  - `core/reference_loader.ts`: UNCHANGED.
  - `core/operation_set_profile.ts`: UNCHANGED.
  - `core/registry.ts`: UNCHANGED (All 8 settings preserved).
  - UI components and `server.ts`: UNCHANGED.
  - Dependencies (`package.json`): UNCHANGED.

---

## 3. Two-Stage Classification Algorithm: Profile Filter $\to$ Strict Matcher

The classification engine enforces an explicit epistemic boundary:

```
+-----------------------------------------------------------------------------------------+
|                                    INPUT MULTISET                                       |
|                  Array of Symmetry Operations: { W: 3x3, w: 3x Rational }                |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
| STAGE 1: CANDIDATE FILTERING (core/operation_set_match.ts: filterCandidates)            |
| 1. Compute Coordinate-Independent Invariant Profile:                                   |
|    - Distinct operation count modulo lattice translations Z^3                           |
|    - Centrosymmetry presence (inversion matrix W = -I_3)                                |
|    - Frequency spectrum of crystallographic matrix orders {1, 2, 3, 4, 6}              |
|    - Proper (+1) vs improper (-1) rotation counts via determinant                       |
|    - Matrix trace frequency histogram                                                  |
| 2. Pruning Rule:                                                                        |
|    Eliminate registered groups whose invariant profiles disagree.                      |
|    Soundness Guarantee: Zero false negatives for valid group settings.                  |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             v (Candidate List)
+-----------------------------------------------------------------------------------------+
| STAGE 2: STRICT CANONICAL OPERATION MATCHING (core/operation_set_match.ts: matchStrict) |
| 1. Generate Canonical Representation Keys:                                              |
|    canonicalOperationKey(op) = JSON(W) | [w_x mod 1, w_y mod 1, w_z mod 1]             |
| 2. Bijective Set Comparison:                                                            |
|    - Query key set == Candidate key set?                                                |
|    - Discrepancy analysis: missing keys in target, extra keys in target                 |
| 3. Origin-Shift Fallback Analysis:                                                      |
|    If exact keys differ, evaluate exact rational shift x_0 = (1/4, 1/4, 1/4).           |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
| EVIDENCE-BACKED REPORT (TwoStageMatchReport)                                            |
| - EXACT_MATCH: Exactly one registered setting matched canonical keys.                   |
| - SETTING_MISMATCH: Operations equivalent under proven origin shift x_0.                |
| - OPERATION_MISMATCH: Invariant profile matched, but canonical operations differ.       |
| - AMBIGUOUS: Multiple settings matched exact canonical keys.                            |
| - NO_CANDIDATES: Filter pruned all catalog settings (not in 8-group catalog).          |
| - INVALID_INPUT: Syntax or rational arithmetic error in query operations.              |
+-----------------------------------------------------------------------------------------+
```

---

## 4. Verification of Mandated Test Requirements (T1–T10)

| Test ID | Test Category | Specific Behavior Tested | Defect Detected / Prevented | Exit Status |
|:---|:---|:---|:---|:---:|
| **T1** | Exact Canonical Sets | All 8 registered settings match their canonical definitions with `EXACT_MATCH`. | Failure to recognize valid canonical group representations. | **PASS** |
| **T2** | Operation Reordering | Reverse and random permutation of operation arrays yields bit-identical classification. | Fragile array index order dependence in matcher. | **PASS** |
| **T3** | Duplicate Handling | Input multiset with 3 identical operations records `totalCount=3, distinctCount=1, hasDuplicates=true`. Evaluates `isExactSetMatch=true`, but `isExactMultisetMatch=false` and logs duplicate notes. | Silent mutation of input data or false claims of exact multiset equality. | **PASS** |
| **T4** | Translation Differentiation | Pure rotation ($P2$, $w=0$) vs screw axis ($P21$, $w_y=1/2$) are strictly differentiated in Stage 2. | Premature translation erasure or false canonicalization. | **PASS** |
| **T5** | Candidate Filter Soundness | Invariant profile filter retains true candidate group for 100% of registered settings (zero false negatives). | Over-aggressive candidate pruning excluding valid groups. | **PASS** |
| **T6** | Profile Collision Separation | Queries with identical profiles ($P2$ and $P21$) retain both in Stage 1, but Stage 2 cleanly selects only the matching group. | Conflating profile matching with group identification. | **PASS** |
| **T7** | All 8 Registered Settings | Every registered setting and origin-shifted Group 19 reference artifact verified through filter and matcher. | Undetected setting divergences or unhandled origin choices. | **PASS** |
| **T8** | Edge Cases & Malformed Inputs | Empty input yields `NO_CANDIDATES`; non-integer matrix or zero denominator yields `INVALID_INPUT`. | Unhandled exceptions, NaN propagation, or process crashes. | **PASS** |
| **T9** | Catalog Order Invariance | Reversing catalog order produces identical classification verdicts and candidate lists. | Iteration order bias or reliance on first-match heuristics. | **PASS** |
| **T10** | Boundary Enforcement | Synthetic incomplete sets (single $C_2$ without identity) or unsupported 5-fold rotations yield `NO_CANDIDATES`. | False positive classification on non-crystallographic inputs. | **PASS** |

---

## 5. Catalog Verification Results (All 8 Registered Settings)

Every registered space group setting was evaluated through `filterCandidates` and `classifyOperationSet`:

| Space Group No. | Setting ID | HM Symbol | Distinct Ops | Inversion | Proper / Improper | Stage 1 Candidates Retained | Stage 2 Verdict | Matched Setting |
|:---:|:---|:---|:---:|:---:|:---:|:---|:---:|:---:|
| **1** | `P1` | $P 1$ | 1 | false | 1 / 0 | `['P1']` (7 pruned) | `EXACT_MATCH` | `P1` |
| **2** | `P-1` | $P \bar{1}$ | 2 | true | 1 / 1 | `['P-1']` (7 pruned) | `EXACT_MATCH` | `P-1` |
| **3** | `P2` | $P 1 2 1$ | 2 | false | 2 / 0 | `['P2', 'P21']` (6 pruned) | `EXACT_MATCH` | `P2` |
| **4** | `P21` | $P 1 2_1 1$ | 2 | false | 2 / 0 | `['P2', 'P21']` (6 pruned) | `EXACT_MATCH` | `P21` |
| **5** | `C2` | $C 1 2 1$ | 4 | false | 4 / 0 | `['C2']` (7 pruned) | `EXACT_MATCH` | `C2` |
| **9** | `Cc` | $C 1 c 1$ | 4 | false | 2 / 2 | `['Cc']` (7 pruned) | `EXACT_MATCH` | `Cc` |
| **14** | `P21/c` | $P 1 2_1/c 1$ | 4 | true | 2 / 2 | `['P21/c']` (7 pruned) | `EXACT_MATCH` | `P21/c` |
| **19** | `P212121` | $P 2_1 2_1 2_1$ | 4 | false | 4 / 0 | `['P212121']` (7 pruned) | `EXACT_MATCH` | `P212121` |
| **19 (Ref)** | `P212121 (Gemmi)` | $P 2_1 2_1 2_1$ | 4 | false | 4 / 0 | `['P212121']` (7 pruned) | `SETTING_MISMATCH` | `P212121` |

### Key Observations:
1. **Zero False Negatives:** For all 8 settings, the true setting is retained in the Stage 1 candidate list.
2. **Linear Degeneracy Pruning:** Settings 3 ($P2$) and 4 ($P21$) share identical linear invariant profiles ($N=2, \det=+1$, order 2). The Stage 1 filter correctly retains both as candidates, and Stage 2 cleanly resolves them via canonical translation keys ($w=0$ vs $w_y=1/2$).
3. **Centering & Glide Discrimination:** Monoclinic C-centered setting $C2$ (all 4 operations proper) is cleanly separated from $Cc$ (2 proper, 2 reflections), with zero candidate overlap.
4. **Origin Shift Handling:** When evaluated against Gemmi's ITA Volume A standard reference operations for Group 19, Stage 1 retains `P212121`, and Stage 2 identifies that the canonical keys differ by standard origin shift $x_0 = (1/4, 1/4, 1/4)$, correctly emitting `SETTING_MISMATCH` with proven equivalence.

---

## 6. Verification Commands & Actual Execution Output

All nine verification commands were executed directly in the environment:

| No. | Command | Exit Code | Result | Summary / Key Diagnostic Output |
|:---:|:---|:---:|:---:|:---|
| 1 | `npx tsx core/operation_set_match.ts` | **0** | **PASS** | Direct CLI self-check loaded all 8 registered settings and verified `EXACT_MATCH` across all 8 settings. |
| 2 | `npx tsx core/filter_soundness.test.ts` | **0** | **PASS** | Tests T1–T10 passed. Extended soundness scenarios S1–S16 passed 100% (zero false negatives). |
| 3 | `npx tsx core/operation_set_profile.test.ts` | **0** | **PASS** | Profiler test suite passed (T1 identity, T2 inversion, T3 rotation vs reflection, T6b multiset duplicates, T7 reordering/periodic lattice invariance, T5 all 8 settings, T8 empty, T9 malformed, T10 determinism). |
| 4 | `npx tsx core/reference_loader.test.ts` | **0** | **PASS** | Reference loader passed. Verified Gemmi benchmark SHA-256 (`f1ee084b...`). Origin shift $x_0 = (1/4, 1/4, 1/4)$ verified. Comparator reports 7 MATCH, 1 SETTING_MISMATCH. |
| 5 | `npx tsx core/group_properties.test.ts` | **0** | **PASS** | KB-14 derived group properties passed 100%. Matrix orders 1, 2, 3, 4, 6, inversion midpoint, unreduced sums vs mod 1, 100-run determinism, permutation invariance. |
| 6 | `npx tsx core/dimension.test.ts` | **0** | **PASS** | 64/64 affine dimensionality tests passed (Tetrahedron 3D, planar 2D, collinear 1D, single point 0D, clustering, scale invariance across $10^{-3}$ to $10^3$, translation invariance). |
| 7 | `npx tsx core/engine.test.ts` | **0** | **PASS** | 31/31 geometric engine tests passed (M-4B regression, M-5C semantic typing, M-5D edge topology, M-5F structural integrity, EXP-02, EXP-03, G-03). |
| 8 | `npm run lint` | **0** | **PASS** | `tsc --noEmit` executed cleanly with 0 type errors across the entire codebase. |
| 9 | `npm run build` | **0** | **PASS** | Vite production build completed in 9.61s (`dist/index.html` and bundles emitted cleanly). |

---

## 7. Categorized Architectural Findings

### A. Confirmed by Code
- `core/operation_set_match.ts` is purely additive and decoupled from existing production modules.
- `getDefaultCatalog()` safely reads registered settings from `SymmetryCatalog` without mutating `core/registry.ts`.
- `canonicalOperationKey` uses BigInt-backed `ExactRational` with `.mod1()` reduction, guaranteeing periodic translation invariance modulo 1.

### B. Confirmed by Executed Tests
- Zero false negatives across all 8 settings in Stage 1 candidate filtering (proven in T5 and S1–S16).
- Strict separation of colliding profiles ($P2$ vs $P21$) in Stage 2 (proven in T4 and T6).
- Deterministic behavior regardless of operation order or catalog traversal order (proven in T2 and T9).
- Clean handling of multiset duplicates without silent data modification (proven in T3).

### C. Mathematically Derived
- The crystallographic restriction in $\mathbb{Z}^3$ limits linear matrix orders of periodic operations to $\{1, 2, 3, 4, 6\}$.
- Linear matrix trace and determinant are similarity invariants: $\operatorname{tr}(P W P^{-1}) = \operatorname{tr}(W)$, $\det(P W P^{-1}) = \det(W)$. Therefore, trace and order frequency histograms are invariant under coordinate rotations.
- Under an affine origin shift $x' = x - x_0$, translational components transform as $w' = w + (W - I) x_0 \pmod 1$. For operations with $W = I$ (e.g. centering translations in $C2, Cc$), $(I - I) x_0 = 0$, meaning pure translations are invariant under origin shifts.

### D. Identified Limitations & Boundary Conditions
1. **Catalog Scope Limitation:** The current catalog contains exactly 8 space group settings. A query from any of the remaining 222 space groups will correctly report `NO_CANDIDATES`. This is an expected catalog boundary, NOT an engine failure.
2. **General Affine Equivalence:** While origin shift equivalence under $x_0 = (1/4, 1/4, 1/4)$ is verified for Group 19, the matcher does not currently perform exhaustive searches over all possible continuous origin shifts or affine change-of-basis transformations ($P \in GL_3(\mathbb{Z})$).
3. **Group Completeness vs Representation Equality:** An `EXACT_MATCH` verdict proves that the query operations match the registered canonical operation keys of that setting. It does not replace group axiom verification (identity, closure, two-sided inverses) for arbitrary unverified inputs.

---

## 8. Final Status & Hold Point

```
INTEGRATION APPLIED: YES (core/operation_set_match.ts, core/filter_soundness.test.ts)
MATCHER SELF-CHECK: PASS (8/8 exact matches)
FILTER SOUNDNESS TEST: PASS (10/10 requirements, 16/16 soundness scenarios)
PROFILE TEST: PASS
REFERENCE LOADER TEST: PASS
GROUP PROPERTIES TEST: PASS
DIMENSION TEST: PASS
ENGINE TEST: PASS
LINT: PASS
BUILD: PASS
PRODUCTION CORE CHANGED: NO (0 existing production files modified)
REGISTRY CHANGED: NO (8 settings intact)
NEXT STEP PROPOSED — NOT EXECUTED: Human Audit of Phase 4D Integration Gate before considering REST API exposure or UI wiring.
```

**Execution stopped for Human Review.**

---

## 9. Phase 4E Epistemic Reconciliation Addendum

**Reconciled in Phase 4E (Documentation Reconciliation Gate):**  
Following the Phase 4D human audit, several statements in Sections 3, 4, and 7 were identified as potentially over-strong if interpreted as unbounded mathematical claims. The following authoritative clarifications and bounds now supersede any informal phrasing:

1. **Scope of Filter Soundness:**  
   The claim of "zero false negatives" is mathematically and empirically validated for valid representations of the **8 registered catalog settings** across test scenarios T1–T10 and S1–S16. It must **not** be extrapolated as an unconditional mathematical proof over arbitrary non-crystallographic or infinite input domains. See `FSS_CLASSIFIER_EVIDENCE_MATRIX.md` (Claim 1).
2. **Origin Shift Boundaries:**  
   The `SETTING_MISMATCH` verdict and origin-shift equivalence are implemented **exclusively** for the specific ITA Volume A standard shift $x_0 = (1/4, 1/4, 1/4)$ in Space Group 19 ($P2_12_12_1$). General, continuous, or unindexed origin shifts are **not implemented**. An arbitrary origin shift will evaluate to `OPERATION_MISMATCH`.
3. **Representation Matching vs. Group Isomorphism:**  
   `EXACT_MATCH` establishes bijective canonical operation key equality in a **fixed conventional coordinate basis** modulo $\mathbb{Z}^3$. It does **not** evaluate general affine group isomorphism under change-of-basis transformations $P \in GL_3(\mathbb{Z})$ or continuous shifts.
4. **Group Axiom Verification on Inputs:**  
   `classifyOperationSet` compares operations against pre-verified catalog settings. It does **not** dynamically compute group closure $\langle S \rangle$ for sparse generator sets. An incomplete input set will result in `OPERATION_MISMATCH` or `NO_CANDIDATES`.
5. **Normative Governance:**  
   All future integration, UI rendering, and API design are strictly governed by:
   - `docs/analysis/FSS_CLASSIFIER_CONTRACT.md` (Normative Contract)
   - `docs/analysis/FSS_CLASSIFIER_ARCHITECTURE.md` (Architecture Specification)
   - `docs/analysis/FSS_CLASSIFIER_EVIDENCE_MATRIX.md` (Evidence Matrix)
