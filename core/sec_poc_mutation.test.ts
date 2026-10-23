/**
 * SEC PoC-01: Mutation Harness Integrity Check & Verification Auditor
 * 
 * Objectives:
 * 1. Verification of Mutation Realism: Track execution path and invocation counters
 *    to prove each mutant (MUT_01..MUT_08) is genuinely called, alters runtime execution,
 *    and cannot report KILLED without active execution.
 * 2. Protection against False PASS: Ensure tests distinguish between authentic and mutated validators.
 * 3. Independence of Expected Results: Verify test expectations derive from analytic group theory,
 *    not the mutated checker itself.
 * 4. Negative Controls:
 *    - CONTROL_A: Authentic validator passes all valid data and rejects all adversarial data.
 *    - CONTROL_B: Permissive dummy validator (always returning PASS) is detected and flagged by the harness.
 * 5. Boundary Robustness & Negative Test Isolation Auditing.
 */

import {
  baseOperations,
  sourceDigest,
  INDEPENDENT_REF_I,
  INDEPENDENT_REF_C3_120,
  INDEPENDENT_REF_C3_240,
  runSecVerification,
  canonicalStringify,
  computeCryptographicDigest,
  isMatrixComputable,
  SecVerificationHooks
} from './sec_poc.test';
import { CANONICAL_TETRAHEDRON } from './canonical';
import { applyMatrix4x4, euclideanDistance } from './engine';
import { Matrix4x4, Operation, Point3D } from './types';

export interface MutationResult {
  mutantId: string;
  name: string;
  description: string;
  targetCheck: string;
  mutationType: string;
  executionPath: string;
  invocations: number;
  activated: boolean;
  testInputDescription: string;
  expectedBehaviorOfCorrectChecker: string;
  mutantCheckerBehavior: string;
  mutantKilled: boolean;
  killerEvidence: string;
}

export interface BoundaryResult {
  testId: string;
  name: string;
  classType: 'VALID_EQUIVALENT' | 'INVALID_BOUNDARY';
  inputDescription: string;
  expectedVerdict: 'VERIFIED' | 'REJECTED';
  actualVerdict: 'VERIFIED' | 'REJECTED';
  passed: boolean;
  details: string;
}

export interface IsolationResult {
  testId: string;
  targetCheck: string;
  injectedDefect: string;
  normalFailedChecks: string[];
  failedChecksWithTargetDisabled: string[];
  stillRejectedWithTargetDisabled: boolean;
  isolationRating: 'STRICTLY_ISOLATED' | 'SHARED_WITH_SECONDARY';
  secondaryChecks: string[];
}

export interface ControlExperimentResult {
  controlId: 'CONTROL_A' | 'CONTROL_B';
  name: string;
  description: string;
  passed: boolean;
  details: string;
}

// =============================================================================
// PART 1: MUTATION TESTING (AUDITING THE AUDITOR'S CHECKERS WITH EXECUTION TRACKING)
// =============================================================================
export function runMutationTestSuite(): MutationResult[] {
  console.log('====================================================================');
  console.log('PART 1: MUTATION TESTING WITH INVOCATION TRACKING (MUT_01 .. MUT_08)');
  console.log('====================================================================\n');

  const results: MutationResult[] = [];

  // ---------------------------------------------------------------------------
  // MUTANT 1: CHK_CLOSURE erroneously accepts any composition result
  // ---------------------------------------------------------------------------
  let invCount1 = 0;
  const inputMut1 = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  inputMut1[1].matrix4x4 = [
    [0.0, -1.0, 0.0, 0.0],
    [1.0,  0.0, 0.0, 0.0],
    [0.0,  0.0, 1.0, 0.0],
    [0.0,  0.0, 0.0, 1.0]
  ];
  const normalRes1 = runSecVerification(inputMut1);
  const mutantRes1 = runSecVerification(inputMut1, {
    overrideClosure: (ops, defVal) => {
      invCount1++;
      return true; // Erroneously forces closure to true
    }
  });
  const normalFailed1 = normalRes1.checks.find(c => c.checkId === 'CHK_CLOSURE')?.status === 'FAIL';
  const mutantFailed1 = mutantRes1.checks.find(c => c.checkId === 'CHK_CLOSURE')?.status === 'FAIL';
  const activated1 = invCount1 > 0;
  const killed1 = activated1 && normalFailed1 && !mutantFailed1;
  results.push({
    mutantId: 'MUT_01',
    name: 'Closure Always True',
    description: 'CHK_CLOSURE unconditionally returns PASS for any composition result',
    targetCheck: 'CHK_CLOSURE',
    mutationType: 'Force isClosed = true',
    executionPath: 'runSecVerification -> hooks.overrideClosure (line 449)',
    invocations: invCount1,
    activated: activated1,
    testInputDescription: 'Group with non-group C4 rotation (broken closure)',
    expectedBehaviorOfCorrectChecker: 'CHK_CLOSURE = FAIL',
    mutantCheckerBehavior: mutantFailed1 ? 'CHK_CLOSURE = FAIL' : 'CHK_CLOSURE = PASS',
    mutantKilled: killed1,
    killerEvidence: killed1
      ? `Hook executed (${invCount1}x). Adversarial assertion caught that CHK_CLOSURE returned PASS instead of FAIL`
      : 'Mutant survived or failed to activate'
  });
  console.log(`[MUT_01] ${killed1 ? '🎯 KILLED' : '⚠️ SURVIVED'} | Invocations: ${invCount1} | Target: CHK_CLOSURE | Normal: ${normalFailed1 ? 'FAIL' : 'PASS'} -> Mutated: ${mutantFailed1 ? 'FAIL' : 'PASS'}`);

  // ---------------------------------------------------------------------------
  // MUTANT 2: CHK_INVERSES erroneously returns PASS when an inverse is missing
  // ---------------------------------------------------------------------------
  let invCount2 = 0;
  const inputMut2 = [baseOperations[0], baseOperations[1]]; // missing C3^2
  const normalRes2 = runSecVerification(inputMut2);
  const mutantRes2 = runSecVerification(inputMut2, {
    overrideInverses: (ops, defVal) => {
      invCount2++;
      return true; // Erroneously forces inverses to true
    }
  });
  const normalFailed2 = normalRes2.checks.find(c => c.checkId === 'CHK_INVERSES')?.status === 'FAIL';
  const mutantFailed2 = mutantRes2.checks.find(c => c.checkId === 'CHK_INVERSES')?.status === 'FAIL';
  const activated2 = invCount2 > 0;
  const killed2 = activated2 && normalFailed2 && !mutantFailed2;
  results.push({
    mutantId: 'MUT_02',
    name: 'Inverses Always True',
    description: 'CHK_INVERSES unconditionally returns PASS when inverse element is missing',
    targetCheck: 'CHK_INVERSES',
    mutationType: 'Force hasInverses = true',
    executionPath: 'runSecVerification -> hooks.overrideInverses (line 478)',
    invocations: invCount2,
    activated: activated2,
    testInputDescription: 'Group set [I, C3] with inverse C3^2 omitted',
    expectedBehaviorOfCorrectChecker: 'CHK_INVERSES = FAIL',
    mutantCheckerBehavior: mutantFailed2 ? 'CHK_INVERSES = FAIL' : 'CHK_INVERSES = PASS',
    mutantKilled: killed2,
    killerEvidence: killed2
      ? `Hook executed (${invCount2}x). Adversarial assertion caught that CHK_INVERSES returned PASS instead of FAIL`
      : 'Mutant survived or failed to activate'
  });
  console.log(`[MUT_02] ${killed2 ? '🎯 KILLED' : '⚠️ SURVIVED'} | Invocations: ${invCount2} | Target: CHK_INVERSES | Normal: ${normalFailed2 ? 'FAIL' : 'PASS'} -> Mutated: ${mutantFailed2 ? 'FAIL' : 'PASS'}`);

  // ---------------------------------------------------------------------------
  // MUTANT 3: CHK_MATRIX_STRUCTURE ignores NaN or Infinity
  // ---------------------------------------------------------------------------
  let invCount3 = 0;
  const inputMut3 = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  inputMut3[1].matrix4x4[0][0] = NaN;
  const normalRes3 = runSecVerification(inputMut3);
  const mutantRes3 = runSecVerification(inputMut3, {
    overrideMatrixStructure: (ops) => {
      invCount3++;
      // Legacy validator without Number.isFinite
      for (const op of ops) {
        const mat = op.matrix4x4;
        const lastRowValid = Math.abs(mat[3][0]) < 1e-6 &&
                             Math.abs(mat[3][1]) < 1e-6 &&
                             Math.abs(mat[3][2]) < 1e-6 &&
                             Math.abs(mat[3][3] - 1.0) < 1e-6;
        if (!lastRowValid) return false;
      }
      return true; // Erroneously passes NaN because in JS NaN > 1e-5 is false
    }
  });
  const normalFailed3 = normalRes3.checks.find(c => c.checkId === 'CHK_MATRIX_STRUCTURE')?.status === 'FAIL';
  const mutantFailed3 = mutantRes3.checks.find(c => c.checkId === 'CHK_MATRIX_STRUCTURE')?.status === 'FAIL';
  const activated3 = invCount3 > 0;
  const killed3 = activated3 && normalFailed3 && !mutantFailed3;
  results.push({
    mutantId: 'MUT_03',
    name: 'Matrix Ignores NaN/Infinity',
    description: 'CHK_MATRIX_STRUCTURE omits Number.isFinite check, relying only on NaN > 1e-5 (evaluates to false)',
    targetCheck: 'CHK_MATRIX_STRUCTURE',
    mutationType: 'Bypass Number.isFinite check',
    executionPath: 'runSecVerification -> hooks.overrideMatrixStructure (line 237)',
    invocations: invCount3,
    activated: activated3,
    testInputDescription: 'Matrix with NaN in linear cell [0][0]',
    expectedBehaviorOfCorrectChecker: 'CHK_MATRIX_STRUCTURE = FAIL',
    mutantCheckerBehavior: mutantFailed3 ? 'CHK_MATRIX_STRUCTURE = FAIL' : 'CHK_MATRIX_STRUCTURE = PASS',
    mutantKilled: killed3,
    killerEvidence: killed3
      ? `Hook executed (${invCount3}x). Adversarial NaN test caught that naive comparison passes NaN undetected`
      : 'Mutant survived or failed to activate'
  });
  console.log(`[MUT_03] ${killed3 ? '🎯 KILLED' : '⚠️ SURVIVED'} | Invocations: ${invCount3} | Target: CHK_MATRIX_STRUCTURE | Normal: ${normalFailed3 ? 'FAIL' : 'PASS'} -> Mutated: ${mutantFailed3 ? 'FAIL' : 'PASS'}`);

  // ---------------------------------------------------------------------------
  // MUTANT 4: CHK_VERTEX_PERMUTATION accepts duplicate vertex images (non-bijective)
  // ---------------------------------------------------------------------------
  let invCount4 = 0;
  const inputMut4 = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  inputMut4[1].matrix4x4 = [
    [0.0, 0.0, 0.0, 1.0],
    [0.0, 0.0, 0.0, 1.0],
    [0.0, 0.0, 0.0, 1.0],
    [0.0, 0.0, 0.0, 1.0]
  ];
  const normalRes4 = runSecVerification(inputMut4);
  const mutantRes4 = runSecVerification(inputMut4, {
    overrideVertexPermutation: (ops) => {
      invCount4++;
      const orig = CANONICAL_TETRAHEDRON.vertices.map(v => v.coords);
      for (const op of ops) {
        const tvs = orig.map(v => applyMatrix4x4(v, op.matrix4x4));
        for (const tv of tvs) {
          if (!orig.some(ov => euclideanDistance(tv, ov) < 1e-4)) return false;
        }
      }
      return true; // Erroneously accepts non-bijective map because Im(f) subseteq V
    }
  });
  const normalFailed4 = normalRes4.checks.find(c => c.checkId === 'CHK_VERTEX_PERMUTATION')?.status === 'FAIL';
  const mutantFailed4 = mutantRes4.checks.find(c => c.checkId === 'CHK_VERTEX_PERMUTATION')?.status === 'FAIL';
  const activated4 = invCount4 > 0;
  const killed4 = activated4 && normalFailed4 && !mutantFailed4;
  results.push({
    mutantId: 'MUT_04',
    name: 'Vertex Permutation Accepts Duplicate Images',
    description: 'CHK_VERTEX_PERMUTATION checks only Im(f) subseteq V without verifying bijectivity (|Im| == 4)',
    targetCheck: 'CHK_VERTEX_PERMUTATION',
    mutationType: 'Omit bijectivity check (cardinality 4)',
    executionPath: 'runSecVerification -> hooks.overrideVertexPermutation (line 506)',
    invocations: invCount4,
    activated: activated4,
    testInputDescription: 'Matrix mapping all tetrahedron vertices to single point v0',
    expectedBehaviorOfCorrectChecker: 'CHK_VERTEX_PERMUTATION = FAIL',
    mutantCheckerBehavior: mutantFailed4 ? 'CHK_VERTEX_PERMUTATION = FAIL' : 'CHK_VERTEX_PERMUTATION = PASS',
    mutantKilled: killed4,
    killerEvidence: killed4
      ? `Hook executed (${invCount4}x). Bijectivity assertion caught that degenerate map was accepted by naive subset check`
      : 'Mutant survived or failed to activate'
  });
  console.log(`[MUT_04] ${killed4 ? '🎯 KILLED' : '⚠️ SURVIVED'} | Invocations: ${invCount4} | Target: CHK_VERTEX_PERMUTATION | Normal: ${normalFailed4 ? 'FAIL' : 'PASS'} -> Mutated: ${mutantFailed4 ? 'FAIL' : 'PASS'}`);

  // ---------------------------------------------------------------------------
  // MUTANT 5: CHK_NONTRIVIAL_ORBIT counts duplicate points as distinct
  // ---------------------------------------------------------------------------
  let invCount5 = 0;
  const inputMut5 = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  inputMut5[2].matrix4x4 = INDEPENDENT_REF_I; // orbit on v1 has only 2 distinct points (v1, v2, v1)
  const normalRes5 = runSecVerification(inputMut5);
  const mutantRes5 = runSecVerification(inputMut5, {
    overrideNontrivialOrbit: () => {
      invCount5++;
      return true; // Erroneously returns PASS without verifying distinct points
    }
  });
  const normalFailed5 = normalRes5.checks.find(c => c.checkId === 'CHK_NONTRIVIAL_ORBIT')?.status === 'FAIL';
  const mutantFailed5 = mutantRes5.checks.find(c => c.checkId === 'CHK_NONTRIVIAL_ORBIT')?.status === 'FAIL';
  const activated5 = invCount5 > 0;
  const killed5 = activated5 && normalFailed5 && !mutantFailed5;
  results.push({
    mutantId: 'MUT_05',
    name: 'Orbit Counts Duplicate Points as Distinct',
    description: 'CHK_NONTRIVIAL_ORBIT accepts orbit of size 2 as order 3 by ignoring duplicate points',
    targetCheck: 'CHK_NONTRIVIAL_ORBIT',
    mutationType: 'Bypass distinct Set/distance check',
    executionPath: 'runSecVerification -> hooks.overrideNontrivialOrbit (line 596)',
    invocations: invCount5,
    activated: activated5,
    testInputDescription: 'Orbit action on v1 generating points [v1, v2, v1] (only 2 distinct)',
    expectedBehaviorOfCorrectChecker: 'CHK_NONTRIVIAL_ORBIT = FAIL',
    mutantCheckerBehavior: mutantFailed5 ? 'CHK_NONTRIVIAL_ORBIT = FAIL' : 'CHK_NONTRIVIAL_ORBIT = PASS',
    mutantKilled: killed5,
    killerEvidence: killed5
      ? `Hook executed (${invCount5}x). Orbit-stabilizer assertion caught that collapsed orbit returned PASS`
      : 'Mutant survived or failed to activate'
  });
  console.log(`[MUT_05] ${killed5 ? '🎯 KILLED' : '⚠️ SURVIVED'} | Invocations: ${invCount5} | Target: CHK_NONTRIVIAL_ORBIT | Normal: ${normalFailed5 ? 'FAIL' : 'PASS'} -> Mutated: ${mutantFailed5 ? 'FAIL' : 'PASS'}`);

  // ---------------------------------------------------------------------------
  // MUTANT 6: CHK_METADATA_CONSISTENCY ignores mismatch between declared angle & matrix
  // ---------------------------------------------------------------------------
  let invCount6 = 0;
  const inputMut6 = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  inputMut6[1].matrix4x4 = INDEPENDENT_REF_C3_240; // matrix is 240°, metadata declares 120°
  const normalRes6 = runSecVerification(inputMut6);
  const mutantRes6 = runSecVerification(inputMut6, {
    overrideMetadataConsistency: () => {
      invCount6++;
      return true; // Erroneously bypasses Rodrigues vector orientation check
    }
  });
  const normalFailed6 = normalRes6.checks.find(c => c.checkId === 'CHK_METADATA_CONSISTENCY')?.status === 'FAIL';
  const mutantFailed6 = mutantRes6.checks.find(c => c.checkId === 'CHK_METADATA_CONSISTENCY')?.status === 'FAIL';
  const activated6 = invCount6 > 0;
  const killed6 = activated6 && normalFailed6 && !mutantFailed6;
  results.push({
    mutantId: 'MUT_06',
    name: 'Metadata Ignores Angle/Orientation Mismatch',
    description: 'CHK_METADATA_CONSISTENCY skips orientation verification between declared 120° and actual 240°',
    targetCheck: 'CHK_METADATA_CONSISTENCY',
    mutationType: 'Omit Rodrigues formula verification',
    executionPath: 'runSecVerification -> hooks.overrideMetadataConsistency (line 326)',
    invocations: invCount6,
    activated: activated6,
    testInputDescription: 'Operation with declared angleDeg=120° but matrix performing 240° rotation',
    expectedBehaviorOfCorrectChecker: 'CHK_METADATA_CONSISTENCY = FAIL',
    mutantCheckerBehavior: mutantFailed6 ? 'CHK_METADATA_CONSISTENCY = FAIL' : 'CHK_METADATA_CONSISTENCY = PASS',
    mutantKilled: killed6,
    killerEvidence: killed6
      ? `Hook executed (${invCount6}x). Adversarial orientation assertion caught that 240° rotation passed under 120° label`
      : 'Mutant survived or failed to activate'
  });
  console.log(`[MUT_06] ${killed6 ? '🎯 KILLED' : '⚠️ SURVIVED'} | Invocations: ${invCount6} | Target: CHK_METADATA_CONSISTENCY | Normal: ${normalFailed6 ? 'FAIL' : 'PASS'} -> Mutated: ${mutantFailed6 ? 'FAIL' : 'PASS'}`);

  // ---------------------------------------------------------------------------
  // MUTANT 7: CHK_INDEPENDENT_REFERENCE always returns PASS
  // ---------------------------------------------------------------------------
  let invCount7 = 0;
  const inputMut7 = [baseOperations[0], baseOperations[2], baseOperations[1]]; // C3 and C3^2 swapped
  const normalRes7 = runSecVerification(inputMut7);
  const mutantRes7 = runSecVerification(inputMut7, {
    overrideIndependentRef: () => {
      invCount7++;
      return true; // Erroneously bypasses Cayley table comparison
    }
  });
  const normalFailed7 = normalRes7.checks.find(c => c.checkId === 'CHK_INDEPENDENT_REFERENCE')?.status === 'FAIL';
  const mutantFailed7 = mutantRes7.checks.find(c => c.checkId === 'CHK_INDEPENDENT_REFERENCE')?.status === 'FAIL';
  const activated7 = invCount7 > 0;
  const killed7 = activated7 && normalFailed7 && !mutantFailed7;
  results.push({
    mutantId: 'MUT_07',
    name: 'Independent Reference Always True',
    description: 'CHK_INDEPENDENT_REFERENCE unconditionally returns PASS regardless of Cayley table mismatch',
    targetCheck: 'CHK_INDEPENDENT_REFERENCE',
    mutationType: 'Force conformsToCayley = true',
    executionPath: 'runSecVerification -> hooks.overrideIndependentRef (line 414)',
    invocations: invCount7,
    activated: activated7,
    testInputDescription: 'Group with swapped operation indices relative to independent Cayley table',
    expectedBehaviorOfCorrectChecker: 'CHK_INDEPENDENT_REFERENCE = FAIL',
    mutantCheckerBehavior: mutantFailed7 ? 'CHK_INDEPENDENT_REFERENCE = FAIL' : 'CHK_INDEPENDENT_REFERENCE = PASS',
    mutantKilled: killed7,
    killerEvidence: killed7
      ? `Hook executed (${invCount7}x). Cayley table assertion caught that swapped matrices passed check`
      : 'Mutant survived or failed to activate'
  });
  console.log(`[MUT_07] ${killed7 ? '🎯 KILLED' : '⚠️ SURVIVED'} | Invocations: ${invCount7} | Target: CHK_INDEPENDENT_REFERENCE | Normal: ${normalFailed7 ? 'FAIL' : 'PASS'} -> Mutated: ${mutantFailed7 ? 'FAIL' : 'PASS'}`);

  // ---------------------------------------------------------------------------
  // MUTANT 8: Digest check uses a hardcoded constant string (Pipeline Execution)
  // ---------------------------------------------------------------------------
  let invCount8 = 0;
  const hardcodedConstantHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const mutatedOpsForDigest = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  mutatedOpsForDigest[1].matrix4x4[0][2] = 1.0001;

  // Run through verification pipeline with authentic digest
  const normalBaseRes8 = runSecVerification(baseOperations);
  const normalMutRes8 = runSecVerification(mutatedOpsForDigest);
  const normalSensitivityDetected = (normalBaseRes8.checks[0].inputDigest !== normalMutRes8.checks[0].inputDigest);

  // Run through verification pipeline with mutated overrideDigest hook
  const mutantBaseRes8 = runSecVerification(baseOperations, {
    overrideDigest: (data, raw) => {
      invCount8++;
      return hardcodedConstantHash;
    }
  });
  const mutantMutRes8 = runSecVerification(mutatedOpsForDigest, {
    overrideDigest: (data, raw) => {
      invCount8++;
      return hardcodedConstantHash;
    }
  });
  const mutantSensitivityDetected = (mutantBaseRes8.checks[0].inputDigest !== mutantMutRes8.checks[0].inputDigest);

  const activated8 = invCount8 > 0;
  const killed8 = activated8 && normalSensitivityDetected && !mutantSensitivityDetected;
  results.push({
    mutantId: 'MUT_08',
    name: 'Digest Returns Hardcoded Constant',
    description: 'Digest generator returns static hash string instead of SHA-256 of actual data',
    targetCheck: 'CANONICAL_DIGEST',
    mutationType: 'Replace SHA-256 computation with static constant string',
    executionPath: 'runSecVerification -> hooks.overrideDigest (line 195)',
    invocations: invCount8,
    activated: activated8,
    testInputDescription: 'Matrix float mutated by +0.0001 evaluated in verification engine',
    expectedBehaviorOfCorrectChecker: 'Digest changes (sourceDigest !== mutatedDigest)',
    mutantCheckerBehavior: mutantSensitivityDetected ? 'Digest changes' : 'Digest invariant to mutation (static constant)',
    mutantKilled: killed8,
    killerEvidence: killed8
      ? `Hook executed (${invCount8}x). Mutation sensitivity check detected that digest remained identical (${mutantBaseRes8.checks[0].inputDigest.substring(0, 12)}...)`
      : 'Mutant survived or failed to activate'
  });
  console.log(`[MUT_08] ${killed8 ? '🎯 KILLED' : '⚠️ SURVIVED'} | Invocations: ${invCount8} | Target: CANONICAL_DIGEST | Normal: ${normalSensitivityDetected ? 'DETECTED' : 'NOT_DETECTED'} -> Mutated: ${mutantSensitivityDetected ? 'DETECTED' : 'STATIC'}`);

  const totalKilled = results.filter(r => r.mutantKilled).length;
  console.log(`\nMutation Testing Summary: ${totalKilled} / ${results.length} mutants killed with active execution proof.\n`);
  return results;
}

// =============================================================================
// PART 2: CONTROL EXPERIMENTS (CONTROL_A & CONTROL_B)
// =============================================================================
export function runControlExperiments(): ControlExperimentResult[] {
  console.log('====================================================================');
  console.log('PART 2: NEGATIVE & POSITIVE CONTROL EXPERIMENTS (CONTROL_A & B)');
  console.log('====================================================================\n');

  const controls: ControlExperimentResult[] = [];

  // ---------------------------------------------------------------------------
  // CONTROL_A: Authentic (Golden) Validator Compliance Check
  // ---------------------------------------------------------------------------
  // Must return VERIFIED for valid C3 baseline, and REJECTED for all adversarial inputs
  const validRes = runSecVerification(baseOperations);
  const posValid = (validRes.overallVerdict === 'VERIFIED' && validRes.checks.every(c => c.status === 'PASS'));

  // Test adversarial inputs on authentic validator
  const brokenClosureOps = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  brokenClosureOps[1].matrix4x4 = [
    [0.0, -1.0, 0.0, 0.0],
    [1.0,  0.0, 0.0, 0.0],
    [0.0,  0.0, 1.0, 0.0],
    [0.0,  0.0, 0.0, 1.0]
  ];
  const adv1Res = runSecVerification(brokenClosureOps);
  const adv1Rejected = adv1Res.overallVerdict === 'REJECTED' && adv1Res.checks.some(c => c.checkId === 'CHK_CLOSURE' && c.status === 'FAIL');

  const missingInvOps = [baseOperations[0], baseOperations[1]];
  const adv2Res = runSecVerification(missingInvOps);
  const adv2Rejected = adv2Res.overallVerdict === 'REJECTED' && adv2Res.checks.some(c => c.checkId === 'CHK_INVERSES' && c.status === 'FAIL');

  const passControlA = posValid && adv1Rejected && adv2Rejected;
  controls.push({
    controlId: 'CONTROL_A',
    name: 'Authentic (Golden) Validator Compliance',
    description: 'Verify authentic validator accepts valid baseline and strictly rejects adversarial cases',
    passed: passControlA,
    details: passControlA
      ? 'Baseline PASSED (10/10 checks PASS), broken closure REJECTED, missing inverse REJECTED'
      : 'Authentic validator failed compliance test'
  });
  console.log(`[CONTROL_A] ${passControlA ? '✅ PASS' : '❌ FAIL'} | ${controls[0].description}`);
  console.log(`            Details: ${controls[0].details}`);

  // ---------------------------------------------------------------------------
  // CONTROL_B: Permissive Dummy / Null Validator Detection Check
  // ---------------------------------------------------------------------------
  // A defective validator that returns PASS unconditionally for every single check.
  // The test harness MUST detect that this validator falsely accepts defective data.
  const dummyHooks: SecVerificationHooks = {
    overrideMatrixStructure: () => true,
    overrideMetadataConsistency: () => true,
    overrideIndependentRef: () => true,
    overrideClosure: () => true,
    overrideInverses: () => true,
    overrideVertexPermutation: () => true,
    overrideNontrivialOrbit: () => true,
    overrideTrivialOrbit: () => true,
    overrideIdentity: () => true,
    overrideDuplicates: () => true
  };

  // Run broken closure under dummy validator
  const dummyRes = runSecVerification(brokenClosureOps, dummyHooks);
  const dummyFalselyPassed = (dummyRes.overallVerdict === 'VERIFIED' && dummyRes.checks.every(c => c.status === 'PASS'));

  // The harness requirement for an adversarial test is that defective data MUST be REJECTED.
  // When tested with dummy validator, the adversarial test FAILS because it expected REJECTED but got VERIFIED.
  // Thus, the harness detects that the dummy validator is defective!
  const passControlB = dummyFalselyPassed; // Confirms the dummy validator was indeed caught attempting to pass defective input
  controls.push({
    controlId: 'CONTROL_B',
    name: 'Permissive Dummy Validator Detection',
    description: 'Verify harness detects when a dummy validator blindly returns PASS on defective data',
    passed: passControlB,
    details: passControlB
      ? 'Harness exposed that dummy validator returned VERIFIED on non-group input (0 failed checks vs expected REJECTED)'
      : 'Harness failed to detect permissive dummy validator'
  });
  console.log(`[CONTROL_B] ${passControlB ? '✅ PASS' : '❌ FAIL'} | ${controls[1].description}`);
  console.log(`            Details: ${controls[1].details}\n`);

  return controls;
}

// =============================================================================
// PART 3: FALSE ACCEPTANCE VS FALSE REJECTION (TOLERANCES & EDGE CASES)
// =============================================================================
export function runBoundaryRobustnessTests(): BoundaryResult[] {
  console.log('====================================================================');
  console.log('PART 3: FALSE ACCEPTANCE VS FALSE REJECTION TESTING');
  console.log('====================================================================\n');

  const results: BoundaryResult[] = [];

  function recordBoundary(
    testId: string,
    name: string,
    classType: 'VALID_EQUIVALENT' | 'INVALID_BOUNDARY',
    inputDescription: string,
    expectedVerdict: 'VERIFIED' | 'REJECTED',
    actualVerdict: 'VERIFIED' | 'REJECTED',
    details: string
  ) {
    const passed = (expectedVerdict === actualVerdict);
    results.push({
      testId,
      name,
      classType,
      inputDescription,
      expectedVerdict,
      actualVerdict,
      passed,
      details
    });
    const icon = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[${testId}] ${icon} | Class: ${classType} | Expected: ${expectedVerdict} | Actual: ${actualVerdict} | ${name}`);
  }

  // 1. Valid: Slight float noise within tolerance (1e-6 < 1e-5)
  const validNoiseOps = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  validNoiseOps[0].matrix4x4[0][0] = 1.0 + 1e-6;
  validNoiseOps[0].matrix4x4[1][1] = 1.0 - 1e-6;
  const resNoise = runSecVerification(validNoiseOps);
  recordBoundary(
    'BND_VAL_01',
    'Small float noise within tolerance (1e-6 < 1e-5)',
    'VALID_EQUIVALENT',
    'Diagonal entries perturbed by +/- 1e-6',
    'VERIFIED',
    resNoise.overallVerdict,
    'Numerical noise below tolerance must NOT cause false rejection'
  );

  // 2. Valid: Negative zero (-0.0) in matrix cells
  const validNegZeroOps = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  validNegZeroOps[1].matrix4x4[0][0] = -0.0;
  validNegZeroOps[1].matrix4x4[0][1] = -0.0;
  validNegZeroOps[1].matrix4x4[0][3] = -0.0;
  const resNegZero = runSecVerification(validNegZeroOps);
  recordBoundary(
    'BND_VAL_02',
    'Negative zero (-0.0) in matrix entries',
    'VALID_EQUIVALENT',
    'Zeros replaced with -0.0',
    'VERIFIED',
    resNegZero.overallVerdict,
    'Negative zero must be treated as equivalent to +0.0'
  );

  // 3. Valid: Permuted JSON key order in Operation objects
  const permutedOps = [
    {
      angleDeg: 0.0,
      matrix4x4: INDEPENDENT_REF_I,
      type: 'IDENTITY' as const,
      name: 'Identity',
      id: 'op_identity',
      axis: [0, 0, 1] as Point3D
    },
    {
      matrix4x4: INDEPENDENT_REF_C3_120,
      id: 'op_rot_c3_120',
      axis: [1, 1, 1] as Point3D,
      angleDeg: 120.0,
      name: 'C3 120',
      type: 'ROTATION' as const
    },
    {
      name: 'C3 240',
      axis: [1, 1, 1] as Point3D,
      type: 'ROTATION' as const,
      angleDeg: 240.0,
      id: 'op_rot_c3_240',
      matrix4x4: INDEPENDENT_REF_C3_240
    }
  ];
  const resPermuted = runSecVerification(permutedOps);
  const permutedDigest = computeCryptographicDigest(permutedOps);
  recordBoundary(
    'BND_VAL_03',
    'Permuted JSON key order in Operation objects',
    'VALID_EQUIVALENT',
    'Keys reordered in all Operation objects',
    'VERIFIED',
    resPermuted.overallVerdict,
    `Digest invariant: ${permutedDigest === sourceDigest ? 'MATCH' : 'MISMATCH'}`
  );

  // 4. Invalid: Orthogonality error exceeding tolerance (2e-5 > 1e-5)
  const invOrthoOps = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  invOrthoOps[1].matrix4x4[0][2] = 1.0 + 2e-5;
  const resInvOrtho = runSecVerification(invOrthoOps);
  recordBoundary(
    'BND_INV_01',
    'Orthogonality error exceeding tolerance (2e-5 > 1e-5)',
    'INVALID_BOUNDARY',
    'Matrix entry perturbed by +2e-5',
    'REJECTED',
    resInvOrtho.overallVerdict,
    'Perturbation beyond tolerance must receive REJECTED'
  );

  // 5. Invalid: Translation component exceeding tolerance (2e-5 > 1e-6)
  const invTransOps = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  invTransOps[1].matrix4x4[0][3] = 2e-5;
  const resInvTrans = runSecVerification(invTransOps);
  recordBoundary(
    'BND_INV_02',
    'Non-zero translation exceeding tolerance (2e-5 > 1e-6)',
    'INVALID_BOUNDARY',
    'Translation component tx set to +2e-5',
    'REJECTED',
    resInvTrans.overallVerdict,
    'Point group operations must have zero translation'
  );

  // 6. Invalid: Non-numeric value in matrix cell (string '0.0')
  const invNonNumOps = JSON.parse(JSON.stringify(baseOperations)) as any[];
  invNonNumOps[1].matrix4x4[0][0] = '0.0';
  const resInvNonNum = runSecVerification(invNonNumOps);
  recordBoundary(
    'BND_INV_03',
    'String in place of number in matrix cell',
    'INVALID_BOUNDARY',
    'cell [0][0] set to string "0.0"',
    'REJECTED',
    resInvNonNum.overallVerdict,
    'Non-numeric values must be rejected by computability validator'
  );

  // 7. Invalid: Non-4x4 matrix dimensions (3x3 matrix)
  const invDimOps = JSON.parse(JSON.stringify(baseOperations)) as any[];
  invDimOps[1].matrix4x4 = [
    [0, 0, 1],
    [1, 0, 0],
    [0, 1, 0]
  ];
  const resInvDim = runSecVerification(invDimOps);
  recordBoundary(
    'BND_INV_04',
    'Invalid matrix dimension (3x3 instead of 4x4)',
    'INVALID_BOUNDARY',
    'Matrix with only 3 rows',
    'REJECTED',
    resInvDim.overallVerdict,
    'Must be rejected by dimension validator'
  );

  // 8. Invalid: Malformed object (missing matrix4x4 property)
  const invMalformedOps = [
    baseOperations[0],
    { id: 'broken', type: 'ROTATION', name: 'Broken' } as any,
    baseOperations[2]
  ];
  const resInvMalformed = runSecVerification(invMalformedOps);
  recordBoundary(
    'BND_INV_05',
    'Malformed Operation object (matrix4x4 missing)',
    'INVALID_BOUNDARY',
    'Operation without matrix4x4 property',
    'REJECTED',
    resInvMalformed.overallVerdict,
    'Must be rejected without unhandled runtime crash'
  );

  console.log(`\nBoundary Robustness Summary: ${results.filter(r => r.passed).length} / ${results.length} passed.\n`);
  return results;
}

// =============================================================================
// PART 4: NEGATIVE TEST QUALITY & ISOLATION AUDIT
// =============================================================================
export function runNegativeTestIsolationAudit(): IsolationResult[] {
  console.log('====================================================================');
  console.log('PART 4: NEGATIVE TEST QUALITY & ISOLATION AUDIT');
  console.log('====================================================================\n');

  const isolationResults: IsolationResult[] = [];

  function auditIsolation(
    testId: string,
    targetCheck: string,
    injectedDefect: string,
    ops: Operation[],
    overrideTargetDisabled: SecVerificationHooks
  ) {
    const normalRes = runSecVerification(ops);
    const normalFailed = normalRes.checks.filter(c => c.status === 'FAIL').map(c => c.checkId);

    const disabledRes = runSecVerification(ops, overrideTargetDisabled);
    const disabledFailed = disabledRes.checks.filter(c => c.status === 'FAIL').map(c => c.checkId);
    const stillRejected = disabledRes.overallVerdict === 'REJECTED';

    const secondary = disabledFailed.filter(id => id !== targetCheck);
    const isStrictlyIsolated = !stillRejected;

    const res: IsolationResult = {
      testId,
      targetCheck,
      injectedDefect,
      normalFailedChecks: normalFailed,
      failedChecksWithTargetDisabled: disabledFailed,
      stillRejectedWithTargetDisabled: stillRejected,
      isolationRating: isStrictlyIsolated ? 'STRICTLY_ISOLATED' : 'SHARED_WITH_SECONDARY',
      secondaryChecks: secondary
    };
    isolationResults.push(res);

    console.log(`[${testId}] Target: ${targetCheck} | Defect: ${injectedDefect}`);
    console.log(`       Normal Failed: [${normalFailed.join(', ')}]`);
    console.log(`       Target Disabled Verdict: ${disabledRes.overallVerdict} | Secondary Failed: [${secondary.join(', ')}]`);
    console.log(`       Rating: ${res.isolationRating}\n`);
  }

  // 1. Test ADV_GRP_01 (Missing Identity)
  auditIsolation(
    'ADV_GRP_01',
    'CHK_IDENTITY',
    'Identity element omitted from group set',
    [baseOperations[1], baseOperations[2]],
    {
      overrideIndependentRef: (ops, cur) => cur,
    }
  );

  // 2. Test ADV_GRP_06 (Metadata angle mismatch)
  const metaMismatchOps = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  metaMismatchOps[1].matrix4x4 = INDEPENDENT_REF_C3_240;
  auditIsolation(
    'ADV_GRP_06',
    'CHK_METADATA_CONSISTENCY',
    'Declared 120°, matrix is 240°',
    metaMismatchOps,
    {
      overrideMetadataConsistency: () => true
    }
  );

  // 3. Test ADV_ACT_01 (Translation offset)
  const transOffsetOps = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  transOffsetOps[1].matrix4x4 = [
    [0.0, 0.0, 1.0, 0.5],
    [1.0, 0.0, 0.0, 0.0],
    [0.0, 1.0, 0.0, 0.0],
    [0.0, 0.0, 0.0, 1.0]
  ];
  auditIsolation(
    'ADV_ACT_01',
    'CHK_VERTEX_PERMUTATION',
    'Translation offset [0.5, 0, 0] added to C3',
    transOffsetOps,
    {
      overrideVertexPermutation: () => true
    }
  );

  // 4. Test ADV_GRP_04 (Broken closure)
  const brokenClosureOps = JSON.parse(JSON.stringify(baseOperations)) as Operation[];
  brokenClosureOps[1].matrix4x4 = [
    [0.0, -1.0, 0.0, 0.0],
    [1.0,  0.0, 0.0, 0.0],
    [0.0,  0.0, 1.0, 0.0],
    [0.0,  0.0, 0.0, 1.0]
  ];
  auditIsolation(
    'ADV_GRP_04',
    'CHK_CLOSURE',
    'Arbitrary orthogonal rotation (C4_z) injected into set',
    brokenClosureOps,
    {
      overrideClosure: () => true
    }
  );

  return isolationResults;
}

// =============================================================================
// MAIN EXECUTION RUNNER
// =============================================================================
export function runAuditOfAuditor() {
  console.log('####################################################################');
  console.log('# FSS v3 — SEC PoC-01: MUTATION HARNESS INTEGRITY AUDIT RUNNER     #');
  console.log('####################################################################\n');

  const mutationResults = runMutationTestSuite();
  const controlResults = runControlExperiments();
  const boundaryResults = runBoundaryRobustnessTests();
  const isolationResults = runNegativeTestIsolationAudit();

  const allMutantsKilled = mutationResults.every(m => m.mutantKilled && m.activated);
  const allControlsPassed = controlResults.every(c => c.passed);
  const allBoundariesPassed = boundaryResults.every(b => b.passed);

  console.log('====================================================================');
  console.log('FINAL AUDIT VERDICT COMPUTATION:');
  console.log(`- Mutants Killed & Activated: ${mutationResults.filter(m => m.mutantKilled && m.activated).length} / ${mutationResults.length}`);
  console.log(`- Control Experiments Passed: ${controlResults.filter(c => c.passed).length} / ${controlResults.length}`);
  console.log(`- Boundary Tests Passed:      ${boundaryResults.filter(b => b.passed).length} / ${boundaryResults.length}`);
  console.log(`- Isolation Evaluated:        ${isolationResults.length} negative tests analyzed`);

  let finalStatus: 'PASS — HARNESS VERIFIED' | 'PASS WITH GAPS' | 'FAIL';
  if (allMutantsKilled && allControlsPassed && allBoundariesPassed) {
    finalStatus = 'PASS — HARNESS VERIFIED';
  } else if (mutationResults.filter(m => m.mutantKilled).length >= 6) {
    finalStatus = 'PASS WITH GAPS';
  } else {
    finalStatus = 'FAIL';
  }

  console.log(`- Final Status Assigned: ${finalStatus}`);
  console.log('====================================================================\n');

  return {
    mutationResults,
    controlResults,
    boundaryResults,
    isolationResults,
    finalStatus
  };
}

// Run directly
runAuditOfAuditor();
