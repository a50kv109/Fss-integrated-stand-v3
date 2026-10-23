# Architectural Flow: Mathematical Passports in FSS

**Document:** `docs/architecture/MATHEMATICAL_PASSPORT_FLOW.md`  
**Status:** `PARTIAL / BASELINE VALIDATED FOR SG-002`

---

## 1. Pipeline Overview: Current Implemented Slice vs. Target Architecture

In FSS V1, mathematical passports feature both a declarative metadata layer and a validated executable integration slice for SG-002 ($P\bar{1}$).

### Current Verified Flow (SG-002 Baseline):
$$\text{Canonical Registry (`core/registry.ts`)} \longrightarrow \text{SG-002 Test (`core/passport_verification.test.ts`)} \longrightarrow \text{Exact Math Checks (`ExactRational`, $Wc+w=c$, independent $P'=-P$)} \longrightarrow \text{Computed Results (`fixedPointOk && pointTransformOk`)} \longrightarrow \text{Visualization DTO (`createSG002VisualizationPayload`)}$$

### Target / Proposed Flow (Deferred):
$$\text{YAML Passport} \longrightarrow \text{Runtime YAML Loader} \longrightarrow \text{Schema Validation} \longrightarrow \text{Automated Contract Dispatch} \longrightarrow \text{Verification Result} \longrightarrow \text{Universal Visualizer UI}$$

---

## 2. Stage Breakdown of Implemented V1 Baseline

1. **Canonical Registry & Data:**
   - Raw operations and group definitions are retrieved exclusively from `core/registry.ts` (`SymmetryCatalog`). Passports reference registry keys rather than duplicating operation matrices.
2. **Declarative Metadata & Types:**
   - YAML files (`docs/math/*.passport.yaml`) and TypeScript types (`core/schema/passport_schema.ts`) serve as descriptive specifications and type contracts. (Runtime YAML loading is deferred).
3. **Deterministic Verification:**
   - Executable methods in `core/group_properties.ts` and test assertions in `core/passport_verification.test.ts` evaluate SG-002 operations using exact rational arithmetic (`ExactRational`), including explicit coordinate checks for the inversion center and independent verification of transformed test points.
4. **Visualization Boundary Contract:**
   - `createSG002VisualizationPayload()` creates a standard DTO object from values passed by the caller.
   - The function itself does not compute geometric transformations or verify mathematical invariants.
   - Precision of `ExactRational` is preserved when passing corresponding objects, but object immutability is not guaranteed.
   - Projecting coordinates onto the screen remains the responsibility of the UI.
