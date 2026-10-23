import assert from 'assert';
import { classifyOperationSet } from '../core/operation_set_match.ts';

// Helper for running tests
function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (err: any) {
    console.error(`FAIL: ${name} - ${err.message}`);
    process.exit(1);
  }
}

// 1. Validation Tests
runTest('Valid input classification', () => {
  const operations = [{ W: [[1,0,0],[0,1,0],[0,0,1]], w: [{numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}] }];
  const report = classifyOperationSet(operations);
  assert(report.verdict !== 'INVALID_INPUT', 'Should not be INVALID_INPUT');
});

runTest('Invalid structure (syntax)', () => {
  const operations = [{ W: [[1,0],[0,1]], w: [] }]; // Invalid matrix
  const report = classifyOperationSet(operations as any);
  assert(report.verdict === 'INVALID_INPUT', 'Should be INVALID_INPUT');
});

runTest('Negative rational translation', () => {
  const operations = [{ W: [[1,0,0],[0,1,0],[0,0,1]], w: [{numerator: 0, denominator: -1}, {numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}] }]; // Invalid denominator
  const report = classifyOperationSet(operations as any);
  assert(report.verdict === 'INVALID_INPUT', 'Should be INVALID_INPUT');
});

// 2. API-specific constraint logic simulations (simulated inside endpoint)
function simulateEndpoint(reqBody: any, contentLength: number) {
  if (contentLength > 100 * 1024) throw new Error('PAYLOAD_TOO_LARGE');
  if (!Array.isArray(reqBody.operations)) throw new Error('INVALID_INPUT');
  if (reqBody.operations.length > 50) throw new Error('OPERATION_LIMIT_EXCEEDED');
  return classifyOperationSet(reqBody.operations);
}

runTest('Constraint: Payload too large', () => {
  try {
    simulateEndpoint({}, 100 * 1024 + 1);
    assert(false, 'Should throw');
  } catch (err: any) {
    assert(err.message === 'PAYLOAD_TOO_LARGE');
  }
});

runTest('Constraint: Too many operations', () => {
  try {
    simulateEndpoint({ operations: new Array(51).fill({}) }, 100);
    assert(false, 'Should throw');
  } catch (err: any) {
    assert(err.message === 'OPERATION_LIMIT_EXCEEDED');
  }
});
