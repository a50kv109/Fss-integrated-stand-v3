# FSS — CROSS-PROJECT COMPARISON AUDIT
**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `CROSS_PROJECT_COMPARISON.md`  
**Phase:** 3 — Cross-Project Audit and Assimilation Planning  
**Mode:** READ-ONLY EVIDENCE-BASED ANALYSIS  
**Audit Target:** Studio FSS Remix vs. External GROK v0.1.1 Archive  
**Date:** 2026-10-11  

---

## 1. Registry Fingerprint Audit & Discrepancy Resolution

### The Question
- Studio is reported to contain **8 registry settings**.
- GROK is reported to contain **4 registry settings**.
- The string `6e426d1d18130de3` was cited in the GROK release documentation. How was it calculated, and does it apply to Studio?

### The Source Evidence
1. **GROK Registry Fingerprint Origin**:
   - `6e426d1d18130de3` is an 8-byte / 16-hex-character checksum produced by GROK's release integrity verification script (`docs/RELEASE_INTEGRITY_v0.1.1.md`).
   - It was computed exclusively over GROK's 4 benchmark settings (`P1`, `P-1`, `P21/c`, `P212121`).
2. **Studio Registry Hashing**:
   - Studio uses a canonical SHA-256 calculation implemented in `core/reference_loader.ts` (`ReferenceArtifactLoader.computeCanonicalSha256`), which canonicalizes key order and serializes JSON.
   - For Studio's 8 benchmark settings (`data/crystallography/gemmi_benchmark_4.json`), the verified canonical SHA-256 is:
     `f1ee084b36c8fb658a62de117347a1a414b723709de8f60d0abc8e14ee4eec36` (16-char prefix: `f1ee084b36c8fb65`).
   - For the 4 original legacy benchmark settings, the canonical SHA-256 is:
     `478cb1c0578437cb34c9f656b8d38e8c2ce705ba4e7a929defc24d40ab0e210c` (16-char prefix: `478cb1c0578437cb`).
3. **Verdict**:
   - **THE FINGERPRINTS ARE INCOMPARABLE.**
   - `6e426d1d18130de3` does **NOT** apply to Studio's 8-group registry.
   - Studio's registry was expanded in milestone Stage A to 8 settings (adding monoclinic groups `P2`, `P21`, `C2`, and `Cc`).
   - GROK's registry remained at 4 settings.
   - A matching fingerprint cannot be claimed between the two registries.

---

## 2. Source-Level Comparison by Module

### A. Candidate Profiler & Matcher (`core/operation_set_profile.ts`, `core/operation_set_match.ts`)
- **Studio Baseline**: Studio has no standalone operation-set profiler. It computes isolated properties in `core/group_properties.ts` (orders, traces, determinants, inversion midpoint), but does not aggregate them into a signature for registry candidate pruning.
- **GROK Implementation**: Implements `OperationSetProfile` extracting distinct operation counts $N_{\text{distinct}}$, orders histogram $\{1, 2, 3, 4, 6\}$, centrosymmetry presence, and proper/improper rotation counts. Implements `filterCandidates` with zero false negatives and `matchStrict`.
- **Verdict**: **GROK IS NOVEL AND VALUABLE**. Must be imported and integrated.

### B. Polyhedral Engine (`core/engine.ts`)
- **Studio Baseline**: Full deterministic 3D polyhedral verification engine (`runSymmetryExperiment`). Includes Chebyshev isometry evaluation, augmenting-path bipartite maximum matching, and canonical undirected edge graph verification ($\pi(E) \subseteq E$, `validateStructureIntegrity` for self-loop and duplicate ID rejection from M-5F).
- **GROK Implementation**: Identical baseline engine, but lacks the latest edge-topology structural integrity hardening.
- **Verdict**: **PRESERVE STUDIO BASELINE**. Do not overwrite with GROK.

### C. Affine Dimensionality Analyzer (`core/dimension.ts`)
- **Studio Baseline**: Barycentric normalization, greedy coincidence clustering, analytical covariance tensor eigenvalues via trigonometric roots, condition status (`WELL_CONDITIONED`, `ILL_CONDITIONED`, `DEGENERATE`), and robust planar/spatial anchor frame construction. Tested with 64/64 passing unit tests.
- **GROK Implementation**: Same baseline, identical algorithms.
- **Verdict**: **PRESERVE STUDIO BASELINE**. Fully tested and stable.

### D. Working Registry (`core/registry.ts`)
- **Studio Baseline**: 8 space group settings (`P1`, `P-1`, `P2`, `P21`, `C2`, `Cc`, `P21/c`, `P212121`), including C-centered monoclinic settings reconciled in Stage A.
- **GROK Implementation**: 4 space group settings (`P1`, `P-1`, `P21/c`, `P212121`).
- **Verdict**: **PRESERVE STUDIO'S 8-GROUP REGISTRY**. Adapt GROK's candidate filter to query Studio's 8 settings.

### E. Exact Rational Arithmetic (`core/schema/crystallographic_exchange.ts`)
- **Studio Baseline**: `ExactRational` backed by `bigint` with safe integer bounds checking (`Number.isSafeInteger`), Euclidean BigInt GCD, `mod1()`, and independent 3-layer validation (Structural, Group Axioms with two-sided inverses, Provenance). Audited in KB-10A.
- **GROK Implementation**: Based on the same exchange contract schema.
- **Verdict**: **PRESERVE STUDIO BASELINE**.

### F. Derived Properties & Origin Shift (`core/group_properties.ts`, `core/reference_loader.ts`)
- **Studio Baseline**:
  - `AffineOperationAlgebra`: Exact 3x3 operations, unreduced affine composition $(W_1 W_2, W_1 w_2 + w_1)$.
  - `CrystallographicGroupProperties`: Inversion midpoint $x_0 = \frac{1}{2} w \pmod 1$, unreduced translation sums $t_{\text{unreduced}}$, intrinsic translation vector $\tau = \frac{1}{k} t_{\text{unreduced}}$.
  - `OriginShiftAnalyzer`: Proves exact equivalence for Group 19 under $x_0 = (1/4, 1/4, 1/4)$.
- **GROK Implementation**: Similar baseline; however, GROK authored `docs/FSS_v0.2_RESEARCH_DESIGN.md` calling for these exact features (C1, C3, C4) as future v0.2 targets!
- **Verdict**: **STUDIO HAS ALREADY IMPLEMENTED GROK's v0.2 SPECIFICATION**.

---

## 3. Filter Soundness Verification on Studio's 8 Settings

The candidate filtering contract was executed live against all 8 settings in Studio's working catalog:

```
Setting: P1       Distinct: 1   Inversion: false   Proper/Improper: 1/0   Candidates: ['P1']
Setting: P-1      Distinct: 2   Inversion: true    Proper/Improper: 1/1   Candidates: ['P-1']
Setting: P2       Distinct: 2   Inversion: false   Proper/Improper: 2/0   Candidates: ['P2', 'P21']
Setting: P21      Distinct: 2   Inversion: false   Proper/Improper: 2/0   Candidates: ['P2', 'P21']
Setting: C2       Distinct: 4   Inversion: false   Proper/Improper: 4/0   Candidates: ['C2']
Setting: Cc       Distinct: 4   Inversion: false   Proper/Improper: 2/2   Candidates: ['Cc']
Setting: P21/c    Distinct: 4   Inversion: true    Proper/Improper: 2/2   Candidates: ['P21/c']
Setting: P212121  Distinct: 4   Inversion: false   Proper/Improper: 4/0   Candidates: ['P212121']
```

### Critical Verification Results
1. **Zero False Negatives**: Every space group setting is included in its own candidate list. Soundness is 100%.
2. **Clean Monoclinic Separation (`C2` vs `Cc`)**:
   - `C2`: 4 proper rotations ($\det = +1$). Candidate: `['C2']`.
   - `Cc`: 2 proper rotations, 2 reflections ($\det = -1$). Candidate: `['Cc']`.
   - The filter cleanly separates `C2` from `Cc` without false matches.
3. **Linear Degeneracy Handling (`P2` vs `P21`)**:
   - Both have identical linear part profiles ($N=2$, $\det = +1$). The candidate filter correctly retains BOTH `['P2', 'P21']`, deferring the exact translation comparison to Stage 2 (`matchStrict`), where $w=0$ vs $w_y=1/2$ resolves them cleanly.
4. **Multiset Duplicate Resilience (Criterion C2)**:
   - A query with 2 duplicate identity operations is correctly identified as $N_{\text{distinct}} = 1$, matching `P1` rather than collapsing or matching 2-operation groups.
