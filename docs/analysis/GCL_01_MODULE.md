# GCL-01 Module Passport & Verification Summary

**Document:** `docs/analysis/GCL_01_MODULE.md`  
**Module:** `core/group_closure.ts`  
**Test Suite:** `core/group_closure.test.ts`  
**Status:** `ISOLATED_MODULE_TESTED`  
**Date:** 2026-10-12  

---

## 1. Scope & Purpose (CODE_CONFIRMED)
`core/group_closure.ts` provides deterministic finite-subgroup closure from crystallographic affine generators modulo the integer lattice $\mathbb{Z}^3$. It is an isolated core library module.

It reuses project primitives:
- `ExactRational` (with `mod1()`) for fractional translations;
- `AffineOperationAlgebra.applyMatrixToVector` for $W \cdot w$;
- `canonicalOperationKey` for canonical identity and deduplication.

---

## 2. Public API & Result Contract (CODE_CONFIRMED)
- `closeGroupFromGenerators(generators: ExchangeSymmetryOperation[], options?: GroupClosureOptions): GroupClosureResult`
- `isOperationSetClosed(ops: ExchangeSymmetryOperation[]): boolean`
- `resultHasAllInverses(ops: ExchangeSymmetryOperation[]): boolean`

### Return Statuses:
- `CLOSED`: BFS worklist exhausted within `maxSize`, and every resulting element has a verified two-sided inverse in the set.
- `LIMIT_EXCEEDED`: Distinct element count exceeded `maxSize`. Partial set is discarded (`operations: []`, `order: 0`). Never reported as `CLOSED`.
- `INVALID_INPUT`: Inputs violate safe integer bounds, $\det(W) \notin \{1, -1\}$, rational format is invalid, intermediate arithmetic overflowed safe integers, or an element lacks a two-sided inverse.

---

## 3. Mathematical Logic & Guardrails (CODE_CONFIRMED)
1. **$GL(3,\mathbb{Z})$ Constraint:** Input generators require $\det(W) = \pm 1$ evaluated on $BigInt$.
2. **Exact Arithmetic:** Matrix multiplication and inversion (adjugate / $\det$) use $BigInt$. Intermediate products do not depend on JavaScript floating-point numbers.
3. **Overflow Protection:** Entries converted to JavaScript numbers via `bigMatrixToSafeNumbers` verify `Number.isSafeInteger`. On overflow, an error is caught and `INVALID_INPUT` is returned.
4. **Group Axiom Verification:** Two-sided inverses are verified explicitly for every element before returning `CLOSED`.
5. **No A Priori Finiteness Claim:** The module does not prove group finiteness algebraically; `CLOSED` indicates termination of BFS within the specified resource bound.

---

## 4. Test Suite Coverage T1–T15

| Test | Assertion (CODE_CONFIRMED) | Execution Result (TEST_REPORT_ONLY) |
| :--- | :--- | :---: |
| T1 | Empty generators $\to$ $\{e\}$ (`CLOSED`, order 1) | PASS |
| T2 | Identity generator $\to$ order 1 | PASS |
| T3 | Inversion $P\,\bar{1} \to$ order 2, closed | PASS |
| T4 | Screw axis $P\,2_1 \to$ order 2 $\pmod{\mathbb{Z}^3}$ | PASS |
| T5 | $P\,2_12_12_1$ two generators $\to$ order 4, generates third screw | PASS |
| T6 | Multiset duplicates $\to$ deduplicated, order 4 | PASS |
| T7 | Lattice translation $(1,0,0) \equiv e \pmod{\mathbb{Z}^3}$ | PASS |
| T8 | Resource limit `maxSize=1` $\to$ `LIMIT_EXCEEDED`, empty operations | PASS |
| T9 | Malformed generator $\to$ `INVALID_INPUT` | PASS |
| T10 | Pairwise closure of mixed generators | PASS |
| T11 | Singular matrix $\det(W)=0 \to$ `INVALID_INPUT` | PASS |
| T12 | $|\det(W)|=2 \notin GL(3,\mathbb{Z}) \to$ `INVALID_INPUT` | PASS |
| T13 | Inverses present for all operations in `CLOSED` | PASS |
| T14 | Infinite linear group growth $\to$ `LIMIT_EXCEEDED` or `INVALID_INPUT`, never `CLOSED` | PASS |
| T15 | Large-entry singular matrix with exact $BigInt$ determinant $\to$ `INVALID_INPUT` | PASS |

---

## 5. Architectural Boundaries & Non-Claims

1. **Unwired Module:** `core/group_closure.ts` is **not** called by `classifyOperationSet` in `core/operation_set_match.ts`.
2. **No API / UI Wiring:** Not exposed to `server.ts` or `App.tsx`.
3. **Classifier Boundaries Unchanged:** Classifier catalog remains strictly 8 settings (`REGISTERED_SETTING_IDS`).
4. **Registry Independence:** Space group 76 ($P\,4_1$) remains in `core/registry.ts`, not in the classifier.
5. **Baseline Comparison Status:** Proof of file invariance against original external repository baseline is `NOT_CONFIRMED` (historical baseline checksum comparison was not performed).
