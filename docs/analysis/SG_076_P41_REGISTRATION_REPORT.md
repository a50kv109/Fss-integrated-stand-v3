# Registration Report: Space Group No. 76 (P 41)

## 1. Registration Record
- **Group Number**: 76
- **HM Symbol**: P 41
- **Hall Symbol**: P 4w
- **Registration Status**: `REGISTERED` (Present in `core/registry.ts`)

## 2. Evidence Ledger

| Claim ID | Claim | Evidence Source | Verification Method | Result | Independence | Limitation |
|---|---|---|---|---|---|---|
| CLM-01 | Presence of SG76 registry record | `core/registry.ts` | Static inspection and TypeScript compilation | PASS | Internal | Proves syntax/presence only, not mathematical correctness |
| CLM-02 | Operation count and uniqueness | `core/registry.ts` | Programmatic assertion in `core/registry.test.ts` | PASS | Internal | Exactly 4 unique operations for general position |
| CLM-03 | Identity operation | `core/registry.ts` | Unit test in `core/registry.test.ts` | PASS | Internal | First operation is $W=I, w=0$ |
| CLM-04 | Closure and inverse properties | `core/registry.test.ts` | Executed unit tests | PASS | Internal | Tested over internal operation set |
| CLM-05 | Screw axis relation ($g^4 = T_{(0,0,1)}$) | `core/registry.test.ts` & `scripts/audit_sg76.ts` | Script / test execution | PASS | Internal | Verified within internal representation; independent reference `PENDING` |
| CLM-06 | Independent provenance of operation list | External literature (ITA/CCTBX) | Manual citation check | PENDING | Independent | Full external reference verification not yet executed in current sandbox |
| CLM-07 | Classifier behavior for SG76 | `core/operation_set_match.ts` | Self-consistency test via `scripts/audit_sg76.ts` | PASS | Internal | Compares catalog entry against itself; not independent validation |
| CLM-08 | Build, lint, and unit test execution | npm scripts (`npm run build`, `npm run lint`) | Shell command execution | PASS | Internal | Stand builds successfully with zero errors |
| CLM-09 | README/catalog accuracy | `README.md` & `core/registry.ts` | Manual audit | PASS | Internal | Registry count updated to 9 settings |

## 3. Summary of Status Dimensions
- **Registration State**: `REGISTERED`
- **Internal Consistency State**: `INTERNAL_CONSISTENCY_CHECKED`
- **Independent Mathematical Verification State**: `PENDING`
- **Integration-Test State**: `INTEGRATION_VERIFIED`
- **Documentation-Compliance State**: `COMPLIANT`
