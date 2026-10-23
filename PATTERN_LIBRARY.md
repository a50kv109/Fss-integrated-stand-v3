# FSS - Pattern Library

A catalog of symmetry reasoning patterns identified in FSS development.

| ID | Name | Core Essence | Status |
| :--- | :--- | :--- | :--- |
| `SYM-PAT-01` | Seed-to-Structure | Seed → Orbit → Structure → Tiling | `PROPOSED` |
| `SYM-PAT-02` | Seed-to-Symmetry | Seed → Orbit → Structure → Symmetry | `PROPOSED` |
| `SYM-PAT-03` | Nested Symmetry | Hierarchical transformation | `PROPOSED` |

## Pattern Definitions

### `SYM-PAT-02`: Seed-to-Symmetry
- **Essence**: Derived structure implies symmetry group.
- **Conditions**: Structure must be fully defined (not partial).
- **Limit**: Symmetry group of structure may not match generating group (Symmetry breaking).
- **Source**: Theoretical design (M-6A.2).

## Constraints & Limitations
- Orbit generation does *not* guarantee correct tiling (`PROPOSED`).
- Inverse transition (Structure → Seed) is highly ambiguous (`PROPOSED`).
- Symmetry of components may be broken upon union (`PROPOSED`).
