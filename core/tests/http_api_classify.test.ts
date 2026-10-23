import request from 'supertest';
import { app } from '../../server';
import assert from 'node:assert';

async function runTests() {
  console.log('Running API tests...');

  // 1. Malformed JSON
  const resMalformed = await request(app)
    .post('/api/classify')
    .set('Content-Type', 'application/json')
    .send('{ "operations": [ { "W": [[1,0,0],[0,1,0],[0,0,1]], "w": [{"numerator":0,"denominator":1},{"numerator":0,"denominator":1},{"numerator":0,"denominator":1}] } '); // Missing closing braces
  assert.strictEqual(resMalformed.status, 400, 'Should return 400 for malformed JSON');
  console.log('  ✓ T1: Malformed JSON handled');

  // 2. Boundary: Exact ~100KB
  const baseOp = { W: [[1,0,0],[0,1,0],[0,0,1]], w: [{numerator:0,denominator:1},{numerator:0,denominator:1},{numerator:0,denominator:1}] };
  const payload100kb = { operations: [baseOp], padding: 'a'.repeat(100 * 1024 - 1000) };
  const resBoundary = await request(app).post('/api/classify').send(payload100kb);
  assert.strictEqual(resBoundary.status, 200, 'Should accept exactly ~100KB payload');
  console.log('  ✓ T2: Exactly ~100KB handled');

  // 3. Boundary: > 100KB
  const payloadOver = { operations: [baseOp], padding: 'a'.repeat(100 * 1024 + 1024) };
  const resOver = await request(app).post('/api/classify').send(payloadOver);
  assert.strictEqual(resOver.status, 413, 'Should return 413 for payload > 100KB');
  console.log('  ✓ T3: Payload > 100KB handled');

  // 4. Valid Request & Response Validation
  const payloadValid = {
    operations: [baseOp]
  };
  const resValid = await request(app).post('/api/classify').send(payloadValid);
  assert.strictEqual(resValid.status, 200);
  assert.ok(resValid.body.candidateFilter, 'Response should contain candidateFilter');
  assert.ok(resValid.body.candidateEvaluations, 'Response should contain candidateEvaluations');
  console.log('  ✓ T4: Valid request & response structure verified');

  // 5. Experiment Route Assertion
  const resExp = await request(app).post('/api/experiment').send({ structureId: 'foo' });
  assert.strictEqual(resExp.status, 400);
  console.log('  ✓ T5: /api/experiment route check');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
