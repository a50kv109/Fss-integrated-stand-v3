# SG-IMPORT-PROTOCOL.md

## Standard Space Group Registration & Verification Protocol

### Purpose
To define a normalized, rigorous algorithm for the intake, mathematical verification, registration, and integration testing of any new space group in FSS V2. All future group registrations MUST follow this protocol.

### Mandatory Architectural Principles
1. Registration ≠ mathematical verification.
2. Self-consistency ≠ independent mathematical verification.
3. Integration verification ≠ mathematical correctness.
4. A test specification ≠ an executed test.
5. A reported PASS ≠ reproducible execution evidence.
6. A catalog record compared against itself ≠ independent validation.
7. Documentation completeness ≠ proof that every required check passed.
8. UNVERIFIED ≠ INVALID.

### Stages of Registration
1. **IDENTIFY**: Confirm space group number, HM symbol, and Hall symbol with authoritative sources (ITA, CCTBX). Status: `UNVERIFIED`.
2. **NORMALIZE**: Translate operations into canonical FSS format (Rotation matrix, fractional translation). Status: `DATA_VALIDATED`.
3. **VALIDATE DATA**: Verify syntax and type compliance with `SymmetryRecord`. Status: `DATA_VALIDATED`.
4. **VERIFY MATH**: Perform independent derivation or external reference comparison. Status: `MATH_VERIFIED` (or `PENDING` if independent source absent). Internal self-consistency is recorded separately as `INTERNAL_CONSISTENCY_CHECKED`.
5. **RECONCILE**: Generate `ANALYSIS/SG_XXX_REGISTRATION_REPORT.md` detailing proofs and limitations.
6. **REGISTER**: Add entry to `core/registry.ts`. Status: `REGISTERED`.
7. **INTEGRATE**: Add unit tests to `core/registry.test.ts`. Verify integration via classifier. Status: `INTEGRATION_VERIFIED`.
8. **ACCEPT & DOCUMENT**: Finalize `DATA_PASSPORT.md` and audit reports. Status: `COMPLIANT` (documentation compliance only).

### Canonical Status Model (Independent Dimensions)
- `DATA_VALIDATED`: Required input fields and representation checked against explicit validation rules.
- `MATH_VERIFIED`: Mathematical properties checked against a documented, independent reference or independently derived proof, with reproducible evidence.
- `INTERNAL_CONSISTENCY_CHECKED`: Internal checks (identity, closure, inverse, self-matching) verified within the repository.
- `REGISTERED`: Group has a record in `core/registry.ts`.
- `INTEGRATION_VERIFIED`: Documented integration test executed with available result.
- `COMPLIANT`: Registration documentation satisfies procedural and evidence-reporting requirements. (Does NOT imply mathematical verification succeeded).
- `PENDING`: Required independent verification or external reference check not yet completed.
- `UNVERIFIED`: Required claim not yet established.
