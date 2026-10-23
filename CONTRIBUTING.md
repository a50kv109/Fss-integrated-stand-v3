# Contributing to FSS Integrated Research Stand

Thank you for your interest in contributing to the **Fedorov Symmetry Reasoning Stand (FSS)**.

FSS is a scientific software project operating under strict **epistemic discipline**. Unlike general web applications, changes in this codebase directly affect mathematical assertions about crystallographic symmetry.

---

## 1. Golden Rules of Scientific Contribution

Before opening a pull request or proposing modifications, verify that your changes adhere to these four principles:

1. **Rule 1 (Epistemic Demarcation):**  
   Never conflate an invariant profile match with a proof of space-group identity. Profile filtering is a necessary condition, never a sufficient condition.
2. **Rule 2 (Representation Fidelity):**  
   Never claim that matching canonical operation keys proves general affine isomorphism under arbitrary basis transformations ($GL_3(\mathbb{Z})$) or continuous origin shifts. Always specify the basis and setting context.
3. **Rule 3 (Exact Rational Arithmetic):**  
   All fractional translations must use `ExactRational` with BigInt or safe integer arithmetic. Never introduce floating-point numbers or tolerances ($\epsilon$) into canonical operation keys or hashing functions.
4. **Rule 4 (No Silent Data Mutation):**  
   Always distinguish sets from multisets. Duplicate operations must be detected and documented, never silently discarded or assumed away.

---

## 2. Code Organization & Architecture

* `core/engine.ts`, `core/dimension.ts`: Vector-affine geometric engine. Modifying these modules requires rigorous regression verification against existing test suites.
* `core/operation_set_profile.ts`: Invariant profiler (orders, traces, determinants, inversion).
* `core/operation_set_match.ts`: Two-stage candidate filter and strict matcher. Must conform strictly to `docs/CLASSIFIER_CONTRACT.md`.
* `core/registry.ts`: Catalog of reference space group settings. Modifying or expanding entries requires provenance validation against ITA Volume A or verified benchmark artifacts.
* `server.ts` & `App.tsx`: Server and UI layers. The classifier subsystem must remain decoupled until an approved API contract is in place.

---

## 3. Development Workflow

### Setting Up:
```bash
git clone <repository-url>
cd fss-integrated-stand
npm install
```

### Verification Pipeline:
Every code contribution must pass the following verification checks:

```bash
# 1. Type Check (Must pass with 0 errors)
npm run lint

# 2. Production Build Check (Must build with 0 errors)
npm run build

# 3. EXP-09 Soundness & Classifier Tests
npx tsx core/filter_soundness.test.ts
npx tsx core/operation_set_profile.test.ts

# 4. Core Geometry & Dimensionality Tests
npx tsx core/dimension.test.ts
npx tsx core/engine.test.ts
npx tsx core/reference_loader.test.ts
```

---

## 4. Documentation Standards

* Any new feature or algorithmic change must be documented in `docs/`.
* When updating existing modules, verify that statements do not contradict the Normative Contract (`docs/CLASSIFIER_CONTRACT.md`) or the Evidence Matrix (`docs/analysis/FSS_CLASSIFIER_EVIDENCE_MATRIX.md`).
* Record any unresolved gaps or limitations in `docs/LIMITATIONS.md`.

---

## 5. Licensing & Provenance Note

Please note that formal licensing terms for this integrated stand are currently under review by the repository owners. Ensure that any contributed code does not infringe on third-party proprietary software.
