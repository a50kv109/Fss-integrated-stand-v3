# FSS — MODULE CATALOG
**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `MODULE_CATALOG.md`  
**Phase:** 1 — Architecture Discovery and Baseline Documentation  
**Mode:** READ-ONLY COMPONENT CATALOG  
**Inspection Date:** 2026-10-11  

---

## Catalog Index of Significant Modules

| Module ID | File Path | Functional Layer | Status | Primary Responsibility |
|:---|:---|:---|:---:|:---|
| `MOD-UI-01` | `/App.tsx` | UI / Presentation | `IMPLEMENTED` | Primary Human Control Stand and interactive experiment runner |
| `MOD-UI-02` | `/components/TetrahedronViewport.tsx` | UI / Visualization | `IMPLEMENTED` | Three.js WebGL viewport rendering 3D tetrahedron and correspondence |
| `MOD-SRV-01` | `/server.ts` | Server / API Gateway | `IMPLEMENTED` | Express server hosting `/api/experiment` and `/api/synthesis` |
| `MOD-ENG-01` | `/core/engine.ts` | Mathematical Core | `IMPLEMENTED` | Deterministic polyhedral symmetry verification engine |
| `MOD-ENG-02` | `/core/dimension.ts` | Mathematical Core | `IMPLEMENTED` | Affine dimensionality, barycenter, and anchor frame analyzer |
| `MOD-CAN-01` | `/core/canonical.ts` | Mathematical Core | `IMPLEMENTED` | Canonical tetrahedron and benchmark rotation/reflection operations |
| `MOD-TYP-01` | `/core/types.ts` | Type Contracts | `IMPLEMENTED` | Active geometric data structures, predicates, and Evidence DTO |
| `MOD-XCH-01` | `/core/schema/crystallographic_exchange.ts` | Crystallographic Core | `IMPLEMENTED` | ExactRational arithmetic and 3-layer validation (structural, math, provenance) |
| `MOD-REF-01` | `/core/reference_loader.ts` | Crystallographic Core | `IMPLEMENTED` | Reference artifact loader, origin shift analyzer, and catalog comparator |
| `MOD-REG-01` | `/core/registry.ts` | Working Registry | `IMPLEMENTED` | `SymmetryCatalog` storing 8 benchmark space group settings |
| `MOD-PRP-01` | `/core/group_properties.ts` | Crystallographic Core | `IMPLEMENTED` | Derived mathematical group properties (orders, inversion, powers, translations) |
| `MOD-EVD-01` | `/core/property_evidence.ts` | Evidence Layer | `IMPLEMENTED` | Evidence-backed crystallographic reports with 8 verification levels |
| `MOD-IMP-01` | `/core/importer.ts` | Crystallographic Core | `IMPLEMENTED` | Normalizer and validator for raw crystallographic records |
| `MOD-GEN-01` | `/core/generator.ts` | Verification / Historical | `IMPLEMENTED` | Reference catalog generation and comparison audit module |
| `MOD-ADP-01` | `/core/symmetry_adapter.ts` | Adapter Layer | `IMPLEMENTED` | Adapts 3x3 + 3x1 crystallographic operations into 4x4 affine matrices |
| `MOD-PAS-01` | `/core/schema/passport_schema.ts` | Passport Layer | `SPECIFIED / PARTIAL` | Mathematical Passport V1 interfaces and claim contracts |
| `MOD-VIS-01` | `/core/visualization_contract.ts` | Visualization Boundary | `IMPLEMENTED` | SG-002 exact rational DTO payload boundary contract |
| `MOD-DAT-01` | `/scripts/extract_gemmi_data.py` | Data Pipeline | `IMPLEMENTED` | Reproducible Python extractor parsing pinned Gemmi C++ table |
| `MOD-DAT-02` | `/data/crystallography/gemmi_benchmark_4.json` | Data Asset | `IMPLEMENTED` | Checked-in exchange JSON artifact containing 8 space group settings |
| `MOD-DAT-03` | `/data/source/gemmi_symmetry_5cc1c23c.cpp` | Upstream Reference | `IMPLEMENTED` | Pinned upstream Gemmi v0.7.5 source file with verified SHA-256 |
| `MOD-LEG-01` | `/components/LatticeVisualizer.tsx` | Legacy Prototype | `UNCONNECTED` | 2D SVG lattice visualizer from initial SHRM template |
| `MOD-LEG-02` | `/services/geminiService.ts` | Legacy Prototype | `UNCONNECTED` | Gemini client wrapper from initial SHRM template |
| `MOD-LEG-03` | `/constants.ts` | Legacy Prototype | `UNCONNECTED` | Hardcoded 16 space group mocks from initial SHRM template |
| `MOD-LEG-04` | `/types.ts` | Legacy Prototype | `UNCONNECTED` | Legacy application state and crystal system enums |

---

## Detailed Module Specifications

### `MOD-ENG-01`: Deterministic Polyhedral Verification Engine
- **File**: `/core/engine.ts`
- **Responsibility**: Pure, deterministic verification of geometric symmetry operations on polyhedral structures in $\mathbb{R}^3$.
- **Inputs**: `ExperimentInput` (`structure` or `structureId`, `operation` or `operationId`, `predicate`, tolerances `epsilon`, `orthogonalityEpsilon`, `determinantEpsilon`).
- **Outputs**: `Evidence` record containing isometry status, determinant, maximum/mean delta, vertex-to-vertex bijection correspondence, edge topology preservation verdict, overall verdict (`VERIFIED` / `REJECTED`), and rejection reason.
- **Dependencies**: `core/types.ts`, `core/canonical.ts`.
- **Consumers**: `App.tsx`, `server.ts`, `core/engine.test.ts`.
- **Core Algorithms**:
  1. `validateStructureIntegrity`: Asserts unique vertex IDs, valid edge endpoints, and absence of self-loops.
  2. `computeOrthogonalityDelta`: Computes Chebyshev norm $\max_{i,j} |(Q^T Q)_{ij} - \delta_{ij}|$.
  3. `applyMatrix4x4`: Homogeneous affine point pushforward $p' = M [x, y, z, 1]^T$.
  4. Augmenting path bipartite maximum matching for bijective vertex correspondence within $\epsilon$.
  5. Canonical undirected edge set matching: $\pi(E) \subseteq E$.
  6. Orientation check: $\det(Q) = +1$ for `PROPER_ROTATION`.
- **Evidence Status**: `SOURCE_CONFIRMED`, `TEST_EXECUTED` (31/31 tests pass in `core/engine.test.ts`).

---

### `MOD-ENG-02`: Affine Dimensionality Analyzer
- **File**: `/core/dimension.ts`
- **Responsibility**: Scale- and translation-invariant assessment of affine dimensionality (0, 1, 2, or 3) for arbitrary 3D vertex configurations.
- **Inputs**: Array of `Vertex` objects, optional `DimensionAnalyzerOptions`.
- **Outputs**: `DimensionAnalysisResult` (barycenter, geometric clusters, eigenvalues $\lambda_1 \ge \lambda_2 \ge \lambda_3 \ge 0$, dimension ratios, `affineDimension`, `conditionStatus`, `anchorFrame`).
- **Dependencies**: `core/types.ts`, `core/engine.ts` (`euclideanDistance`).
- **Consumers**: `core/dimension.test.ts`, `evidence_check.ts`.
- **Core Algorithms**:
  1. Barycenter normalization: $c = \frac{1}{N} \sum v_i$.
  2. Coincidence clustering: greedy clustering with $\epsilon_{\text{coincidence}} = 10^{-6}$.
  3. Normalized covariance tensor $C = \frac{1}{N} \sum (v_i - c)(v_i - c)^T$.
  4. Exact analytical trigonometric roots of 3x3 characteristic polynomial for eigenvalues.
  5. Eigenvalue ratio tests ($\lambda_2/\lambda_1, \lambda_3/\lambda_1$) against $\epsilon_{\text{dimension}} = 10^{-4}$ with borderline factor 10.0.
  6. Robust anchor frame generation (linearly independent points maximizing volume / area).
- **Evidence Status**: `SOURCE_CONFIRMED`, `TEST_EXECUTED` (64/64 tests pass in `core/dimension.test.ts`).

---

### `MOD-XCH-01`: Crystallographic Exchange Contract & Arithmetic
- **File**: `/core/schema/crystallographic_exchange.ts`
- **Responsibility**: Strict schema enforcement, exact rational arithmetic, and independent 3-layer validation for crystallographic records.
- **Inputs**: `SpaceGroupRecord`, `ExchangeManifest`.
- **Outputs**: `ExactRational` arithmetic instances, `RecordValidationReport` with independent `structural`, `mathematical`, and `provenance` results.
- **Dependencies**: None (self-contained arithmetic and validation).
- **Consumers**: `core/reference_loader.ts`, `core/group_properties.ts`, `core/property_evidence.ts`, `core/schema/crystallographic_exchange.test.ts`.
- **Core Algorithms**:
  1. `ExactRational`: Arbitrary precision BigInt numerator/denominator, BigInt Euclidean GCD, sign normalization, safe integer bounds checking.
  2. `mod1()`: Periodic fractional coordinate reduction to $[0, 1)$.
  3. `validateStructuralRecord`: Checks safe integer bounds, space group range [1, 230], positive denominators, operation counts.
  4. `validateMathematicalGroup`: Exact identity detection ($W = I_3, w = 0 \pmod 1$), two-sided inverse discovery ($O_1 \circ O_2 \equiv I \land O_2 \circ O_1 \equiv I \pmod 1$), algebraic group closure modulo 1 ($O_i \circ O_j \in G \pmod 1$), duplicate operation detection.
  5. `validateProvenance`: Verifies minimum 7-character commit SHA, licensing, and explicit `isVerified` flag.
- **Evidence Status**: `SOURCE_CONFIRMED`, `TEST_EXECUTED` (100% pass across all layers in `crystallographic_exchange.test.ts`).

---

### `MOD-REF-01`: Crystallographic Reference Loader & Comparator
- **File**: `/core/reference_loader.ts`
- **Responsibility**: Loads and validates reference JSON artifacts against cryptographic hashes, analyzes coordinate origin shifts, and performs non-destructive catalog comparisons.
- **Inputs**: File path or raw JSON string, candidate origin shift vectors $x_0$.
- **Outputs**: Validated `CrystallographicExchangeArtifact`, `GroupComparisonReport[]` with verdicts (`MATCH`, `SETTING_MISMATCH`, `OPERATION_MISMATCH`, `INCOMPLETE`, `REFERENCE_INVALID`).
- **Dependencies**: `core/schema/crystallographic_exchange.ts`, `core/registry.ts`.
- **Consumers**: `core/importer.ts`, `core/reference_loader.test.ts`.
- **Core Algorithms**:
  1. `ReferenceArtifactLoader`: Canonical SHA-256 calculation across sorted record JSON; validates manifest checksum.
  2. `OriginShiftAnalyzer`: Evaluates transformation law $w' = (w + (W - I)x_0) \pmod 1$ in `ExactRational`; proves exact equivalence between distinct origin conventions.
  3. `CrystallographicComparator`: Compares canonical operation key sets against `SymmetryCatalog` in `core/registry.ts`.
- **Evidence Status**: `SOURCE_CONFIRMED`, `STATIC_RISK` (Unit test `core/reference_loader.test.ts` fails because it expects 4 records while artifact now contains 8).

---

### `MOD-REG-01`: Working Symmetry Registry
- **File**: `/core/registry.ts`
- **Responsibility**: Working registry storing verified crystallographic space group settings.
- **Inputs**: Query by `groupNumber`, `settingId`, or `hallSymbol`.
- **Outputs**: Deep clone of `DetailedSymmetryRecord`.
- **Dependencies**: `core/symmetry_adapter.ts`.
- **Consumers**: `core/generator.ts`, `core/reference_loader.ts`, `core/property_evidence.ts`, `core/registry.test.ts`, `core/passport_verification.test.ts`.
- **Contents**: Exactly 8 records:
  - SG 1 (`P1`), SG 2 (`P-1`), SG 3 (`P2`), SG 4 (`P21`), SG 5 (`C2`), SG 9 (`Cc`), SG 14 (`P21/c`), SG 19 (`P212121`).
- **Evidence Status**: `SOURCE_CONFIRMED`, `TEST_EXECUTED` (all tests pass in `core/registry.test.ts`).

---

### `MOD-PRP-01`: Derived Group Properties Analyzer
- **File**: `/core/group_properties.ts`
- **Responsibility**: Calculates derived crystallographic properties from exact operations without premature modulo reduction.
- **Inputs**: `SpaceGroupRecord`.
- **Outputs**: `SpaceGroupPropertyReport` containing `linearParts`, `centrosymmetry`, and `operationPowers`.
- **Dependencies**: `core/schema/crystallographic_exchange.ts`.
- **Consumers**: `core/property_evidence.ts`, `core/passport_verification.test.ts`, `core/group_properties.test.ts`.
- **Core Algorithms**:
  1. Linear classification: 3x3 determinant, trace, algebraic matrix order $k \in \{1, 2, 3, 4, 6\}$.
  2. Centrosymmetry detection: searches for $W = -I_3$; computes exact midpoint $x_0 = \frac{1}{2} w \pmod 1$ in `ExactRational`.
  3. Operation powers: iterates $(W, w)^k$ unreduced, preserving $t_{\text{unreduced}} = \sum_{j=0}^{k-1} W^j w$.
  4. Intrinsic translation calculation: $\tau = \frac{1}{k} t_{\text{unreduced}}$ (detects screw and glide translations).
- **Evidence Status**: `SOURCE_CONFIRMED`, `STATIC_RISK` (Unit test `core/group_properties.test.ts` fails because index 2 was assumed to be `P21/c` but is now `P2`).

---

### `MOD-EVD-01`: Property Evidence Generator
- **File**: `/core/property_evidence.ts`
- **Responsibility**: Constructs structured, traceable evidence reports linking reference records, calculations, results, and explicit limitations.
- **Inputs**: `SpaceGroupRecord`, `ExchangeManifest`.
- **Outputs**: `EvidenceBackedGroupReport`, `PropertyEvidence` records with 8 distinct verification levels.
- **Dependencies**: `core/schema/crystallographic_exchange.ts`, `core/group_properties.ts`, `core/reference_loader.ts`.
- **Consumers**: `core/property_evidence.test.ts`.
- **Evidence Status**: `SOURCE_CONFIRMED`, `STATIC_RISK` (Unit test fails because it asserts 4 benchmark reports instead of 8).

---

### `MOD-UI-01`: Human Control Stand
- **File**: `/App.tsx`
- **Responsibility**: Primary interactive UI hosting the regular tetrahedron experiment, parameter controls, verdict display, and Three.js viewport.
- **Inputs**: User button clicks (Positive C3 120°, Negative 45°, Reflection Plane $x=y$, Reset), predicate toggle (`PRESERVES_STRUCTURE` / `PROPER_ROTATION`), epsilon input.
- **Outputs**: Visual verdict cards, metric deltas, pushforward correspondence table, JSON evidence drawer, 3D viewport scene update.
- **Dependencies**: `core/engine.ts`, `core/canonical.ts`, `core/types.ts`, `components/TetrahedronViewport.tsx`, `lucide-react`.
- **Evidence Status**: `SOURCE_CONFIRMED`, active application entry point.

---

### `MOD-SRV-01`: Server Entry Point & Agent Gateway
- **File**: `/server.ts`
- **Responsibility**: Express server hosting API endpoints for headless AI agents and serving Vite frontend.
- **Endpoints**:
  - `POST /api/experiment`: Agent tool call invoking `runSymmetryExperiment`.
  - `GET /api/experiment/canonical`: Returns canonical structures and operations.
  - `POST /api/synthesis`: Gemini API integration for legacy prototype prompts.
- **Dependencies**: `express`, `vite`, `@google/genai`, `core/engine.ts`, `core/canonical.ts`.
- **Evidence Status**: `SOURCE_CONFIRMED`, active dev server runner.
