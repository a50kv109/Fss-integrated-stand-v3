# FSS — Status

**Status:** Integrated Theoretical Research Stand (`PHASE 5G COMPLETED: STL V1 INTEGRATED; PHASE 5E PARTIALLY EXPOSED`)  
**Last Updated:** 2026-10-13  

## Current Execution & Verification Status
- **Core Regression Test Harness:** 16 / 16 FSS core regression test suites PASS cleanly (exit code 0, verified 2026-10-13 via `npx tsx`).
- **STL V1 Module Status:** `INTEGRATED_STANDALONE_MODULE` (7/7 native test scenarios PASS in `core/stl/conjugacy.test.ts` on 2026-10-13; standalone library in `core/stl/`).
- **GCL-01 Module Status:** `ISOLATED_MODULE_TESTED` (T1–T15 pass in `core/group_closure.test.ts`; unwired from API, UI, or matcher).
- **Static Analysis (`lint`):** PASS (0 errors, verified 2026-10-13 via `npm run lint`).
- **Production Build (`build`):** PASS (verified 2026-10-13 via `npm run build` / `compile_applet`).
- **Production Runtime (`start`):** PASS (`tsx server.ts`).
- **HTTP API Test Caveat:** `REPORTED_PASS_WITH_CAVEAT` (Phase 5D historical report passed assertions T1–T5, but process did not exit cleanly due to open server sockets; **not** re-run in 2026-10-13 regression pass; unit pass and build do NOT mean HTTP test caveats are closed).
- **Catalog Boundaries & SG 76 Divergence:** 8 space group settings in classifier catalog (`REGISTERED_SETTING_IDS`), 9 settings in `core/registry.ts` (SG 76 / $P4_1$ is registered, but excluded from classifier catalog and returns `NO_CANDIDATES`).
- **Classifier UI Exposure:** API endpoint implemented via `POST /api/classify` in `server.ts`; UI component present in `components/ClassifierUI.tsx`, but navigation switcher is unexposed in `App.tsx` (remains active tetrahedron experiment view).

## Project Phases
- **Phases 1–4E**: Foundation, Geometry, and Assimilation (`COMPLETED`)
- **Phase 5A**: Standalone Repository Architecture (`COMPLETED`)
- **Phase 5B**: Legacy Test Debt Reconciliation (`COMPLETED`)
- **Phase 5C**: Packaging Repair & Epistemic Hardening (`COMPLETED`)
- **Phase 5D**: Controlled REST API & UI Matcher Exposure (`COMPLETED`)
- **Phase 5E**: Classifier UI Integration (`PARTIALLY_EXPOSED_API`: API & `ClassifierUI` implemented, user navigation unexposed)
- **Phase 5F**: Group Closure Engine (`ISOLATED_MODULE_TESTED`; unwired research module)
- **Phase 5G**: STL V1 Module Assimilation (`COMPLETED` — 2026-10-13: exact matrix conjugacy library in `core/stl/`)
- **Phase 6**: Catalog Expansion & $P4_1$ Reconciliation (`PLANNED`)

## Component Status Matrix
| Component / Path | Status | Verification & Operational Note |
| :--- | :--- | :--- |
| `core/stl/` (STL V1) | `INTEGRATED_STANDALONE_MODULE` | Exact matrix arithmetic on BigInt & $g' = P^{-1} g P$; 7/7 native tests PASS (2026-10-13). Autonomous library. |
| `core/group_closure` (GCL-01) | `ISOLATED_MODULE_TESTED` | BFS closure from generators modulo $\mathbb{Z}^3$ on BigInt; T1–T15 pass per execution report. Unwired. |
| `core/` (Geometry Engine) | `ACTIVE_IN_UI` | Regular tetrahedron 3D experiment via `core/engine.ts`; tested (31/31 PASS). |
| `core/dimension` | `IMPLEMENTED` | Scale-invariant affine dimensionality analysis (64/64 PASS). |
| `core/operation_set_profile` | `IMPLEMENTED` | Algebraic invariant profiler (EXP-09, T1–T10 PASS). |
| `core/operation_set_match` | `PARTIALLY_EXPOSED_API` | Two-stage candidate matcher (8 settings); queried by `/api/classify` in `server.ts`; UI tab unexposed. |
| `core/registry.ts` (SG 76 / $P4_1$) | `REGISTERED_EXCLUDED_FROM_CLASSIFIER` | 9 settings defined in registry; SG 76 excluded from 8-setting classifier catalog. |
| `App` (UI / Viewport) | `ACTIVE_IN_UI` | Active 3D tetrahedron stand; `/api/classify` reachable via API; UI navigation switcher unexposed. |
| `Evidence Generation` | `IMPLEMENTED` | Geometric `Evidence` (M-5F), PropertyEvidence (KB-15), and STL `ConjugacyResult`. |
| `Automated Basis Discovery` | `NOT_IMPLEMENTED` | Basis matrix $P$ must be supplied explicitly; automated search in $GL_3(\mathbb{Z})$ not implemented. |
| `230 Space Group Catalog` | `NOT_IMPLEMENTED` | Fast classifier evaluates 8 settings; full 230 catalog planned for Phase 6. |


