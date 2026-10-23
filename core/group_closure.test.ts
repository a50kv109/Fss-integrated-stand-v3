/**
 * Tests for core/group_closure.ts
 * Uses ExchangeSymmetryOperation + canonicalOperationKey conventions.
 */
import {
  closeGroupFromGenerators,
  isOperationSetClosed,
  resultHasAllInverses,
  GroupClosureResult
} from './group_closure';
import { canonicalOperationKey, ExchangeSymmetryOperation } from './schema/crystallographic_exchange';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
}

function op(
  W: number[][],
  w: Array<[number, number]>
): ExchangeSymmetryOperation {
  return {
    W,
    w: w.map(([n, d]) => ({ numerator: n, denominator: d }))
  };
}

const I = op(
  [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ],
  [
    [0, 1],
    [0, 1],
    [0, 1]
  ]
);

const INV = op(
  [
    [-1, 0, 0],
    [0, -1, 0],
    [0, 0, -1]
  ],
  [
    [0, 1],
    [0, 1],
    [0, 1]
  ]
);

/** P21 screw from registry: -x, y+1/2, -z */
const P21_SCREW = op(
  [
    [-1, 0, 0],
    [0, 1, 0],
    [0, 0, -1]
  ],
  [
    [0, 1],
    [1, 2],
    [0, 1]
  ]
);

/** P212121 non-identity ops (registry origin choice) */
const P212121_G1 = op(
  [
    [1, 0, 0],
    [0, -1, 0],
    [0, 0, -1]
  ],
  [
    [1, 2],
    [0, 1],
    [1, 2]
  ]
);
const P212121_G2 = op(
  [
    [-1, 0, 0],
    [0, 1, 0],
    [0, 0, -1]
  ],
  [
    [1, 2],
    [1, 2],
    [0, 1]
  ]
);
const P212121_G3 = op(
  [
    [-1, 0, 0],
    [0, -1, 0],
    [0, 0, 1]
  ],
  [
    [0, 1],
    [1, 2],
    [1, 2]
  ]
);

let passed = 0;
function pass(name: string) {
  console.log('  ✓', name);
  passed++;
}

console.log('group_closure.test.ts\n');

// T1 empty → trivial
{
  const r = closeGroupFromGenerators([]);
  assert(r.status === 'CLOSED', 'T1 status');
  assert(r.order === 1, 'T1 order');
  assert(r.keys.length === 1, 'T1 keys');
  assert(isOperationSetClosed(r.operations), 'T1 closed');
  pass('T1 empty generators → {e}');
}

// T2 identity only
{
  const r = closeGroupFromGenerators([I]);
  assert(r.status === 'CLOSED' && r.order === 1, 'T2');
  pass('T2 identity generator → order 1');
}

// T3 P-1
{
  const r = closeGroupFromGenerators([INV]);
  assert(r.status === 'CLOSED' && r.order === 2, `T3 order ${r.order}`);
  const keys = new Set(r.keys);
  assert(keys.has(canonicalOperationKey(I)), 'T3 has I');
  assert(keys.has(canonicalOperationKey(INV)), 'T3 has inv');
  assert(isOperationSetClosed(r.operations), 'T3 closed');
  pass('T3 P-1 inversion → order 2');
}

// T4 P21 screw
{
  const r = closeGroupFromGenerators([P21_SCREW]);
  assert(r.status === 'CLOSED' && r.order === 2, `T4 order ${r.order}`);
  assert(isOperationSetClosed(r.operations), 'T4 closed');
  pass('T4 P21 screw → order 2 mod Z^3');
}

// T5 P212121
{
  const r = closeGroupFromGenerators([P212121_G1, P212121_G2]);
  assert(r.status === 'CLOSED' && r.order === 4, `T5 order ${r.order} notes=${r.notes.join(';')}`);
  const keys = new Set(r.keys);
  assert(keys.has(canonicalOperationKey(P212121_G3)), 'T5 generates third screw');
  assert(isOperationSetClosed(r.operations), 'T5 closed');
  pass('T5 P212121 two gens → order 4');
}

// T6 multiset duplicates
{
  const r = closeGroupFromGenerators([P212121_G1, P212121_G1, I, P212121_G2, P212121_G2]);
  assert(r.status === 'CLOSED' && r.order === 4, `T6 order ${r.order}`);
  pass('T6 duplicate generators → still order 4');
}

// T7 integer translation normalization: (I, (1,0,0)) ≡ identity mod Z^3
{
  const lattice = op(
    [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ],
    [
      [1, 1],
      [0, 1],
      [0, 1]
    ]
  );
  const r = closeGroupFromGenerators([lattice]);
  assert(r.status === 'CLOSED' && r.order === 1, `T7 order ${r.order}`);
  pass('T7 lattice translation ≡ e after mod1');
}

// T8 LIMIT_EXCEEDED — maxSize 1 cannot fit identity+non-id
{
  const r = closeGroupFromGenerators([INV], { maxSize: 1 });
  assert(r.status === 'LIMIT_EXCEEDED', `T8 status ${r.status}`);
  assert(r.operations.length === 0, 'T8 no partial ops on limit');
  assert(r.order === 0, 'T8 order 0');
  pass('T8 maxSize=1 with inversion → LIMIT_EXCEEDED, empty ops');
}

// T9 INVALID_INPUT
{
  const r = closeGroupFromGenerators([{ W: [[1]], w: [] } as any]);
  assert(r.status === 'INVALID_INPUT', `T9 ${r.status}`);
  pass('T9 malformed generator → INVALID_INPUT');
}

// T10 closedness already checked in T3–T5; explicit product check
{
  const r = closeGroupFromGenerators([INV, P21_SCREW]);
  assert(r.status === 'CLOSED', 'T10 status');
  assert(isOperationSetClosed(r.operations), 'T10 pairwise closed');
  pass('T10 mixed gens pairwise closure check');
}


// T11 singular matrix det=0 → INVALID_INPUT
{
  const singular = op(
    [
      [1, 0, 0],
      [0, 0, 0],
      [0, 0, 1]
    ],
    [
      [0, 1],
      [0, 1],
      [0, 1]
    ]
  );
  const r = closeGroupFromGenerators([singular]);
  assert(r.status === 'INVALID_INPUT', `T11 status ${r.status}`);
  assert(r.operations.length === 0, 'T11 empty ops');
  pass('T11 det(W)=0 → INVALID_INPUT');
}

// T12 |det|>1 not in GL(3,Z) units → INVALID_INPUT
{
  const scaled = op(
    [
      [2, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ],
    [
      [0, 1],
      [0, 1],
      [0, 1]
    ]
  );
  const r = closeGroupFromGenerators([scaled]);
  assert(r.status === 'INVALID_INPUT', `T12 status ${r.status}`);
  pass('T12 det(W)=2 → INVALID_INPUT');
}

// T13 inverses present for CLOSED results
{
  const r = closeGroupFromGenerators([INV, P21_SCREW]);
  assert(r.status === 'CLOSED', 'T13 status');
  assert(resultHasAllInverses(r.operations), 'T13 inverses');
  assert(isOperationSetClosed(r.operations), 'T13 closed');
  pass('T13 CLOSED implies inverses + closure');
}


// T14 growing GL(3,Z) generator: must not CLOSED with corrupted number matrix
// Fibonacci-like [[2,1],[1,1]] block; either LIMIT_EXCEEDED or INVALID_INPUT (overflow)
{
  const hyp = op(
    [
      [2, 1, 0],
      [1, 1, 0],
      [0, 0, 1]
    ],
    [
      [0, 1],
      [0, 1],
      [0, 1]
    ]
  );
  const r = closeGroupFromGenerators([hyp], { maxSize: 40 });
  assert(
    r.status === 'LIMIT_EXCEEDED' || r.status === 'INVALID_INPUT',
    `T14 expected LIMIT or INVALID, got ${r.status}`
  );
  assert(r.status !== 'CLOSED', 'T14 must not CLOSED');
  assert(r.operations.length === 0, 'T14 no partial ops');
  pass('T14 unbounded GL growth → LIMIT_EXCEEDED or INVALID_INPUT, never CLOSED');
}

// T15 det exact BigInt: large-entry singular still INVALID (products in det stay exact)
{
  const bigSing = op(
    [
      [100000, 100000, 0],
      [100000, 100000, 0],
      [0, 0, 1]
    ],
    [
      [0, 1],
      [0, 1],
      [0, 1]
    ]
  );
  const r = closeGroupFromGenerators([bigSing]);
  assert(r.status === 'INVALID_INPUT', `T15 ${r.status}`);
  pass('T15 large-entry det=0 → INVALID_INPUT (BigInt det)');
}

console.log(`\nALL group_closure tests passed (${passed}).`);
