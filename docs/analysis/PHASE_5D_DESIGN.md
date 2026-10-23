# FSS — PHASE 5D-DESIGN: CLASSIFIER API CONTRACT

**Status:** DESIGN READY FOR HUMAN REVIEW (Read-Only)

---

## 1. REVISED API CONTRACT (`/api/classify`)

### Request Structure (`POST`)
```json
{
  "operations": [
    {
      "W": [[number, number, number], [number, number, number], [number, number, number]],
      "w": [{ "numerator": number, "denominator": number }, ...]
    }
  ]
}
```
*   **Validation (CODE-CONFIRMED):** Uses `validateOperationSyntax`. Checks that `W` is 3x3 matrix of integers, and each translation component `w` is a rational object `{numerator: number, denominator: number}` with `denominator > 0`.
*   **Proposed Additions (PROPOSED):** Request body size limited to < 100KB; maximum 50 operations allowed per request.

### Response Structure (`JSON` - Matches `TwoStageMatchReport`)
```json
{
  "verdict": "EXACT_MATCH" | "SETTING_MISMATCH" | "OPERATION_MISMATCH" | "AMBIGUOUS" | "NO_CANDIDATES" | "INVALID_INPUT",
  "matchedSettingId": string | null,
  "matchedSpaceGroupNumber": number | null,
  "data": {
    "queryProfile": OperationSetProfile,
    "candidateFilter": CandidateFilterResult,
    "candidateEvaluations": StrictMatchDetail[],
    "exactMatches": string[],
    "notes": string[]
  },
  "metadata": {
    "apiVersion": "1.0",
    "catalogEntryCount": 8,
    "disclaimer": string
  }
}
```

---

## 2. VERDICT & IMPLEMENTATION MAPPING (CODE-CONFIRMED)

| Verdict | Trigger Condition (Existing Code) | Origin |
|:---|:---|:---|
| `EXACT_MATCH` | `exactMatches.length === 1` | Bijective set match of canonical keys. |
| `AMBIGUOUS` | `exactMatches.length > 1` | Multiple exact canonical matches found. |
| `SETTING_MISMATCH`| `exactMatches.length === 0` && `originShiftMatch` (Group 19 only) | `OriginShiftAnalyzer.verifyEquivalenceUnderShift` |
| `OPERATION_MISMATCH`| `exactMatches.length === 0` && `candidateFilter.candidates.length > 0` | Profile compatible, but keys differ. |
| `NO_CANDIDATES` | `candidateFilter.candidates.length === 0` | All candidates pruned by filter. |
| `INVALID_INPUT` | `validateOperationSyntax` error | Syntactic check. |

---

## 3. PROPOSED API BOUNDARIES & SAFEGUARDS

| Boundary | Proposal | Status |
|:---|:---|:---|
| **Max Operations** | 50 operations | PROPOSED |
| **Max Request Body** | 100 KB | PROPOSED |
| **Exception Handling** | 500 or 400 status. **NEVER** expose `Error.stack` to client. | PROPOSED |
| **Catalog Metadata** | `catalogEntryCount: 8` | CODE-CONFIRMED |

---

## 4. EPISTEMIC SAFETY RULES (CODE-CONFIRMED)

1.  **No Overclaiming:** Responses must map directly to `TwoStageMatchReport` fields.
2.  **Catalog Bound:** `NO_CANDIDATES` means *not in current 8-setting catalog*, not *non-existent group*.
3.  **Representation Bound:** `EXACT_MATCH` confirms canonical representation match (modulo $\mathbb{Z}^3$).
4.  **No Hidden Logic:** No implicit group closure expansion.

---

## 5. REVISION SUMMARY

*   **Logic Mapping:** Verified `TwoStageMatchReport` fields (queryProfile, candidateFilter, candidateEvaluations, notes) map directly to response data.
*   **Origin Shift:** `originShiftVector` is present in `StrictMatchDetail` only when `isOriginShiftEquivalent` is `true`.
*   **Validation:** `validateOperationSyntax` provides robust syntactic checks; boundary checks (size/count) are proposed for API layer.

---

## 6. HUMAN DECISIONS REQUIRED

1.  **Final Approval:** Are the API constraints and the proposed contract (including the decision to retain full evaluation detail) approved for implementation?
2.  **Implementation Permission:** Do you authorize the transition to **Phase 5D-Implementation** based on this design?
