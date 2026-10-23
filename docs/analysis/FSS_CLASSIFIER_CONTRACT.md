# FSS — CLASSIFIER NORMATIVE CONTRACT (EXP-09)

**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `FSS_CLASSIFIER_CONTRACT.md`  
**Classification:** Level 1 Normative Specification  
**Status:** CANONICAL & ACTIVE  
**Last Updated:** 2026-10-11 (Phase 4E Documentation Reconciliation)

---

## 1. Purpose and Epistemic Scope Boundaries

The FSS Space-Group Classifier (`core/operation_set_match.ts`) is an **in-memory representation matcher** designed to evaluate whether a supplied collection of 3D affine symmetry operations matches the canonical representations registered in FSS's internal symmetry catalog.

### Fundamental Boundaries:
1. **Catalog Bound (8 of 230):**  
   The current working catalog (`core/registry.ts`) contains exactly **8 space group settings** (Nos. 1, 2, 3, 4, 5, 9, 14, 19). It is **not** an exhaustive classifier of the 230 Fedorov space groups.
2. **Representation Equality $\neq$ Abstract Isomorphism:**  
   Matching an operation set against a catalog record proves identity of the **specific coordinate representation** in a fixed crystallographic basis modulo unit cell translations $\mathbb{Z}^3$. It does **not** prove general affine group isomorphism under arbitrary changes of basis $P \in GL_3(\mathbb{Z})$ or continuous origin shifts $x_0 \in \mathbb{R}^3$.
3. **Candidate Filtering $\neq$ Group Identification:**  
   The candidate filter prunes incompatible space-group candidates using necessary algebraic invariants. Passing the filter is a necessary condition, **never** a sufficient proof that the operations form or belong to that group.
4. **No Implicit Claims in UI or API:**  
   The classifier must never emit unproven or generalized space-group assertions. Every diagnostic statement must strictly reflect the verified evidence tier.

---

## 2. Two-Stage Classification Architecture

The classification pipeline consists of two decoupled mathematical stages:

```
+-----------------------------------------------------------------------------------------+
|                                    INPUT MULTISET                                       |
|                  Array of Symmetry Operations: { W: 3x3, w: 3x Rational }                |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
| STAGE 1: INVARIANT PROFILE FILTER (filterCandidates)                                   |
| - Computes coordinate-independent invariant profile:                                    |
|   * distinctCount (modulo lattice translations Z^3)                                     |
|   * hasInversion (W = -I_3)                                                             |
|   * orderHistogram (orders in {1, 2, 3, 4, 6})                                          |
|   * properRotationsCount (det W = +1), improperRotationsCount (det W = -1)              |
|   * traceHistogram (tr(W))                                                              |
|   * translationsSummary (zero vs fractional translation count)                          |
| - Pruning Rule:                                                                         |
|   Eliminates catalog settings whose invariant profiles differ from query profile.       |
| - Mathematical Status:                                                                  |
|   NECESSARY INVARIANT ONLY. Passing does NOT imply sufficient isomorphism.              |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             v (Retained Candidates)
+-----------------------------------------------------------------------------------------+
| STAGE 2: STRICT CANONICAL MATCHER (matchStrict)                                         |
| - Generates canonical keys: JSON(W) | [w_x mod 1, w_y mod 1, w_z mod 1]                 |
| - Evaluates bijective set equality: queryKeySet == targetKeySet                          |
| - Distinguishes Set equality from Multiset equality (duplicate tracking)                |
| - Origin-Shift Fallback:                                                                |
|   If exact keys differ, evaluates exact rational shift x_0 = (1/4, 1/4, 1/4)            |
|   for Group 19 (P212121).                                                               |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
| EVIDENCE-BACKED REPORT (TwoStageMatchReport)                                            |
| Emits exact verdict: EXACT_MATCH | SETTING_MISMATCH | OPERATION_MISMATCH |               |
|                      AMBIGUOUS | NO_CANDIDATES | INVALID_INPUT                          |
+--------------------------------------------+--------------------------------------------+
```

### Distinction of Mathematical Concepts:
* **Necessary Invariant:** A property that must match if two groups are isomorphic (e.g. matrix trace spectrum, inversion presence). If it differs, groups are definitely distinct.
* **Sufficient Condition:** A condition that guarantees group identity. Profile matching is **not** sufficient.
* **Canonical Representation Match:** Point-by-point equality of all operations in the canonical basis of ITA Volume A.
* **Mathematical Origin Equivalence:** Equivalence under an explicit coordinate translation $x' = x - x_0$.
* **Affine Isomorphism:** Equivalence under general affine transformations $(P, p) \in \text{Aff}(3, \mathbb{R})$. FSS **does not** perform general affine isomorphism searches.

---

## 3. Normative Definition of Verdicts (`StrictMatchVerdict`)

All verdicts returned by `classifyOperationSet` have strict mathematical interpretations:

| Verdict | Precondition in Code | Permitted Conclusion | Prohibited Conclusion | Known Limitations |
|:---|:---|:---|:---|:---|
| `EXACT_MATCH` | Retained candidates has exactly 1 entry with `isExactSetMatch === true`. | The input operations identically match the canonical generator/operation set of setting `settingId` in the catalog modulo $\mathbb{Z}^3$. | **Prohibited:** Claiming that this proves the input represents the space group in any other basis or that unsupplied operations exist. | Does not verify group closure of external inputs unless the input matches the catalog setting's complete operation list. |
| `SETTING_MISMATCH` | `isExactSetMatch === false`, but `isOriginShiftEquivalent === true` under proven shift vector $x_0 = (1/4, 1/4, 1/4)$. | The input operations are mathematically equivalent to setting `settingId` under the specific verified origin shift $x_0$. | **Prohibited:** Claiming the operations match standard ITA setting origin or that arbitrary origin shifts are supported. | Currently implemented exclusively for Group 19 standard shift $x_0 = (1/4, 1/4, 1/4)$. Continuous or arbitrary shifts not searched. |
| `OPERATION_MISMATCH` | Candidate profile matched one or more catalog settings, but `isExactSetMatch === false` and no verified origin shift matched. | The input shares necessary invariant profile features with retained candidates, but its specific matrices or translations differ from their registered canonical forms. | **Prohibited:** Concluding the operations do not belong to that space group family under some untested basis or shift. | Indicates setting/orientation/translation divergence, not topological or group incompatibility. |
| `AMBIGUOUS` | More than 1 candidate in the catalog achieves `isExactSetMatch === true`. | The input operations simultaneously match multiple registered catalog records (e.g. duplicate catalog entries or identical sub-settings). | **Prohibited:** Arbitrarily choosing one setting over another without distinguishing evidence. | Does not occur in standard 8-setting catalog because all 8 settings have mutually distinct canonical sets. |
| `NO_CANDIDATES` | `candidateFilter.candidates.length === 0` (all catalog records pruned) or input is empty. | None of the 8 registered settings in the current FSS catalog match the invariant profile of the input. | **Prohibited:** Stating that the input is "not a space group". It may be one of the other 222 space groups not in the catalog. | Strictly bounded by the 8-setting catalog size. |
| `INVALID_INPUT` | Syntax violation (non-array, non-3x3, missing rows) or zero denominator in rational translation. | The input data structure violates the crystallographic exchange schema or contains invalid rational numbers. | **Prohibited:** Interpreting syntactic failures as crystallographic properties. | Rejects malformed structures immediately before algebraic computation. |

---

## 4. Mathematical and Computational Boundaries

### A. Rational Arithmetic & Exact Representation
* Translations $w$ must be represented using `Rational { numerator, denominator }` and evaluated via `ExactRational` backed by `BigInt` arithmetic.
* Floating-point coordinates (`0.333333`) are forbidden in internal keys to prevent rounding drift.
* Reductions use Euclidean GCD: $\gcd(a, b)$. Denominators must be non-zero integers.

### B. Translation Normalization Modulo Unit Cell ($\mathbb{Z}^3$)
* Fractional translations $w$ are normalized via `.mod1()`:
  $$w_i' = \left(\frac{n}{d} \pmod 1\right) = \frac{n \bmod d + d}{d} \pmod 1 \in [0, 1)$$
* A translation of $5/2$ normalizes to $1/2$; a translation of $-1/4$ normalizes to $3/4$.
* Operations differing only by integer lattice vectors $\vec{t} \in \mathbb{Z}^3$ produce identical canonical keys.

### C. Sets vs. Multisets (Duplicate Operations)
* An input array is an ordered **multiset**.
* `buildOperationSetProfile` computes both `totalCount` and `distinctCount`.
* If `totalCount > distinctCount`, the multiset has duplicates (`hasDuplicates = true`).
* `matchStrict` verifies distinct set equality (`isExactSetMatch`) and multiset equality (`isExactMultisetMatch`). Duplicate operations are explicitly documented in `report.notes` and do not cause silent data corruption.

### D. Origin Shift Transformations
* Under an origin shift $x' = x - x_0$, an affine symmetry operation $(W, w)$ transforms as:
  $$W' = W, \quad w' = w + (W - I) x_0 \pmod 1$$
* Pure translations ($W = I$) are invariant under origin shifts since $(I - I) x_0 = 0$.
* For non-identity operations, $w'$ depends directly on $x_0$.
* **Current Implementation Scope:** FSS tests the specific ITA Volume A standard shift $x_0 = (1/4, 1/4, 1/4)$ for Space Group 19 ($P2_12_12_1$). General continuous shift optimization is **not implemented**.

### E. Basis Transformations ($GL_3(\mathbb{Z})$)
* Change of crystal axis basis $x' = P x$ transforms operations as $(P W P^{-1}, P w)$.
* While matrix trace $\operatorname{tr}(W)$, determinant $\det(W)$, and matrix order $k$ are invariant under similarity transforms, the matrix entries $W_{ij}$ and translation coordinates $w$ change.
* FSS **does not** perform change-of-basis searches. Operations must be expressed in the conventional coordinate system of the registered setting.

### F. Group Closure and Generator Completeness
* `classifyOperationSet` tests whether the supplied operations match the **complete list of canonical operations** of a registered setting.
* If a user supplies only a set of independent **generators** (e.g. 2 generators for a group of order 4), `matchStrict` will find missing operations and return `OPERATION_MISMATCH`.
* `classifyOperationSet` does **not** dynamically compute the algebraic group closure $\langle S \rangle$ of an arbitrary input.
* Independent closure verification exists in `core/schema/crystallographic_exchange.ts` (`validateMathematicalGroup`), but is not invoked in the fast classifier path.

### G. Catalog Scope Boundary
* Current catalog: 8 settings (`P1`, `P-1`, `P2`, `P21`, `C2`, `Cc`, `P21/c`, `P212121`).
* Any operation set belonging to one of the remaining 222 space groups will receive `NO_CANDIDATES`. This is an expected catalog limitation, not an algorithmic defect.

---

## 5. Epistemic Rules for System Outputs

Developers, API consumers, and UI renderers must adhere to the following strict epistemic rules:

1. **Rule 1 (No Unverified Generalization):**  
   Never present `EXACT_MATCH` as "Proven Space Group $X$ in all systems". Present it as *"Matches canonical setting $X$ in catalog"*.
2. **Rule 2 (No Conflation of Profiles):**  
   Never claim that matching the Invariant Profile identifies a space group. Always require Stage 2 canonical key verification.
3. **Rule 3 (No False Extrapolation of Soundness):**  
   Empirical passing of tests T1–T10 and S1–S16 proves soundness over the tested catalog and synthetic scenarios. It must not be cited as mathematical proof of soundness over arbitrary non-crystallographic or infinite input domains.
4. **Rule 4 (Explicit Bounded Reporting):**  
   If an input receives `NO_CANDIDATES`, the UI must state: *"No matching setting found in the 8 registered catalog groups"*, rather than *"Invalid space group"*.
5. **Rule 5 (Isolation of UI/API):**  
   Neither `server.ts` nor the React UI shall expose candidate matching until an explicit, human-audited API contract is approved.
