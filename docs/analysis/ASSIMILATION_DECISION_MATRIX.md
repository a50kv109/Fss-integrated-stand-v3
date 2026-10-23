# FSS — ASSIMILATION DECISION MATRIX
**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `ASSIMILATION_DECISION_MATRIX.md`  
**Phase:** 3 — Cross-Project Audit and Assimilation Planning  
**Mode:** READ-ONLY INTEGRATION DECISION MATRIX  
**Date:** 2026-10-11  

---

## 1. Decision Categories

- `KEEP_STUDIO`: Retain the existing Studio file unchanged. The Studio version possesses validated enhancements or broader coverage.
- `IMPORT_GROK_MODULE`: Import the GROK file into the project. It introduces new, non-overlapping functionality.
- `ADAPT_GROK_MODULE`: Adapt the GROK module to interface cleanly with Studio's types and 8-group catalog.
- `MERGE_SELECTIVELY`: Combine specific functions or configurations without overwriting the core module.
- `RESEARCH_ONLY`: Retain in `/docs/` as architectural reference and specification.

---

## 2. Complete Module Decision Matrix

| Module / File Path | Origin / Present In | Proposed Disposition | Primary Justification & Evidence |
|:---|:---:|:---:|:---|
| `core/operation_set_profile.ts` | GROK | `IMPORT_GROK_MODULE` | Introduces the algebraic invariant profiler (orders histogram, inversion flag, proper/improper counts, multiset deduplication). Fills an existing gap in Studio. |
| `core/operation_set_match.ts` | GROK | `ADAPT_GROK_MODULE` | Implements candidate filtering and strict matching. Must be adapted to query Studio's 8 registered groups instead of GROK's 4 groups. |
| `core/filter_soundness.test.ts` | GROK | `IMPORT_GROK_MODULE` | 16 tests verifying candidate filter soundness. Proven sound across all 8 Studio groups during Phase 3 verification. |
| `core/operation_set_profile.test.ts` | GROK | `IMPORT_GROK_MODULE` | Verifies profiler behavior across tests T1–T9 and T6b (duplicate operations, order counts). |
| `core/registry.ts` | Both | `KEEP_STUDIO` | Studio contains 8 space groups (including `C2`, `Cc`, `P2`, `P21`) reconciled in Stage A. GROK has only 4. Studio must be preserved. |
| `core/engine.ts` | Both | `KEEP_STUDIO` | Studio contains M-5F edge-topology validation and structural integrity checks (`validateStructureIntegrity`). Fully verified with 31/31 tests passing. |
| `core/dimension.ts` | Both | `KEEP_STUDIO` | Studio contains comprehensive affine dimension, barycenter, and anchor frame logic verified by 64/64 tests. |
| `core/schema/crystallographic_exchange.ts` | Both | `KEEP_STUDIO` | Studio contains BigInt `ExactRational` with safe-integer checks, two-sided inverses, and provenance validation audited in KB-10A. |
| `core/reference_loader.ts` | Both | `KEEP_STUDIO` | Studio contains `OriginShiftAnalyzer` and `CrystallographicComparator` supporting origin-shift equivalence proofs. |
| `core/group_properties.ts` | Both | `KEEP_STUDIO` | Studio implements unreduced power iterations, intrinsic translation $\tau$, and exact inversion midpoint derivation. |
| `core/property_evidence.ts` | Both | `KEEP_STUDIO` | Studio implements structured `PropertyEvidence` with 8 distinct verification levels. |
| `core/schema/passport_schema.ts` | Both | `KEEP_STUDIO` | Standard passport schema interfaces. |
| `core/visualization_contract.ts` | Both | `KEEP_STUDIO` | Exact rational boundary payload DTO for SG-002 visualization. |
| `data/crystallography/gemmi_benchmark_4.json` | Studio | `KEEP_STUDIO` | 8 verified space group records extracted from pinned Gemmi source. (GROK lacks this data asset). |
| `data/source/gemmi_symmetry_5cc1c23c.cpp` | Studio | `KEEP_STUDIO` | Pinned upstream source with SHA-256 `fae1e4e6f297...`. (GROK lacks this data asset). |
| `scripts/extract_gemmi_data.py` | Studio | `KEEP_STUDIO` | Reproducible extraction script from Gemmi C++ table. |
| `tsconfig.tests.json` | GROK | `IMPORT_GROK_MODULE` | Dedicated TypeScript configuration for test runners. Resolves test configuration isolation. |
| `package.json` | Both | `MERGE_SELECTIVELY` | Retain Studio's configuration, but add GROK's `"engines": { "node": ">=18" }` and define `"test": "tsx core/*.test.ts"`. |
| `docs/FSS_v0.2_RESEARCH_DESIGN.md` | GROK | `RESEARCH_ONLY` | Authoritative specification of v0.2 criteria (C1–C4, layered evidence). Preserved as the unifying design standard. |
| `docs/V0.2_ROADMAP.md` | GROK | `RESEARCH_ONLY` | Implementation roadmap for post-assimilation milestones. |
| `TRANSFER_GUIDE.md` | GROK | `RESEARCH_ONLY` | Handoff runbook and verification checklist. |
| `components/LatticeVisualizer.tsx` | Both | `KEEP_BOTH_WITH_EXPLICIT_BOUNDARY` | Legacy prototype file. Bypassed by active core; do not touch. |
| `constants.ts` & `types.ts` (root) | Both | `KEEP_BOTH_WITH_EXPLICIT_BOUNDARY` | Legacy prototype files. Bypassed by active core; do not touch. |
