# FSS — BASELINE MANIFEST
**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `BASELINE_MANIFEST.md`  
**Phase:** 1 — Architecture Discovery and Baseline Documentation  
**Mode:** READ-ONLY BASELINE INVENTORY  
**Inspection Date:** 2026-10-11  

---

## 1. Source Identity & Inspection Baseline

- **Primary Source (Remix Workspace)**: AI Studio Remix environment (`/workspace/applet`)
- **Secondary Source (Archive)**: `Fedorov-symmetry-reasoning-stand-main.zip`
- **GitHub Commit SHA / Archive Fingerprint**: `cf3d811ee305fc1c5b24dfac08bd905d1ac0017a`
- **Tracked Workspace File Count**: Exactly 71 files
- **Correspondence Status**: `100% IDENTICAL PATH SET` (0 path divergences)

---

## 2. Environment & Dependency Manifest

### Runtimes Present
- **Node.js**: `v22.14.0`
- **TypeScript**: `v5.8.2`
- **Bun**: `v1.4.2`
- **Python**: `Python 3.11+` (`/usr/bin/python3`)

### Installed Dependencies (`package.json`)
```json
{
  "dependencies": {
    "@google/genai": "^1.34.0",
    "express": "^5.2.1",
    "lucide-react": "^0.562.0",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "three": "^0.186.1",
    "tsx": "^4.23.15"
  },
  "devDependencies": {
    "@types/express": "^5.0.6",
    "@types/node": "^22.14.0",
    "@types/three": "^0.186.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

---

## 3. Cryptographic Checksums & Artifact Fingerprints

| Artifact Path | Declared / Upstream Fingerprint | Verified Local Checksum | Status |
|:---|:---|:---|:---:|
| `data/source/gemmi_symmetry_5cc1c23c.cpp` | SHA-256: `fae1e4e6f297bbca5ff22126e5f99a54b60d8bcda0f003256558d2bb6426489c` | `fae1e4e6f297bbca5ff22126e5f99a54b60d8bcda0f003256558d2bb6426489c` | **VERIFIED MATCH** |
| `data/crystallography/gemmi_benchmark_4.json` | Manifest SHA-256: `f1ee084b36c8fb658a62de117347a1a414b723709de8f60d0abc8e14ee4eec36` | `f1ee084b36c8fb658a62de117347a1a414b723709de8f60d0abc8e14ee4eec36` | **VERIFIED MATCH** |
| GitHub Repository Commit | Commit SHA: `cf3d811ee305fc1c5b24dfac08bd905d1ac0017a` | Embedded in ZIP metadata footer | **VERIFIED MATCH** |
| Pinned Gemmi Release Commit | Commit SHA: `5cc1c23c6007e0e6cbd69289c6f7c0bff50e943e` | Referenced in extractor & manifest | **VERIFIED MATCH** |
| Legacy Reference Commit | Commit SHA: `6ea553a` | Stored in `core/registry.ts` records 1, 2, 14, 19 | **RECORDED (LEGACY)** |

---

## 4. Space Group Registry & Data Coverage Summary

| Metric | Actual Count | Source |
|:---|:---:|:---|
| Total Crystallographic Space Groups | 230 | International Tables for Crystallography |
| Upstream Settings Table Entries | 564 | `data/source/gemmi_symmetry_5cc1c23c.cpp` (`spacegroup_tables::main`) |
| Benchmark Records Extracted | 8 | `scripts/extract_gemmi_data.py` (`TARGET_GROUPS = [1, 2, 3, 4, 5, 9, 14, 19]`) |
| Records in Benchmark Artifact | 8 | `data/crystallography/gemmi_benchmark_4.json` |
| Records in Working Catalog | 8 | `core/registry.ts` (`SymmetryCatalog`) |
| Implemented Space Group Numbers | 8 | Nos. 1 (`P1`), 2 (`P-1`), 3 (`P2`), 4 (`P21`), 5 (`C2`), 9 (`Cc`), 14 (`P21/c`), 19 (`P212121`) |
| Unimplemented Space Group Numbers | 222 | Nos. 6–8, 10–13, 15–18, 20–230 |

---

## 5. Test Suite & Verification Script Execution Matrix

Tests were executed directly using `npx tsx` and `bun test` in read-only mode:

| Test / Script File | Target Capability | Commands Available | Actual Execution Result | Root Cause of Failure (if any) |
|:---|:---|:---|:---:|:---|
| `core/dimension.test.ts` | M-6A.1 Affine Dimensionality | `npx tsx core/dimension.test.ts` | **PASS** (64/64 tests) | None |
| `core/engine.test.ts` | Deterministic Polyhedral Engine | `npx tsx core/engine.test.ts` | **PASS** (31/31 tests) | None |
| `core/generator.test.ts` | KB-08A Generator Audit | `npx tsx core/generator.test.ts` | **PASS** (4/4 settings match) | None |
| `core/group_properties.test.ts` | KB-14 Analytical Group Properties | `npx tsx core/group_properties.test.ts` | **FAIL** | Line 83 hardcodes `records[2]` as `P21/c`; following 8-record expansion, `records[2]` is `P2` |
| `core/importer.test.ts` | KB-07B Import Validation | `npx tsx core/importer.test.ts` | **PASS** | None |
| `core/passport_verification.test.ts` | Mathematical Passport V1 (SG-002) | `npx tsx core/passport_verification.test.ts` | **PASS** | None |
| `core/property_evidence.test.ts` | KB-15 Property Evidence Reports | `npx tsx core/property_evidence.test.ts` | **FAIL** | Line 53 asserts `reports.length === 4`; artifact now produces 8 reports |
| `core/reference_loader.test.ts` | KB-13A Artifact Loader & Comparator | `npx tsx core/reference_loader.test.ts` | **FAIL** | Lines 30–31 assert `recordCount === 4` and `records.length === 4`; artifact has 8 |
| `core/registry.test.ts` | KB-06 & Stage A Registry Validation | `npx tsx core/registry.test.ts` | **PASS** | None |
| `core/symmetry_adapter.test.ts` | 4x4 Affine Adapter | `npx tsx core/symmetry_adapter.test.ts` | **PASS** | None |
| `core/schema/crystallographic_exchange.test.ts` | KB-10A 3-Layer Validation Audit | `npx tsx core/schema/crystallographic_exchange.test.ts` | **PASS** (100% pass) | None |
| `core/schema/crystallographic_extractor.test.ts` | KB-11 Extractor Contract | `npx tsx core/schema/crystallographic_extractor.test.ts` | **FAIL** | Line 23 asserts `recordCount === 4`; manifest declares 8 |
| `core/tests/SG-002.test.ts` | SG-002 Specific Checks | `npx tsx core/tests/SG-002.test.ts` | **PASS** | None |
| `evidence_check.ts` | Standalone Invariance Check | `npx tsx evidence_check.ts` | **PASS** | None |
| `verify_groups.py` | Python Group Axiom Check | `python3 verify_groups.py` | **PASS** | None |
| `verify_contract.py` | Python Contract Check | `python3 verify_contract.py` | **PASS** | None |
| `npm run lint` | TypeScript Type Checker | `tsc --noEmit` | **PASS** (0 errors) | None |
| `npm run build` | Vite Production Build | `vite build` | **PASS** | None |

---

## 6. Build and Verification Health Summary

- **Type Check (`tsc --noEmit`)**: Clean (Exit code 0).
- **Vite Build (`vite build`)**: Clean (Exit code 0).
- **Passing Test Suites**: 9 out of 13 TypeScript test suites pass (69.2%).
- **Failing Test Suites**: 4 test suites fail (30.8%), all caused by a single shared defect: desynchronization between test assertion constants (`recordCount === 4`, hardcoded array index `[2]`) and the 8-group expansion of `gemmi_benchmark_4.json`.
