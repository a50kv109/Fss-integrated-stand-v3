# FSS — CLASSIFIER EVIDENCE MATRIX (EXP-09)

**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `FSS_CLASSIFIER_EVIDENCE_MATRIX.md`  
**Classification:** Level 3 Verification Evidence Registry  
**Status:** CANONICAL & ACTIVE  
**Last Updated:** 2026-10-11 (Phase 4E Documentation Reconciliation)

---

## 1. Evidence Registry Guidelines

This registry cross-examines every significant claim regarding the EXP-09 classification engine against three distinct evidentiary pillars:
1. **Source Code Implementation:** Is the algorithm explicitly implemented in production code?
2. **Empirical Test Evidence:** Is the behavior directly exercised and asserted in repeatable test suites?
3. **Mathematical Justification:** Does a formal mathematical theorem or algebraic principle guarantee the property?

### Status Definitions:
* `CODE_CONFIRMED`: Feature and logic are verified by direct inspection of active source code.
* `TEST_CONFIRMED`: Feature is covered by passing automated unit/integration tests with deterministic assertions.
* `MATHEMATICALLY_JUSTIFIED`: Feature is backed by a valid mathematical theorem (e.g. group theory, crystallographic restriction, similarity invariants).
* `PARTIALLY_SUPPORTED`: Implementation or justification covers a specific bounded subset, but does not extend to the general case.
* `NOT_IMPLEMENTED`: Desired capability is explicitly absent from current code.
* `UNKNOWN`: Status cannot be determined from available codebase.

---

## 2. Comprehensive Evidence Matrix

| Claim / Assertion | Source Code Reference | Test Evidence | Mathematical Justification | Status | Limitation / Boundary |
|:---|:---|:---|:---|:---:|:---|
| **1. Zero False Negatives in Candidate Filter** | `core/operation_set_match.ts` (`filterCandidates`, `isProfileCompatible`) | `core/filter_soundness.test.ts` (T5, S1–S16) | Trace, order, and determinant are similarity invariants; isomorphic representations in the same lattice system preserve these spectra. | `CODE_CONFIRMED`<br>`TEST_CONFIRMED`<br>`MATHEMATICALLY_JUSTIFIED` | Proven for valid representations of the 8 registered catalog settings. Does **not** constitute a universal proof across arbitrary non-crystallographic or unclosed input spaces. |
| **2. Profile Filter Identifies Space Group** | `core/operation_set_match.ts` (Explicitly rejected in module comments) | `core/filter_soundness.test.ts` (T6) | False. Distinct space groups can have identical point groups and matrix order histograms (e.g. $P2$ and $P21$). | **REFUTED**<br>`NOT_IMPLEMENTED` | Profile filtering is strictly necessary, **never sufficient**. Stage 2 canonical key matching is mandatory for group identification. |
| **3. Exact Canonical Key Matching mod $\mathbb{Z}^3$** | `core/schema/crystallographic_exchange.ts` (`canonicalOperationKey`), `core/operation_set_match.ts` (`matchStrict`) | `core/filter_soundness.test.ts` (T1, T2) | Translations $w + \vec{t}$ with $\vec{t} \in \mathbb{Z}^3$ describe identical crystallographic operations in a periodic lattice. | `CODE_CONFIRMED`<br>`TEST_CONFIRMED`<br>`MATHEMATICALLY_JUSTIFIED` | Evaluates representation equality against a specific registered setting in a fixed basis; does not detect groups transformed by general basis change. |
| **4. Strict Distinction of Linear Profile Collisions ($P2$ vs $P21$)** | `core/operation_set_match.ts` (`matchStrict`) | `core/filter_soundness.test.ts` (T4, T6) | $P2$ ($w = 0$) has pure rotation; $P21$ ($w_y = 1/2$) has non-zero fractional translation. Canonical keys differ. | `CODE_CONFIRMED`<br>`TEST_CONFIRMED`<br>`MATHEMATICALLY_JUSTIFIED` | Stage 1 retains both; Stage 2 cleanly resolves the correct group with zero ambiguity. |
| **5. Duplicate Detection & Multiset Fidelity** | `core/operation_set_profile.ts` (`buildOperationSetProfile`), `core/operation_set_match.ts` (`matchStrict`) | `core/filter_soundness.test.ts` (T3), `core/operation_set_profile.test.ts` (T6b) | Distinguishing multiset cardinality from distinct set cardinality prevents false assumptions of 1:1 bijection. | `CODE_CONFIRMED`<br>`TEST_CONFIRMED`<br>`MATHEMATICALLY_JUSTIFIED` | Input duplicates are flagged in notes. Set match is true, but multiset match (`isExactMultisetMatch`) is false. No silent mutation. |
| **6. Arbitrary / Continuous Origin Shift Search** | Absent in `core/operation_set_match.ts` | None | Continuous shift optimization over $\mathbb{R}^3 / \mathbb{Z}^3$ is mathematically well-defined but computationally unindexed. | `NOT_IMPLEMENTED` | Classifier **cannot** detect arbitrary origin shifts. Non-standard shifts evaluate to `OPERATION_MISMATCH`. |
| **7. Specific ITA Volume A Origin Shift for Group 19** | `core/reference_loader.ts` (`OriginShiftAnalyzer`), `core/operation_set_match.ts` (lines 268–285) | `core/filter_soundness.test.ts` (T7), `core/reference_loader.test.ts` | Translation transformation under $x' = x - x_0$ yields $w' = w + (W - I) x_0 \pmod 1$. For $x_0 = (1/4, 1/4, 1/4)$, Gemmi and FSS match identically. | `CODE_CONFIRMED`<br>`TEST_CONFIRMED`<br>`MATHEMATICALLY_JUSTIFIED`<br>`PARTIALLY_SUPPORTED` | Supported **only** for setting `P212121` with exact shift vector $(1/4, 1/4, 1/4)$. Not a general origin-shift solver. |
| **8. General Affine Change of Basis ($GL_3(\mathbb{Z})$)** | Absent in `core/operation_set_match.ts` | None | Modular group $GL_3(\mathbb{Z})$ requires lattice reduction (e.g. Niggli / Delaunay / Gruber reduction). | `NOT_IMPLEMENTED` | Operations must be provided in the standard coordinate orientation of the registered setting. Alternative settings (e.g. $P2_1/n$, $P2_1/a$) fail strict match. |
| **9. Group Closure Verification for Arbitrary Inputs** | `core/schema/crystallographic_exchange.ts` (`validateMathematicalGroup`) exists, but is **not** called by `classifyOperationSet` | `core/schema/crystallographic_exchange.ts` test suites | Group axioms (closure, identity, inverses) require $\forall g_1, g_2 \in G: g_1 g_2 \in G$. | `PARTIALLY_SUPPORTED`<br>`NOT_IMPLEMENTED` in fast matcher path | `classifyOperationSet` compares against already-closed catalog records. If an unclosed or incomplete generator set is input, matcher reports `OPERATION_MISMATCH`, not an explicit closure error. |
| **10. Exact Rational Arithmetic (No Float Drift)** | `core/schema/crystallographic_exchange.ts` (`ExactRational`) | `core/reference_loader.test.ts`, `core/operation_set_profile.test.ts` | BigInt integer arithmetic with Euclidean GCD reduction guarantees exact rational representation without precision loss. | `CODE_CONFIRMED`<br>`TEST_CONFIRMED`<br>`MATHEMATICALLY_JUSTIFIED` | Guaranteed for all rational components with safe integer numerators and non-zero denominators. |
| **11. Full 230 Space Group Classification** | `core/registry.ts` (`SymmetryCatalog`) | `core/filter_soundness.test.ts` (T1, T7) | 230 space groups exist in 3D Euclidean space. Current registry contains 8 settings. | `PARTIALLY_SUPPORTED` (8 of 230) | A query for any of the other 222 space groups correctly returns `NO_CANDIDATES`. This is a catalog scope boundary, not an algorithmic bug. |
| **12. Operation & Catalog Traversal Order Invariance** | `core/operation_set_match.ts` (`classifyOperationSet`, `filterCandidates`) | `core/filter_soundness.test.ts` (T2, T9) | Mathematical sets are order-independent; canonical hashing into `Set<string>` guarantees permutation invariance. | `CODE_CONFIRMED`<br>`TEST_CONFIRMED`<br>`MATHEMATICALLY_JUSTIFIED` | Fully verified under array reversal, random permutation, and reverse catalog order. |
| **13. Non-Crystallographic / Malformed Input Rejection** | `core/operation_set_profile.ts` (`validateOperationSyntax`), `core/operation_set_match.ts` | `core/filter_soundness.test.ts` (T8, T10), `core/operation_set_profile.test.ts` (T8, T9) | Crystallographic restriction restricts rotational orders in $\mathbb{Z}^3$ to $\{1, 2, 3, 4, 6\}$. 5-fold rotations have order 0. | `CODE_CONFIRMED`<br>`TEST_CONFIRMED`<br>`MATHEMATICALLY_JUSTIFIED` | Synthetic non-crystallographic operations or incomplete single matrices cleanly receive `NO_CANDIDATES`; syntax errors receive `INVALID_INPUT`. |
| **14. REST API & UI Isolation** | `server.ts`, `src/` (No imports of `operation_set_match.ts`) | Clean build and absence of references | Separation of concerns; gating integration behind human mathematical audit. | `CODE_CONFIRMED`<br>`TEST_CONFIRMED` | Classifier logic is not exposed via REST endpoints or UI components. |

---

## 3. Epistemic Assessment Summary

1. **What is solidly proven:**
   - The two-stage classifier correctly, deterministically, and soundly identifies and distinguishes the 8 registered settings in the FSS catalog when operations are provided in canonical coordinates modulo $\mathbb{Z}^3$.
   - Linear profile collisions ($P2$ vs $P21$, $C2$ vs $Cc$) are cleanly pruned or resolved.
   - Multiset duplicate handling, exact rational reductions, and order invariance operate with 100% fidelity.
   - Origin shift equivalence is proven and operational for the specific ITA Volume A shift of Group 19.
2. **What remains open / unproved for the general case:**
   - Universal soundness over arbitrary infinite input sets (requires formal proof beyond finite test suites).
   - Arbitrary continuous origin shifts (requires non-linear integer programming or exhaustive rational grid search).
   - General change-of-basis isomorphism ($GL_3(\mathbb{Z})$ Delaunay/Gruber lattice reduction).
   - In-flight algebraic group closure calculation for sparse generator sets.
   - Expansion of the catalog from 8 to 230 space groups.
