# FSS - Evidence Contract

This defines the schema for evidence verification in the system (M-6A.1).

## 1. Dimension Analysis Result (`DimensionAnalysisResult`)
Based on `core/dimension.ts`:

| Field | Type | Meaning |
| :--- | :--- | :--- |
| `vertexCount` | `number` | Total input vertices |
| `uniqueGeometricCount` | `number` | Unique vertex positions |
| `hasCoincidentVertices` | `boolean` | Are there coincident vertices? |
| `clusters` | `GeometricCluster[]` | Clusters of coincident vertices |
| `barycenter` | `Point3D` | Barycenter position |
| `maxRadius` | `number` | Max distance from barycenter |
| `rmsRadius` | `number` | RMS radius |
| `eigenvalues` | `[number, number, number]` | Sorted eigenvalues |
| `dimensionRatios` | `{ r2: number, r3: number }` | Eigenvalue ratios |
| `affineDimension` | `AffineDimension` | Computed dimension (0-3) |
| `conditionStatus` | `ConditionStatus` | Numerical stability status |
| `diagnostic` | `string` | Diagnostic details |
| `anchorFrame` | `AnchorFrame` | Computed frame or null |

## 2. Evidence Contract (`Evidence`)
Based on `core/types.ts`:

| Field | Type | Meaning |
| :--- | :--- | :--- |
| `experiment_id` | `string` | ID of the experiment |
| `structure_id` | `string` | ID of the structure |
| `operation` | `object` | Transformation details (id, name, type, axis, angleDeg) |
| `predicate` | `VerificationPredicate` | Verification type |
| `epsilon` | `number` | Numerical tolerance |
| `orthogonality_epsilon` | `number` | Orthogonality tolerance |
| `is_isometric` | `boolean` | Isometric verification result |
| `orthogonality_delta` | `number` | Orthogonality check result |
| `determinant` | `number` | Transformation determinant |
| `determinant_epsilon` | `number?` | Determinant tolerance |
| `original_state` | `Vertex[]` | State before transformation |
| `transformed_state` | `Vertex[]` | State after transformation |
| `correspondence` | `Correspondence[]` | Vertex matching details |
| `max_delta` | `number` | Max vertex delta |
| `mean_delta` | `number` | Mean vertex delta |
| `is_bijective` | `boolean` | Bijective verification result |
| `edge_count` | `number` | Total edges |
| `edge_topology_preserved` | `boolean?` | Topology preservation result |
| `verdict` | `ExperimentVerdict` | Result of verification |
| `rejection_reason` | `string?` | Reason for rejection |
| `timestamp` | `string` | ISO timestamp |

### Correspondence (`Correspondence`)
| Field | Type | Meaning |
| :--- | :--- | :--- |
| `originId` | `string` | ID of original vertex |
| `targetId` | `string` | ID of target vertex |
| `delta` | `number` | Displacement delta |
| `originCoords` | `Point3D` | Original coordinates |
| `transformedCoords` | `Point3D` | Transformed coordinates |
| `targetCoords` | `Point3D?` | Target coordinates |

## 3. Status Semantics
- `ConditionStatus`: `WELL_CONDITIONED` \| `ILL_CONDITIONED` \| `DEGENERATE`.
- `ExperimentVerdict`: `VERIFIED` \| `REJECTED`.
- `VerificationPredicate`: `PRESERVES_STRUCTURE` \| `PROPER_ROTATION`.
