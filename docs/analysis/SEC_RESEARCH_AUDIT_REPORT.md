# FSS Grok 2 — SEC Audit Closure & Refined Specification

**Date:** October 22, 2026  
**Status:** Post-Audit Closure & Architectural Refinement (Pre-Implementation Phase)  
**Target Object:** Fedorov Symmetry Reasoning Stand (FSS) Core & Symmetry Evidence Chain (SEC)  

---

## 1. SG 227 ($Fd\bar{3}m$) Origin & Audit Findings

### Findings from Codebase Inspection
- Inspection of `/data/crystallography/gemmi_benchmark_4.json` and registry files reveals crystallographic metadata and benchmarks, but **does not contain an explicit, fully audited programmatic closure of all 192 affine operations** derived from raw ITCr (International Tables for Crystallography) generators for space group 227 in both origin settings (origin choice 1 vs origin choice 2).
- The previously reported "192 operations via $48 \times 4$" is an expected mathematical cardinality for $Fd\bar{3}m$ in standard setting, but **cardinality does not equal structural proof**. Without tracing the exact matrix generators $W_i$, translation vectors $w_i$ (including F-центрирование $(0, 1/2, 1/2)$, $(1/2, 0, 1/2)$, $(1/2, 1/2, 0)$), and coordinate reduction modulo $\mathbb{Z}^3$, relying on SG 227 as a reference verification object introduces an unverified assumption ("Producer claim = Receiver truth").

### Identified Gaps
1. **Explicit generator pipeline:** Missing an immutable, version-controlled serialization of raw generators for SG 227.
2. **Setting ambiguity:** Origin choice 1 ($m\bar{3}m$ at origin $-3m$) vs origin choice 2 ($m\bar{3}m$ at origin $3\bar{3}m$) shifts translation vectors by $(1/8, 1/8, 1/8)$, which directly affects Wyckoff position coordinates (such as position 8a).
3. **Automatic closure validation:** Lack of an automated algebraic closure test that verifies $(W_i, w_i) \circ (W_j, w_j) \equiv (W_k, w_k) \pmod{\mathbb{Z}^3}$ across all 192 elements without gaps or duplicates.

**Conclusion:** SG 227 is deferred as a primary PoC reference until its full generator pipeline is audited. For the first SEC PoC, we must use a rigorously defined, fully inspected reference set (such as the canonical tetrahedron symmetry operations or group $O_h$).

---

## 2. Refined SEC Contract (Evidence-First Architecture)

To resolve Problem № 2 (preventing boolean flags like `isClosedUnderComposition: true` from acting as unverified assertions), the SEC contract separates **inputs**, **independent check executions**, **status results**, and **evidence references**.

```ts
export type CheckStatus = 'PASS' | 'FAIL' | 'NOT_RUN';

export interface EvidenceCheckResult {
  checkId: string;
  description: string;
  status: CheckStatus;
  inputDigest: string;
  computedDetails?: string;
  evidenceRef?: string;
  errorMessage?: string;
}

export interface ExactArithmeticMetadata {
  isExact: boolean;
  arithmeticBackend: 'EXACT_RATIONAL' | 'BIGINT' | 'IEEE_754_FLOAT';
  toleranceEpsilon?: number; // Used only if isExact is false
}

export interface SymmetryEvidenceChainReport {
  schemaVersion: string;
  timestamp: string;
  source: {
    sourceId: string;
    commitHash?: string;
    crystallographicSetting?: string;
    sourceChecksum: string;
  };
  arithmetic: ExactArithmeticMetadata;
  checks: {
    identityValidation: EvidenceCheckResult;
    inverseValidation: EvidenceCheckResult;
    closureValidation: EvidenceCheckResult;
    duplicateCheck: EvidenceCheckResult;
    groupActionValidation: EvidenceCheckResult;
    orbitStabilizerConsistency: EvidenceCheckResult;
  };
  finalVerdict: 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
}
```

### Key Design Rules:
1. **No blind assertions:** Fields cannot simply be set to `true`. Every check (identity, inverse, closure, duplicate, orbit-stabilizer) is executed by a pure verification function that returns `PASS`, `FAIL`, or `NOT_RUN` accompanied by an input digest.
2. **Arithmetic separation:** `ExactRational` checks operate with `isExact: true` and no numerical tolerance ($\epsilon$). Numerical approximations (such as floating-point rotation matrices) explicitly declare `isExact: false` and specify `toleranceEpsilon`.

---

## 3. Verification Independence Protocol

To address Problem № 3 (avoiding shared-error collusion between producer and verifier), SEC defines four distinct verification tiers:

| Tier | Name | Mechanism | What It Catches | Shared Failure Mode / Limitation |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | Rerun Verification | Same algorithm executed twice on identical input data. | Transient execution faults, memory corruption. | Vulnerable to bugs present in the algorithm itself. |
| **Tier 2** | Alternative Algorithm | Independent code implementation computing the same invariant via a different mathematical path (e.g., verifying group closure via multiplication table vs direct Cayley graph traversal). | Implementation bugs, language-specific numeric pitfalls. | Vulnerable if both algorithms share the same logical misunderstanding of the mathematical spec. |
| **Tier 3** | Independent Source | Comparing computed group operations and Wyckoff orbits against an external authoritative standard (e.g., ITCr tables or benchmark files). | Upstream transcription errors, bad generator data. | Vulnerable to upstream errors in the reference source itself. |
| **Tier 4** | Independent Math Check | Verifying structural invariants that do not depend on the generation path (e.g., verifying $|\operatorname{Orb}(x)| \cdot |G_x| = |G|$ and Reynolds operator idempotency $P^2 = P$). | Internal logical inconsistency in group action. | Does not verify whether the group matches the physical space group intended by the user. |

---

## 4. Minimal PoC Specification (Using Verified $O_h$ / Tetrahedron Base)

Since SG 227 generator provenance is deferred, the first PoC will be implemented and tested using **canonical tetrahedron symmetry operations** and **point group $O_h$ (48 operations)**, which are fully defined and tested in the existing FSS codebase.

### PoC Specification:
- **Input Contract:** Array of affine operations $(W, w)$ representing the group $O_h$ or tetrahedron symmetry group.
- **Mathematical Preconditions:** 
  1. Matrix dimensions must be $3 \times 3$ (or $4 \times 4$ affine).
  2. For exact rational checks, matrix entries must be rational numbers.
- **Mandatory Checks:**
  1. **Identity check:** Existence of $(I, 0)$ in the set.
  2. **Inverse check:** For every $g$, existence of $g^{-1}$ such that $g \circ g^{-1} = (I, 0)$.
  3. **Closure check:** For all $g_i, g_j$, $g_i \circ g_j \in G$.
  4. **Orbit-Stabilizer check:** $|\operatorname{Orb}(x_0)| \cdot |G_{x_0}| = |G|$.
- **Negative Tests (Error Injection):**
  - *Test A (Mutated Operation):* Inject a perturbed rotation matrix where determinant $\neq \pm 1$ or orthogonality condition fails. **Expected Result:** `closureValidation` or `groupActionValidation` returns `FAIL`, and final verdict is `REJECTED`.
  - *Test B (Broken Inverse):* Remove an inverse element from the generator closure. **Expected Result:** `inverseValidation` returns `FAIL`, and final verdict is `REJECTED`.
  - *Test C (Incorrect Orbit-Stabilizer Product):* Simulate an incomplete orbit calculation. **Expected Result:** `orbitStabilizerConsistency` returns `FAIL`, and final verdict is `REJECTED`.

---

## 5. Audit Summary Table

| Claim | Evidence | Status | Remaining Gap / Action |
| :--- | :--- | :--- | :--- |
| **1. Data Provenance & Source ID** | Files, commits, and setting identifiers can be hashed into a source digest. | **Verified** | Standardize source digest generation format across all imports. |
| **2. Exact Rational Arithmetic** | `ExactRational` and `bigint` modules successfully eliminate IEEE 754 drift in rational tests. | **Verified** | Ensure all future spatial group tests adopt exact arithmetic where applicable. |
| **3. SG 227 ($Fd\bar{3}m$) 192 Operations** | Cardinality $48 \times 4 = 192$ is mathematically standard, but programmatic closure from raw ITCr generators is unverified in repo. | **Deferred** | Defer SG 227 as PoC reference until raw generator closure pipeline is fully audited and tested. |
| **4. SEC Evidence-First Contract** | Replaced boolean flags with explicit check result structs (`PASS`, `FAIL`, `NOT_RUN`) and input digests. | **Designed** | Ready for implementation in `core/sec.ts` after final sign-off. |
| **5. Independent Verification Tiers** | Defined 4 tiers of verification to mitigate shared-error collusion between producer and verifier. | **Designed** | Incorporate Tier 4 (Orbit-Stabilizer invariant check) into the primary PoC runner. |
| **6. Negative Test Suite** | Designed error-injection tests (mutated matrix, missing inverse) to prove the SEC can catch invalid data. | **Designed** | Implement negative test cases alongside the PoC runner. |

---
*End of Audit Closure.*
