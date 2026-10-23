# FSS Integrated Research Stand — Engineering Roadmap

**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `docs/ROADMAP.md`  
**Classification:** Canonical Project Roadmap  
**Status:** Active Engineering Plan  
**Last Updated:** 2026-10-11  

---

## 1. Roadmap Principles

* **No Premature Capabilities:** Features are marked as planned, not implemented.
* **Strict Epistemic Progression:** A capability is only exposed to higher tiers (UI, API) after it has passed in-memory unit tests, property tests, and normative contract specification.
* **Zero Magic / Zero Hallucination:** Algorithms must be exact, deterministic, and verifiable.

---

## 2. Development Phases

### Phase 5A — Repository Packaging & Publication Preparation (COMPLETE)
* [x] Complete system inventory and codebase audit.
* [x] Establish canonical documentation suite in `docs/` (`PROJECT_PASSPORT`, `ARCHITECTURE`, `MATHEMATICAL_MODEL`, `CLASSIFIER_CONTRACT`, `INTEGRATION_HISTORY`, `TESTING`, `LIMITATIONS`, `ROADMAP`).
* [x] Create root `README.md`, `CONTRIBUTING.md`, and clean `.env.example`.
* [x] Preserve all Phase 4A–4E analytical artifacts in `docs/analysis/`.
* [x] Record test execution statuses and legacy test debt without modifying production code.
* [x] Gated stop for human repository review.

---

### Phase 5B — Legacy Test Debt Reconciliation (COMPLETE)
* [x] Reconcile stale 4-record expectations in `core/property_evidence.test.ts` (update assertion from 4 to 8, robust predicate lookup).
* [x] Reconcile stale 4-record manifest check in `core/schema/crystallographic_extractor.test.ts` (update assertion from 4 to 8, robust lookup).
* [x] Achieve 15/15 passing test suites across the repository (100% PASS, verified in-environment via `npx tsx`).
* [x] Document execution evidence and artifact consistency in `docs/analysis/PHASE_5B_READINESS_REPORT.md`.

---

### Phase 5C — Packaging Repair & Epistemic Boundary Hardening (COMPLETE)
* [x] Package run script repair: updated `npm start` to execute `tsx server.ts` with `"engines": { "node": ">=18" }` (fixing Node native ESM resolution failure).
* [x] Verified full suite independent execution (RERUN: 15/15 PASS, clean `tsc --noEmit`, clean `vite build`, successful server startup smoke test).
* [x] Synchronized root and specialized documentation (`STATUS.md`, `ROADMAP.md`, `README.md`, `docs/CLASSIFIER_CONTRACT.md`, `docs/LIMITATIONS.md`).
* [x] Hardened epistemic boundaries against overclaiming universal soundness, origin shifts beyond SG 19, or isomorphism beyond canonical representations.
* [x] Production math core and 8-setting registry strictly preserved with zero alterations.

---

### Phase 5D — Controlled REST API & UI Matcher Exposure (COMPLETE)
* [x] Implement `POST /api/classify` in `server.ts` with strict input validation.
* [x] Ensure API responses adhere strictly to `TwoStageMatchReport` and `FSS_CLASSIFIER_CONTRACT.md`.
* [x] Perform independent API boundary testing.

---

### Phase 5E — Classifier UI Integration (PARTIALLY_EXPOSED_API)
* [x] Create React ClassifierUI component (`components/ClassifierUI.tsx`).
* [x] Integrate with `POST /api/classify` in `server.ts`.
* [ ] Add tab-based navigation for experiment vs. classifier (unexposed; view state initialized in `App.tsx` without navigation switcher).
* [x] Verify UI component implementation against API contract.

---

### Phase 5F — Group Closure Engine (ISOLATED_MODULE_TESTED)
* [x] Implement deterministic group closure from affine generators modulo $\mathbb{Z}^3$ on BigInt (`core/group_closure.ts`).
* [x] Verified isolated test suite T1–T15 (`core/group_closure.test.ts`) per execution report.
* [ ] Architectural decision on potential matcher/API pipeline integration (unwired research module).

---

### Phase 5G — STL V1 Module Assimilation (COMPLETED — 2026-10-13)
* [x] Transferred 6 canonical files to `core/stl/` (`exact_scalar.ts`, `exact_matrix.ts`, `conjugacy.ts`, `index.ts`, `conjugacy.test.ts`, `README.md`).
* [x] Established autonomous exact matrix arithmetic on BigInt and deterministic conjugacy verification $g' = P^{-1} g P$ for $n \in \{2, 3\}$.
* [x] Verified native test suite: `npx tsx core/stl/conjugacy.test.ts` (7/7 PASS).
* [x] Verified 16/16 FSS core regression test suites via `npx tsx` (all exit code 0).
* [x] Verified clean static analysis (`npm run lint`: 0 errors) and production build (`npm run build`).
* [x] Established formal module passport and negative boundaries in `core/stl/README.md`.

---

### Phase 6 — Catalog Expansion & Reconciliation (Path to 230 Space Groups)
* [ ] Reconcile SG 76 ($P4_1$) between `core/registry.ts` and `REGISTERED_SETTING_IDS` with test coverage.
* [ ] Design automated ingestion pipeline for International Tables for Crystallography (ITA) Volume A data.
* [ ] Ingest and validate triclinic, monoclinic, and orthorhombic space groups (Nos. 1–74).
* [ ] Expand to tetragonal, trigonal, hexagonal, and cubic crystal families (Nos. 75–230).
* [ ] Implement exact Delaunay/Niggli lattice reduction for arbitrary change-of-basis identification ($GL_3(\mathbb{Z})$).

