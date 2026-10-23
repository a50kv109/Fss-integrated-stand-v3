# SG_076_P41_DATA_AUDIT.md

## 1. Identification
- **International space-group number:** 76
- **Hermann–Mauguin symbol:** P 41
- **Hall symbol:** P 4w
- **Crystal system:** tetragonal
- **Lattice type:** primitive
- **Screw axis:** 4_1 (parallel to c)
- **General-position multiplicity:** 4

## 2. Provenance & Evidence Gaps
- **Source Sources:** CCTBX / IUCr / Gemmi standard settings.
- **Independent-Reference Status:** `PENDING`. An external independent reference check or derivation has not been executed in this environment.
- **Data Status:** `DATA_VALIDATED` (syntax and type compliance with `SymmetryRecord`).

## 3. Operations Table (Standard Setting)
| № | Operator |
|---|---|
| 1 | (x, y, z) |
| 2 | (-y, x, z + 1/4) |
| 3 | (-x, -y, z + 1/2) |
| 4 | (y, -x, z + 3/4) |

## 4. FSS Operation Representation
```typescript
const operations = [
  { W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] },
  { W: [[0, -1, 0], [1, 0, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 1, denominator: 4 }] },
  { W: [[-1, 0, 0], [0, -1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 1, denominator: 2 }] },
  { W: [[0, 1, 0], [-1, 0, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 3, denominator: 4 }] }
];
```

## 5. Internal Consistency Checks Performed
- **Identity Operation:** Checked (Op 1 is identity). Status: `INTERNAL_CONSISTENCY_CHECKED`.
- **Matrix Integrity:** Checked ($W \in M_3(\mathbb{Z})$). Status: `INTERNAL_CONSISTENCY_CHECKED`.
- **Group Closure & Inverses:** Checked internally. Status: `INTERNAL_CONSISTENCY_CHECKED`.
- **Screw Axis Relation ($g^4 = T_{(0,0,1)}$):** Checked internally. Status: `INTERNAL_CONSISTENCY_CHECKED`.
- **Independent Verification:** Status: `PENDING`.

## 6. Recommendations
- Maintain registration in `core/registry.ts`.
- Keep independent mathematical verification marked as `PENDING` until an external reference dataset or independent analytical proof is provided.
