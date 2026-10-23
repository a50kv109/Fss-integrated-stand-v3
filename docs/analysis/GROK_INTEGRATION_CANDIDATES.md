# GROK — INTEGRATION CANDIDATES
**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Edition:** GROK Independently Developed Release (v0.1.1)  
**Document:** `GROK_INTEGRATION_CANDIDATES.md`  
**Phase:** 2 — Deep Architecture Decomposition  
**Mode:** READ-ONLY INTEGRATION CLASSIFICATION  
**Inspection Date:** 2026-10-11  

---

## 1. Classification Framework

Every module in the GROK archive is evaluated for its future integration role into the unified FSS project:
- `PRESERVE_CANDIDATE`: Novel, high-value functionality that should be retained and brought into the unified project.
- `ADAPTATION_CANDIDATE`: Valuable logic that requires interface or schema alignment with Studio's validated core.
- `DUPLICATION_CANDIDATE`: Overlaps with functionality already validated in Studio; requires side-by-side verification before deciding precedence.
- `REIMPLEMENTATION_CANDIDATE`: Conceptually sound, but code needs rework to comply with unified invariants.
- `RESEARCH_ONLY`: Specifications, roadmaps, or design documents providing guidance rather than executable code.

---

## 2. Component-by-Component Integration Evaluation

### Category A: `PRESERVE_CANDIDATE` (High-Value Additions)

#### 1. `core/operation_set_profile.ts` (`GROK-PRF-01`)
- **Integration Role**: `PRESERVE_CANDIDATE`
- **Value**: Provides coordinate-independent algebraic profiling: orders histogram $\{1, 2, 3, 4, 6\}$, centrosymmetry detection, determinant distribution, trace spectrum, and distinct operation counting.
- **Why It Matters**: Studio currently lacks a standalone operation-set profiler. Studio has `AffineOperationAlgebra` and `CrystallographicGroupProperties` in `core/group_properties.ts`, but does not aggregate them into a single, compact `OperationSetProfile` signature.
- **Dependencies**: Depends only on `ExactRational` and `canonicalOperationKey`. Easily decoupled.
- **Conflicts**: Minimal. Interfaces with existing types seamlessly.

#### 2. `core/operation_set_match.ts` (`GROK-MCH-01`)
- **Integration Role**: `PRESERVE_CANDIDATE`
- **Value**: Implements two-stage classification: profile-based candidate filtering with guaranteed soundness (no false negatives), followed by strict element-by-element matching.
- **Why It Matters**: Solves the core FSS problem of classifying an unknown symmetry operation set against the registry.
- **Dependencies**: `core/operation_set_profile.ts`, `core/registry.ts`.
- **Conflicts**: Must be updated to match against Studio's 8-group catalog (`core/registry.ts`) rather than GROK's 4-group catalog.

#### 3. `core/filter_soundness.test.ts` (`GROK-TST-01`)
- **Integration Role**: `PRESERVE_CANDIDATE`
- **Value**: 16 rigorous test cases demonstrating that the candidate filter never incorrectly eliminates a valid space group.
- **Integration Requirement**: Adapt to run against both 4-group and 8-group catalogs.

#### 4. `core/operation_set_profile.test.ts` (`GROK-TST-02`)
- **Integration Role**: `PRESERVE_CANDIDATE`
- **Value**: Verifies profiler behavior across tests T1–T9 and T6b (duplicate rejection, distinct operation counts, order histograms).

---

### Category B: `ADAPTATION_CANDIDATE` (Requires Reconciliation)

#### 5. `core/registry.ts` (`GROK-REG-01`)
- **Integration Role**: `ADAPTATION_CANDIDATE`
- **Current State in GROK**: Contains 4 benchmark space groups (Nos. 1, 2, 14, 19) with fingerprint `6e426d1d18130de3`.
- **Current State in Studio**: Contains 8 space groups (Nos. 1, 2, 3, 4, 5, 9, 14, 19) reconciled in Stage A with verified Hall symbols and C-centering operations.
- **Assimilation Strategy**: **PRESERVE STUDIO'S 8-GROUP REGISTRY**, but compute and expose GROK's canonical profiling signatures for all 8 groups so that GROK's `filterCandidates` can query the expanded registry.

#### 6. `package.json` (`tsconfig.tests.json`)
- **Integration Role**: `ADAPTATION_CANDIDATE`
- **Current State in GROK**: Declares `tsx` in runtime `"dependencies"`, adds `"engines": { "node": ">=18" }`, and provides `tsconfig.tests.json`.
- **Current State in Studio**: `tsx` is only in devDependencies; no `tsconfig.tests.json`.
- **Assimilation Strategy**: Adopt GROK's runtime configuration (`engines.node`, `tsconfig.tests.json`) and add a proper `"test"` script (`"test": "tsx core/*.test.ts"`) to resolve Studio's existing `MISSING_CONTRACT` technical debt.

---

### Category C: `DUPLICATION_CANDIDATE` (Studio Precedence)

#### 7. `core/engine.ts` (`GROK-ENG-01`)
- **Integration Role**: `DUPLICATION_CANDIDATE` (Prefer Studio)
- **Evaluation**: Both implementations derive from the same canonical polyhedral engine. Studio's version includes explicit `validateStructureIntegrity` (self-loop edge rejection, duplicate vertex IDs) and full edge topology bijection checks developed in milestone M-5F.
- **Decision**: Retain Studio's `core/engine.ts`.

#### 8. `core/dimension.ts` (`GROK-DIM-01`)
- **Integration Role**: `DUPLICATION_CANDIDATE` (Prefer Studio)
- **Evaluation**: Studio's `core/dimension.ts` is fully verified with 64/64 tests covering planar and spatial anchor frames, scale invariance, and condition status.
- **Decision**: Retain Studio's `core/dimension.ts`.

#### 9. `core/schema/crystallographic_exchange.ts` (`GROK-XCH-01`)
- **Integration Role**: `DUPLICATION_CANDIDATE` (Prefer Studio)
- **Evaluation**: Studio's version includes BigInt-backed `ExactRational` with safe integer boundaries, two-sided inverse checks, and duplicate operation rejection audited in KB-10A.
- **Decision**: Retain Studio's `core/schema/crystallographic_exchange.ts`.

#### 10. `core/group_properties.ts` and `core/property_evidence.ts`
- **Integration Role**: `DUPLICATION_CANDIDATE` (Prefer Studio)
- **Evaluation**: Studio's version implements unreduced affine powers $t_{\text{unreduced}}$, intrinsic translation $\tau$, centrosymmetry midpoint $x_0 = \frac{1}{2} w \pmod 1$, and 8-level property evidence reporting.
- **Decision**: Retain Studio's implementation; update unit test assertions to match the 8-group catalog.

---

### Category D: `RESEARCH_ONLY` (Design Guidance)

#### 11. `docs/FSS_v0.2_RESEARCH_DESIGN.md` & `docs/V0.2_ROADMAP.md`
- **Integration Role**: `RESEARCH_ONLY`
- **Value**: Authoritative architectural blueprint for v0.2. Crucially, Studio has already implemented several aspects of C1 (closure/inverses), C3 (origin shift), and C4 (inversion center) in code, while GROK implemented the profiling and filtering layers!
- **Assimilation Action**: Preserve in `/docs/` as the unifying design standard for the consolidated v0.2 release.
