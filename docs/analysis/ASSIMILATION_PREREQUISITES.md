# FSS — ASSIMILATION PREREQUISITES
**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `ASSIMILATION_PREREQUISITES.md`  
**Phase:** 1 — Architecture Discovery and Baseline Documentation  
**Mode:** READ-ONLY COMPARISON PREREQUISITES  
**Inspection Date:** 2026-10-11  

---

## 1. Purpose & Scope

This document specifies the strict architectural constraints, invariants, contracts, and evaluation criteria that must govern any future comparison or assimilation involving an independently developed GROK repository archive.

**This is not an assimilation plan.** No code modification, deletion, or merging is authorized during Phase 1.

---

## 2. Inviolable Architectural Invariants

Any candidate implementation from the GROK repository must preserve or satisfy the following core principles:

### A. Epistemic Integrity
1. **Geometry State $\neq$ Epistemic State**: A geometric object or coordinate array does not know its symmetry status until evaluated by an explicit predicate.
2. **Claim $\neq$ Truth**: A declared symmetry operation or passport metadata entry is a falsifiable hypothesis until verified by deterministic code.
3. **Construction $\neq$ Verification**: The code that generates or formats a structure/operation must never be the sole judge of its validity.
4. **Representation $\neq$ Truth**: Coordinate choices, origin settings, and basis conventions (e.g. standard ITA Volume A vs shifted origin) must not be treated as conflicting errors if exact mathematical equivalence can be proven under affine transformation.
5. **Lookup $\neq$ Prediction**: Finding a space group in a table or registry is distinct from discovering symmetries from point sets.

### B. Mathematical & Arithmetic Contracts
1. **Exact Rational Representation**:
   - Translations $w \in \mathbb{Q}^3$ must be represented as exact numerators and denominators ($n/d$), never converted to floating-point numbers during group composition or invariant checks.
   - Reduction modulo 1 ($w \pmod 1$) must be applied strictly to periodic space-group fractional translations and never to unconstrained geometric polyhedra.
   - Multiplications and additions must be protected against 64-bit float precision overflow (FSS currently uses `bigint` with `Number.isSafeInteger()`).
2. **Strict Multi-Layer Validation**:
   - Structural validity, mathematical group axioms (identity, two-sided inverses, closure mod 1), and source provenance must remain cleanly separated.
   - An unverified source must not be rejected mathematically if its operations form a valid algebraic group; conversely, an authentic provenance commit must never bypass mathematical axiom checks.
3. **Unreduced Translation Preservation**:
   - Intermediate powers $(W, w)^k$ must preserve unreduced sums $t_{\text{unreduced}} = \sum_{j=0}^{k-1} W^j w$ to compute the intrinsic translation $\tau = \frac{1}{k} t_{\text{unreduced}}$, distinguishing pure rotations from screw axes and pure reflections from glide planes.

---

## 3. Interfaces That Must Not Be Broken

| Interface / Symbol | Location | Contract Guarantee |
|:---|:---|:---|
| `runSymmetryExperiment(input: ExperimentInput): Evidence` | `core/engine.ts` | Shared by both Human UI and Agent Tool API. Returns immutable `Evidence` record with identical fields. |
| `POST /api/experiment` | `server.ts` | HTTP endpoint consumed by autonomous AI agents. Request schema and response `Evidence` schema must remain stable. |
| `ExactRational` | `core/schema/crystallographic_exchange.ts` | Exact rational class supporting BigInt arithmetic, GCD reduction, `add`, `mul`, `mod1`, `equals`. |
| `validateExchangeRecord(record, manifest): RecordValidationReport` | `core/schema/crystallographic_exchange.ts` | Returns independent `structural`, `mathematical`, and `provenance` results. |
| `SymmetryCatalog` | `core/registry.ts` | Working registry methods `findByGroupNumber`, `findBySettingId`, `findByHallSymbol`. |
| `createSG002VisualizationPayload` | `core/visualization_contract.ts` | Boundary contract transferring exact rational coordinates to UI without loss of precision. |

---

## 4. Components Subject to Potential Replacement / Unification

The following modules represent technical debt, historical prototypes, or isolated areas that may be safely unified or replaced, provided all functional contracts are preserved:

1. **Legacy Dead-Code Modules**:
   - `components/LatticeVisualizer.tsx`: Unconnected 2D SVG visualizer.
   - `services/geminiService.ts`: Unconnected client service from initial SHRM template.
   - `constants.ts`: Unconnected hardcoded mock space groups list.
   - Root `types.ts`: Deprecated template state interface.
2. **Extractor Script & JSON Naming**:
   - `scripts/extract_gemmi_data.py`: Currently outputs to `gemmi_benchmark_4.json` even though it extracts 8 records. The naming should be reconciled without breaking loaders.
3. **Passport Verification Dispatcher**:
   - In FSS V1, passport verification is manual and specialized (`core/passport_verification.test.ts` for SG-002 only). A universal runtime YAML loader and automated dispatcher could be safely introduced.

---

## 5. Technical Debt and Uncertainty Register

| Issue ID | Classification | Affected Files | Description | Impact |
|:---|:---|:---|:---|:---|
| `TD-01` | `CONFIRMED_DEFECT` | `core/group_properties.test.ts`, `core/reference_loader.test.ts`, `core/property_evidence.test.ts`, `core/schema/crystallographic_extractor.test.ts` | Desynchronization between test suites expecting 4 records and `gemmi_benchmark_4.json` containing 8 records. | 4 test suites fail on assertion of record counts or hardcoded index `[2]`. |
| `TD-02` | `DUPLICATION / DEAD_CODE` | `types.ts`, `core/types.ts`, `components/LatticeVisualizer.tsx`, `constants.ts` | Remnants of initial prototype "Harmonic Resonance" exist alongside active core. | Cognitive overhead; risk of importing wrong `types.ts`. |
| `TD-03` | `PROVENANCE_GAP` | `core/registry.ts`, `data/crystallography/gemmi_benchmark_4.json` | Records 1, 2, 14, 19 in `registry.ts` cite commit `6ea553a`, while benchmark artifact cites pinned release commit `5cc1c23c...`. | Inconsistent upstream commit references across records. |
| `TD-04` | `STATIC_RISK` | `core/dimension.ts`, `core/engine.ts` | Geometric verification relies on floating-point tolerances ($\epsilon = 10^{-5}$). | Potential edge-case sensitivity near borderline thresholds. |
| `TD-05` | `COVERAGE_GAP` | `core/registry.ts`, `data/crystallography/gemmi_benchmark_4.json` | Only 8 of 230 space groups are present. | 222 space groups cannot be verified or looked up. |
| `TD-06` | `MISSING_CONTRACT` | `package.json` | No `"test"` script in `package.json`. | Tests must be invoked manually via individual CLI arguments. |

---

## 6. Critical Questions for GROK Archive Comparison

When the GROK repository ZIP is provided, the following specific questions must be answered:

1. **Space Group Coverage**: How many space groups are implemented in the GROK codebase? Does GROK implement all 230 groups, or a subset?
2. **Arithmetic Foundation**: Does GROK use floating-point matrices or exact rational arithmetic ($\mathbb{Q}$ / `ExactRational`) for space-group operations?
3. **Origin & Setting Conventions**: Does GROK handle ITA Volume A standard settings, or custom/legacy settings? Does it contain an analytical origin shift solver?
4. **Symmetry Discovery**: Has GROK implemented an automated symmetry discovery algorithm (point cloud $\to$ space group), or is it also registry/lookup-based?
5. **Passport Flow**: Does GROK provide a dynamic runtime YAML passport loader and automated contract verification runner?
6. **Provenance Tracking**: Does GROK cryptographically pin its crystallographic source to Gemmi / ITA tables, or are operations unverified?
