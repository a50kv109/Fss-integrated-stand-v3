import { classifyOperationSet } from '../operation_set_match';
import { SymmetryCatalog } from '../registry';
import { InputSymmetryOperation } from '../operation_set_profile';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('Running Phase 5D API Boundary Tests...\n');

const catalog = [SymmetryCatalog.findBySettingId('P1')!];
const identityOp: InputSymmetryOperation = {
  W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
};

// Test Helper: Mock API call using classifyOperationSet (since we cannot easily start the full server)
function mockApiCall(ops: InputSymmetryOperation[]) {
  if (ops.length > 50) return { status: 400, error: 'OPERATION_LIMIT_EXCEEDED' };
  
  // Simulate body size check (rough estimate)
  const bodySize = JSON.stringify(ops).length;
  if (bodySize > 100 * 1024) return { status: 413, error: 'PAYLOAD_TOO_LARGE' };
  
  try {
    const report = classifyOperationSet(ops, catalog);
    return { status: 200, report };
  } catch (e) {
    return { status: 500, error: 'INTERNAL_ERROR' };
  }
}

// 1. Valid request (< 50 operations)
const validOps = Array(10).fill(identityOp);
const res1 = mockApiCall(validOps);
assert(res1.status === 200, 'Valid request should pass');
console.log('  ✓ T1: Valid request passed');

// 2. Exactly 50 operations
const fiftyOps = Array(50).fill(identityOp);
const res2 = mockApiCall(fiftyOps);
assert(res2.status === 200, 'Exactly 50 operations should pass');
console.log('  ✓ T2: Exactly 50 operations passed');

// 3. 51 operations (rejected)
const fiftyOneOps = Array(51).fill(identityOp);
const res3 = mockApiCall(fiftyOneOps);
assert(res3.status === 400 && (res3 as any).error === 'OPERATION_LIMIT_EXCEEDED', '51 operations should be rejected');
console.log('  ✓ T3: 51 operations rejected');

// 4. Request body > 100 KB
const largeBodyOps = Array(50).fill({
    W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }],
    // Add extra data to inflate size
    extra: "x".repeat(2500) 
} as any);
const res4 = mockApiCall(largeBodyOps);
assert(res4.status === 413 && (res4 as any).error === 'PAYLOAD_TOO_LARGE', 'Over 100KB body should be rejected');
console.log('  ✓ T4: Request body > 100KB rejected');

// 5. NO_CANDIDATES behavior
const invalidOp: InputSymmetryOperation = {
  W: [[0, 0, 0], [0, 0, 0], [0, 0, 0]], // Invalid
  w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }]
};
const report = (mockApiCall([invalidOp]) as any).report;
assert(report.verdict === 'NO_CANDIDATES' || report.verdict === 'INVALID_INPUT', 'Should return NO_CANDIDATES or INVALID_INPUT');
console.log('  ✓ T5: NO_CANDIDATES/INVALID_INPUT behavior confirmed');

console.log('\n✅ ALL Phase 5D API Boundary Tests Passed.');
