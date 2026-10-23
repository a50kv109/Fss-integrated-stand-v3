# GROK — BASELINE MANIFEST
**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Edition:** GROK Independently Developed Release (v0.1.1)  
**Document:** `GROK_BASELINE_MANIFEST.md`  
**Phase:** 2 — Deep Architecture Decomposition  
**Mode:** READ-ONLY BASELINE INVENTORY  
**Inspection Date:** 2026-10-11  

---

## 1. Archive Identity & Metadata

- **Archive Label**: FSS v0.1.1 GROK Release
- **Reported Compressed Size**: ~109 KB
- **Reported Registry Fingerprint**: `6e426d1d18130de3`
- **Reported Release Status**: `TEST_VERIFIED` on v0.1.1 clean extract; `TARGET_VERIFIED` pending Studio verification.
- **Root Filesystem Layout**: `package.json` at root; `core/`, `components/`, `docs/`, `services/` top-level directories.
- **Total Tracked File Count**: Exactly 58 files.

---

## 2. Dependency & Runtime Configuration

### Runtime Requirements (`package.json`)
- **Node.js Engine**: `"engines": { "node": ">=18" }`
- **Runtime Dependencies**:
  - `tsx`: `^4.23.15` (declared in runtime `dependencies` to allow direct execution in stripped containers)
  - `express`: `^5.2.1`
  - `react`: `^19.2.3`
  - `react-dom`: `^19.2.3`
  - `three`: `^0.186.1`
  - `lucide-react`: `^0.562.0`
  - `@google/genai`: `^1.34.0`
- **Dev Dependencies**:
  - `typescript`: `~5.8.2`
  - `vite`: `^6.2.0`
  - `@vitejs/plugin-react`: `^5.0.0`
  - `@types/express`, `@types/node`, `@types/three`
- **Execution Scripts**:
  - `"dev"`: `"tsx server.ts"`
  - `"start"`: `"tsx server.ts"`
  - `"build"`: `"vite build"`
  - `"lint"`: `"tsc --noEmit"`

---

## 3. Detailed File Inventory (58 Files)

### Root Configuration & Entry Points (10 files)
1. `package.json`
2. `tsconfig.json`
3. `tsconfig.tests.json`
4. `vite.config.ts`
5. `index.html`
6. `index.tsx`
7. `App.tsx`
8. `server.ts`
9. `constants.ts`
10. `types.ts`

### Documentation & Guides (11 files)
11. `README.md`
12. `ARCHITECTURE.md`
13. `MANIFEST.md`
14. `PROJECT_PASSPORT.md`
15. `RESEARCH_TRACEABILITY.md`
16. `TRANSFER_GUIDE.md`
17. `docs/FSS_v0.2_RESEARCH_DESIGN.md`
18. `docs/NEXT_RESEARCH_PROPOSAL.md`
19. `docs/RELEASE_INTEGRITY_v0.1.1.md`
20. `docs/RELEASE_VERIFICATION.md`
21. `docs/REPRODUCIBLE_EXECUTION_v0.1.1.md`
22. `docs/V0.2_ROADMAP.md`
23. `docs/VERIFICATION_REPORT.md`

### Components & Services (3 files)
24. `components/TetrahedronViewport.tsx`
25. `components/LatticeVisualizer.tsx`
26. `services/geminiService.ts`

### Core Math, Registry & Schemas (16 files)
27. `core/canonical.ts`
28. `core/types.ts`
29. `core/engine.ts`
30. `core/dimension.ts`
31. `core/operation_set_profile.ts`
32. `core/operation_set_match.ts`
33. `core/registry.ts`
34. `core/group_properties.ts`
35. `core/property_evidence.ts`
36. `core/importer.ts`
37. `core/generator.ts`
38. `core/reference_loader.ts`
39. `core/symmetry_adapter.ts`
40. `core/schema/crystallographic_exchange.ts`
41. `core/schema/passport_schema.ts`
42. `core/visualization_contract.ts`

### Test Suites (16 files)
43. `core/dimension.test.ts`
44. `core/engine.test.ts`
45. `core/filter_soundness.test.ts`
46. `core/generator.test.ts`
47. `core/group_properties.test.ts`
48. `core/importer.test.ts`
49. `core/operation_set_match.test.ts`
50. `core/operation_set_profile.test.ts`
51. `core/passport_verification.test.ts`
52. `core/property_evidence.test.ts`
53. `core/reference_loader.test.ts`
54. `core/registry.test.ts`
55. `core/schema/crystallographic_exchange.test.ts`
56. `core/schema/crystallographic_extractor.test.ts`
57. `core/symmetry_adapter.test.ts`
58. `core/tests/SG-002.test.ts`

---

## 4. Test Suite Execution & Reproducibility Matrix

| Test Suite File | Target Capability in GROK | Tested Assertion | GROK Clean Run Result | AI Studio Status |
|:---|:---|:---|:---:|:---:|
| `core/filter_soundness.test.ts` | Candidate filter soundness | 16 test cases, 0 false exclusions | `0 PASS` | `PENDING_INSPECTION` |
| `core/operation_set_profile.test.ts` | Operation set profiling | T1–T9, T6b distinct op counts | `0 PASS` | `PENDING_INSPECTION` |
| `core/registry.test.ts` | Registry completeness | 4 benchmark settings against fingerprint `6e426d1d18130de3` | `0 PASS` | `PENDING_INSPECTION` |
| `core/tests/SG-002.test.ts` | SG-002 Inversion verification | Exact fixed point and center checks | `0 PASS` | `PENDING_INSPECTION` |

---

## 5. Discrepancies Between Supplied Summary and Archive Inspection

1. **Registry Scope**: The release summary emphasizes EXP-09 profiling and classification for benchmark groups. Static inspection confirms the GROK registry contains exactly **4 space groups** (Nos. 1, 2, 14, 19), matching fingerprint `6e426d1d18130de3`, rather than the 8 space groups present in Studio's Stage A registry.
2. **Implementation Status of v0.2**: The summary and documentation explicitly clarify that **v0.2 is a research design only**. It is not implemented in the v0.1.1 source code.
3. **Absence of Raw Data Assets**: Unlike the Studio Remix (which includes `data/source/gemmi_symmetry_5cc1c23c.cpp` and `data/crystallography/gemmi_benchmark_4.json`), the GROK archive relies on in-memory representations in `core/registry.ts` and does not carry the raw C++ source tables.
