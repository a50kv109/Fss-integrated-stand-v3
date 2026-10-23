#!/usr/bin/env python3
"""
Reproducible Gemmi Crystallographic Extractor for FSS (KB-11)

Extracts verified crystallographic space groups (Nos. 1, 2, 5, 9, 14, 19)
directly from the authoritative, pinned Gemmi source repository.

Upstream Provenance:
- Project: Gemmi (https://github.com/project-gemmi/gemmi)
- Release: v0.7.5
- Pinned Commit SHA: 5cc1c23c6007e0e6cbd69289c6f7c0bff50e943e
- Verified Source Table: src/symmetry.cpp (table: spacegroup_tables::main[564])
- Verified Source Hash: fae1e4e6f297bbca5ff22126e5f99a54b60d8bcda0f003256558d2bb6426489c
- License: MPL-2.0
- Attribution: International Tables for Crystallography (ITA)
"""

import sys
import os
import re
import json
import hashlib
import urllib.request
from math import gcd

PINNED_COMMIT = "5cc1c23c6007e0e6cbd69289c6f7c0bff50e943e"
PINNED_TAG = "v0.7.5"
SOURCE_REPO = "https://github.com/project-gemmi/gemmi"
SOURCE_CPP_URL = f"https://raw.githubusercontent.com/project-gemmi/gemmi/{PINNED_COMMIT}/src/symmetry.cpp"
EXPECTED_CPP_SHA256 = "fae1e4e6f297bbca5ff22126e5f99a54b60d8bcda0f003256558d2bb6426489c"

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "source")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "crystallography", "gemmi_benchmark_4.json")

TARGET_GROUPS = [1, 2, 3, 4, 5, 9, 14, 19]

DEN = 24  # Gemmi denominator for fractional symmetry operations

def fetch_and_verify_source() -> str:
    """Fetches Gemmi src/symmetry.cpp and verifies tamper-proof cryptographic hash."""
    os.makedirs(CACHE_DIR, exist_ok=True)
    cached_file = os.path.join(CACHE_DIR, f"gemmi_symmetry_{PINNED_COMMIT[:8]}.cpp")
    
    if os.path.exists(cached_file):
        with open(cached_file, "rb") as f:
            data = f.read()
        sha = hashlib.sha256(data).hexdigest()
        if sha == EXPECTED_CPP_SHA256:
            print(f"✓ Using verified local Gemmi source ({sha[:12]}...)")
            return data.decode("utf-8")
        else:
            print(f"⚠ Cached source checksum mismatch: expected {EXPECTED_CPP_SHA256}, got {sha}. Re-fetching...")

    print(f"Fetching Gemmi source from {SOURCE_CPP_URL}...")
    req = urllib.request.Request(SOURCE_CPP_URL, headers={"User-Agent": "FSS-Crystallography-Extractor/1.0"})
    with urllib.request.urlopen(req) as resp:
        data = resp.read()

    sha = hashlib.sha256(data).hexdigest()
    if sha != EXPECTED_CPP_SHA256:
        raise ValueError(f"CRITICAL: Integrity failure on Gemmi source! Expected SHA-256 {EXPECTED_CPP_SHA256}, got {sha}")

    with open(cached_file, "wb") as f:
        f.write(data)

    print(f"✓ Source fetched and verified (SHA-256: {sha})")
    return data.decode("utf-8")

def parse_gemmi_spacegroup_table(source_code: str):
    """
    Parses spacegroup_tables::main[564] directly from Gemmi src/symmetry.cpp.
    Extracts entries: number, ccp4, hm, ext, qualifier, hall, basis_op_id.
    """
    start_marker = "const SpaceGroup spacegroup_tables::main[564] = {"
    start_idx = source_code.find(start_marker)
    if start_idx == -1:
        raise ValueError("Could not locate spacegroup_tables::main in Gemmi source code!")
    start_idx += len(start_marker)
    end_idx = source_code.find("};\n", start_idx)
    table_body = source_code[start_idx:end_idx]

    entries = []
    for line in table_body.strip().splitlines():
        line = line.strip()
        if not line or line.startswith("//"):
            continue
        if "//" in line:
            line = line[:line.rfind("//")].strip()
        if line.startswith("{") and line.endswith("},"):
            content = line[1:-2].strip()
            # Parse C struct tokens respecting strings and escaped quotes
            content_clean = content.replace('\\"', '__ESCAPED_QUOTE__')
            parts = []
            cur = []
            in_str = False
            in_char = False
            for ch in content_clean:
                if ch == '"' and not in_char:
                    in_str = not in_str
                elif ch == "'" and not in_str:
                    in_char = not in_char
                elif ch == "," and not in_str and not in_char:
                    parts.append("".join(cur).strip())
                    cur = []
                    continue
                cur.append(ch)
            parts.append("".join(cur).strip())

            if len(parts) == 7:
                num = int(parts[0])
                ccp4 = int(parts[1])
                hm = parts[2].strip('"').replace('__ESCAPED_QUOTE__', '"')
                ext = parts[3].strip("'")
                qualifier = parts[4].strip('"')
                hall = parts[5].strip('"').replace('__ESCAPED_QUOTE__', '"')
                basis_op_id = int(parts[6])
                entries.append({
                    "number": num,
                    "ccp4": ccp4,
                    "hm": hm,
                    "ext": ext,
                    "qualifier": qualifier,
                    "hall": hall,
                    "basis_op_id": basis_op_id
                })

    print(f"✓ Parsed all {len(entries)} spacegroup table definitions from Gemmi src/symmetry.cpp")
    return entries

# -----------------------------------------------------------------------------
# Gemmi Hall Symbol Translation Engine (Exact Rational mod 24)
# Implements generators_from_hall and add_missing_elements from symmetry.hpp
# -----------------------------------------------------------------------------

def mat_mul(W1, W2):
    res = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
    for i in range(3):
        for j in range(3):
            res[i][j] = W1[i][0] * W2[0][j] + W1[i][1] * W2[1][j] + W1[i][2] * W2[2][j]
    return res

def hall_rotation_z(N):
    if N == 1:
        return [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
    elif N == 2:
        return [[-1, 0, 0], [0, -1, 0], [0, 0, 1]]
    elif N == 3:
        return [[0, -1, 0], [1, -1, 0], [0, 0, 1]]
    elif N == 4:
        return [[0, -1, 0], [1, 0, 0], [0, 0, 1]]
    elif N == 6:
        return [[1, -1, 0], [1, 0, 0], [0, 0, 1]]
    elif N == "'":
        return [[0, -1, 0], [-1, 0, 0], [0, 0, -1]]
    elif N == '"':
        return [[0, 1, 0], [1, 0, 0], [0, 0, -1]]
    elif N == '*':
        return [[0, 0, 1], [1, 0, 0], [0, 1, 0]]
    else:
        raise ValueError(f"Unknown Hall rotation order: {N}")

def alter_order(r, i, j, k):
    return [
        [r[i][i], r[i][j], r[i][k]],
        [r[j][i], r[j][j], r[j][k]],
        [r[k][i], r[k][j], r[k][k]]
    ]

def hall_translation_from_symbol(char_sym):
    h = DEN // 2  # 12
    q = DEN // 4  # 6
    lookup = {
        'a': [h, 0, 0],
        'b': [0, h, 0],
        'c': [0, 0, h],
        'n': [h, h, h],
        'u': [q, 0, 0],
        'v': [0, q, 0],
        'w': [0, 0, q],
        'd': [q, q, q]
    }
    if char_sym not in lookup:
        raise ValueError(f"Unknown translation symbol: {char_sym}")
    return list(lookup[char_sym])

def parse_hall_generators(hall_str: str):
    """
    Faithfully replicates Gemmi's generators_from_hall(const char* hall)
    from gemmi/src/symmetry.cpp lines 375-418.
    """
    hall = hall_str.strip()
    centrosym = hall.startswith('-')
    if centrosym:
        hall = hall[1:].strip()

    lattice = hall[0]
    ops = []
    
    # Always starts with Identity
    ops.append({
        "W": [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        "w": [0, 0, 0]
    })
    
    if lattice == 'C':
        ops.append({"W": [[1, 0, 0], [0, 1, 0], [0, 0, 1]], "w": [12, 12, 0]})
    elif lattice != 'P':
        raise NotImplementedError(f"Benchmark scope covers 'P' and 'C' lattices, got: {lattice}")

    parts = hall[1:].strip().split()

    counter = 0
    prev = 0

    for part in parts:
        counter += 1
        if part == '1':
            continue

        neg = part.startswith('-')
        p = part[1:] if neg else part
        N = int(p[0])
        p = p[1:]

        fractional_tran = 0
        principal_axis = None
        diagonal_axis = None
        tran = [0, 0, 0]

        for char in p:
            if char.isdigit():
                fractional_tran = int(char)
            elif char in ["'", '"', '*']:
                diagonal_axis = char
            elif char in ['x', 'y', 'z']:
                principal_axis = char
            else:
                t = hall_translation_from_symbol(char)
                tran = [(tran[i] + t[i]) % DEN for i in range(3)]

        # Implicit axes as defined in Gemmi symmetry.cpp lines 324-338
        if not principal_axis and not diagonal_axis:
            if counter == 1:
                principal_axis = 'z'
            elif counter == 2 and N == 2:
                if prev in [2, 4]:
                    principal_axis = 'x'
                elif prev in [3, 6]:
                    diagonal_axis = "'"
            elif counter == 3 and N == 3:
                diagonal_axis = '*'
            elif N != 1:
                raise ValueError(f"Missing axis in Hall symbol token: {part}")

        rot = hall_rotation_z(diagonal_axis if diagonal_axis else N)
        if neg:
            rot = [[-val for val in row] for row in rot]

        if principal_axis == 'x':
            rot = alter_order(rot, 2, 0, 1)
        elif principal_axis == 'y':
            rot = alter_order(rot, 1, 2, 0)

        if fractional_tran:
            axis_idx = ord(principal_axis) - ord('x')
            tran[axis_idx] = (tran[axis_idx] + (DEN // N) * fractional_tran) % DEN

        prev = N
        ops.append({"W": rot, "w": tran})

    if centrosym:
        ops.append({
            "W": [[-1, 0, 0], [0, -1, 0], [0, 0, -1]],
            "w": [0, 0, 0]
        })

    return ops

def compose_op(op1, op2):
    W = mat_mul(op1["W"], op2["W"])
    w = [0, 0, 0]
    for i in range(3):
        term = sum(op1["W"][i][k] * op2["w"][k] for k in range(3))
        w[i] = (op1["w"][i] + term) % DEN
    return {"W": W, "w": w}

def op_key(op):
    return f"{op['W']}|{op['w']}"

def generate_full_group_ops(generators):
    """
    Computes algebraic group closure of operations mod 24
    (Gemmi GroupOps::add_missing_elements in symmetry.hpp line 491).
    """
    unique_ops = {}
    for g in generators:
        unique_ops[op_key(g)] = g

    added = True
    while added:
        added = False
        current_list = list(unique_ops.values())
        for o1 in current_list:
            for o2 in current_list:
                comp = compose_op(o1, o2)
                k = op_key(comp)
                if k not in unique_ops:
                    unique_ops[k] = comp
                    added = True

    return list(unique_ops.values())

def to_exact_rational(val24):
    """Converts val/24 into an exact reduced fraction {numerator, denominator}."""
    g = gcd(abs(val24), DEN)
    return {
        "numerator": val24 // g,
        "denominator": DEN // g
    }

def format_triplet(W, w24):
    """Constructs algebraic triplet (e.g. -x, y+1/2, -z+1/2) for verification traceability."""
    vars_ = ['x', 'y', 'z']
    parts = []
    for i in range(3):
        terms = []
        for j in range(3):
            coeff = W[i][j]
            if coeff == 1:
                terms.append(vars_[j] if not terms else f"+{vars_[j]}")
            elif coeff == -1:
                terms.append(f"-{vars_[j]}")
            elif coeff != 0:
                terms.append(f"{coeff:+d}{vars_[j]}")
        r = to_exact_rational(w24[i])
        if r["numerator"] != 0:
            terms.append(f"+{r['numerator']}/{r['denominator']}")
        parts.append("".join(terms) if terms else "0")
    return ",".join(parts)

# -----------------------------------------------------------------------------
# Main Extraction & Artifact Construction Pipeline
# -----------------------------------------------------------------------------

def extract_benchmark_catalog():
    print("=" * 60)
    print("FSS KB-11: Gemmi Benchmark Space Groups Extractor")
    print("=" * 60)
    
    source_code = fetch_and_verify_source()
    all_entries = parse_gemmi_spacegroup_table(source_code)

    selected_entries = {
        1: [e for e in all_entries if e["number"] == 1 and e["ccp4"] == 1][0],
        2: [e for e in all_entries if e["number"] == 2 and e["ccp4"] == 2][0],
        14: [e for e in all_entries if e["number"] == 14 and e["qualifier"] == "b1"][0],  # Standard ITA setting P 1 21/c 1
        19: [e for e in all_entries if e["number"] == 19 and e["ccp4"] == 19][0],
        5: [e for e in all_entries if e["number"] == 5][0],
        9: [e for e in all_entries if e["number"] == 9][0],
        4: [e for e in all_entries if e["number"] == 4][0],
        3: [e for e in all_entries if e["number"] == 3][0]
    }

    records = []

    system_map = {
        1: "triclinic",
        2: "triclinic",
        5: "monoclinic",
        9: "monoclinic",
        14: "monoclinic",
        19: "orthorhombic",
        4: "monoclinic",
        3: "monoclinic"
    }

    setting_id_map = {
        1: "P1",
        2: "P-1",
        5: "C2",
        9: "Cc",
        14: "P21/c",
        19: "P212121",
        4: "P21",
        3: "P2"
    }

    for num in TARGET_GROUPS:
        entry = selected_entries[num]
        print(f"\nProcessing Group {num}: HM='{entry['hm']}', Hall='{entry['hall']}'...")
        
        generators = parse_hall_generators(entry["hall"])
        full_ops = generate_full_group_ops(generators)
        
        print(f"  ✓ Derived {len(full_ops)} group symmetry operations from Hall symbol '{entry['hall']}'")

        formatted_ops = []
        for idx, op in enumerate(full_ops):
            w_rats = [to_exact_rational(t) for t in op["w"]]
            triplet = format_triplet(op["W"], op["w"])
            formatted_ops.append({
                "W": op["W"],
                "w": w_rats,
                "triplet": triplet
            })

        # Determine centering from Hall symbol
        hall_for_centering = entry["hall"].strip()
        if hall_for_centering.startswith('-'):
            hall_for_centering = hall_for_centering[1:].strip()
        centering = hall_for_centering[0]

        record = {
            "spaceGroupNumber": num,
            "settingId": setting_id_map[num],
            "hmSymbol": entry["hm"],
            "hallSymbol": entry["hall"],
            "crystalSystem": system_map[num],
            "centering": centering,
            "operationsCount": len(formatted_ops),
            "operations": formatted_ops,
            "provenance": {
                "sourceName": "Gemmi",
                "sourceRepository": SOURCE_REPO,
                "sourceCommit": PINNED_COMMIT,
                "tablePath": "src/symmetry.cpp:spacegroup_tables::main",
                "license": "MPL-2.0",
                "attribution": "International Tables for Crystallography (ITA)",
                "isVerified": True
            }
        }
        records.append(record)

    # Compute deterministic canonical SHA-256 checksum of records payload
    records_canonical_json = json.dumps(records, separators=(',', ':'), sort_keys=True)
    records_sha256 = hashlib.sha256(records_canonical_json.encode("utf-8")).hexdigest()

    manifest = {
        "schemaId": "https://fss.local/schemas/crystallographic-exchange-v1.json",
        "schemaVersion": "1.0.0",
        "sourceName": "Gemmi",
        "sourceRepository": SOURCE_REPO,
        "sourceCommit": PINNED_COMMIT,
        "sourceVersion": PINNED_TAG,
        "tablePath": "src/symmetry.cpp:spacegroup_tables::main",
        "license": "MPL-2.0",
        "attribution": "International Tables for Crystallography (ITA)",
        "extractorVersion": "1.0.0",
        "recordCount": len(records),
        "sha256Checksum": records_sha256,
        "isSourceVerified": True
    }

    artifact = {
        "manifest": manifest,
        "records": records
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(artifact, f, indent=2)

    print(f"\n" + "=" * 60)
    print(f"✓ Artifact successfully generated at: {OUTPUT_PATH}")
    print(f"✓ Records SHA-256: {records_sha256}")
    print("=" * 60)
    return OUTPUT_PATH, records_sha256

if __name__ == "__main__":
    extract_benchmark_catalog()
