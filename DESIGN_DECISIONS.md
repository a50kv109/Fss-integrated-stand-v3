# FSS - Design Decisions

Documenting architectural rationale for FSS.

| Decision | Rationale | Alternatives |
| :--- | :--- | :--- |
| Functional Core | Stateless, pure functions improve stability and testing | Object-Oriented state management |
| Eigenvalue Analysis | Analytical Cardano's formula is more stable and deterministic than iterative methods | Iterative Jacobi algorithm |
| Anchor Frame Selection | Maximize volume/area to reduce numerical ill-conditioning | Random selection, centroid-based |

## Rationale
- **Stateless Core**: Necessary for reproducibility and deterministic testing.
- **Numerical Stability**: The emphasis on tolerances (`EPSILON`) and `BORDERLINE_FACTOR` reflects the need for robust handling of numerical ambiguity.
