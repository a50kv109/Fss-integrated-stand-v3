# FSS — Project Passport

**Project:** Fedorov Symmetry Stand (FSS)  
**Document:** `docs/PROJECT_PASSPORT.md`  
**Classification:** Canonical System Passport  
**Repository Target:** `fss-integrated-stand`  
**Status:** Deterministic Theoretical Research Stand (Post-STL V1 Integration)  
**Last Updated:** 2026-10-13  

---

## 1. System Mission & Identity

The **Fedorov Symmetry Stand (FSS)** is an open-source, deterministic theoretical research stand designed for the mathematical analysis, verification, and experimental investigation of crystallographic space groups.

Rooted in Evgraf S. Fedorov's classical 1891 geometric derivation of the 230 space groups, FSS does not operate merely as a static handbook or lookup table. Instead, it provides a computational experimental environment that couples exact rational arithmetic and vector-affine geometry with hypothesis testing, reproducible digital evidence generation, and strict epistemic demarcation.

### Conceptual Architecture Model: The Three Tiers
FSS organizes its analytical capabilities into three conceptual tiers. Note that this represents an architectural organizational model, not a single monolithic execution engine (components are independently executable modules with specialized interfaces):

1. **Crystallographic Knowledge Base / Reference Catalog:**  
   * Passive normative reference data: canonical descriptions of space group settings derived from ITA Volume A and Gemmi benchmarks.
   * Encodes canonical coordinate representations $(W, \vec{w} \bmod 1)$, matrix generators, and setting-specific origin conventions.
2. **Deterministic Mathematical Computing Core:**  
   * Performs exact arithmetic and algebraic evaluations with zero floating-point drift: `ExactRational` (`BigInt` with Euclidean GCD reduction), affine geometry, and invariant extraction.
   * Houses standalone algorithmic libraries: STL V1 (exact matrix conjugacy $g' = P^{-1} g P$) and GCL-01 (group closure BFS $\langle S \rangle \bmod \mathbb{Z}^3$).
3. **Experimental & Hypothesis-Testing Stand:**  
   * Provides environments for formulating and verifying theoretical symmetry hypotheses:
     - 3D geometric transformation stand on canonical polyhedra (regular tetrahedron) with metric tolerance $\varepsilon$.
     - Algebraic conjugacy verification stand for user-specified basis changes $P$.
     - Candidate space group classification stand (two-stage filter and canonical key matching).
   * Generates structured, bit-identical digital evidence reports.

---

## 2. Core Epistemic Principles & Evidentiary Discipline

FSS enforces strict boundaries between computation, reporting, and mathematical proof:

* **Distinction Between Computed Result, Report, and Proof:**  
  - *Computed Result:* The direct numerical or symbolic output of a deterministic function (e.g., transformed vertices, matrix conjugacy products, key lists).
  - *Report:* A structured machine-readable JSON artifact capturing parameters, timestamps, and verdicts (`Evidence`, `TwoStageMatchReport`, `ConjugacyResult`).
  - *Verified Evidence of a Property:* An exact confirmation of a specific, strictly defined property under stated conditions (e.g., structure preservation within tolerance $\varepsilon$, or matrix equivalence under given $P$). It does *not* constitute an unbounded proof of unverified global claims.
* **Geometry Simulation $\neq$ Algebraic Proof:** Transforming vertices of a polyhedron in $\mathbb{R}^3$ tests geometric invariance of a finite model; it does not prove the global symmetry group of an infinite crystal lattice.
* **Invariant Match $\neq$ Space Group Identification:** Matching a coordinate-independent linear invariant profile is a necessary filter, never a sufficient proof of space group isomorphism (e.g. $P2$ and $P2_1$ share identical profiles).
* **Canonical Key Match $\neq$ General Isomorphism:** Bijective matching of operation keys proves identity strictly within the conventional coordinate basis of the catalog setting modulo $\mathbb{Z}^3$, not under arbitrary affine transformations $GL_3(\mathbb{Z}) \ltimes \mathbb{R}^3$.
* **Conjugacy Verification $\neq$ Group Axiom Proof:** STL V1 verifies the algebraic relation $g' = P^{-1} g P$ for a supplied list of matrices; it does not evaluate closure, inverses, or identity existence.
* **Negative Demarcation:** The system emits exact diagnostic verdicts (`EXACT_MATCH`, `SETTING_MISMATCH`, `OPERATION_MISMATCH`, `NO_CANDIDATES`, `REFUTED`, `INVALID_INPUT`) without guessing, silent coercion, or heuristic smoothing.

---

## 3. Structural & Architectural Scope

| Layer / Component | Implementation Path | Implementation Status | Test Status & Verification (2026-10-13) |
|:---|:---|:---:|:---:|
| **Affine Geometry Engine** | `core/engine.ts`, `core/dimension.ts`, `core/canonical.ts` | `ACTIVE_IN_UI` | PASS (64/64 dimension, 31/31 engine via `npx tsx`) |
| **Interactive 3D Viewport** | `App.tsx`, `components/TetrahedronViewport.tsx` | `ACTIVE_IN_UI` | PASS (Vite Production Build & Dev Server) |
| **Exact Rational Arithmetic** | `core/schema/crystallographic_exchange.ts` | `IMPLEMENTED` | PASS (`crystallographic_exchange.test.ts`) |
| **Symmetry Registry (9 Settings)** | `core/registry.ts` | `IMPLEMENTED` | PASS (`core/registry.test.ts`) |
| **Classifier Catalog (8 Settings)** | `core/operation_set_match.ts` (`REGISTERED_SETTING_IDS`) | `PARTIALLY_EXPOSED_API` | PASS (`filter_soundness.test.ts`, `operation_set_profile.test.ts`) |
| **Space Group 76 ($P4_1$) Entry** | `core/registry.ts` (Excluded from classifier catalog) | `REGISTERED_EXCLUDED_FROM_CLASSIFIER` | Documented discrepancy: in registry, absent from 8-setting matcher |
| **Group Closure Engine (GCL-01)** | `core/group_closure.ts` | `ISOLATED_MODULE_TESTED` | PASS (15/15 tests in `core/group_closure.test.ts`; unwired) |
| **Symmetry Transformation Lab (STL V1)** | `core/stl/` (`exact_matrix.ts`, `conjugacy.ts`) | `INTEGRATED_STANDALONE_MODULE` | PASS (7/7 native tests in `core/stl/conjugacy.test.ts`; standalone library) |
| **Classifier API Endpoint** | `server.ts` (`POST /api/classify`) | `PARTIALLY_EXPOSED_API` | IMPLEMENTED; Caveat on HTTP runner exit; contract pending formal approval |
| **Classifier UI Tab** | `components/ClassifierUI.tsx`, `App.tsx` | `PARTIALLY_EXPOSED_API` | Component exists; navigation tab unexposed in UI |
| **Automated Basis Discovery ($GL_3(\mathbb{Z})$)** | N/A | `NOT_IMPLEMENTED` | Out of scope for V1; requires explicit basis matrix $P$ |
| **230 Space Group Full Catalog** | N/A | `NOT_IMPLEMENTED` | Planned for Phase 6 |

---

## 4. Key Artifacts & References

* **System Architecture:** `docs/ARCHITECTURE.md`
* **Mathematical Specification:** `docs/MATHEMATICAL_MODEL.md`
* **Normative Classifier Contract:** `docs/CLASSIFIER_CONTRACT.md`
* **Known Limitations & Epistemic Boundaries:** `docs/LIMITATIONS.md`
* **Development Roadmap:** `docs/ROADMAP.md`
* **Test Verification & Harness Status:** `docs/TESTING.md`
* **STL V1 Module Passport:** `core/stl/README.md`
* **Integration History:** `docs/INTEGRATION_HISTORY.md`

