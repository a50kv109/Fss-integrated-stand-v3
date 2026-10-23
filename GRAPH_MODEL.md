# FSS - Graph Model

This document distinguishes the five required graph architectures in the FSS project.

| Graph Type | Purpose | Status |
| :--- | :--- | :--- |
| **Geometry-dependency** | Define dependencies between geometric primitives | `PROPOSED` (Conceptual Structure only) |
| **Structural-relation** | Define spatial/relational links (e.g., edge-based) | `IMPLEMENTED` (in `CanonicalStructure`) |
| **Symmetry-transformation** | Define transformation candidates | `NOT_IMPLEMENTED` |
| **Epistemic-status** | Track verification status of structures | `NOT_IMPLEMENTED` |
| **Provenance/evidence** | Map origin of symmetry claims | `PARTIALLY_IMPLEMENTED` (Contract defined) |

## Graph Definitions

### 1. Geometry-dependency Graph
- **Purpose**: Ensure stability in geometric construction.
- **Node Types**: `Vertex`, `Barycenter`, `AnchorFrame`.
- **Edge Types**: `DependentOn`.
- **Status**: `PROPOSED`. No independent graph structure or DAG validation currently implemented.

### 2. Structural-relation Graph
- **Purpose**: Define input structural topology.
- **Node Types**: `Vertex`.
- **Edge Types**: `ConnectedTo` (derived from input edges in `CanonicalStructure`).
- **Status**: `IMPLEMENTED` as part of `CanonicalStructure` data model.

### 3. Symmetry-transformation Graph (M-6A.2)
- **Purpose**: Represent candidate group transformations.
- **Node Types**: `Transformation`.
- **Edge Types**: `Composer`, `InverseOf`.
- **Status**: `NOT_IMPLEMENTED`.

### 4. Epistemic-status Graph
- **Purpose**: Track knowledge about a structure.
- **Node Types**: `Structure`.
- **Edge Types**: `VerifiedBy`.
- **Status**: `NOT_IMPLEMENTED`.

### 5. Provenance/evidence Graph
- **Purpose**: Link claim to verification result.
- **Node Types**: `Claim`, `Evidence`.
- **Edge Types**: `SupportedBy`.
- **Status**: `PARTIALLY_IMPLEMENTED`. Schema defined in `EVIDENCE_CONTRACT.md`, but no persistent graph storage.
