# FSS — Known Limitations & Prohibited Claims

**Project:** Fedorov Symmetry Stand (FSS)  
**Document:** `docs/LIMITATIONS.md`  
**Classification:** Canonical Constraints Specification  
**Status:** Active Epistemic Guide (Post-STL V1 Integration)  
**Last Updated:** 2026-10-13  

---

## 1. Prohibited Mathematical & Epistemic Claims

To preserve scientific rigor, all developers, documentation authors, and API consumers must adhere to the following negative boundaries. The following assertions are **strictly prohibited or false** in the current system:

1. ❌ **PROHIBITED:** *"FSS classifies all 230 space groups."*  
   * **Reality:** The working classifier catalog contains exactly **8 space group settings** (Nos. 1, 2, 3, 4, 5, 9, 14, 19). While 9 settings are declared in `core/registry.ts` (including SG 76 / $P4_1$), $P4_1$ is explicitly omitted from `REGISTERED_SETTING_IDS` and from `gemmi_benchmark_4.json`. Queries outside the 8 catalog settings return `NO_CANDIDATES`, `OPERATION_MISMATCH`, or `SETTING_MISMATCH`; they never return `EXACT_MATCH`.
2. ❌ **PROHIBITED:** *"Setting 76 ($P4_1$) is classified because it is present in registry.ts."*  
   * **Reality:** SG 76 is a registered data structure in `core/registry.ts`, but the two-stage classifier `core/operation_set_match.ts` filters candidates strictly against the 8-setting catalog. Input operations matching $P4_1$ return `NO_CANDIDATES`.
3. ❌ **PROHIBITED:** *"Matching the invariant profile proves that the input is space group X."*  
   * **Reality:** The profile matches necessary linear invariants (orders, traces, determinants, inversion). Distinct groups sharing identical linear invariants (e.g. $P2$ and $P2_1$) have identical profiles. Only Stage 2 strict canonical key matching can distinguish them.
4. ❌ **PROHIBITED:** *"FSS supports arbitrary or continuous origin shifts."*  
   * **Reality:** FSS evaluates origin shift equivalence **exclusively** for the specific standard shift $\vec{x}_0 = (1/4, 1/4, 1/4)$ in Space Group 19 ($P2_12_12_1$). An input with an arbitrary continuous or non-standard origin shift evaluates to `OPERATION_MISMATCH`.
5. ❌ **PROHIBITED:** *"The matcher automatically computes group closure from generators."*  
   * **Reality:** The classifier compares the query multiset against the complete registered list of operations. An incomplete generator set returns `OPERATION_MISMATCH`. While an isolated research module `core/group_closure.ts` exists (`ISOLATED_MODULE_TESTED`), it is intentionally not wired to the matcher.
6. ❌ **PROHIBITED:** *"Passing test suites constitutes a universal mathematical proof of soundness."*  
   * **Reality:** Passing unit tests validates the implementation over tested finite inputs and registered catalog settings. It is not an unbounded formal proof over infinite mathematical domains.
7. ❌ **PROHIBITED:** *"FSS recognizes space groups under arbitrary change of basis ($GL_3(\mathbb{Z})$)."*  
   * **Reality:** General affine basis change (e.g., lattice reduction via Niggli or Delaunay) is not implemented in the classifier. Operations must be provided in the conventional coordinate orientation of the registered setting.
8. ❌ **PROHIBITED:** *"STL V1 conjugacy verification proves that a matrix set forms a mathematical group."*  
   * **Reality:** Status `CONJUGACY_VERIFIED` in `core/stl/` confirms strictly the algebraic identity $g' = P^{-1} g P$ for the supplied matrix list. It does *not* verify closure under multiplication, existence of inverses, identity element existence, or group associativity.
9. ❌ **PROHIBITED:** *"STL V1 automatically discovers the basis transformation matrix $P$."*  
   * **Reality:** Matrix $P$ must be explicitly provided by the caller and must be invertible ($\det P \neq 0$). Automated discovery of $P$ between arbitrary matrix representations is `NOT_IMPLEMENTED`.
10. ❌ **PROHIBITED:** *"STL V1 operates on arbitrary matrix dimensions."*  
    * **Reality:** STL V1 strictly enforces `MatrixDim = 2 | 3`. Matrices of dimension $n \notin \{2, 3\}$ return status `UNSUPPORTED_INPUT`.

---

## 2. Technical & Algorithmic Gaps & Implementation Matrix

| Capability / Subsystem | Implementation Status | Current Behavior / Impact | Target Resolution |
|:---|:---:|:---|:---|
| **230 Space Group Catalog** | `NOT_IMPLEMENTED` (8/230 in matcher) | Queries outside 8 catalog settings return `NO_CANDIDATES` or mismatch. | Ingest full ITA Volume A data tables (Phase 6). |
| **SG 76 ($P4_1$) in Classifier** | `REGISTERED_EXCLUDED_FROM_CLASSIFIER` | SG 76 exists in `core/registry.ts`, but absent from `REGISTERED_SETTING_IDS`; returns `NO_CANDIDATES`. | Reconcile benchmark artifact and add to `REGISTERED_SETTING_IDS` with test coverage. |
| **Dynamic Group Closure** | `ISOLATED_MODULE_TESTED` (GCL-01) | T1–T15 pass in `core/group_closure.test.ts`. Module is unwired from matcher and API. | Architectural decision on matcher pipeline integration. |
| **STL V1 Matrix Conjugacy** | `INTEGRATED_STANDALONE_MODULE` | T1–T7 pass in `core/stl/conjugacy.test.ts`. Standalone library in `core/stl/`; unwired from UI/API. | Maintained as an autonomous exact algebraic tool. |
| **Continuous Origin Shift Solver** | `NOT_IMPLEMENTED` (1 discrete shift) | Non-standard origin choices cannot be mapped. | Rational linear programming solver for origin shifts. |
| **Lattice Reduction ($GL_3(\mathbb{Z})$)** | `NOT_IMPLEMENTED` | Non-conventional cell settings evaluate to `OPERATION_MISMATCH`. | Implement Delaunay/Gruber lattice reduction. |
| **Classifier UI / REST Exposure** | `PARTIALLY_EXPOSED_API` | `/api/classify` implemented in `server.ts`; `ClassifierUI` exists; UI navigation tab unexposed in `App.tsx`. | Expose UI navigation upon formal approval of API contract. |

---

## 3. In-Depth Architectural Analysis: Space Group 76 ($P4_1$) Discrepancy

### 3.1. Verification of Codebase State
A systematic audit of Space Group 76 ($P4_1$) across the FSS codebase reveals an intentional architectural divergence between the data registry and the active classifier catalog:

1. **Presence in `core/registry.ts`:**
   - Defined under `groupNumber: 76`, `settingId: "P41"`, `hmSymbol: "P 41"`, `hallSymbol: "P 4w"`.
   - Contains 4 exact rational operations representing general position transformations with tetragonal 4-fold screw translations along the $z$-axis ($w_z \in \{0, 1/4, 1/2, 3/4\}$):
     - $g_1 = (I, [0, 0, 0])$
     - $g_2 = (4_z, [0, 0, 1/4])$ where $W = \begin{pmatrix} 0 & -1 & 0 \\ 1 & 0 & 0 \\ 0 & 0 & 1 \end{pmatrix}$
     - $g_3 = (2_z, [0, 0, 1/2])$ where $W = \begin{pmatrix} -1 & 0 & 0 \\ 0 & -1 & 0 \\ 0 & 0 & 1 \end{pmatrix}$
     - $g_4 = (4_z^3, [0, 0, 3/4])$ where $W = \begin{pmatrix} 0 & 1 & 0 \\ -1 & 0 & 0 \\ 0 & 0 & 1 \end{pmatrix}$
   - Successfully queryable via `SymmetryCatalog.findBySettingId("P41")` and `SymmetryCatalog.findByGroupNumber(76)`.
   - Verified internally for operation count, identity, group composition closure, inverses, and screw-axis relation ($g_2^4 = T_{(0,0,1)}$) in `core/registry.test.ts`.

2. **Absence in `core/operation_set_match.ts` (`REGISTERED_SETTING_IDS`):**
   - The constant `REGISTERED_SETTING_IDS` specifies exactly 8 setting IDs: `'P1'`, `'P-1'`, `'P2'`, `'P21'`, `'C2'`, `'Cc'`, `'P21/c'`, and `'P212121'`.
   - The type `RegisteredSettingId` is strictly constrained to these 8 values.
   - `P41` is omitted from `REGISTERED_SETTING_IDS`.

3. **Absence in Default Catalog (`getDefaultCatalog()`):**
   - The function `getDefaultCatalog()` constructs the working catalog by iterating exclusively over `REGISTERED_SETTING_IDS`.
   - As a direct consequence, `getDefaultCatalog().length === 8`.
   - `getDefaultCatalog()` does not contain Space Group 76.

4. **Absence in Benchmark Dataset (`data/crystallography/gemmi_benchmark_4.json`):**
   - The external benchmark artifact contains test fixtures strictly for the 8 triclinic, monoclinic, and orthorhombic settings (Nos. 1, 2, 3, 4, 5, 9, 14, 19).
   - Space Group 76 is not present in the benchmark dataset.

5. **Runtime Classification Behavior (`classifyOperationSet`):**
   - When an operation multiset corresponding to $P4_1$ (e.g. `SymmetryCatalog.findBySettingId("P41")!.operations`) is supplied to `classifyOperationSet()`, the Stage 1 candidate filter (`filterCandidates()`) compares the invariant profile against the 8 default catalog candidates.
   - Because no tetragonal candidate exists in the 8-setting catalog, the filter yields an empty candidate list (`candidates.length === 0`).
   - The classifier terminates at Stage 1, emitting `verdict: "NO_CANDIDATES"`.

### 3.2. Epistemic Impact & Gating Policy
- **Registry Membership $\neq$ Classification Capability:** The presence of a record in `SymmetryCatalog` (`core/registry.ts`) denotes data storage and syntactic validity, but does **not** grant recognition by the classification engine.
- **Why SG 76 is Gated:** Introducing $P4_1$ into `REGISTERED_SETTING_IDS` requires:
  1. Updating the canonical benchmark fixture `gemmi_benchmark_4.json`.
  2. Updating all tests that assert `catalog.length === 8` (e.g. `core/filter_soundness.test.ts`).
  3. Validating tetragonal profile separation across all 8 existing settings.
- **Target Resolution:** This reconciliation is formally scheduled for **Phase 6: Catalog Expansion & Reconciliation (Path to 230 Space Groups)**.

---

## 4. Test Verification Breakdown & Execution Status

To prevent conflation of different test layers, test execution statuses are explicitly segregated:

* **Core Regression Test Suites (16 Suites — 2026-10-13 Run):**  
  All 16 suites executed sequentially via `npx tsx` and passed cleanly with exit code 0:
  1. `core/filter_soundness.test.ts`
  2. `core/operation_set_profile.test.ts`
  3. `core/dimension.test.ts` (64/64)
  4. `core/engine.test.ts` (31/31)
  5. `core/group_properties.test.ts`
  6. `core/reference_loader.test.ts`
  7. `core/registry.test.ts`
  8. `core/generator.test.ts`
  9. `core/importer.test.ts`
  10. `core/symmetry_adapter.test.ts`
  11. `core/property_evidence.test.ts`
  12. `core/schema/crystallographic_exchange.test.ts`
  13. `core/schema/crystallographic_extractor.test.ts`
  14. `core/visualization_contract.test.ts`
  15. `evidence_check.ts`
  16. `core/group_closure.test.ts` (GCL-01 T1–T15)
* **STL V1 Native Test Suite (1 Suite — 2026-10-13 Run):**  
  `npx tsx core/stl/conjugacy.test.ts` passed cleanly with exit code 0 (7 test scenarios T1–T7).
* **Static Analysis & Production Build (2026-10-13 Run):**  
  - `npm run lint`: PASS (0 errors).
  - `npm run build`: PASS (Vite production bundle generated successfully).
* **Deferred HTTP API Test Suite Caveat (`REPORTED_PASS_WITH_CAVEAT`):**  
  - Tests in `core/tests/http_api_classify.test.ts` and `phase_5d_api.test.ts` have a known historical caveat: while HTTP assertions passed in Phase 5D reports, the test process did not exit cleanly due to open Express server sockets.
  - **Critical Notice:** These HTTP API tests were **not** executed during the 2026-10-13 regression run. Passing unit tests and successful `npm run build` do **not** imply that HTTP test caveats are resolved.

---

## 4. Licensing & Intellectual Property

* **Current Status:** The repository contains no formal `LICENSE` file.
* **Component Provenance:**
  1. Studio FSS Baseline: Developed in Google AI Studio.
  2. GROK donor modules (`operation_set_profile.ts`, `operation_set_match.ts`): Assimilated from the GROK research archive.
  3. STL V1 module (`core/stl/`): Transferred from `STL_V1_FSS_DELIVERY` as an autonomous exact algebraic library.
  4. Benchmark data (`gemmi_benchmark_4.json`): Generated from Gemmi crystallographic library data.
* **Action Required by Owner:** Determine the appropriate open-source license and verify permissions prior to public repository release.
