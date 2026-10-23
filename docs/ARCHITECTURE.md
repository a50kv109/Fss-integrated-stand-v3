# FSS — System Architecture

**Project:** Fedorov Symmetry Stand (FSS)  
**Document:** `docs/ARCHITECTURE.md`  
**Classification:** Canonical System Architecture  
**Status:** Active Research Stand Architecture (Post-STL V1 Integration)  
**Last Updated:** 2026-10-13  

---

## 1. High-Level Component Topology

The Fedorov Symmetry Stand (FSS) is organized into four technical tiers embodying the conceptual model of **Reference Catalog**, **Computing Core**, and **Experimental Stand**.  
*Important Architectural Note:* The conceptual three-tier model defines the epistemic roles of components. It does *not* imply a single universal execution orchestrator; components are modular, independently testable units.

```
+-----------------------------------------------------------------------------------------+
| TIER 1: USER INTERFACE & VISUALIZATION (src/ / App.tsx) [ACTIVE_IN_UI]                 |
| - React 19 SPA with Tailwind CSS                                                        |
| - Three.js 3D Viewport: Interactive Regular Tetrahedron (TetrahedronViewport.tsx)       |
| - Symmetry Experiment Control: Operation selector, predicate selector, epsilon control  |
| - Evidence Inspection Panel: Real-time JSON evidence generation                         |
| - Harmonic Mode: LatticeVisualizer (2D SVG topological frequency lattice)               |
+-----------------------------------------------------------------------------------------+
                                             ▲
                                             │ HTTP / REST / Vite HMR
                                             ▼
+-----------------------------------------------------------------------------------------+
| TIER 2: SERVER & SERVICE DISPATCHER (server.ts) [PARTIALLY_EXPOSED_API]                |
| - Express 5 running on Node.js / tsx (Port 3000)                                        |
| - POST /api/experiment -> Invokes core/engine.ts (Deterministic symmetry verification)  |
| - GET /api/experiment/canonical -> Serves canonical structures and operations           |
| - POST /api/classify -> Invokes core/operation_set_match.ts (8-setting catalog query)   |
| - POST /api/synthesis -> Gemini API client for harmonic protocol analysis               |
| - Static file serving for Vite production build in dist/                                |
+-----------------------------------------------------------------------------------------+
                                             │
                                             ▼ In-Process Method Invocations
+-----------------------------------------------------------------------------------------+
| TIER 3: DETERMINISTIC MATHEMATICAL CORE (core/) [IMPLEMENTED]                           |
|                                                                                         |
|  [Affine Geometric Engine]                 [Reference Catalog & Exchange]               |
|  - engine.ts (runSymmetryExperiment)       - registry.ts (9 Settings Defined)           |
|  - dimension.ts (Affine dimension 0-3)     - schema/crystallographic_exchange.ts        |
|  - canonical.ts (Tetrahedron, Ops)         - reference_loader.ts (Gemmi benchmark)      |
|  - group_properties.ts (Order, traces)     - property_evidence.ts                       |
|                                                                                         |
|  [Autonomous Math Modules in Core]                                                      |
|  - core/stl/ (Symmetry Transformation Lab V1) [INTEGRATED_STANDALONE_MODULE]            |
|    * exact_scalar.ts (Exact rational arithmetic p/q on BigInt)                          |
|    * exact_matrix.ts (Exact matrix operations, det, inverse, set equality)              |
|    * conjugacy.ts (Deterministic verification of g' = P^-1 g P)                         |
|  - core/group_closure.ts (GCL-01 Group Closure) [ISOLATED_MODULE_TESTED]                |
|    * BFS group generation from generators modulo Z^3 on BigInt                          |
+-----------------------------------------------------------------------------------------+
                                             │
                                             ▼ (In-Memory Algebraic Extension)
+-----------------------------------------------------------------------------------------+
| TIER 4: CLASSIFICATION & MATCHING SUBSYSTEM (EXP-09, in core/) [PARTIALLY_EXPOSED]     |
|                                                                                         |
|  [Stage 1: Invariant Profiler]             [Stage 2: Candidate Matcher]                 |
|  - core/operation_set_profile.ts           - core/operation_set_match.ts                |
|    * buildOperationSetProfile()              * filterCandidates()                       |
|    * Matrix order spectrum                   * matchStrict()                            |
|    * Trace & determinant histograms          * classifyOperationSet()                   |
|                                                                                         |
|  * CATALOG SCOPE: 8 Settings in matcher (Nos. 1, 2, 3, 4, 5, 9, 14, 19).                 |
|    SG 76 (P4_1) is registered in registry.ts but excluded from REGISTERED_SETTING_IDS. |
+-----------------------------------------------------------------------------------------+
```

---

## 2. Component Directory & File Layout

```
.
├── App.tsx                     # Main React UI entry point (Active Tetrahedron Stand)
├── components/
│   ├── TetrahedronViewport.tsx # Three.js interactive 3D rendering of vertices & axes
│   ├── LatticeVisualizer.tsx   # SVG lattice visualizer for space group modes
│   └── ClassifierUI.tsx        # UI component for classifier (navigation tab unexposed)
├── core/
│   ├── canonical.ts            # Canonical regular tetrahedron & symmetry operations
│   ├── dimension.ts            # 3D affine dimensionality calculator (0D, 1D, 2D, 3D)
│   ├── engine.ts               # Deterministic symmetry experiment execution engine
│   ├── generator.ts            # Group generator algorithms
│   ├── group_closure.ts        # GCL-01: Group closure BFS modulo Z^3 (ISOLATED_MODULE_TESTED)
│   ├── group_closure.test.ts   # GCL-01 test suite (T1-T15 PASS)
│   ├── group_properties.ts     # Affine algebra, matrix order detection, inversion midpoint
│   ├── importer.ts             # Crystallographic data importing routines
│   ├── operation_set_match.ts  # EXP-09 candidate filter & strict canonical matcher (8 settings)
│   ├── operation_set_profile.ts# EXP-09 coordinate-independent invariant profiler
│   ├── property_evidence.ts    # Evidence reporting for group properties
│   ├── reference_loader.ts     # Gemmi benchmark artifact loader & origin shift analyzer
│   ├── registry.ts             # Registry of 9 space group settings (includes SG 76)
│   ├── schema/
│   │   ├── crystallographic_exchange.ts # BigInt ExactRational arithmetic & validation
│   │   └── crystallographic_extractor.ts# Data extraction tools
│   ├── stl/                    # STL V1: Symmetry Transformation Lab (INTEGRATED_STANDALONE_MODULE)
│   │   ├── exact_scalar.ts     # Exact rational arithmetic on BigInt (normalized p/q)
│   │   ├── exact_matrix.ts     # Exact rational matrices (dim 2 and 3, det, inv, equality)
│   │   ├── conjugacy.ts        # Deterministic verification of g' = P^-1 g P
│   │   ├── index.ts            # Public typed interface of STL V1
│   │   ├── conjugacy.test.ts   # STL test suite (T1-T7 PASS)
│   │   └── README.md           # Module passport and epistemic specification
│   ├── symmetry_adapter.ts     # Bridge between internal types and external formats
│   ├── types.ts                # TypeScript interfaces for geometry and evidence
│   └── visualization_contract.ts# Contract for 3D rendering data structures
├── data/
│   └── crystallography/
│       └── gemmi_benchmark_4.json # 8-setting benchmark artifact from Gemmi
├── docs/                       # Comprehensive documentation suite
├── server.ts                   # Express server and API endpoints
└── package.json                # Project dependencies and npm scripts
```

---

## 3. Data Flow Pipelines

### A. The Interactive Geometric Verification Pipeline (`ACTIVE_IN_UI`)
1. User selects a structure (`CANONICAL_TETRAHEDRON`) and an affine operation (e.g. $C_3$ 120° rotation or reflection).
2. User configures verification predicate (`PRESERVES_STRUCTURE`, `INVARIANT_SUBSPACE`) and distance threshold $\epsilon = 10^{-5}$.
3. UI invokes `runSymmetryExperiment(...)` from `core/engine.ts`:
   - Structure vertices are transformed via matrix multiplication $v' = W \cdot v + w$.
   - A bipartite nearest-neighbor matching algorithm pairs original and transformed vertices.
   - Root-mean-square deviation (RMSD) and max distance are computed.
   - A deterministic `Evidence` report is generated with timestamp, input hash, and boolean verdict.
4. UI renders the result in real-time in the Three.js viewport and emits full JSON evidence.

### B. The Space Group Classification Pipeline (`PARTIALLY_EXPOSED_API`)
1. **Input:** Array of affine operations $(W, w)$ with exact rational translations.
2. **Stage 0 (Profile Extraction):** `buildOperationSetProfile` normalizes translations mod 1, computes distinct operation count, matrix orders, trace histogram, and inversion flag.
3. **Stage 1 (Candidate Filtering):** `filterCandidates` compares the invariant profile against the 8 settings in `SymmetryCatalog` and prunes incompatible groups (zero false negatives for catalog settings).
4. **Stage 2 (Strict Canonical Matching):** `matchStrict` generates canonical keys `${JSON(W)}|${w mod 1}` and evaluates bijective set equality. If exact match fails, it evaluates exact origin shift $x_0 = (1/4, 1/4, 1/4)$ for Group 19.
5. **Report Emission:** `classifyOperationSet` returns a typed `TwoStageMatchReport` with an explicit verdict.

### C. Deterministic Matrix Conjugacy Verification Pipeline (STL V1: `INTEGRATED_STANDALONE_MODULE`)
1. **Input:** Family of exact matrices $G \subset \mathbb{Q}^{n \times n}$ ($n \in \{2, 3\}$), invertible basis transformation matrix $P \in \mathbb{Q}^{n \times n}$ ($\det P \neq 0$), and optional expected set $G'$.
2. **Deterministic Evaluation:** `verifyConjugacy({ G, P, expected })` computes exact algebraic images $g'_i = P^{-1} g_i P$ using `ExactMatrix` rational inversion and multiplication.
3. **Report Generation:** Produces a typed `ConjugacyResult` with status (`CONJUGACY_VERIFIED`, `REFUTED`, `INVALID_INPUT`, `UNSUPPORTED_INPUT`) and elementwise `ElementEvidence`.
4. **Epistemic Demarcation:** Confirms strictly the algebraic conjugacy relation $g' = P^{-1} g P$. It does *not* test group closure, inverses, or general space group isomorphism.

---

## 4. Isolation, Gating Rationale & Known Discrepancies

1. **Epistemic Discipline:** The fast classifier working catalog contains 8 space group settings. Exposing it in the UI as a general "Space Group Identifier" risks misleading users into assuming it classifies all 230 space groups.
2. **Missing Group Closure in Matcher:** Arbitrary user inputs might be incomplete generator sets. While `core/group_closure.ts` is implemented and verified in isolation, it is intentionally unwired from `classifyOperationSet`.
3. **Documented Discrepancy on SG 76 ($P4_1$):**  
   - `core/registry.ts` defines 9 settings (including SG 76 / $P4_1$).
   - `core/operation_set_match.ts` restricts `REGISTERED_SETTING_IDS` to 8 settings (Nos. 1, 2, 3, 4, 5, 9, 14, 19).
   - An input corresponding to $P4_1$ will evaluate to `NO_CANDIDATES` in the classifier. This divergence is intentional to maintain alignment with `gemmi_benchmark_4.json` pending Phase 6 catalog expansion.
4. **STL V1 Isolation:** STL V1 is placed in `core/stl/` as an autonomous mathematical tool. It is not coupled to the classifier, geometry stand, or API server.
