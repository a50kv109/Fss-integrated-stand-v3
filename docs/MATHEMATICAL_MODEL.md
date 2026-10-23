# FSS Integrated Research Stand — Mathematical Model

**Project:** Fedorov Symmetry Reasoning Stand (FSS)  
**Document:** `docs/MATHEMATICAL_MODEL.md`  
**Classification:** Canonical Mathematical Specification  
**Status:** Active Mathematical Model  
**Last Updated:** 2026-10-11  

---

## 1. Symmetry Operations & Representation Formalism

An affine symmetry operation acting on 3D Euclidean space $\mathbb{R}^3$ is defined as the pair $(W, w)$:
$$\vec{x}' = W \vec{x} + \vec{w}$$
where:
* $W \in GL_3(\mathbb{Z})$ is a $3 \times 3$ integer matrix representing the linear rotation, reflection, or roto-inversion part.
* $\vec{w} \in \mathbb{Q}^3$ is a 3-element vector of rational numbers representing the translational part (screws, glides, or lattice centering).

### Group Composition Law
Composition of two operations $(W_1, \vec{w}_1)$ and $(W_2, \vec{w}_2)$ follows the semi-direct product rule:
$$(W_1, \vec{w}_1) \circ (W_2, \vec{w}_2) = \left(W_1 W_2, \; W_1 \vec{w}_2 + \vec{w}_1 \pmod{\mathbb{Z}^3}\right)$$

---

## 2. Exact Rational Arithmetic (`ExactRational`)

To prevent rounding errors, catastrophic cancellation, and precision drift in floating-point representations (e.g. $1/3 \approx 0.3333333333333333$), all fractional translations in FSS are evaluated via `ExactRational` (`core/schema/crystallographic_exchange.ts`):

* **Internal Representation:** Numerator $n \in \mathbb{Z}$ and denominator $d \in \mathbb{Z} \setminus \{0\}$, backed by JavaScript `BigInt` or safe integers (`Number.isSafeInteger`).
* **Canonical Reduction:** Reduced via the Euclidean Greatest Common Divisor (GCD):
  $$n' = \frac{n}{\gcd(|n|, |d|)}, \quad d' = \frac{|d|}{\gcd(|n|, |d|)} \cdot \operatorname{sgn}(d)$$
* **Periodic Unit-Cell Reduction (`mod1`):**  
  Translations are normalized into the half-open interval $[0, 1)$:
  $$\operatorname{mod1}\left(\frac{n}{d}\right) = \frac{(n \bmod d + d) \bmod d}{d}$$
  * Example: $5/2 \pmod 1 = 1/2$
  * Example: $-1/4 \pmod 1 = 3/4$

---

## 3. Coordinate-Independent Invariant Profiling (EXP-09)

When classifying an operation set, direct matrix comparison fails if the operations are reordered, permuted, or expressed in alternative coordinate systems. The **Invariant Profiler** (`core/operation_set_profile.ts`) extracts coordinate-independent similarity invariants:

### A. The Crystallographic Restriction in $\mathbb{Z}^3$
In a 3-dimensional periodic lattice, the trace of a rotation matrix $W$ by an angle $\theta$ satisfies:
$$\operatorname{tr}(W) = 1 + 2\cos\theta \in \mathbb{Z} \implies \cos\theta \in \left\{ -1, -\frac{1}{2}, 0, \frac{1}{2}, 1 \right\}$$
Consequently, permissible rotation orders $k$ for periodic operations are strictly restricted to:
$$k \in \{1, 2, 3, 4, 6\}$$
Operations with non-crystallographic orders (e.g. 5-fold rotations or non-periodic matrices) are assigned order $0$.

### B. Similarity Invariants
Under a change of basis $P \in GL_3(\mathbb{Z})$, the linear matrix transforms as $W' = P W P^{-1}$. The following quantities are similarity invariants:
1. **Matrix Order:** $\operatorname{ord}(P W P^{-1}) = \operatorname{ord}(W)$.
2. **Matrix Determinant:** $\det(P W P^{-1}) = \det(W) \in \{+1, -1\}$ (separating proper rotations from reflections/roto-inversions).
3. **Matrix Trace:** $\operatorname{tr}(P W P^{-1}) = \operatorname{tr}(W)$.
4. **Spatial Inversion:** $W = -I_3$ is invariant under any invertible transformation since $P (-I) P^{-1} = -I$.

### C. Invariant Profile Definition
An `OperationSetProfile` comprises:
* `distinctCount`: Cardinality of the operation set modulo lattice translations $\mathbb{Z}^3$.
* `hasInversion`: Boolean presence of the inversion center $-I_3$.
* `orderHistogram`: Frequency distribution of matrix orders $k \in \{1, 2, 3, 4, 6\}$.
* `traceHistogram`: Frequency distribution of traces $\operatorname{tr}(W) \in \{-3, -2, -1, 0, 1, 2, 3\}$.
* `properRotationsCount` vs. `improperRotationsCount`: Ratio of $\det(W) = +1$ to $\det(W) = -1$.
* `translationsSummary`: Ratio of pure point operations ($\vec{w} \equiv \vec{0} \pmod 1$) to fractional operations ($\vec{w} \not\equiv \vec{0}$).

---

## 4. Canonical Representation Keys & Set Equality

Two operations $(W_1, \vec{w}_1)$ and $(W_2, \vec{w}_2)$ are identical modulo lattice translations if and only if their canonical keys match:
$$\text{key}(W, \vec{w}) = \text{JSON}(W) \parallel [w_x \bmod 1, \; w_y \bmod 1, \; w_z \bmod 1]$$

### Set vs. Multiset Semantics:
* A collection of input operations is a **multiset** (can contain duplicated entries).
* The profiler detects duplicates by verifying whether $\text{totalCount} > \text{distinctCount}$.
* Distinct set equality is satisfied if:
  $$\text{keys}(S_{\text{query}}) \equiv \text{keys}(S_{\text{catalog}})$$
* Multiset equality (`isExactMultisetMatch`) additionally requires:
  $$\text{hasDuplicates} = \text{false} \quad \text{and} \quad |S_{\text{query}}| = |S_{\text{catalog}}|$$

---

## 5. Origin Shift Transformation

Under an affine translation of the origin $\vec{x}' = \vec{x} - \vec{x}_0$, symmetry operations transform according to:
$$W' = W, \quad \vec{w}' = \vec{w} + (W - I) \vec{x}_0 \pmod{\mathbb{Z}^3}$$

### Key Properties:
1. **Invariance of Pure Translations:** For $W = I$ (lattice centering, identity), $(I - I)\vec{x}_0 = \vec{0}$, so centering translations are invariant under any origin shift.
2. **ITA Volume A Origin 1 vs. Origin 2:** In non-symmorphic space groups (e.g. Group 19, $P2_12_12_1$), standard tables often use an origin choice shifted by $\vec{x}_0 = (1/4, 1/4, 1/4)$.
3. **Verification in FSS:** FSS evaluates exact rational origin equivalence under $\vec{x}_0 = (1/4, 1/4, 1/4)$ via `OriginShiftAnalyzer.verifyEquivalenceUnderShift`.

---

## 6. Affine Dimensionality Engine (`core/dimension.ts`)

To prevent non-physical dimension assumptions (e.g. treating collinear points as a 3D polyhedron), the geometric engine computes the affine dimension $d \in \{0, 1, 2, 3\}$ of a point set:

1. **Barycenter Normalization:** Points are translated so their centroid is at the origin $\vec{c} = \frac{1}{N}\sum \vec{p}_i = \vec{0}$.
2. **Covariance Matrix:**
   $$C = \frac{1}{N} \sum_{i=1}^N \vec{p}_i \vec{p}_i^T$$
3. **Eigenvalue Thresholding:** Eigenvalues $\lambda_1 \ge \lambda_2 \ge \lambda_3 \ge 0$ are computed.
   * If $\lambda_1 < \epsilon$: Dimension = $0$ (Point)
   * If $\lambda_2 < \epsilon$: Dimension = $1$ (Collinear)
   * If $\lambda_3 < \epsilon$: Dimension = $2$ (Planar)
   * Otherwise: Dimension = $3$ (Spatial)
4. **Scale Invariance:** The engine is scale-invariant across distances from $10^{-3}$ to $10^3$ (verified by 64/64 passing tests in `core/dimension.test.ts`).

---

## 7. Symmetry Experiment RMSD & Predicates

The experimental engine (`core/engine.ts`) applies an affine operation to a vertex structure and computes the permutation distance metric:
$$\text{RMSD} = \sqrt{\frac{1}{N} \sum_{i=1}^N \min_j \|\vec{x}'_i - \vec{x}_j\|^2}$$

* **Predicate `PRESERVES_STRUCTURE`:** Verified if $\text{RMSD} \le \epsilon$ and the mapping between vertices is a bijective permutation.
* **Predicate `INVARIANT_SUBSPACE`:** Verified if the barycenter and orientation axes remain fixed.
