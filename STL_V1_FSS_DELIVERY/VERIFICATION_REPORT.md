# STL V1 — Verification Report (Delivery Package)

## Baseline identity

| Item | Value |
|------|--------|
| Baseline archive | `fss-stl-v1-checkpoint.zip` |
| Status label | HARDENED WITH LIMITATIONS |
| Includes | maxSize-null contract, null-request safety, StlSession summarizeRequest, H5c/H5d tests |

## Source files delivered (checksums computed at pack time)

See `MANIFEST.sha256`.

## Historical evidence (prior sessions — not re-executed at pack time unless listed below)

| Check | Outcome (historical) | Notes |
|-------|----------------------|-------|
| Native `tsx` conjugacy tests | PASS (40–51 assertions in earlier sessions) | Required re-run in receiving env |
| STL-only strict `tsc` | PASS (isolated) | |
| Full project `tsc` / vite build | Mixed / blocked by incomplete deps in sandbox | Not claimed for this package |
| JS mirror (conjugacy + safety + maxSize) | PASS | Supporting only |
| Static contract inspection | maxSize null path present in `conjugacy.ts` | |

## Commands executed while building **this** delivery package

| Command | Outcome |
|---------|---------|
| Unzip + copy sources from checkpoint | Done |
| `rg` for `rawMax` / H5c in packaged sources | Present |
| SHA-256 manifest generation | Done at pack |
| Native full `tsx` suite in pack environment | **NOT_RUN** if tooling unavailable — do not treat as PASS |
| Full FSS regression | **NOT_RUN** |

## Receiving project must still run

```bash
npx tsx core/stl/conjugacy.test.ts
# plus host lint/build/regression
```

## Limitations

1. This package does not embed `node_modules`.
2. Native TypeScript execution depends on the host toolchain.
3. Full FSS build success is **not** asserted by this delivery.
4. JS mirror ≠ native TS verification.
