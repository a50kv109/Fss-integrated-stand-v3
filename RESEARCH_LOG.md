# FSS - Research Log

A chronological log of research and development stages for FSS.

| Stage | Focus | Key Findings / Result | Status |
| :--- | :--- | :--- | :--- |
| M-6A.1 | Dimension Analysis | Barycenter, Normalization, Affine Dim (0-3) | `IMPLEMENTED` |
| M-6A.1C | Stability & Determinism | Sorted eigenvalues, clustering, scale-independence | `IMPLEMENTED` |
| M-6A.2 | Symmetry Discovery | Candidate generation, anchor transformations | `PARTIALLY_IMPLEMENTED` |
| KB-10 | Exchange Contract | Strict schema, ExactRational, 3-layer validation | `IMPLEMENTED` |
| KB-10A | Exact Arithmetic & Group Audit | BigInt-backed ExactRational, safe integer boundaries, 2-sided inverses | `IMPLEMENTED` |
| KB-11 | Reproducible Extraction | Pinned Gemmi v0.7.5 extractor, verified SHA-256, JSON artifact | `IMPLEMENTED` |
| KB-12 | Independent Extractor Audit | Origin choice analysis, determinism check, contract audit | `COMPLETED` |
| KB-13A | Controlled Reference Integration | Reference loader, OriginShiftAnalyzer, non-destructive comparator | `IMPLEMENTED` |
| KB-14 | Derived Group Properties | Linear parts, centrosymmetry, exact powers, unreduced translations | `IMPLEMENTED` |
| KB-15 | Evidence-Backed Reports | Multi-level verification, structured PropertyEvidence, traceability | `IMPLEMENTED` |
| KB-15A | Audit Findings Reconciliation | Documentation update based on Grok audit ZIP analysis | `COMPLETED` |
| KB-16 | Centered Lattice (#5, C2) | Added C2, implemented C-centering logic, verified 4 ops | `COMPLETED` |
| KB-17 | Centered Lattice & Glide (#9, Cc) | Added Cc, implemented C-centering/glide, verified 4 ops | `COMPLETED` |
| KB-18 | Centered Lattice (#4, P2₁) | Added P2₁, verified 2 operations | `COMPLETED` |
| KB-19 | Monoclinic (#3, P2) | Added P2, verified 2 operations | `COMPLETED` |
| CHECKPOINT | Pre-Audit Documentation Freeze | Audit dossier in `docs/RESEARCH_CHECKPOINT.md` prepared for external review | `COMPLETED` |
| Passport V1 | Mathematical Passport V1 | YAML schema, deterministic verification, and visualization boundary contract for SG-002 | `PARTIAL / BASELINE VALIDATED FOR SG-002` |
| Stage A | Registry Reconciliation & Validation | Reconciled Group No. 9 (Cc), implemented exact finite-set validation (identity, closure mod 1, inverses mod 1 with explicit failure reports, and C2 vs Cc distinction) | `COMPLETED` |

## Stage Details

### M-6A.1 / M-6A.1C
- **Question**: Can we deterministically assess the dimensionality of an arbitrary vertex structure?
- **Result**: Yes, using covariance tensor eigenvalues and robust anchor frame construction.
- **Tests**: `dimension.test.ts` (11 tests, including tetrahedron, square, triangle, collinear, scale/translation invariance).
- **Known Issues**: Potential numerical instability near thresholds. BORDERLINE cases exist (`ILL_CONDITIONED`).

### FSS-KB-09 — Source Extraction Pipeline & Environment Audit
- **Question**: Can we execute dynamic runtime extraction from the Gemmi C++ source repository in the current environment?
- **Finding**: No (`pip3` and Python `gemmi` bindings are unavailable in the isolated Node.js/Vite preview environment).
- **Architecture Implication**: Source extraction must be decoupled from runtime normalization. Normalization and validation (`CrystallographicImporter`) operate on version-controlled, verified raw data structures derived from Gemmi commit `6ea553a` (MPL-2.0, ITA attribution).
- **Status**: `BLOCKED — SOURCE ACCESS OR EXECUTION UNAVAILABLE` (for direct dynamic extraction script execution).

### FSS-KB-10 — Crystallographic Exchange Contract & Schema Validation
- **Objective**: Establish strict data exchange contract between external extractors and FSS.
- **Components Implemented**:
  - `core/schema/crystallographic_exchange.ts`: Defines `ExchangeManifest`, `SpaceGroupRecord`, `ExchangeSymmetryOperation`, `ExactRational`, and multi-layer validation logic.
  - `ExactRational`: Arbitrary exact rational arithmetic with integer numerator, positive integer denominator, GCD reduction, addition, multiplication, and mod 1 reduction.
  - Distinct Validation Layers:
    1. Structural Validity (`validateStructuralRecord`): Checks space group range [1, 230], 3x3 integer matrices $W$, positive rational denominators, non-empty `settingId`, operations count consistency, duplicate detection.
    2. Mathematical Group Consistency (`validateMathematicalGroup`): Verifies identity operation, existence of inverses, and algebraic group closure under composition modulo 1.
    3. Source Provenance (`validateProvenance`): Verifies metadata integrity, minimum 7-char commit hash, and explicit flags (`isVerified`), distinguishing unverified records from invalid records.
  - Comprehensive Test Suite (`core/schema/crystallographic_exchange.test.ts`): All positive benchmark groups (Nos. 1, 2, 14, 19) and negative test cases (invalid matrices, zero/negative denominators, non-integers, missing identity, broken closure, missing inverses, count mismatches, empty identifiers).
- **Status**: `IMPLEMENTED`
- **Known Limitations**: Live dynamic extractor from external Gemmi source is not yet implemented (deferred to future extraction pipeline stage). The geometric engine (`core/engine.ts`) and existing catalog remain untouched.

### FSS-KB-10A — Exact Arithmetic and Group Validation Audit
- **Objective**: Conduct mathematical and architectural audit of `core/schema/crystallographic_exchange.ts`, fix confirmed defects, and verify edge cases.
- **Audited Properties & Fixes**:
  1. *Exact Rational Arithmetic*: Upgraded `ExactRational` to use `bigint` internally for all arithmetic products ($n_1 d_2 + n_2 d_1$, $d_1 d_2$) and GCD computation. Enforced strict `Number.isSafeInteger()` validation on input and canonical reduction boundaries, preventing JavaScript 64-bit float precision loss.
  2. *Modulo 1 Lattice Reduction*: Confirmed that `mod1()` operates canonically on fractional coordinates with integer carries ($3/2 \to 1/2$, $-1/4 \to 3/4$, $-5/2 \to 1/2$, $-4/4 \to 0/1$). Clarified that `mod1()` is strictly applied to periodic space group operations and never to unconstrained geometric vectors.
  3. *Composition Convention*: Audited composition order $x' = W_1 (W_2 x + w_2) + w_1 \equiv (W_1 W_2) x + (W_1 w_2 + w_1 \pmod 1)$.
  4. *Two-Sided Inverses*: Upgraded `validateMathematicalGroup` to require strict two-sided inverses ($O_1 \circ O_2 \equiv I$ AND $O_2 \circ O_1 \equiv I \pmod 1$).
  5. *Mathematical Set Uniqueness*: Added duplicate operation detection directly into `validateMathematicalGroup`, rejecting sets of correct declared size ($N$) containing duplicated operations and missing group elements.
  6. *Provenance Decoupling*: Confirmed that mathematical and structural validation operate independently of source metadata, preventing unverified records from being misidentified as authenticated sources.
- **Test Evidence**:
  - `core/schema/crystallographic_exchange.test.ts` (100% pass across positive reference groups, safe integer boundary violations, duplicate sets of correct size, foreign rotation elements, missing inverses, and layer independence).
  - All existing project regression tests (`engine.test.ts`, `importer.test.ts`, `generator.test.ts`, `registry.test.ts`, `dimension.test.ts`, `symmetry_adapter.test.ts`) passed with 0 failures.
- **Status**: `IMPLEMENTED`
- **Known Limitations**: Live external extractor remains deferred to KB-11. Catalog still contains 4 baseline reference groups.

### FSS-KB-11 — Reproducible Crystallographic Data Extraction
- **Objective**: Implement a reproducible extraction pipeline for benchmark space groups (Nos. 1, 2, 14, 19) from pinned Gemmi source into a contract-compliant JSON artifact.
- **Source Verification & Pinned Provenance**:
  - Upstream Source: Project Gemmi (`https://github.com/project-gemmi/gemmi`).
  - Pinned Release & Tag: `v0.7.5`.
  - Full Commit SHA: `5cc1c23c6007e0e6cbd69289c6f7c0bff50e943e`. (The previous `6ea553a` was identified as an unverified placeholder).
  - Pinned Source Table: `src/symmetry.cpp` (`spacegroup_tables::main[564]`) with verified SHA-256 `fae1e4e6f297bbca5ff22126e5f99a54b60d8bcda0f003256558d2bb6426489c`.
  - License: MPL-2.0. Attribution: International Tables for Crystallography (ITA).
- **Implementation**:
  - `scripts/extract_gemmi_data.py`: Downloads or reads local cached Gemmi source, cryptographically verifies source SHA-256, parses `spacegroup_tables::main`, translates Hall symbols (`P 1`, `-P 1`, `-P 2ybc`, `P 2ac 2ab`) using exact rational generators and group closure mod 24, and outputs `data/crystallography/gemmi_benchmark_4.json`.
  - Records canonical SHA-256: `478cb1c0578437cb34c9f656b8d38e8c2ce705ba4e7a929defc24d40ab0e210c`.
- **Validation & Comparison**:
  - Contract Validation (`core/schema/crystallographic_extractor.test.ts`): All 4 groups passed structural, mathematical (identity, two-sided inverses, closure), and provenance checks.
  - Catalog Comparison: Groups 1, 2, and 14 match the legacy catalog 100%. For Group 19 ($P2_12_12_1$), the test revealed a genuine crystallographic difference: Gemmi's Hall extraction produces standard ITA Volume A origin choice ($2_z \to (1/2,0,1/2), 2_x \to (1/2,1/2,0), 2_y \to (0,1/2,1/2)$), whereas the legacy hand-written catalog in `core/registry.ts` had permuted axes.
  - Immutability: Confirmed that legacy catalog was not modified or overwritten.
  - Reproducibility: Confirmed 100% bit-identical artifact across multiple independent runs.
- **Status**: `IMPLEMENTED`
- **Known Limitations**: Limited to the 4 benchmark space groups. Mass import of 230 groups is intentionally deferred.

### FSS-KB-12 — Independent Audit of the Crystallographic Extractor
- **Objective**: Conduct rigorous independent audit of the extraction pipeline, origin settings, and artifact determinism prior to catalog integration.
- **Audit Findings**:
  1. *Source Provenance*: Gemmi source tag `v0.7.5` at commit `5cc1c23c6007e0e6cbd69289c6f7c0bff50e943e` verified via upstream table checksum.
  2. *Origin Setting for Group 19 ($P2_12_12_1$)*: Identified exact origin shift $x_0 = (1/4, 1/4, 1/4)$ transforming ITA Volume A standard setting into the legacy working catalog coordinates identically via $w' = (w + (W - I)x_0) \pmod 1$.
  3. *Zero Unintended Side Effects*: Verified that the geometric engine, UI, and working catalog were completely untouched.
- **Status**: `COMPLETED`

### FSS-KB-13A — Controlled Reference Catalog Integration
- **Objective**: Connect the verified Gemmi reference exchange artifact to FSS research workflows with non-destructive comparison, preserving the working catalog intact.
- **Components Implemented**:
  - `core/reference_loader.ts`:
    1. `ReferenceArtifactLoader`: Loads, parses, and validates exchange artifact JSON against manifest SHA-256 and KB-10 structural/mathematical contracts.
    2. `OriginShiftAnalyzer`: Exact rational origin transformation engine $x' = x - x_0$, computing $w' = (w + (W - I)x_0) \pmod 1$, with exact equivalence prover.
    3. `CrystallographicComparator`: Compares loaded reference records against `core/registry.ts`, reporting verdicts (`MATCH`, `SETTING_MISMATCH`, `OPERATION_MISMATCH`, `INCOMPLETE`, `REFERENCE_INVALID`).
  - `core/reference_loader.test.ts`: Complete test suite covering artifact loading, checksum validation, negative corruptions, origin shift proofs for Group 19 under $x_0 = (1/4, 1/4, 1/4)$, catalog comparison verdicts, and catalog immutability.
- **Status**: `IMPLEMENTED`
- **Catalog Immutability**: `core/registry.ts` remains completely unchanged (unmodified legacy baseline).

### FSS-KB-14 — Derived Group Properties from Exact Operations
- **Objective**: Implement a verified analytical layer deriving mathematical group properties from exact operations based on defined rational arithmetic, avoiding premature modulo 1 reduction where possible.
- **Components Implemented**:
  - `core/group_properties.ts`:
    1. `AffineOperationAlgebra`: Exact 3x3 integer matrix operations ($\det$, $\operatorname{tr}$, crystallographic bound $\{1,2,3,4,6\}$), matrix-vector multiplication with `ExactRational`, and unreduced affine composition $(W_1, w_1) \circ (W_2, w_2) = (W_1 W_2, W_1 w_2 + w_1)$.
    2. `CrystallographicGroupProperties`:
       - *Linear Parts Analysis*: Extracts $W$, orders, determinants, traces, and geometric classes.
       - *Inversion Centers*: Computes midpoint $x_0 = \frac{1}{2} w \pmod 1$ in `ExactRational`.
       - *Operation Powers & Translations*: Computes $(W, w)^k$ up to $k = \operatorname{ord}(W)$, preserving $t_{\text{unreduced}} = \sum_{j=0}^{k-1} W^j w$ to support computation of intrinsic translation $\tau = \frac{1}{k} t_{\text{unreduced}}$.
       - *Traceability*: Records statuses (`VERIFIED`, `INCOMPLETE`, `NOT_APPLICABLE`), tracks limitations.
  - `core/group_properties.test.ts`: Test suite covering crystallographic orders, inversion centers, exact power iteration, translation comparisons, and determinism.
- **Key Scientific Observation**:
  - Preserving unreduced sums $t_{\text{unreduced}}$ avoids loss of intrinsic translation data $\tau$ that can occur during intermediate modulo 1 reduction in screw axes and glides.
- **Status**: `IMPLEMENTED`

### FSS-KB-15 — Evidence-Backed Mathematical Property Reports
- **Objective**: Link derived group properties to the FSS evidence framework, establishing rigorous verification levels, end-to-end traceability (`Reference Record -> Operations -> Calculation -> Result -> Evidence`), and explicit limitation boundaries.
- **Components Implemented**:
  - `core/property_evidence.ts`:
    1. `PropertyEvidence`: Structured evidence container with `evidenceId`, `subject` (group number, setting, symbols), `property`, `sourceRecordId`, `sourceChecksum`, `operationReferences`, `method`, `inputs`, `result`, `verificationStatus`, and `limitations`.
    2. Strict Partitioning of Verification Levels:
       - `SOURCE_VERIFIED`: Artifact SHA-256 integrity and upstream provenance confirmed.
       - `STRUCTURALLY_VALID`: Schema and rational range bounds met.
       - `GROUP_AXIOMS_VERIFIED`: Group closure, identity, and two-sided inverses algebraically verified.
       - `PROPERTY_COMPUTED`: Property produced by deterministic algorithm.
       - `PROPERTY_VERIFIED`: Verified through independent analytical formula or test.
       - `REFERENCE_VERIFIED`: Corroborated by independent external source (not falsely promoted).
       - `INCOMPLETE`: Insufficient operations or missing fields.
       - `CONFLICT`: Checksum mismatch, data corruption, or contradictory claims.
    3. `EvidenceBackedGroupReport`: Complete passport, source provenance, schema/axiom validation summaries, catalog comparison verdict, list of evidences, and unresolved questions.
    4. `CrystallographicEvidenceGenerator`: Generates reports for individual records or entire benchmark suites.
  - `core/property_evidence.test.ts`: Complete test suite covering subject/setting linkage, operation references integrity, exact calculation concordance, data tampering detection, checksum protection, prevention of false promotion to `REFERENCE_VERIFIED`, permutation invariance, origin shift discrepancy preservation, incomplete record handling, and 100-run determinism.
- **Status**: `IMPLEMENTED`

### FSS-KB-15A — Audit Findings Reconciliation
- **Objective**: Reconcile project documentation with independent audit findings (Grok ZIP analysis), specifically addressing provenance versions, origin shift scope, and epistemic status of tests.
- **Findings Reconciled**:
  1. *Origin Choice Equivalence*: Clarified that equivalence for Group 19 is proven for the specific pair (Gemmi vs Registry) under shift $p=(1/4, 1/4, 1/4)$. No universal solver for arbitrary basis/origin choices exists.
  2. *Provenance*: Documented that manifest (`5cc1c23c...`) and registry (`6ea553a`) use different versions.
  3. *Test Status*: Clarified that test `PASS` status refers to the local development environment (where `node_modules` is present); execution within a bare ZIP audit environment is constrained.
- **Status**: `COMPLETED`

### FSS-KB-16 — Centered Lattice (#5, C2)
- **Objective**: Extend benchmark with Space Group No. 5 (monoclinic, standard unique-axis-b, C2).
- **Implementation**:
  - Implemented metadata extraction and axiom validation for C-centering. Verified 4 operations.
- **Status**: `COMPLETED`

### FSS-KB-17 — Add Space Group No. 9 (Cc)
- **Objective**: Extend benchmark with Space Group No. 9 (monoclinic, standard unique-axis-b, Cc).
- **Implementation**:
  - Updated `scripts/extract_gemmi_data.py` to support `Cc` via Hall symbol `C -2yc`.
  - Added group 9 to `TARGET_GROUPS`.
  - Regenerated `data/crystallography/gemmi_benchmark_4.json` (6 records total).
- **Validation**:
  - Verified 4 operations derived from source `5cc1c23c...`.
  - Group 9 exhibits `centering: C`.
  - Note: Group 9 is in the reference artifact but not currently in `core/registry.ts`.
- **Status**: `COMPLETED`

### FSS-CHECKPOINT — Pre-Audit Documentation Freeze (KB-15 Checkpoint)
- **Objective**: Freeze repository state and establish comprehensive audit dossier before independent external review (Grok).
- **Deliverables**:
  - `docs/RESEARCH_CHECKPOINT.md`: Comprehensive audit dossier documenting project mission, implemented architecture, exact data coverage (4 benchmark groups), verification matrix, chronology of milestones KB-01–KB-15, resolved vs open limitations, epistemic evidence policies, and reproduction commands for external reviewers.
  - Updates to `STATUS.md` and `RESEARCH_LOG.md`.
- **Integrity Guarantee**: Zero modifications to code, tests, or reference datasets.
- **Status**: `COMPLETED`

### Mathematical Passport V1 / SG-002 Validation Checkpoint (Corrected Audit)
- **Objective**: Establish and validate the baseline vertical integration slice for Mathematical Passport V1 using SG-002 ($P\bar{1}$), including audit corrections for explicit inversion center coordinate checks and independent point transformation verification.
- **Verified Checks**:
  1. Inversion matrix $W = -I$.
  2. Explicit coordinate checks for inversion center ($c = (0/1, 0/1, 0/1)$).
  3. Fixed point equation $Wc + w = c$ evaluated via exact rational arithmetic.
  4. Independent point transformation $P' = WP + w$ verified against expected coordinates $(-1/4, -1/3, -1/2)$ for test point $P = (1/4, 1/3, 1/2)$.
  5. Computed boolean results `fixedPointOk` and `pointTransformOk`.
  6. Result flag `satisfied = fixedPointOk && pointTransformOk`.
  7. Transmission of values into visualization DTO (`createSG002VisualizationPayload`).
- **Command Results**:
  - `npx tsx core/passport_verification.test.ts`: **PASS** (Exit code 0).
  - `npm run lint` (`tsc --noEmit`): **PASS** (Exit code 0).
  - `npm run build` (`vite build`): **PASS** (Exit code 0).
- **Status**: `PARTIAL / BASELINE VALIDATED FOR SG-002`

### Stage A — Registry Reconciliation and Exact Group Validation
- **Objective**: Reconcile Group No. 9 (`Cc`) into working registry (`core/registry.ts`) from benchmark artifact `gemmi_benchmark_4.json`, preserving distinct provenance, and implement exact finite-set validation in `core/registry.test.ts`.
- **Implementation & Deliverables**:
  - Added Group No. 9 (`Cc`, monoclinic, C-centering, 4 operations) to `core/registry.ts` with explicit provenance pointing to Gemmi commit `5cc1c23c6007e0e6cbd69289c6f7c0bff50e943e`.
  - Updated `core/registry.test.ts` to test completeness for all registered groups (including `Cc`, `P2`, `P21`).
  - Implemented exact finite-set validation: identity presence, closure under composition modulo $\mathbb{Z}^3$ (`mod1()`), existence of inverse for every operation modulo $\mathbb{Z}^3$ with explicit failure reporting identifying setting and operation pair, exact rational arithmetic, and an explicit assertion distinguishing Group No. 5 (`C2`) from Group No. 9 (`Cc`).
- **Command Results**:
  - `npx tsx core/registry.test.ts`: **PASS** (Exit code 0).
  - `npx tsx core/passport_verification.test.ts`: **PASS** (Exit code 0).
  - `npm run lint` (`tsc --noEmit`): **PASS** (Exit code 0).
  - `npm run build` (`vite build`): **PASS** (Exit code 0).
- **Status**: `COMPLETED`

## Research Experiments

### FSS-EXP-02 — Registry-Free Structure Input
- **Changes**:
  - Added field "structure?: CanonicalStructure".
  - "structureId" is now optional.
  - If "structure" is provided, it is used directly.
  - If "structure" is missing, it falls back to lookup via "structureId".
  - Throws explicit error if structure lookup fails.
- **Result**: 27/27 tests passed.

### FSS-EXP-03 — Deformation & Symmetry
- **Setup**:
  - S0: Correct tetrahedron.
  - S1: Uniform scaling of coordinates by 1.1.
  - S2: Deformation of vertex v0 to coordinates (1.5, 1, 1).
- **Operation Tested**: "(x,y,z) → (z,x,y)".
- **Engine-Reported Results**:
  - S0 — VERIFIED
  - S1 — VERIFIED
  - S2 — REJECTED
- **Mathematically Verified**: The operation preserves vertex sets for S0 and S1, but not S2.
- **Limitation**: The experiment verified only a single transformation operation, not the full symmetry group closure.
