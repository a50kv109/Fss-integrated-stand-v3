# FSS v3 — Capability Manifest & Verification Summary

**Fedorov Symmetry Stand v3 (FSS v3)** is an open-source, deterministic theoretical research stand engineered for rigorous crystallographic symmetry reasoning, algebraic validation, and adversarial evidence verification.

This document establishes the official capability manifest, verified mathematical scope, architectural boundaries, and known limitations of FSS v3.

---

## 1. Verified Mathematical Scopes

FSS v3 does not claim universal coverage of all 230 crystallographic space groups. Instead, it provides rigorously verified mathematical and geometric prototypes across three foundational levels:

### Level 1: Cyclic Group $C_3$ (Symmetry Evidence Chain PoC-01)
- **Scope**: Cyclic group of order 3 ($\{e, r, r^2\}$).
- **Verified Properties**: Group identity, generator powers, inverse mapping, element closure, and determinant / orthogonality constraints.
- **Adversarial Validation**: Verified via a dedicated mutation testing harness (`core/sec_poc_mutation.test.ts`) introducing 8 distinct targeted mutations (`MUT_01` through `MUT_08`). All 8 mutants were successfully detected and killed by the SEC verification assertions.
- **Reports**: [`SEC-POC-01-REPORT.md`](SEC-POC-01-REPORT.md), [`SEC-POC-01-FREEZE-REPORT.md`](SEC-POC-01-FREEZE-REPORT.md).

### Level 2: Non-Abelian Symmetric Group $S_3$ (Symmetry Evidence Chain PoC-02)
- **Scope**: Symmetric group of degree 3 (order 6), representing permutations of three elements and non-commutative isometries.
- **Verified Properties**: Non-commutative composition ($ab \neq ba$), complete Cayley table consistency, inverse existence, associativity, and independent reference audit.
- **Reports**: [`SEC-POC-02-S3-REPORT.md`](SEC-POC-02-S3-REPORT.md), [`SEC-POC-02-FREEZE-REPORT.md`](SEC-POC-02-FREEZE-REPORT.md).

### Level 3: Geometric Action on Regular Tetrahedron $V_4$ (Symmetry Evidence Chain PoC-03)
- **Scope**: Rigid spatial transformations acting on the vertices of a regular tetrahedron $V_4$:
  $$v_1 = (1, 1, 1), \quad v_2 = (1, -1, -1), \quad v_3 = (-1, 1, -1), \quad v_4 = (-1, -1, 1)$$
- **Verified Properties**: Metric preservation (Euclidean distance preservation within tolerance $\epsilon = 10^{-6}$), vertex permutation consistency, and faithful correspondence between abstract group operations and spatial geometric actions.
- **Important Distinction**: This constitutes an experimental geometric validation of transformation consistency on a polyhedral model, **not** a third independent group catalog entry.
- **Reports**: [`SEC-POC-03-GEOMETRIC-ACTION-REPORT.md`](SEC-POC-03-GEOMETRIC-ACTION-REPORT.md).

---

## 2. Architectural Boundaries & Non-Claims

To maintain strict scientific integrity, FSS v3 enforces the following limitations and non-claims:

1. **No Full 230 Space Group Claim**: FSS v3 provides analytical tooling and reference tests for selected symmetry groups and 8 classifier settings. It does not automate or guarantee complete space group determination for arbitrary experimental diffraction data across all 230 space groups.
2. **SEC Standalone Status**: The Symmetry Evidence Chain (SEC) framework operates as an independent research validation and testing stand. It is **not** coupled to or embedded within the core crystal structure generation engine.
3. **Pristine Core Preservation**: Core engine files (`core/engine.ts`, `core/canonical.ts`), SG 227 data, and group catalog definitions remain strictly unaltered in accordance with project constraints.
4. **Restricted Classifier Scope**: The two-stage classifier operates on 8 registered catalog settings (Nos. 1, 2, 3, 4, 5, 9, 14, 19). Unregistered settings (e.g. $P4_1$ SG 76) return `NO_CANDIDATES`.

---

## 3. Verification & Build Integrity

All test suites, type checking, linting, and production builds successfully pass without errors:
- $C_3$ SEC Harness: PASS (19/19 assertions)
- $C_3$ Mutation Harness: PASS (8/8 mutants killed)
- $S_3$ Symmetric Group Audit: PASS
- Tetrahedron Geometric Action: PASS
- TypeScript Type Check (`tsc`): PASS
- Production Build (`vite build`): PASS
