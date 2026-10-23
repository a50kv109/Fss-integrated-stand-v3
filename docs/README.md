# Fedorov Symmetry Stand (FSS) Documentation

Welcome to the canonical documentation suite of the **Fedorov Symmetry Stand (FSS)** — a deterministic theoretical research environment for crystallographic symmetry analysis.

## Conceptual Framework: The Three Tiers
The documentation reflects the three conceptual tiers of the stand (as an organizing architectural model, not a single monolithic engine):
1. **Crystallographic Reference Catalog:** Passive normative data ([`PROJECT_PASSPORT.md`](PROJECT_PASSPORT.md), [`MATHEMATICAL_MODEL.md`](MATHEMATICAL_MODEL.md)).
2. **Deterministic Computing Core:** Exact rational arithmetic, affine geometry, and standalone algorithms ([`ARCHITECTURE.md`](ARCHITECTURE.md), [`../core/stl/README.md`](../core/stl/README.md)).
3. **Experimental Research Stand:** Interactive geometry, algebraic conjugacy, and classification ([`CLASSIFIER_CONTRACT.md`](CLASSIFIER_CONTRACT.md), [`LIMITATIONS.md`](LIMITATIONS.md)).

## Core Documentation
- [Project Passport](PROJECT_PASSPORT.md) — System mission, conceptual tiers, and epistemic boundaries
- [System Architecture](ARCHITECTURE.md) — Tier topology, directory layout, and data flow pipelines
- [Mathematical Model](MATHEMATICAL_MODEL.md) — Formal equations, rational arithmetic, invariants, and origin shifts
- [Classifier Contract](CLASSIFIER_CONTRACT.md) — Normative classifier verdicts, state transitions, and error handling
- [Known Limitations & Epistemic Boundaries](LIMITATIONS.md) — Prohibited claims, technical gaps, and test breakdown

## Specialized Modules & Specifications
- [STL V1 Module Passport](../core/stl/README.md) — Symmetry Transformation Lab: exact matrix conjugacy ($g' = P^{-1} g P$)
- [SEC PoC-01 Report](SEC-POC-01-REPORT.md) — Symmetry Evidence Chain: Prototype validation and audit report for cyclic group $C_3$ (Status: **PASS WITH GAPS — INTERNAL VERIFICATION ONLY**)
- [SEC PoC-01 Adversarial Audit](SEC-POC-01-ADVERSARIAL-AUDIT.md) — Symmetry Evidence Chain: Comprehensive adversarial reliability audit report (Status: **PASS — INTERNAL ADVERSARIAL TESTS PASSED**)
- [SEC PoC-01 Audit of the Auditor](SEC-POC-01-AUDIT-OF-AUDITOR.md) — Symmetry Evidence Chain: Mutation testing, check independence, and boundary robustness report (Status: **PASS — MUTATION TESTS PASSED**)
- [SEC PoC-01 Mutation Harness Audit](SEC-POC-01-MUTATION-HARNESS-AUDIT.md) — Detailed verification and execution results of mutation testing harness (Status: **PASS — MUTATION HARNESS VERIFIED**)
- [SEC PoC-01 Freeze & Reproducibility Checkpoint Report](SEC-POC-01-FREEZE-REPORT.md) — Final freeze report, execution logs, and reproducibility checkpoint for SEC PoC-01 (Status: **FROZEN — PASS**)
- [SEC PoC-02 S3 Report](SEC-POC-02-S3-REPORT.md) — Symmetry Evidence Chain Phase 2: Independent S3 Symmetric Group & Non-Commutative Verification Report (Status: **PASS — INDEPENDENTLY VERIFIED**)
- [SEC PoC-02 Freeze & Reproducibility Checkpoint Report](SEC-POC-02-FREEZE-REPORT.md) — Final freeze report, execution logs, and reproducibility checkpoint for SEC PoC-02 S3 (Status: **FROZEN — PASS**)
- [SEC PoC-03 Geometric Action Verification Report](SEC-POC-03-GEOMETRIC-ACTION-REPORT.md) — Symmetry Evidence Chain Phase 3: Geometric Action Verification of Abstract Group Operations on Tetrahedron Vertices V4 (Status: **VERIFIED — PASS**)

## Engineering & Verification Status
- [FSS v3 Capability Manifest](FSS-V3-CAPABILITY-MANIFEST.md) — Official verified scope ($C_3$, $S_3$, Tetrahedron action), boundaries, and non-claims
- [FSS v3 Verification Matrix](FSS-V3-VERIFICATION-MATRIX.md) — Master test suite matrix, execution commands, and status
- [FSS v3 Baseline Audit](FSS-V3-BASELINE.md) — Baseline audit, mathematical inventory, and repository boundary for FSS v3
- [Engineering Roadmap](ROADMAP.md) — Phase history (Phases 5A through 5G STL V1, Phase 6 planned)
- [Testing Strategy & Harness Status](TESTING.md) — Test breakdown and execution results
- [Integration History](INTEGRATION_HISTORY.md) — Detailed provenance and assimilation records
- [Current System Status](../STATUS.md) — Component status matrix and execution verification

## Historical Analysis Reports
- [`analysis/`](analysis/) — Archive of Phase 4A–4E and Phase 5B–5E analytical and verification reports

