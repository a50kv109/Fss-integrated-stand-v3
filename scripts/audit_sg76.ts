import { classifyOperationSet } from '../core/operation_set_match';
import { SymmetryCatalog } from '../core/registry';

const record = SymmetryCatalog.findBySettingId('P41');
if (!record) {
  console.error('Record P41 not found');
  process.exit(1);
}

const operations = record.operations;
// Use the default catalog for matching
const catalog = [record]; // We can also use a full catalog if needed, but P41 should match itself
const report = classifyOperationSet(operations, catalog);

console.log('--- SG 76 (P41) AUDIT REPORT ---');
console.log('Verdict:', report.verdict);
console.log('Matched Setting ID:', report.matchedSettingId);
console.log('Notes:', report.notes);
