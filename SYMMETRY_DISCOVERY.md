# FSS - Symmetry Discovery (M-6A.2)

**STATUS: PARTIALLY IMPLEMENTED (Deterministic Verification)**

This document outlines the design for the Symmetry Discovery phase (M-6A.2).

## 1. Objectives
- Automated discovery of symmetry transformations (In progress).
- Deterministic verification against `core/` model (Implemented).

## 2. Constraints & Principles
- Affine dimensions (0-3) require specialized handling.
- Candidate generation and verification are distinct.
- Semantic-type compatibility must match `core/`.

## 3. Plan (`PROPOSED`)
- Define candidate transformations based on anchors.
- Apply transformations to structural candidates.
- Verify isometry and group closure.
- Evidence generation for verified transformations.
