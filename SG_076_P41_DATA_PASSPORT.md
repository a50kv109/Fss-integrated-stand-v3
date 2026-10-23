# Data Passport: Space Group No. 76 (P 41)

## 1. Metadata
- **Number**: 76
- **Hermann–Mauguin Symbol**: P 41
- **Hall Symbol**: P 4w (Source: AFLOW/CCTBX/IUCr)
- **Crystal System**: Tetragonal
- **Point Group**: 4
- **Number of Operations**: 4

## 2. Operations (Canonical)
| # | Operator | Rotation (W) | Translation (w) |
|---|---|---|---|
| 1 | (x, y, z) | [[1,0,0], [0,1,0], [0,0,1]] | {numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}, {numerator: 0, denominator: 1} |
| 2 | (-y, x, z+1/4) | [[0,-1,0], [1,0,0], [0,0,1]] | {numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}, {numerator: 1, denominator: 4} |
| 3 | (-x, -y, z+1/2) | [[-1,0,0], [0,-1,0], [0,0,1]] | {numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}, {numerator: 1, denominator: 2} |
| 4 | (y, -x, z+3/4) | [[0,1,0], [-1,0,0], [0,0,1]] | {numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}, {numerator: 3, denominator: 4} |

## 3. Mathematical Verification & Evidence Status
- **Screw Axis Relation**: Intended relation is $g^4 = T_{(0,0,1)}$ along $[0,0,1]$.
- **Internal Consistency**: Verified via script and unit test assertions (identity, closure, inverse, self-matching). Status: `INTERNAL_CONSISTENCY_CHECKED`.
- **Independent Mathematical Verification**: An independent reference check or external derivation has not yet been completed in this environment. Status: `PENDING`.
- **Registration Report**: Detailed evidence ledger and validation notes can be found in `/docs/analysis/SG_076_P41_REGISTRATION_REPORT.md`.

## 4. Status Dimensions
- **Protocol Stage**: 8. ACCEPT & DOCUMENT
- **Documentation Compliance Status**: `COMPLIANT` (Satisfies procedural and evidence-reporting requirements; does NOT imply mathematical verification has succeeded).
- **Data Validation Status**: `DATA_VALIDATED`
- **Internal Consistency Status**: `INTERNAL_CONSISTENCY_CHECKED`
- **Independent Mathematical Verification Status**: `PENDING`
- **Registration Status**: `REGISTERED` (Present in `core/registry.ts`)
- **Integration Status**: `INTEGRATION_VERIFIED` (Unit tested in `core/registry.test.ts` and verified via internal consistency script)
- **Reference**: Follows [SG-IMPORT-PROTOCOL.md](/docs/SG-IMPORT-PROTOCOL.md)
