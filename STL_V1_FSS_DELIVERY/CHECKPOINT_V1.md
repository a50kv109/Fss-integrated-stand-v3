# STL V1 — CHECKPOINT RECORD

**Status:** HARDENED WITH LIMITATIONS

**Scope:** Exact matrix conjugacy for 2×2 and 3×3 matrices, exact rational arithmetic, input validation, safe session history, expected-set comparison, and independent pair checks.

**Accepted semantics:**

- `maxSize === undefined` uses the default value **32**.
- Explicit `null`, non-numeric, non-finite, non-integer, or non-positive `maxSize` values are **INVALID_INPUT**.
- `expected` compares mathematical sets, ignoring order and duplicate occurrences.
- `pairs` checks explicitly supplied matrix correspondences independently; membership of `pair.g` in `G` is **not** required.
- Conjugacy verification does **not** establish that the input set is a group.
- The user supplies \(P\); STL does **not** search for \(P\).

**Excluded from V1:**

- GCL gateway
- Origin-shift transformations
- Automatic search for unknown \(P\)
- Abstract group-isomorphism search
- Geometry-based symmetry discovery
- Matcher / registry / classifier changes

**Verification limitation:** Native TypeScript full-suite run and full FSS build remain environment-dependent. A JavaScript mirror is supporting evidence, not a substitute for native verification in the receiving project.

**Baseline archive:** `fss-stl-v1-checkpoint.zip` (includes maxSize-null micro-patch and session input safety).
