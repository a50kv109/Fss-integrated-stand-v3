#!/usr/bin/env bash
# STL V1 package integrity + optional local test.
# Does NOT install dependencies. Does NOT modify a host FSS app.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "PASS: $*"; }
skip() { echo "SKIP: $*"; }

REQUIRED=(
  core/stl/exact_scalar.ts
  core/stl/exact_matrix.ts
  core/stl/conjugacy.ts
  core/stl/conjugacy.test.ts
  core/stl/index.ts
  core/stl/README.md
  README.md
  CHECKPOINT_V1.md
  INTEGRATION_GUIDE.md
  API_CONTRACT.md
  VERIFICATION_REPORT.md
  CHANGELOG.md
  MANIFEST.sha256
)

echo "== Package file presence =="
for f in "${REQUIRED[@]}"; do
  [[ -f "$f" ]] || fail "missing required file: $f"
  pass "found $f"
done

echo "== Manifest check =="
if command -v sha256sum >/dev/null 2>&1; then
  # Verify listed source files still match manifest entries for core/stl
  while read -r hash path; do
    [[ -z "${hash:-}" ]] && continue
    [[ "$path" == core/stl/* ]] || continue
    if [[ -f "$path" ]]; then
      actual=$(sha256sum "$path" | awk '{print $1}')
      if [[ "$actual" == "$hash" ]]; then
        pass "hash ok $path"
      else
        fail "hash mismatch $path (manifest $hash actual $actual)"
      fi
    fi
  done < MANIFEST.sha256
else
  skip "sha256sum not available"
fi

echo "== Optional native test =="
if command -v npx >/dev/null 2>&1; then
  if npx --yes tsx --version >/dev/null 2>&1; then
    echo "Running: npx tsx core/stl/conjugacy.test.ts"
    if npx --yes tsx core/stl/conjugacy.test.ts; then
      pass "conjugacy.test.ts"
    else
      fail "conjugacy.test.ts returned non-zero"
    fi
  else
    skip "tsx not runnable via npx (no auto-install beyond npx cache attempt failed or offline)"
  fi
else
  skip "npx not available"
fi

echo "== Summary =="
echo "File presence checks completed. Optional test may have been SKIPPED."
echo "Do not treat SKIP as PASS."
exit 0
