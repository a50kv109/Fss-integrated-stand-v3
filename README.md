# Fedorov Symmetry Stand (FSS)

**A Deterministic Theoretical Research Stand for Crystallographic Symmetry Reasoning**

---

## 1. Overview & Purpose

The **Fedorov Symmetry Stand (FSS)** is an open-source, deterministic theoretical research environment engineered for the mathematical verification, analysis, and representation matching of crystallographic space groups.

Rooted in Evgraf S. Fedorov’s classical 1891 geometric derivation of the 230 space groups, FSS is designed not as a static handbook or lookup table, but as a computational experimental stand providing:
* A **deterministic vector-affine geometric engine** for testing symmetry operations on 3D structures (such as the canonical regular tetrahedron) with exact metric tolerance.
* An **interactive 3D Three.js visualization environment** allowing real-time inspection of symmetry transformations and generated evidence.
* A **two-stage in-memory classification subsystem** combining coordinate-independent invariant profiling with strict canonical key matching modulo unit-cell translations $\mathbb{Z}^3$.
* An **autonomous exact matrix conjugacy lab (STL V1)** verifying $g' = P^{-1} g P$ in $\mathbb{Q}^{n \times n}$ ($n \in \{2, 3\}$) with normalized rational arithmetic on `BigInt`.
* Strict epistemic demarcation and negative boundaries distinguishing physical simulation, computed results, and mathematical proof.

### Conceptual Architecture Model: The Three Tiers
FSS organizes its capabilities into three conceptual tiers. Note that this represents an architectural organizational model, not a single monolithic execution engine (components are independently executable modular libraries):
1. **Crystallographic Knowledge Base / Reference Catalog:** Passive normative reference data (ITA Volume A, Gemmi benchmark, canonical operation tables).
2. **Deterministic Mathematical Computing Core:** Exact rational arithmetic (`BigInt`, Euclidean GCD), affine geometry, invariant extraction, and standalone algorithmic modules (`core/stl/`, `core/group_closure.ts`).
3. **Experimental & Hypothesis-Testing Stand:** Dedicated environments for formulating and verifying symmetry hypotheses (3D tetrahedron stand, STL conjugacy verification, two-stage space group classification).

---

## 2. Integrated Architecture & Provenance

This repository integrates capabilities developed across three complementary engineering streams:

```
+-----------------------------------------------------------------------------------------+
|                                FEDOROV SYMMETRY STAND (FSS)                             |
|                                                                                         |
|  [Studio FSS Baseline]       [GROK v0.1.1 Assimilated]      [STL V1 Autonomous Module]  |
|  - Vector-affine engine      - Two-stage classifier         - Exact matrix arithmetic   |
|  - 3D Three.js viewport      - Algebraic invariant profile  - Conjugacy: g' = P^-1 g P  |
|  - 9-setting registry        - Strict canonical key matcher - Elementwise evidence      |
|  - BigInt ExactRational      - Multiset duplicate check     - D4, rational inversion   |
|  - Express REST server       - Soundness test suite         - 7/7 native tests PASS     |
+-----------------------------------------------------------------------------------------+
```

### Integrated Subsystems:
1. **Symmetry Transformation Lab V1 (`core/stl/`):** Transferred as an autonomous mathematical library. Performs exact rational matrix operations, determinant computation, matrix inversion, and verifies $g' = P^{-1} g P$ for user-specified $P$ without floating-point approximations.
2. **Invariant Profiler (`core/operation_set_profile.ts`):** Extracts coordinate-independent algebraic invariants (matrix orders $\{1, 2, 3, 4, 6\}$, trace histograms, determinant ratio, inversion presence) to rapidly prune incompatible space groups.
3. **Strict Candidate Matcher (`core/operation_set_match.ts`):** Performs bijective set comparison of canonical keys `${JSON(W)}|${w mod 1}` against the 8-setting classifier catalog and evaluates ITA Volume A origin shifts for Group 19.
4. **Vector-Affine Geometric Stand (`core/engine.ts`, `App.tsx`):** Verifies structure preservation and invariant subspaces on canonical polyhedra in Three.js.

---

## 3. Current System Capabilities

* **Interactive Symmetry Experiments (`ACTIVE_IN_UI`):**
  - Interactive 3D visualization of a canonical regular tetrahedron.
  - Execution of affine symmetry operations ($C_3$ 120° rotations, reflections, non-symmetry rotations).
  - Configurable verification predicates (`PRESERVES_STRUCTURE`, `INVARIANT_SUBSPACE`) and distance threshold $\epsilon$.
  - Real-time generation of bit-identical JSON evidence reports.
* **Autonomous Matrix Conjugacy Verification (STL V1: `INTEGRATED_STANDALONE_MODULE`):**
  - Exact rational matrix arithmetic on BigInt without rounding drift.
  - Verification of algebraic conjugacy $g' = P^{-1} g P$ for $n \in \{2, 3\}$ under user-supplied $P$.
  - Structured `ConjugacyResult` reports with elementwise `ElementEvidence`.
* **Affine Dimensionality Analysis (`core/dimension.ts`):**
  - Scale-invariant covariance and eigenvalue analysis determining geometric dimension ($0$D, $1$D, $2$D, $3$D) across scales from $10^{-3}$ to $10^3$.
* **Two-Stage Space Group Classifier (`PARTIALLY_EXPOSED_API`):**
  - **Stage 1 (Candidate Filter):** Prunes catalog candidates using necessary linear invariants (zero false negatives for registered catalog settings).
  - **Stage 2 (Strict Matcher):** Bijectively matches canonical operation keys modulo $\mathbb{Z}^3$.
  - **Origin Shift Awareness:** Detects and verifies exact equivalence under the standard ITA Volume A origin shift $\vec{x}_0 = (1/4, 1/4, 1/4)$ for Space Group 19 ($P2_12_12_1$).
  - **REST API Route:** Implemented in `server.ts` via `POST /api/classify`. UI component present in `components/ClassifierUI.tsx` (navigation tab unexposed in UI).

---

## 4. Current Mathematical Boundaries & Known Discrepancies

To maintain scientific rigor, the system enforces strict epistemic boundaries:
1. **Catalog Bound (8 in Classifier, 9 in Registry):** The fast classifier evaluates exactly 8 space group settings: Nos. 1 ($P1$), 2 ($P\bar{1}$), 3 ($P2$), 4 ($P2_1$), 5 ($C2$), 9 ($Cc$), 14 ($P2_1/c$), and 19 ($P2_12_12_1$). Setting 76 ($P4_1$) is registered in `core/registry.ts` but is explicitly excluded from `REGISTERED_SETTING_IDS` and returns `NO_CANDIDATES`. Queries outside the 8 catalog settings never yield `EXACT_MATCH`.
2. **Invariant Profile $\neq$ Space Group Identification:** Invariant profile matching is a necessary filter, **never** a sufficient proof of space group identity (e.g. $P2$ and $P2_1$ have identical profiles).
3. **Representation Matching $\neq$ General Isomorphism:** `EXACT_MATCH` proves equality in the canonical coordinate basis of the catalog setting modulo $\mathbb{Z}^3$. Arbitrary basis changes ($P \in GL_3(\mathbb{Z})$) and continuous origin shifts are not implemented.
4. **Group Closure Notice:** The matcher evaluates complete operation lists against catalog entries. It does not automatically compute group closure $\langle S \rangle$ for sparse generator sets. (An isolated research module `core/group_closure.ts` exists and passed test suite T1–T15 per execution report [`ISOLATED_MODULE_TESTED`], but is strictly unwired from `classifyOperationSet`, `server.ts`, and the UI).
5. **STL V1 Boundaries:** Status `CONJUGACY_VERIFIED` confirms solely the algebraic relation $g' = P^{-1} g P$ for the supplied matrices. It does **not** prove group closure, inverses, or general space group identity. Matrix $P$ must be explicitly provided ($\det P \neq 0$). Matrix dimension is strictly $n \in \{2, 3\}$.
6. **Gated UI/API Status:**
   - **Classification Core:** Fully implemented in-memory (`core/operation_set_profile.ts`, `core/operation_set_match.ts`).
   - **API Route:** Implemented in `server.ts` via `POST /api/classify`.
   - **UI Component:** `ClassifierUI` component exists in `components/ClassifierUI.tsx`.
   - **User Navigation:** The classifier tab is unexposed in user navigation; `App.tsx` holds view state initialized to `'experiment'` with no navigation switch control exposed in the interface.


For complete details, see [docs/LIMITATIONS.md](docs/LIMITATIONS.md), [docs/CLASSIFIER_CONTRACT.md](docs/CLASSIFIER_CONTRACT.md), [docs/FSS-V3-CAPABILITY-MANIFEST.md](docs/FSS-V3-CAPABILITY-MANIFEST.md), and [docs/FSS-V3-VERIFICATION-MATRIX.md](docs/FSS-V3-VERIFICATION-MATRIX.md).

---

## 5. Environment & Getting Started

### Prerequisites:
* **Node.js:** v18.0.0 or higher (v20+ recommended)
* **npm:** v9.0.0 or higher

### Installation:
```bash
# Clone the repository
git clone <repository-url>
cd fss-integrated-stand

# Install dependencies
npm install
```

### Environment Configuration:
Copy the example environment file:
```bash
cp .env.example .env
```
*(Note: `GEMINI_API_KEY` is optional; required only for harmonic protocol text synthesis via `/api/synthesis`)*

---

## 6. Running & Verification Commands

```bash
# Start local development server (Express + Vite on Port 3000)
npm run dev

# Run static TypeScript type check (Zero errors)
npm run lint

# Build production bundle (Vite)
npm run build

# Start production server
npm start
```

### Running Test Suites:
```bash
# STL V1 Autonomous Matrix Conjugacy Test Suite (7 scenarios, T1–T7 PASS)
npx tsx core/stl/conjugacy.test.ts

# EXP-09 Candidate Filter Soundness & Classification Test Suite
npx tsx core/filter_soundness.test.ts

# EXP-09 Invariant Profiler Test Suite
npx tsx core/operation_set_profile.test.ts

# Affine Dimensionality Engine (64 tests)
npx tsx core/dimension.test.ts

# Geometric Symmetry Engine (31 tests)
npx tsx core/engine.test.ts

# GCL-01 Isolated Group Closure Test Suite (15 tests, T1–T15 PASS)
npx tsx core/group_closure.test.ts
```

*Verification Notice:* All 16 FSS core regression test suites passed with exit code 0 on 2026-10-13. Historical HTTP API test suites (`core/tests/http_api_classify.test.ts`) have a known runner exit caveat (`REPORTED_PASS_WITH_CAVEAT`) and were not part of this core regression run. For complete test details, see [docs/TESTING.md](docs/TESTING.md) and [docs/LIMITATIONS.md](docs/LIMITATIONS.md).

---

## 7. Directory Structure

```
fss-integrated-stand/
├── README.md                   # This overview
├── CONTRIBUTING.md             # Developer guidelines & epistemic rules
├── CHANGELOG.md                # Project version & integration history
├── .env.example                # Template environment file (no secrets)
├── package.json                # Project dependencies and scripts
├── server.ts                   # Express server & API endpoints (/api/classify, /api/experiment)
├── App.tsx                     # React 19 interactive stand UI
├── components/                 # React UI components (3D Viewport, Lattice, ClassifierUI)
├── core/                       # Deterministic mathematical core
│   ├── canonical.ts            # Canonical structures & operations
│   ├── dimension.ts            # 3D affine dimensionality analysis
│   ├── engine.ts               # Symmetry experiment execution
│   ├── group_closure.ts        # GCL-01: Group closure engine (ISOLATED_MODULE_TESTED)
│   ├── operation_set_profile.ts# Algebraic invariant profiler (EXP-09)
│   ├── operation_set_match.ts  # Two-stage candidate matcher (8 settings)
│   ├── registry.ts             # 9-setting space group registry (includes SG 76)
│   ├── schema/                 # Exact rational arithmetic & exchange
│   └── stl/                    # STL V1: Symmetry Transformation Lab (INTEGRATED_STANDALONE_MODULE)
│       ├── exact_scalar.ts     # Normalized rational arithmetic on BigInt
│       ├── exact_matrix.ts     # Exact rational matrix operations & inversion
│       ├── conjugacy.ts        # Deterministic verification of g' = P^-1 g P
│       ├── index.ts            # Public typed interface
│       ├── conjugacy.test.ts   # STL test suite (7/7 PASS)
│       └── README.md           # STL module passport and specification
├── data/                       # Crystallographic benchmarks (Gemmi)
└── docs/                       # Project documentation
    ├── PROJECT_PASSPORT.md     # System mission, status, and principles
    ├── ARCHITECTURE.md         # Component topology & data flow
    ├── MATHEMATICAL_MODEL.md   # Mathematical equations & formalisms
    ├── CLASSIFIER_CONTRACT.md  # Normative verdicts & rules
    ├── INTEGRATION_HISTORY.md  # Detailed history of GROK assimilation
    ├── TESTING.md              # Test execution guide & results
    ├── LIMITATIONS.md          # Negative boundaries and prohibited claims
    ├── ROADMAP.md              # Development phases
    └── analysis/               # Phase 4A-4E analytical reports
```

---

## 8. Documentation Index

1. [docs/PROJECT_PASSPORT.md](docs/PROJECT_PASSPORT.md) — System passport and scope boundaries
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Architectural layers, data pipelines, and gating
3. [docs/MATHEMATICAL_MODEL.md](docs/MATHEMATICAL_MODEL.md) — Group theory, rational arithmetic, and invariants
4. [docs/CLASSIFIER_CONTRACT.md](docs/CLASSIFIER_CONTRACT.md) — Normative classifier verdicts and decision rules
5. [docs/LIMITATIONS.md](docs/LIMITATIONS.md) — Negative boundaries and prohibited claims
6. [docs/ROADMAP.md](docs/ROADMAP.md) — Engineering phases (5A docs through 5G STL V1 to 6 catalog)
7. [docs/TESTING.md](docs/TESTING.md) — Execution status of all test suites and lint/build checks
8. [core/stl/README.md](core/stl/README.md) — STL V1 Module Passport and specification
9. [docs/INTEGRATION_HISTORY.md](docs/INTEGRATION_HISTORY.md) — History of GROK assimilation

---

## 9. Current Status & Next Steps

* **Current Status:** Deterministic Theoretical Research Stand (`Phase 5G Completed`: STL V1 Assimilated; `Phase 5E Partially Exposed`).
  - STL V1 transferred to `core/stl/` as an autonomous exact algebraic library; 7/7 native tests PASS.
  - 16 / 16 FSS core regression test suites PASS per execution report (2026-10-13).
  - Classifier API (`POST /api/classify`) implemented in `server.ts`; `ClassifierUI` component present; navigation tab unexposed in UI.
  - Documented discrepancy on SG 76 ($P4_1$): present in `core/registry.ts`, but excluded from `REGISTERED_SETTING_IDS` (evaluates to `NO_CANDIDATES`).
* **Next Steps:**
  1. GCL-01 Module: Decision on whether to wire `core/group_closure.ts` to matcher or maintain as an isolated research module.
  2. Phase 6: Systematic expansion to full 230 space groups and reconciliation of $P4_1$.

