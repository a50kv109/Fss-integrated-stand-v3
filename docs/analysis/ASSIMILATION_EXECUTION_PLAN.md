# FSS — ASSIMILATION EXECUTION PLAN
**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `ASSIMILATION_EXECUTION_PLAN.md`  
**Phase:** 3 — Cross-Project Audit and Assimilation Planning  
**Mode:** READ-ONLY EXECUTION PLAN (Awaiting Approval)  
**Date:** 2026-10-11  

---

## 1. Principles of Minimal Safe Execution

1. **Zero Uncontrolled Overwrites**: Never overwrite an existing working module in `core/` with an external file.
2. **Modular Import First**: Introduce new, non-overlapping capabilities (`operation_set_profile.ts`, `operation_set_match.ts`, and their test suites) as isolated modules.
3. **Verify Before Connecting**: Run the new test suites against the isolated modules before connecting them to `server.ts` or `App.tsx`.
4. **Preserve Tested Core**: Studio's 64/64 passing tests in `dimension.test.ts` and 31/31 passing tests in `engine.test.ts` must remain green at every checkpoint.

---

## 2. Step-by-Step Implementation Sequence

### STEP 1: Introduce Isolated Profiler and Tests (The Safe First Step)
- **Objective**: Import GROK's operation-set profiler and test suite into `core/` without touching existing modules.
- **Files to Create**:
  - `core/operation_set_profile.ts` (from GROK)
  - `core/operation_set_profile.test.ts` (from GROK)
  - `tsconfig.tests.json` (from GROK)
- **Dependencies**: Depends on `core/schema/crystallographic_exchange.ts` (`ExactRational`, `canonicalOperationKey`) and `core/group_properties.ts` (`AffineOperationAlgebra`).
- **Required Tests**:
  - Run `npx tsx core/operation_set_profile.test.ts` (verifying T1–T9, T6b multiset deduplication).
  - Verify all existing passing tests (`dimension.test.ts`, `engine.test.ts`, `registry.test.ts`, `passport_verification.test.ts`) still pass.
- **Acceptance Criteria**: `operation_set_profile.test.ts` exits with code 0; `npm run lint` passes with 0 errors.
- **Rollback Strategy**: Delete `core/operation_set_profile.ts` and `core/operation_set_profile.test.ts`.

---

### STEP 2: Introduce Candidate Filter and Soundness Suite
- **Objective**: Import and adapt GROK's candidate filter and strict matcher to query Studio's 8 registered space groups.
- **Files to Create**:
  - `core/operation_set_match.ts` (adapted to query `SymmetryCatalog` in `core/registry.ts`)
  - `core/filter_soundness.test.ts` (from GROK)
  - `core/operation_set_match.test.ts` (from GROK)
- **Dependencies**: `core/operation_set_profile.ts`, `core/registry.ts`.
- **Required Tests**:
  - Run `npx tsx core/filter_soundness.test.ts` (verifying all 16 soundness test cases across Studio's 8 settings).
  - Run `npx tsx core/operation_set_match.test.ts`.
- **Acceptance Criteria**: Both test suites exit with code 0; zero false negatives on all 8 registered settings.
- **Rollback Strategy**: Delete `core/operation_set_match.ts` and the two test files.

---

### STEP 3: Reconcile Studio Test Desynchronization Technical Debt
- **Objective**: Resolve the existing regression in Studio's tests where `recordCount === 4` was hardcoded instead of 8.
- **Files to Modify**:
  - `core/group_properties.test.ts`: Find `P21/c` by `settingId === 'P21/c'` rather than hardcoding index `[2]`.
  - `core/reference_loader.test.ts`: Assert `manifest.recordCount === 8` (or dynamic `artifact.records.length`).
  - `core/property_evidence.test.ts`: Assert reports generated for all loaded benchmark groups.
  - `core/schema/crystallographic_extractor.test.ts`: Update recordCount check to match manifest.
- **Dependencies**: None.
- **Required Tests**:
  - Run all 15 test suites across the repository.
- **Acceptance Criteria**: 100% of repository tests exit with code 0 (15/15 passing).
- **Rollback Strategy**: Revert test edits.

---

### STEP 4: Import v0.2 Research and Roadmap Specifications
- **Objective**: Establish the unified FSS v0.2 design and roadmap documents in `/docs/`.
- **Files to Create**:
  - `docs/FSS_v0.2_RESEARCH_DESIGN.md` (from GROK)
  - `docs/V0.2_ROADMAP.md` (from GROK)
  - `TRANSFER_GUIDE.md` (from GROK)
- **Dependencies**: None (documentation only).
- **Acceptance Criteria**: Clean documentation suite reflecting v0.2 unified architecture.

---

### STEP 5: Expose Classification Endpoint on Server & UI Gateway
- **Objective**: Connect the verified classifier to `server.ts` and optionally provide UI inspection tools.
- **Files to Modify**:
  - `server.ts`: Add `POST /api/classify` endpoint invoking `classifyOperationSet(operations)`.
  - `package.json`: Add `"test": "tsx core/*.test.ts"` and `"engines": { "node": ">=18" }`.
- **Dependencies**: `core/operation_set_match.ts`.
- **Required Tests**:
  - `curl -X POST http://localhost:3000/api/classify` with test operation sets.
  - `npm run lint` and `npm run build`.
- **Acceptance Criteria**: Server responds with typed match results; clean build.
