# FSS v3 — Verification Matrix & Test Summary

This matrix catalogs the verification status, test suites, execution commands, and evidence artifacts associated with FSS v3.

---

## Verification Matrix

| Module / Test File | Component / Scope | Assertions / Checks | Execution Command | Status | Evidence Artifact |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `core/sec_poc.test.ts` | SEC PoC-01 ($C_3$ Group) | 19 assertions covering group identity, generator powers, inverse mapping, element closure, and determinant / orthogonality constraints. | `npx tsx core/sec_poc.test.ts` | **PASS** | [`SEC-POC-01-REPORT.md`](SEC-POC-01-REPORT.md) |
| `core/sec_poc_mutation.test.ts` | Mutation Harness (PoC-01) | 8 targeted mutations (`MUT_01`–`MUT_08`) introduced to test detector sensitivity. | `npx tsx core/sec_poc_mutation.test.ts` | **PASS** (8/8 killed) | [`SEC-POC-01-MUTATION-HARNESS-AUDIT.md`](SEC-POC-01-MUTATION-HARNESS-AUDIT.md) |
| `core/sec_poc02_s3.test.ts` | SEC PoC-02 ($S_3$ Group) | Non-abelian composition ($ab \neq ba$), complete Cayley table consistency, inverse existence, associativity. | `npx tsx core/sec_poc02_s3.test.ts` | **PASS** | [`SEC-POC-02-S3-REPORT.md`](SEC-POC-02-S3-REPORT.md) |
| `core/sec_poc03_geometry.test.ts` | SEC PoC-03 (Tetrahedron) | Rigid spatial transformations on $V_4$, Euclidean distance preservation ($\epsilon = 10^{-4}$), vertex permutations (geometric-action subset test, without group closure assumptions). | `npx tsx core/sec_poc03_geometry.test.ts` | **PASS** | [`SEC-POC-03-GEOMETRIC-ACTION-REPORT.md`](SEC-POC-03-GEOMETRIC-ACTION-REPORT.md) |
| TypeScript Compiler | Static Type Checking (`tsc`) | Full type correctness across core modules, tests, and UI components. | `npx tsc --noEmit` | **PASS** | Build logs |
| Linter | Code Linting (`eslint`) | Code style, syntax rules, and import correctness. | `npm run lint` | **PASS** | Linter output |
| Production Bundler | Vite Build (`vite build`) | Production asset compilation and bundling. | `npm run build` | **PASS** | `dist/` bundle output |

---

## Summary of Reproducibility

To run the complete verification suite locally:

```bash
npx tsx core/sec_poc.test.ts
npx tsx core/sec_poc_mutation.test.ts
npx tsx core/sec_poc02_s3.test.ts
npx tsx core/sec_poc03_geometry.test.ts
npm run lint
npm run build
```
