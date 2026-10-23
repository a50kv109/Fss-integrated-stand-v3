# GROK — MODULE CATALOG
**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Edition:** GROK Independently Developed Release (v0.1.1)  
**Document:** `GROK_MODULE_CATALOG.md`  
**Phase:** 2 — Deep Architecture Decomposition  
**Mode:** READ-ONLY MODULE CATALOG  
**Inspection Date:** 2026-10-11  

---

## Catalog of Modules in GROK Archive

### 1. Profiling & Invariant Extraction Layer

#### `GROK-PRF-01`: Operation-Set Profiler (`core/operation_set_profile.ts`)
- **File**: `core/operation_set_profile.ts`
- **Responsibility**: Computes a coordinate-system-independent algebraic signature from an arbitrary list of symmetry operations. Solves the problem of characterizing an unknown operation set without committing to a specific space-group setting.
- **Inputs**: Array of symmetry operations (`{ W: number[][]; w: Rational[] }[]`).
- **Outputs**: `OperationSetProfile` structure containing:
  - `totalCount`: Number of input operations.
  - `distinctCount`: Number of unique operations modulo unit-cell translations.
  - `hasDuplicates`: Boolean flag indicating multiset multiplicity.
  - `orderHistogram`: Counts of operations of order 1, 2, 3, 4, 6.
  - `hasInversion`: Boolean indicating presence of $W = -I_3$.
  - `determinantDistribution`: Counts of proper rotations ($\det = +1$) vs improper rotations ($\det = -1$).
  - `traceDistribution`: Multiset of matrix traces.
  - `translationTypes`: Summary of translation fractions (zero, half, glide fractions).
- **Dependencies**: `core/schema/crystallographic_exchange.ts` (`ExactRational`, `canonicalOperationKey`), `core/group_properties.ts` (`AffineOperationAlgebra`).
- **Consumers**: `core/operation_set_match.ts`, `core/operation_set_profile.test.ts`.
- **Contracts**:
  - *Preconditions*: Operations must have 3x3 integer matrices and positive rational denominators.
  - *Postconditions*: Order histogram sums exactly to `distinctCount`. All orders belong to $\{1, 2, 3, 4, 6\}$ (crystallographic restriction).
- **Tested Behaviors**: Tests T1–T9 and T6b in `core/operation_set_profile.test.ts` (handling duplicates, improper rotations, order counts, identity presence).
- **Integration Importance**: **CRITICAL** (Core asset of EXP-09; absent from the original Studio Remix).

---

### 2. Candidate Filtering & Matching Layer

#### `GROK-MCH-01`: Operation-Set Matcher & Candidate Filter (`core/operation_set_match.ts`)
- **File**: `core/operation_set_match.ts`
- **Responsibility**: Implements two-stage space-group classification: rapid candidate pruning using invariant profiles, followed by strict element-by-element set equality.
- **Inputs**: Query operation set, candidate space group catalog or target setting ID.
- **Outputs**:
  - `CandidateFilterResult`: List of compatible space-group candidates with match reasons.
  - `StrictMatchResult`: Boolean verdict, matched setting ID, confidence level, and discrepancy report.
- **Dependencies**: `core/operation_set_profile.ts`, `core/registry.ts`, `core/schema/crystallographic_exchange.ts`.
- **Consumers**: `server.ts` (EXP-09 classify API), `core/filter_soundness.test.ts`, `core/operation_set_match.test.ts`.
- **Contracts**:
  - *Soundness Invariant*: `filterCandidates` must never prune a space group if the query operations represent a valid setting of that group (zero false negatives).
  - *Precision Invariant*: `matchStrict` requires 100% element-by-element correspondence modulo lattice translations.
- **Tested Behaviors**: 16 distinct test cases in `core/filter_soundness.test.ts`.
- **Integration Importance**: **CRITICAL** (Provides the missing bridge between candidate operations and registry records).

---

### 3. Registry & Data Layer

#### `GROK-REG-01`: Working Symmetry Catalog (`core/registry.ts`)
- **File**: `core/registry.ts`
- **Responsibility**: Provides working in-memory storage of reference crystallographic space group settings.
- **Inputs**: Query by group number or setting ID.
- **Outputs**: `DetailedSymmetryRecord` for matching.
- **Dependencies**: `core/symmetry_adapter.ts`.
- **Contents**: Exactly 4 reference settings:
  - SG 1: `P1` (1 op)
  - SG 2: `P-1` (2 ops)
  - SG 14: `P21/c` (4 ops)
  - SG 19: `P212121` (4 ops)
- **Declared Fingerprint**: `6e426d1d18130de3`.
- **Integration Importance**: **HIGH** (Requires reconciliation with Studio's 8-group catalog).

---

### 4. Geometric & Dimensionality Engine

#### `GROK-ENG-01`: Polyhedral Symmetry Verification Engine (`core/engine.ts`)
- **File**: `core/engine.ts`
- **Responsibility**: Pure deterministic verification of 3D polyhedral symmetries. Identical to original core.
- **Integration Importance**: **PRESERVE EXISTING STUDIO CORE** (Studio core has additional edge-topology and bipartite matching hardening).

#### `GROK-DIM-01`: Affine Dimensionality Analyzer (`core/dimension.ts`)
- **File**: `core/dimension.ts`
- **Responsibility**: Evaluates affine dimension (0–3), barycenter, and anchor frames.
- **Integration Importance**: **PRESERVE EXISTING STUDIO CORE** (Studio core is fully tested with 64/64 tests).

---

### 5. Research Design & Specification Layer

#### `GROK-DOC-01`: v0.2 Research Design (`docs/FSS_v0.2_RESEARCH_DESIGN.md`)
- **File**: `docs/FSS_v0.2_RESEARCH_DESIGN.md`
- **Responsibility**: Architectural design specification for the next version of FSS. Defines criteria C1–C4:
  - **C1**: Exact closure under composition and two-sided inverses modulo lattice translations.
  - **C2**: Closed multiset / distinct operations handling.
  - **C3**: Bounded origin-shift search and equivalence proving.
  - **C4**: Exact inversion-center midpoint derivation.
  - **Layered Evidence**: Strict partitioning of hypothesis, profile, filter, match, and proof.
- **Status**: `DESIGN_ONLY` (Specified for future implementation; not implemented in v0.1.1).
- **Integration Importance**: **CRITICAL SPECIFICATION** (Guides assimilation and validation).

#### `GROK-DOC-02`: v0.2 Implementation Roadmap (`docs/V0.2_ROADMAP.md`)
- **File**: `docs/V0.2_ROADMAP.md`
- **Responsibility**: Phased execution plan (P0 through P4) detailing milestones, gates, and acceptance criteria.
- **Integration Importance**: **HIGH** (Provides roadmap for Phase 3 and Phase 4 work).

#### `GROK-DOC-03`: Clean Execution & Release Reports (`docs/RELEASE_*.md`, `docs/REPRODUCIBLE_*.md`)
- **Files**: `docs/RELEASE_INTEGRITY_v0.1.1.md`, `docs/REPRODUCIBLE_EXECUTION_v0.1.1.md`, `TRANSFER_GUIDE.md`
- **Responsibility**: Records test results, environment assertions, and handoff protocols.
- **Integration Importance**: **AUDIT EVIDENCE**.
