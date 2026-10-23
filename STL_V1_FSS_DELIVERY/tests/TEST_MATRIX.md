# STL V1 — Test Matrix

Runner: `core/stl/conjugacy.test.ts` (ad-hoc asserts, `npx tsx`).

| ID | Scenario | Expected |
|----|----------|----------|
| T1 | D₄ conjugacy with independently derived fixture | `CONJUGACY_VERIFIED` |
| T2 | Singular \(P\) | `INVALID_INPUT`, det 0 |
| T3 | Expected set differs | `REFUTED` |
| T4 | Expected list order changed | `CONJUGACY_VERIFIED` (set equality) |
| T5 | \(\det P=2\), rational inverse | `CONJUGACY_VERIFIED` |
| T6 | Non-group subset, conjugacy ok | `CONJUGACY_VERIFIED`; limits note not a group proof |
| T7 | Mixed 2×2 / 3×3 or bad dimension | `INVALID_INPUT` / `UNSUPPORTED_INPUT` |
| H1 | Unsafe `number` scalar | throw |
| H2 | Large int via bigint/string | exact |
| H3 | Bad first G entry | `INVALID_INPUT` |
| H4 | Malformed pairs | `INVALID_INPUT` |
| H5 | maxSize −1 / 1.5 | `INVALID_INPUT` |
| H5c | maxSize `null` | `INVALID_INPUT` |
| H5d | maxSize omitted | default; conjugacy can succeed |
| H6 | Bad matrix scalar entry | throw at construction |
| S1–S4 | null/undefined request; session with null G/P; missing G | `INVALID_INPUT`; session records snapshot |
| Session | Two runs | history length 2 |
| 3×3 | Identity conjugacy smoke | `CONJUGACY_VERIFIED` |

T1 fixture is **independently derived** (standard \(D_4\) presentation), not a recovered EXPERIMENT 01 binary blob.
