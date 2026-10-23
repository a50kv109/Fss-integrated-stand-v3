# FSS Integrated Research Stand — Integration History

**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `docs/INTEGRATION_HISTORY.md`  
**Classification:** Canonical Integration Provenance History  
**Status:** Complete Post-Phase 4E History  
**Last Updated:** 2026-10-11  

---

## 1. Provenance Overview: Studio FSS & GROK v0.1.1

The **FSS Integrated Research Stand** was formed by the controlled architectural integration of two independent crystallographic software efforts:

1. **Studio FSS Baseline (Fedorov Symmetry Reasoning Stand):**  
   Developed within Google AI Studio as an interactive 3D stand for deterministic symmetry reasoning. It contributed the vector-affine geometry engine (`core/engine.ts`), affine dimensionality reduction (`core/dimension.ts`), interactive Three.js viewport (`components/TetrahedronViewport.tsx`), exact rational schema with BigInt (`core/schema/crystallographic_exchange.ts`), and an 8-setting reference catalog (`core/registry.ts`, based on Gemmi benchmark data).
2. **GROK v0.1.1 Development Archive (Donor Research):**  
   Provided as an external research archive containing an experimental two-stage space group classification pipeline: an algebraic operation invariant profiler and a canonical key candidate matcher, originally developed against a 4-setting prototype catalog.

---

## 2. Chronological Integration Phases

### Phase 1–3: Architectural Reconnaissance & Gap Analysis
* **Activities:** Detailed source code inspection of the GROK v0.1.1 archive against Studio baseline.
* **Findings:** GROK contained valuable algebraic profiling and fast candidate pruning algorithms. However, blind file replacement would have overwritten Studio's 8-setting catalog and BigInt rational arithmetic with an older 4-setting prototype.
* **Decision:** Execute a **controlled, bounded assimilation** (Assimilation Decision Matrix). Only the isolated profiler and matcher modules were selected for adaptation, leaving Studio's core intact.
* **Archival Documents:**
  - `docs/analysis/GROK_ARCHITECTURE_PASSPORT.md`
  - `docs/analysis/GROK_MODULE_CATALOG.md`
  - `docs/analysis/GROK_BASELINE_MANIFEST.md`
  - `docs/analysis/GROK_INTEGRATION_CANDIDATES.md`
  - `docs/analysis/GROK_V02_IMPLEMENTATION_GAP.md`
  - `docs/analysis/CROSS_PROJECT_COMPARISON.md`
  - `docs/analysis/ASSIMILATION_DECISION_MATRIX.md`
  - `docs/analysis/ASSIMILATION_EXECUTION_PLAN.md`
  - `docs/analysis/ASSIMILATION_RISKS_AND_TESTS.md`

---

### Phase 4A: Pre-Integration Validation Gate
* **Goal:** Verify baseline stability of Studio before any code modification.
* **Results:**
  - `core/dimension.test.ts`: PASS (64/64 tests)
  - `core/engine.test.ts`: PASS (31/31 tests)
  - `core/reference_loader.test.ts` & `core/group_properties.test.ts`: Reproduced expected test failures caused by stale assumptions of a 4-record catalog (the catalog had been expanded to 8 settings, but test assertions still expected 4).
* **Gate Status:** Integration halted to prepare bounded patch plan without touching failing files.
* **Archival Document:** `docs/analysis/PHASE_4A_PREINTEGRATION_VALIDATION.md`

---

### Phase 4B: Bounded Profiler Integration
* **Goal:** Integrate only `core/operation_set_profile.ts` and `core/operation_set_profile.test.ts`.
* **Adaptations:** Adapted GROK's profiler to use Studio's `ExactRational` and `canonicalOperationKey` from `core/schema/crystallographic_exchange.ts`.
* **Results:**
  - Profiler unit tests passed with Exit Code 0.
  - Existing engine, dimension, and catalog modules remained untouched (0 edits).
* **Archival Document:** `docs/analysis/PHASE_4B_PROFILE_INTEGRATION.md`

---

### Phase 4C: Regression Test Debt Reconciliation
* **Goal:** Resolve stale test assumptions in `reference_loader.test.ts` and `group_properties.test.ts` without modifying production source code.
* **Fixes Applied:**
  - Updated record count assertions from 4 to 8 in `core/reference_loader.test.ts`.
  - Replaced fragile positional array indexing (`records[2]`) with stable setting lookups (`findBySettingId('P21/c')`) in `core/group_properties.test.ts`.
* **Results:** All 7 test suites, linter, and build passed with Exit Code 0. Zero production code files were modified.
* **Archival Document:** `docs/analysis/PHASE_4C_REGRESSION_RECONCILIATION.md`

---

### Phase 4D: Controlled Candidate Matcher Integration
* **Goal:** Integrate `core/operation_set_match.ts` and `core/filter_soundness.test.ts`.
* **Adaptations:**
  - Configured `getDefaultCatalog()` to read all 8 registered settings in `core/registry.ts`.
  - Implemented exact set vs. multiset duplicate detection.
  - Implemented ITA Volume A origin shift equivalence check $\vec{x}_0 = (1/4, 1/4, 1/4)$ for Group 19.
* **Results:** All 10 mandated requirements (T1–T10) and 16 extended soundness scenarios (S1–S16) passed with Exit Code 0. Zero production modules were modified.
* **Archival Document:** `docs/analysis/PHASE_4D_MATCHER_INTEGRATION.md`

---

### Phase 4E: Documentation Reconciliation Gate
* **Goal:** Reconcile documentation with actual code capabilities and resolve over-strong claims.
* **Results:**
  - Established Level 1 Normative Contract (`docs/analysis/FSS_CLASSIFIER_CONTRACT.md`).
  - Established Level 2 Architecture Specification (`docs/analysis/FSS_CLASSIFIER_ARCHITECTURE.md`).
  - Established Level 3 Evidence Matrix (`docs/analysis/FSS_CLASSIFIER_EVIDENCE_MATRIX.md`).
  - Appended Epistemic Reconciliation Addendum to `docs/analysis/PHASE_4D_MATCHER_INTEGRATION.md` clarifying that soundness is mathematically proven for the 8 registered settings, not universal infinite domains.
  - Re-confirmed that REST API and UI remain disconnected from the matcher.

---

## 3. Donor Attribution & Licensing Notes

* **GROK Intellectual Heritage:** The algorithmic concepts of the two-stage invariant profiler (matrix order spectrum, trace histograms) and strict canonical matching originated in the GROK v0.1.1 research project.
* **Adaptation Work:** All integration code was adapted to Studio's type system, Euclidean BigInt rational arithmetic, and 8-setting catalog by the FSS engineering team.
* **Licensing Status:** Neither the original Studio FSS prototype nor the GROK v0.1.1 archive contained formal SPDX license headers. A formal open-source license must be selected and approved by project stakeholders prior to public release. See `docs/LIMITATIONS.md` (Section 4).
