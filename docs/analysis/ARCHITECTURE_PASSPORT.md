# FSS — ARCHITECTURE PASSPORT
**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `ARCHITECTURE_PASSPORT.md`  
**Phase:** 1 — Architecture Discovery and Baseline Documentation  
**Mode:** READ-ONLY ARCHITECTURAL BASELINE  
**Inspection Date:** 2026-10-11  
**Repository SHA / Fingerprint:** `cf3d811ee305fc1c5b24dfac08bd905d1ac0017a`  

---

## 1. Executive Summary & Purpose

The **Fedorov Symmetry Reasoning Stand (FSS)** is a deterministic visual-experimental platform for spatial and crystallographic symmetry reasoning, verification, and provenance tracking. It rejects heuristic approximations, floating-point ambiguity, and unverified generative AI claims, enforcing rigorous mathematical invariants based on exact rational arithmetic and group theory.

### Fundamental System Invariants
1. **Epistemic Separation**: Geometric State $\neq$ Epistemic State; Claim $\neq$ Truth; Construction $\neq$ Verification; Representation $\neq$ Truth.
2. **Determinism**: Identical inputs yield bit-identical verification results across local, agent, and test execution environments.
3. **Exact Arithmetic**: Fractional coordinates and affine translations are computed using `ExactRational` backed by `bigint` with explicit safe-integer checks, preventing 64-bit IEEE-754 precision loss.
4. **Decoupled Verification Layers**: Structural validity, mathematical group consistency (closure, identity, two-sided inverses modulo lattice translations), and source provenance are validated independently.

---

## 2. Source Inventory & Revision Correspondence

### Source A: Current AI Studio Remix Environment
- **Runtime**: Node.js v22.14.0, TypeScript v5.8.2, Bun v1.4.2, Python 3.
- **Tracked Files**: Exactly 71 files in workspace root and subdirectories (`core/`, `components/`, `data/`, `docs/`, `scripts/`, `services/`).
- **Dependencies**: `@google/genai` (^1.34.0), `express` (^5.2.1), `lucide-react` (^0.562.0), `react` (^19.2.3), `react-dom` (^19.2.3), `three` (^0.186.1), `tsx` (^4.23.15).

### Source B: Uploaded Repository ZIP Archive
- **Archive Path**: `Fedorov-symmetry-reasoning-stand-main.zip` (containing root directory `Fedorov-symmetry-reasoning-stand-main/`).
- **Commit SHA**: `cf3d811ee305fc1c5b24dfac08bd905d1ac0017a`.
- **Tracked Files**: Exactly 71 files corresponding 1:1 with Source A.

### Correspondence Verdict: `IDENTICAL_REVISION`
- Files only in Source A: `0`
- Files only in Source B: `0`
- Both sources represent the exact same repository state at commit `cf3d811ee305fc1c5b24dfac08bd905d1ac0017a`.

---

## 3. High-Level Architectural Decomposition

```
+---------------------------------------------------------------------------------------------+
|                                    USER & AGENT CHANNELS                                    |
|   +------------------------------------+          +-------------------------------------+   |
|   |         Human Web UI (React)       |          |        Agent HTTP Tool API          |   |
|   |     (App.tsx + OrbitControls)      |          |    (server.ts: POST /api/experiment)|   |
|   +-----------------+------------------+          +------------------+------------------+   |
+---------------------|------------------------------------------------|----------------------+
                      |                                                |
                      +-----------------------+------------------------+
                                              |
                                              v
+---------------------------------------------------------------------------------------------+
|                                    DETERMINISTIC CORE                                       |
|                                                                                             |
|   1. Canonical Polyhedral Engine (core/engine.ts)                                           |
|      - Isometry Delta Check: ||Q^T Q - I||_max <= eps_orth                                  |
|      - Proper Rotation Check: |det(Q) - 1.0| <= eps_det                                     |
|      - Pushforward Mapping: Q(v_i) -> v_pi(i) via Maximum Bipartite Matching                |
|      - Edge Topology Preservation: pi(E) subseteq E                                         |
|      - Generates immutable Evidence DTO (core/types.ts)                                     |
|                                                                                             |
|   2. Affine Dimensionality Analyzer (core/dimension.ts)                                     |
|      - Barycenter Calculation: c = (1/N) sum(v_i)                                           |
|      - Greedy Coincidence Clustering: eps_coincidence = 1e-6                                |
|      - Covariance Tensor Eigenvalues (Trigonometric analytical roots)                       |
|      - Affine Dimension (0, 1, 2, 3) and Condition Status (WELL, ILL, DEGENERATE)           |
|      - Robust Planar/Spatial Anchor Frame Construction                                      |
+---------------------------------------------------------------------------------------------+
                                              |
                                              v
+---------------------------------------------------------------------------------------------+
|                                 CRYSTALLOGRAPHIC SYSTEM                                     |
|                                                                                             |
|   3. Crystallographic Exchange Contract (core/schema/crystallographic_exchange.ts)         |
|      - ExactRational: BigInt numerator & denominator, GCD reduction, safe integers          |
|      - mod1(): Canonical periodic lattice reduction [0, 1)                                   |
|      - Structural Validation: matrix sizes, positive denominators, group range [1, 230]     |
|      - Mathematical Group Validation: W=I & w=0; two-sided inverses; closure mod 1          |
|      - Provenance Validation: commit SHA, license, attribution, isVerified flag             |
|                                                                                             |
|   4. Reference Loader & Origin Shift Analyzer (core/reference_loader.ts)                    |
|      - ReferenceArtifactLoader: SHA-256 manifest verification, loads Gemmi artifact         |
|      - OriginShiftAnalyzer: w' = (w + (W - I)x_0) mod 1; equivalence prover                 |
|      - CrystallographicComparator: Non-destructive comparison with working catalog          |
|                                                                                             |
|   5. Derived Group Properties & Evidence (core/group_properties.ts, property_evidence.ts)  |
|      - AffineOperationAlgebra: det, trace, matrix orders in {1, 2, 3, 4, 6}                 |
|      - Centrosymmetry & Inversion Center: W = -I => c = (1/2)*w mod 1                       |
|      - Unreduced Translation Sums: t_unreduced = sum_{j=0}^{k-1} W^j w                      |
|      - Intrinsic Translation: tau = (1/k)*t_unreduced (detects screw/glide components)      |
|      - Structured Multi-Level PropertyEvidence reports                                      |
|                                                                                             |
|   6. Working Registry (core/registry.ts)                                                    |
|      - SymmetryCatalog: 8 registered space group settings                                   |
|                                                                                             |
|   7. Mathematical Passports (core/schema/passport_schema.ts, visualization_contract.ts)     |
|      - Declarative YAML passport schema & SG-002 validated test slice                       |
|      - Exact rational coordinate boundary payload for visualization layer                   |
+---------------------------------------------------------------------------------------------+
                                              |
                                              v
+---------------------------------------------------------------------------------------------+
|                                     DATA ARTIFACTS                                          |
|   - Pinned Gemmi Source: data/source/gemmi_symmetry_5cc1c23c.cpp (SHA-256 verified)         |
|   - Extractor Script: scripts/extract_gemmi_data.py                                         |
|   - Exchange Artifact: data/crystallography/gemmi_benchmark_4.json (8 space group records)  |
+---------------------------------------------------------------------------------------------+
```

---

## 4. Module Responsibility Map Summary

The codebase contains **21 significant modules** across 5 functional layers:
1. **Presentation & UI**: `App.tsx`, `components/TetrahedronViewport.tsx`
2. **Server & Integration**: `server.ts`
3. **Geometric Engine**: `core/engine.ts`, `core/dimension.ts`, `core/canonical.ts`, `core/types.ts`
4. **Crystallographic Core**: `core/schema/crystallographic_exchange.ts`, `core/reference_loader.ts`, `core/group_properties.ts`, `core/property_evidence.ts`, `core/registry.ts`, `core/importer.ts`, `core/generator.ts`, `core/symmetry_adapter.ts`
5. **Passport & Visualization Boundary**: `core/schema/passport_schema.ts`, `core/visualization_contract.ts`
6. **Data & Extraction**: `scripts/extract_gemmi_data.py`, `data/crystallography/gemmi_benchmark_4.json`, `data/source/gemmi_symmetry_5cc1c23c.cpp`
7. **Legacy / Disconnected Remnants**: `components/LatticeVisualizer.tsx`, `services/geminiService.ts`, `constants.ts`, `types.ts`

---

## 5. Mathematical & Symmetry Core Scope

### Space Group Registry & Benchmark Scope
- **Total Space Groups in Nature/ITA**: 230
- **Total Entries in Gemmi Source Table**: 564 settings (`spacegroup_tables::main`)
- **Entries in Working Registry (`core/registry.ts`)**: **8 settings**
- **Entries in Reference Artifact (`gemmi_benchmark_4.json`)**: **8 settings**

| Group No. | Setting ID | HM Symbol | Hall Symbol | System | Operations | Centering | Registry Status | Provenance Commit |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | `P1` | `P 1` | `P 1` | triclinic | 1 | P | `MATCH` | `6ea553a` (catalog) / `5cc1c23c` (artifact) |
| 2 | `P-1` | `P -1` | `-P 1` | triclinic | 2 | P | `MATCH` | `6ea553a` (catalog) / `5cc1c23c` (artifact) |
| 3 | `P2` | `P 1 2 1` | `P 2y` | monoclinic | 2 | P | `MATCH` | `5cc1c23c` |
| 4 | `P21` | `P 1 21 1` | `P 2yb` | monoclinic | 2 | P | `MATCH` | `5cc1c23c` |
| 5 | `C2` | `C 1 2 1` | `C 2y` | monoclinic | 4 | C | `MATCH` | `5cc1c23c` |
| 9 | `Cc` | `C 1 c 1` | `C -2yc` | monoclinic | 4 | C | `MATCH` | `5cc1c23c` |
| 14 | `P21/c` | `P 21/c` | `-P 2ybc` | monoclinic | 4 | P | `MATCH` | `6ea553a` (catalog) / `5cc1c23c` (artifact) |
| 19 | `P212121` | `P 21 21 21` | `P 2ac 2ab` | orthorhombic | 4 | P | `SETTING_MISMATCH` (Origin Shift $(1/4, 1/4, 1/4)$) | `6ea553a` (catalog) / `5cc1c23c` (artifact) |

*Scope Limit*: Space groups 6–8, 10–13, 15–18, and 20–230 are **NOT IMPLEMENTED**.

---

## 6. Execution Paths

### Principal Path 1: Interactive Human UI
`App.tsx` $\to$ `handleRunPositive()` $\to$ `runSymmetryExperiment()` (`core/engine.ts`) $\to$ `validateStructureIntegrity()` $\to$ `computeOrthogonalityDelta()` $\to$ `applyMatrix4x4()` $\to$ Bipartite Matching within $\epsilon$ $\to$ Edge Set Verification $\to$ `det(Q)` check $\to$ `Evidence` object $\to$ `<TetrahedronViewport />` (`components/TetrahedronViewport.tsx`).

### Principal Path 2: Headless Agent API
`POST /api/experiment` (`server.ts`) $\to$ JSON request body validation $\to$ `runSymmetryExperiment()` $\to$ bit-identical `Evidence` JSON response.

### Principal Path 3: Crystallographic Extraction Pipeline
`scripts/extract_gemmi_data.py` $\to$ reads verified `data/source/gemmi_symmetry_5cc1c23c.cpp` $\to$ parses `spacegroup_tables::main` $\to$ computes group closure modulo 24 $\to$ writes `data/crystallography/gemmi_benchmark_4.json`.

### Principal Path 4: Reference Loader & Comparator
`ReferenceArtifactLoader.loadFromFile()` $\to$ validates manifest SHA-256 $\to$ validates records with KB-10 contract $\to$ `CrystallographicComparator.compareWithWorkingCatalog()` $\to$ yields comparison report with origin-shift proofs.

### Principal Path 5: Mathematical Passport Verification Slice
`core/passport_verification.test.ts` $\to$ loads Group 2 (`P-1`) from `core/registry.ts` $\to$ verifies $W = -I$ $\to$ computes center $c = (0, 0, 0)$ via `CrystallographicGroupProperties` $\to$ evaluates fixed point equation $Wc + w = c$ $\to$ checks test point $P' = WP + w$ $\to$ packages `SG002VisualizationPayload`.

---

## 7. Status of Capabilities

- **IMPLEMENTED & VERIFIED**:
  - Pure polyhedral symmetry verification engine (`core/engine.ts`).
  - Affine dimensionality, barycenter, and anchor frame analysis (`core/dimension.ts`).
  - Exact rational arithmetic with BigInt and safe integer checks (`ExactRational`).
  - Three-layer crystallographic validation (`validateExchangeRecord`).
  - Origin shift transformation $w' = (w + (W - I)x_0) \pmod 1$ and Group 19 equivalence proof.
  - Linear matrix order calculation, centrosymmetry midpoint detection, unreduced translation summation.
  - Interactive 3D Three.js visualization of the canonical tetrahedron.
  - Agent HTTP POST `/api/experiment` endpoint with identical determinism.
- **PARTIALLY IMPLEMENTED**:
  - Mathematical Passport V1 (SG-002 validated slice works; automated runtime YAML loader and universal visualizer deferred).
- **SPECIFIED ONLY / NOT IMPLEMENTED**:
  - Automated symmetry discovery engine (candidate generation from point clouds).
  - General space-group classification for arbitrary atomic structures.
  - Universal origin shift solver for arbitrary basis choices.
  - Full ingestion of all 230 space groups.
  - Wyckoff position analysis and unit cell metric tensor calculations.
