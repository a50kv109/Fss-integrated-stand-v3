# FSS Integrated Research Stand — Classifier Normative Contract

**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `docs/CLASSIFIER_CONTRACT.md`  
**Classification:** Canonical Normative Contract (EXP-09)  
**Status:** Active Normative Specification  
**Last Updated:** 2026-10-11  

---

## 1. Scope & Foundational Boundaries

The FSS Space-Group Classifier (`core/operation_set_match.ts`) is an **in-memory representation matcher** designed to evaluate whether a collection of 3D affine symmetry operations matches the canonical representations registered in FSS's internal symmetry catalog.

### Fundamental Boundaries:
1. **Catalog Bound (8 of 230):**  
   The current working catalog (`core/registry.ts`) contains exactly **8 space group settings** (Nos. 1, 2, 3, 4, 5, 9, 14, 19). It is **not** an exhaustive classifier of all 230 Fedorov space groups.
2. **Representation Equality $\neq$ Abstract Isomorphism:**  
   Matching an operation set against a catalog record proves identity of the **specific coordinate representation** in a fixed crystallographic basis modulo unit cell translations $\mathbb{Z}^3$. It does **not** prove general affine group isomorphism under arbitrary changes of basis $P \in GL_3(\mathbb{Z})$ or continuous origin shifts $\vec{x}_0 \in \mathbb{R}^3$.
3. **Candidate Filtering $\neq$ Group Identification:**  
   The candidate filter prunes incompatible space-group candidates using necessary algebraic invariants. Passing the filter is a necessary condition, **never** a sufficient proof that the operations form or belong to that group.
4. **No Implicit Claims in UI or API:**  
   The classifier must never emit unproven or generalized space-group assertions. Every diagnostic statement must strictly reflect the verified evidence tier.

---

## 2. Verdicts & Decision Rules (`StrictMatchVerdict`)

The classification engine returns exactly one of six normative verdicts:

| Verdict | Trigger Condition in Code | Permitted Conclusion | Prohibited Conclusion | Known Limitations |
|:---|:---|:---|:---|:---|
| `EXACT_MATCH` | Exactly 1 catalog candidate achieves `isExactSetMatch === true`. | The input operations identically match the canonical generator/operation set of setting `settingId` in the catalog modulo $\mathbb{Z}^3$. | **Prohibited:** Claiming that this proves the input represents the space group in any other basis or that unsupplied operations exist. | Does not verify group closure of external inputs unless the input matches the catalog setting's complete operation list. |
| `SETTING_MISMATCH` | `isExactSetMatch === false`, but `isOriginShiftEquivalent === true` under proven shift vector $\vec{x}_0 = (1/4, 1/4, 1/4)$. | The input operations are mathematically equivalent to setting `settingId` under the specific verified origin shift $\vec{x}_0$. | **Prohibited:** Claiming the operations match standard ITA setting origin or that arbitrary origin shifts are supported. | Currently implemented exclusively for Group 19 standard shift $\vec{x}_0 = (1/4, 1/4, 1/4)$. Continuous or arbitrary shifts not searched. |
| `OPERATION_MISMATCH` | Candidate profile matched one or more catalog settings, but `isExactSetMatch === false` and no verified origin shift matched. | The input shares necessary invariant profile features with retained candidates, but its specific matrices or translations differ from their registered canonical forms. | **Prohibited:** Concluding the operations do not belong to that space group family under some untested basis or shift. | Indicates setting/orientation/translation divergence, not topological or group incompatibility. |
| `AMBIGUOUS` | More than 1 candidate in the catalog achieves `isExactSetMatch === true`. | The input operations simultaneously match multiple registered catalog records. | **Prohibited:** Arbitrarily choosing one setting over another without distinguishing evidence. | Does not occur in standard 8-setting catalog because all 8 settings have mutually distinct canonical sets. |
| `NO_CANDIDATES` | `candidateFilter.candidates.length === 0` (all catalog records pruned) or input is empty. | None of the 8 registered settings in the current FSS catalog match the invariant profile of the input. | **Prohibited:** Stating that the input is "not a space group". It may be one of the other 222 space groups not in the catalog. | Strictly bounded by the 8-setting catalog size. |
| `INVALID_INPUT` | Syntax violation (non-array, non-3x3, missing rows) or zero denominator in rational translation. | The input data structure violates the crystallographic exchange schema or contains invalid rational numbers. | **Prohibited:** Interpreting syntactic failures as crystallographic properties. | Rejects malformed structures immediately before algebraic computation. |

---

## 3. Mathematical & Computational Constraints

1. **Exact Rational Arithmetic:** All fractional translations must be evaluated via `ExactRational` with BigInt / safe integers and Euclidean GCD reduction. Floating-point coordinates are strictly prohibited in keys.
2. **Translation Normalization Modulo 1:** Translations are reduced to $[0, 1)$ via `.mod1()`. Operations differing only by integer lattice vectors $\vec{t} \in \mathbb{Z}^3$ produce identical canonical keys.
3. **Sets vs. Multisets:** The profiler tracks both `totalCount` and `distinctCount`. Duplicate operations mod 1 are detected, logged in `notes`, and prevent false claims of 1:1 multiset equality.
4. **Group Closure Notice:** `classifyOperationSet` tests completeness against registered settings, not dynamic closure of incomplete generator sets. If an unclosed generator set is provided, the matcher reports `OPERATION_MISMATCH` or `NO_CANDIDATES`.

---

## 4. Epistemic Rules for Developers and UI Designers

* **Rule 1:** Never display "Identified Space Group: X" on a pure profile match.
* **Rule 2:** Never display "Invalid Space Group" when the verdict is `NO_CANDIDATES`. Display "No matching setting found among 8 catalog entries".
* **Rule 3:** Clearly separate distinct set equality (`isExactSetMatch`) from multiset equality (`isExactMultisetMatch`).
* **Rule 4:** Keep the classifier disconnected from `server.ts` and `App.tsx` until full closure verification and expanded catalog support are integrated.

---

## 5. Authoritative References
* Deep Normative Contract: `docs/analysis/FSS_CLASSIFIER_CONTRACT.md`
* Evidence Matrix: `docs/analysis/FSS_CLASSIFIER_EVIDENCE_MATRIX.md`
* Architecture Specification: `docs/analysis/FSS_CLASSIFIER_ARCHITECTURE.md`
