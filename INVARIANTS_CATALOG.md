# FSS - Invariants Catalog

This catalog documents implemented and theoretical invariants in FSS.

| Invariant | Formulation | Status |
| :--- | :--- | :--- |
| **Translational Invariance** | `f(V + t) = f(V)` (Barycenter-based) | `IMPLEMENTED`, `TESTED` |
| **Scale Invariance** | `f(s*V) = f(V)` (Normalization by `maxRadius`) | `IMPLEMENTED`, `TESTED` |
| **Dimensionality** | Affine dimension (0-3) | `IMPLEMENTED`, `TESTED` |
| **Orthogonality** | `norm(u1 x u2) ≈ 1` (Planar anchor) | `IMPLEMENTED` |

## Implementation Notes

-   **Numerical Tolerance (`DIMENSION_TOLERANCES`)**:
    -   `COINCIDENCE_EPSILON` (1e-6)
    -   `ZERO_RADIUS_EPSILON` (1e-7)
    -   `DIMENSION_EPSILON` (1e-4)
-   Distinction between `verificationTolerance` (logical correctness of dimension) and `pixelTolerance` (if applicable in UI) is maintained through separation of `core/` logic from `components/` UI layer.
