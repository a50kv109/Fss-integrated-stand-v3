# FSS — ASSIMILATION RISKS AND TEST PROTOCOL
**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `ASSIMILATION_RISKS_AND_TESTS.md`  
**Phase:** 3 — Cross-Project Audit and Assimilation Planning  
**Mode:** READ-ONLY RISK & VERIFICATION PROTOCOL  
**Date:** 2026-10-11  

---

## 1. Identified Architectural Risks

| Risk ID | Category | Affected Scope | Risk Description | Prevention & Mitigation Strategy |
|:---|:---|:---|:---|:---|
| `RSK-01` | **Regression** | `core/registry.ts` | Overwriting Studio's 8-group catalog with GROK's 4-group catalog would destroy monoclinic settings `C2`, `Cc`, `P2`, `P21`. | **Hard boundary**: `core/registry.ts` is strictly marked `KEEP_STUDIO`. GROK's candidate filter must adapt to Studio's registry. |
| `RSK-02` | **Regression** | `core/engine.ts` | Overwriting Studio's polyhedral engine would lose M-5F edge-topology validation and self-loop edge integrity checks. | **Hard boundary**: `core/engine.ts` is strictly marked `KEEP_STUDIO`. |
| `RSK-03` | **Soundness Failure** | `core/operation_set_match.ts` | Candidate filtering could prematurely prune centered settings (`C2`, `Cc`) or linear degeneracies (`P2` vs `P21`). | **Proven in Phase 3**: Live execution verified zero false negatives across all 8 settings. Test `core/filter_soundness.test.ts` must run on all 8 groups. |
| `RSK-04` | **Precision Loss** | Profiler translation checks | Converting translations to IEEE-754 floats during profiling could introduce rounding errors. | **Invariant rule**: All translation operations in profiler must use `ExactRational` or exact rational strings. |
| `RSK-05` | **Multiset Multiplicity** | Candidate filtering | Duplicate operations in input could cause false match failure if evaluated by total count. | **Criterion C2**: Profiler must evaluate `distinctCount` rather than `totalCount` (verified by Test T6b). |

---

## 2. Test Execution Verification Matrix

| Verification Gate | Command | Scope | Target Exit Code | Checkpoint Condition |
|:---|:---|:---|:---:|:---|
| **Gate 0: Pre-Assimilation Baseline** | `npx tsx core/dimension.test.ts && npx tsx core/engine.test.ts && npx tsx core/registry.test.ts` | Studio Core Geometry & Registry | `0` | Existing green baseline verified |
| **Gate 1: Profiler Unit Tests** | `npx tsx core/operation_set_profile.test.ts` | GROK Invariant Profiling (T1–T9, T6b) | `0` | Profiling sound on isolated operations |
| **Gate 2: Candidate Soundness Tests** | `npx tsx core/filter_soundness.test.ts` | Two-Stage Filtering (16 test scenarios) | `0` | Zero false negatives across all 8 settings |
| **Gate 3: Strict Matcher Tests** | `npx tsx core/operation_set_match.test.ts` | Strict Canonical Key Verification | `0` | Clean match verdicts for known settings |
| **Gate 4: Full Repository Regression** | `for f in core/*.test.ts; do npx tsx "$f"; done` | All Core Test Suites | `0` (all pass) | Complete test parity across repository |
| **Gate 5: TypeScript & Build Verification** | `npm run lint && npm run build` | Whole-Project Compilation | `0` | Zero type errors, clean Vite build |

---

## 3. Epistemic Verification Boundaries

Every test and report during assimilation must preserve the following status labels:
- `TEST_EXECUTED`: The test command was run live in the current environment and observed to pass.
- `SOURCE_CONFIRMED`: Code exists and was inspected line-by-line in source.
- `SPECIFIED_ONLY`: Feature is described in design documents (`FSS_v0.2_RESEARCH_DESIGN.md`) but has no executable implementation.
- `INCOMPARABLE`: Fingerprints or checksums derived from different datasets or algorithms (e.g. GROK's 4-group `6e426d1d18130de3` vs. Studio's 8-group SHA-256 `f1ee084b...`).
