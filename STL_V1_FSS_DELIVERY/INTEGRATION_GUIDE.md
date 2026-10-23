# STL V1 — Integration Guide for FSS Remix (Google AI Studio / Gemini)

**Audience:** Gemini (or a human) integrating this package into an existing FSS Remix.  
**Rule:** Do **not** modify protected FSS components to “make STL fit.” Plan first; change only after explicit approval.

---

## Phase A — Inspect the receiving project

Before any edit, inventory the **actual** Remix:

1. Directory tree (especially `core/`, `src/`, test layout).
2. Package manager and lockfile (`package.json`, `package-lock.json` / `bun.lock` / `pnpm-lock.yaml`).
3. TypeScript config (`tsconfig.json`: `module`, `moduleResolution`, `strict`, path aliases).
4. Existing mathematical modules (ExactRational, affine ops, group_closure, engine).
5. Test runner convention (`tsx` scripts, vitest, jest, or ad-hoc `*.test.ts`).
6. Export/import style (ESM vs CJS, `.ts` extensions).
7. Presence and **real paths** of:
   - matcher / `operation_set_match`
   - `registry`
   - `engine`
   - `group_closure`
   - `server`
   - anything named `canonicalOperationKey`
   - classifier / UI entry points

**Deliverable of Phase A:** a short report with real paths and compatibility notes. Do not guess.

---

## Phase B — Plan before editing

Produce a **file-level plan** and wait for approval:

| Item | Content |
|------|---------|
| Files to **add** | Typically `core/stl/*` from this package |
| Files that may need **adaptation** | Only if import paths or test harness differ |
| Dependencies | Prefer host project’s `tsx` / `typescript`; STL has **no** extra runtime deps |
| Type risks | Do not force STL matrices into crystallographic `ExchangeSymmetryOperation` |
| Test command | e.g. `npx tsx core/stl/conjugacy.test.ts` |
| Regression | Existing classifier / registry tests |
| Rollback | Delete `core/stl/` and revert import-only changes |

**No application code changes until the plan is approved.**

---

## Phase C — Integrate the module

### Default placement

```text
<project-root>/core/stl/
  exact_scalar.ts
  exact_matrix.ts
  conjugacy.ts
  conjugacy.test.ts
  index.ts
  README.md
```

Copy from this package’s `core/stl/`. Adjust only import paths if the host uses path aliases.

### Isolation rules

1. Keep STL as a **standalone** exact-matrix module.
2. Do **not** replace `canonicalOperationKey` usage for conjugacy equality.
3. Do **not** route conjugacy verdicts through float `engine.ts`.
4. Do **not** duplicate `group_closure` algorithms.
5. Do **not** auto-write registry or catalog entries.
6. Optional later: thin adapter **from** crystallographic ops **to** `ExactMatrix` — separate task, not required for V1 load.

### Protected boundaries (verify paths in Remix)

Do not change merely for integration convenience:

- `core/operation_set_match.ts` (or equivalent matcher)
- `core/registry.ts`
- `core/engine.ts`
- `core/group_closure.ts`
- `server.ts`
- `canonicalOperationKey` definition/call sites
- Existing classifier behavior and registry contents

Any modification needs a **separate** justification and approval.

### Out of scope for this integration

GCL gateway, origin shift, search for \(P\), abstract iso search, geometry discovery, automatic classifier updates.

---

## Phase D — Verify the integration

Run and **record actual outcomes**:

1. `npx tsx core/stl/conjugacy.test.ts` (or host-equivalent) — must execute the **TypeScript** sources.
2. Project typecheck (`tsc --noEmit` / `npm run lint`).
3. Application production build.
4. Relevant existing FSS regression tests (registry, classifier, GCL if present).
5. Confirm classifier behavior unchanged (no unintended catalog edits).
6. Review final diff (only `core/stl/**` and explicitly approved glue).
7. Document limitations.

A JavaScript mirror alone is **not** sufficient to close Phase D.

---

## Phase E — Optional UI (separate decision)

After the module is independently testable:

- Propose UI options (e.g. conjugacy panel) with their own acceptance criteria.
- Do **not** make a new screen mandatory for the initial merge.

---

## Suggested order of operations for Gemini

1. Unpack `STL_V1_FSS_DELIVERY.zip`.
2. Phase A inspection report.
3. Phase B plan → human approval.
4. Copy `core/stl/` into the Remix.
5. Phase D verification commands + results table.
6. Stop; wait for approval before UI or GCL work.

---

## Smoke usage after copy

```ts
import { ExactMatrix, verifyConjugacy } from './core/stl'; // adjust path

const I = ExactMatrix.fromInt([[1, 0], [0, 1]]);
const R = ExactMatrix.fromInt([[0, -1], [1, 0]]);
const P = ExactMatrix.fromInt([[1, 1], [0, 1]]);
const result = verifyConjugacy({ G: [I, R], P });
// result.status === 'CONJUGACY_VERIFIED' when images compute successfully
```
