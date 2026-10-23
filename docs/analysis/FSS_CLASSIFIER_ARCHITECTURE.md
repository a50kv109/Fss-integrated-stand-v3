# FSS — CLASSIFIER ARCHITECTURE (EXP-09)

**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `FSS_CLASSIFIER_ARCHITECTURE.md`  
**Classification:** Level 2 Architecture Specification  
**Status:** CANONICAL & ACTIVE  
**Last Updated:** 2026-10-11 (Phase 4E Documentation Reconciliation)

---

## 1. Architectural Overview & Context

The Space-Group Operation Matcher (EXP-09) is an in-memory algebraic module implemented in `core/operation_set_match.ts`. It integrates the invariant profiling capabilities introduced in `core/operation_set_profile.ts` with the reference data in `core/registry.ts` and exact rational exchange schema in `core/schema/crystallographic_exchange.ts`.

### Architectural Position:
```
+-----------------------------------------------------------------------------------------+
|                                    USER INTERFACE                                       |
| React SPA (Vite) - 3D Visualizer, Matrix Inspectors, Harmonic Mode (NO MATCHER WIRING)   |
+-----------------------------------------------------------------------------------------+
                                             |
                                         (DISCONNECTED)
                                             v
+-----------------------------------------------------------------------------------------+
|                                   BACKEND SERVER                                        |
| Express REST API (server.ts) - Serving JSON artifacts, SSE, logs (NO MATCHER ROUTE)     |
+-----------------------------------------------------------------------------------------+
                                             |
                                         (DISCONNECTED)
                                             v
+-----------------------------------------------------------------------------------------+
|                            IN-MEMORY CORE MODULE (EXP-09)                               |
|                     core/operation_set_match.ts (classifyOperationSet)                  |
|                                                                                         |
|       +----------------------------+             +----------------------------+         |
|       |     operation_set_profile  |             |      registry.ts           |         |
|       |  (Invariant Profiler)      |             |  (8-Setting Catalog)       |         |
|       +-------------+--------------+             +-------------+--------------+         |
|                     |                                          |                        |
|                     v                                          v                        |
|       +--------------------------------------------------------+              |         |
|       |               Two-Stage Classifier Pipeline            |              |         |
|       +--------------------------------------------------------+              |         |
+-----------------------------------------------------------------------------------------+
```

**Crucial Boundary:** The classifier is entirely in-memory within `core/`. Neither `server.ts` nor the React UI components import or invoke `classifyOperationSet` or `matchStrict`. The integration boundary remains strictly sealed pending human audit.

---

## 2. Pipeline Stages: Input $\to$ Profile Filter $\to$ Strict Matcher $\to$ Result

```
Input Multiset (Array of InputSymmetryOperation)
      │
      ▼
[Stage 0: Syntactic Validation & Profile Construction]
  Function: buildOperationSetProfile(input)
  Error Trap: If malformed -> verdict: 'INVALID_INPUT'
      │
      ▼ (OperationSetProfile)
[Stage 1: Invariant Candidate Filtering]
  Function: filterCandidates(profile, catalog)
  Pruning: Filter out catalog records with incompatible invariants
      │
      ├─► If 0 candidates -> verdict: 'NO_CANDIDATES'
      │
      ▼ (CandidateMatch[])
[Stage 2: Strict Canonical Matching]
  Function: matchStrict(input, candidateRecord)
  Comparison: Exact key set equality + Origin shift check for Group 19
      │
      ▼ (StrictMatchDetail[])
[Stage 3: Result Synthesis]
  Function: classifyOperationSet(input, catalog)
  Verdict Assignment: EXACT_MATCH | SETTING_MISMATCH | OPERATION_MISMATCH | AMBIGUOUS
      │
      ▼
Output: TwoStageMatchReport
```

---

## 3. Detailed Specification of Each Stage

### Stage 0: Syntactic Validation & Profile Construction
* **Input:** `InputSymmetryOperation[]` (array of objects with $3 \times 3$ matrix `W` and 3-element `w: Rational[]`).
* **Output:** `OperationSetProfile` or exception.
* **Component:** `core/operation_set_profile.ts` (`buildOperationSetProfile`).
* **Responsibility:**
  1. Validate that `W` is a $3 \times 3$ integer matrix and `w` has 3 rational components with non-zero denominators.
  2. Normalize translations mod 1 using `ExactRational` and Euclidean GCD reduction.
  3. Deduplicate operations via canonical keys to separate `totalCount` from `distinctCount`.
  4. Compute matrix order $k \in \{1, 2, 3, 4, 6\}$ using repeated matrix multiplication via `AffineOperationAlgebra`.
  5. Compute determinant ($\det W = \pm 1$) and matrix trace ($\operatorname{tr}(W)$).
* **Guarantees:** Deterministic computation; exact integer and BigInt rational arithmetic; rejection of zero denominators.
* **Limitations:** Does not verify group closure or associativity.
* **Test Verification:** Verified by `core/operation_set_profile.test.ts` (T1, T2, T3, T6b, T7, T8, T9, T10).

---

### Stage 1: Invariant Candidate Filtering
* **Input:** `OperationSetProfile` and `catalog: DetailedSymmetryRecord[]` (defaults to 8 settings from `getDefaultCatalog()`).
* **Output:** `CandidateFilterResult` containing:
  - `candidates: CandidateMatch[]`
  - `prunedCount: number`
  - `totalCatalogCount: number`
  - `filterSummary: string`
* **Component:** `core/operation_set_match.ts` (`filterCandidates`, `isProfileCompatible`).
* **Responsibility:**
  1. Compare `queryProfile` against the precomputed profile of each registered setting in the catalog.
  2. Prune candidates whose necessary invariants disagree:
     - `distinctCount`
     - `hasInversion`
     - `properRotationsCount`
     - `improperRotationsCount`
     - `orderHistogram`
     - `traceHistogram`
* **Guarantees:**
  - **Zero False Negatives for Valid Catalog Settings:** A valid setting will never be pruned if present in the catalog.
  - **Traversal Order Invariance:** The order of records in the catalog does not affect the candidate list.
* **Limitations:**
  - Does not distinguish settings sharing identical linear invariants (e.g. $P2$ vs $P21$, which both have 2 operations, no inversion, order 2).
  - Soundness guarantee applies to registered settings; it does not constitute a proof of group isomorphism.
* **Test Verification:** Verified by `core/filter_soundness.test.ts` (T5, T6, T9, and S1–S16).

---

### Stage 2: Strict Canonical Matching
* **Input:** `queryOperations: InputSymmetryOperation[]` and `candidateRecord: DetailedSymmetryRecord`.
* **Output:** `StrictMatchDetail` containing:
  - `settingId`, `spaceGroupNumber`, `hmSymbol`
  - `isExactSetMatch: boolean`
  - `isExactMultisetMatch: boolean`
  - `isOriginShiftEquivalent: boolean`
  - `originShiftVector?: [Rational, Rational, Rational]`
  - `missingInTargetKeys: string[]`, `extraInTargetKeys: string[]`
  - `discrepancies: string[]`
* **Component:** `core/operation_set_match.ts` (`matchStrict`).
* **Responsibility:**
  1. Generate canonical keys for query and target operations:
     $$\text{key} = \text{JSON}(W) \parallel [w_x \bmod 1, w_y \bmod 1, w_z \bmod 1]$$
  2. Evaluate set equality modulo lattice translations: `queryKeySet == targetKeySet`.
  3. Identify missing and extra keys.
  4. Track multiset equality: verify whether duplicates exist in the query.
  5. Fallback Origin-Shift Check: Evaluate exact equivalence under ITA Volume A standard shift $x_0 = (1/4, 1/4, 1/4)$ via `OriginShiftAnalyzer.verifyEquivalenceUnderShift` for Group 19.
* **Guarantees:**
  - Exact element-by-element equality in canonical coordinate representation.
  - Multiset fidelity: duplicate operations are detected, flagged, and prevented from masquerading as a 1:1 multiset match.
  - Precise origin shift verification without floating-point approximation.
* **Limitations:**
  - Does not perform continuous origin shift parameter searching.
  - Does not evaluate affine basis changes $P \in GL_3(\mathbb{Z})$.
  - Does not compute dynamic group closure for incomplete generator subsets.
* **Test Verification:** Verified by `core/filter_soundness.test.ts` (T1, T2, T3, T4, T7).

---

### Stage 3: Result Synthesis & Reporting
* **Input:** Evaluated candidates from Stage 1 and Stage 2.
* **Output:** `TwoStageMatchReport` containing:
  - `verdict: StrictMatchVerdict`
  - `matchedSettingId: string | null`
  - `matchedSpaceGroupNumber: number | null`
  - `exactMatches: string[]`
  - `candidateEvaluations: StrictMatchDetail[]`
  - `notes: string[]`
* **Component:** `core/operation_set_match.ts` (`classifyOperationSet`).
* **Responsibility:**
  - Synthesize verdicts following the normative contract:
    - 1 exact match $\to$ `EXACT_MATCH`
    - $>1$ exact matches $\to$ `AMBIGUOUS`
    - 0 exact matches, but verified origin shift $\to$ `SETTING_MISMATCH`
    - 0 exact matches, candidates existed $\to$ `OPERATION_MISMATCH`
    - 0 candidates from Stage 1 $\to$ `NO_CANDIDATES`
    - Syntax error in Stage 0 $\to$ `INVALID_INPUT`
* **Guarantees:** Strict adherence to contract status definitions; explicit explanatory notes.
* **Limitations:** Bounded to the 8 settings registered in FSS.

---

## 4. Module Dependencies & Structural Isolation

| Module | Location | Role in Classifier | Modifications in Phase 4D/4E |
|:---|:---|:---|:---:|
| `operation_set_profile.ts` | `core/` | Invariant profile generator | **0 (Read-only)** |
| `operation_set_match.ts` | `core/` | Two-stage candidate filter & matcher | **0 (Read-only)** |
| `crystallographic_exchange.ts` | `core/schema/` | `ExactRational`, `canonicalOperationKey` | **0 (Read-only)** |
| `group_properties.ts` | `core/` | `AffineOperationAlgebra` (matrix multiplication) | **0 (Read-only)** |
| `reference_loader.ts` | `core/` | `OriginShiftAnalyzer` (ITA shift verification) | **0 (Read-only)** |
| `registry.ts` | `core/` | `SymmetryCatalog` (8 reference settings) | **0 (Read-only)** |
| `server.ts` | Root | Express server | **0 (Read-only, Unwired)** |
| React UI | `src/` | Visual components | **0 (Read-only, Unwired)** |

---

## 5. Architectural Invariants Enforced

1. **Pure Functional Evaluation:** `classifyOperationSet` is completely side-effect-free. It does not mutate the catalog, the input operations, or global state.
2. **Zero Production Regressions:** Integration is entirely additive; no existing engine, dimension, or visualization contract was altered.
3. **Exact Decimal Prohibition:** All internal translation keys and origin shift vectors use BigInt rational arithmetic; floating-point tolerance ($\epsilon$) is forbidden in key hashing.
4. **Epistemic Decoupling:** Profile filtering logic is physically separated from strict matching logic, ensuring that invariant compatibility can never be confused with representation equality.
