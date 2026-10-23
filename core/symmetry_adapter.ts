import { Matrix4x4, Operation } from './types';

export interface Rational {
  numerator: number;
  denominator: number;
}

export interface SymmetryRecord {
  groupNumber: number;
  settingId: string;
  hmSymbol: string;
  hallSymbol: string;
  basisChange?: Matrix4x4;
  operations: {
    W: number[][]; // 3x3
    w: Rational[]; // 3x1
  }[];
  provenance: string;
}

export class SymmetryAdapter {
  static adapt(record: SymmetryRecord): Operation[] {
    if (!record.operations || record.operations.length === 0) {
      throw new Error('No operations provided');
    }

    return record.operations.map((op, index) => {
      if (op.W.length !== 3 || op.W.some(row => row.length !== 3)) {
        throw new Error(`Invalid W matrix size at op ${index}`);
      }
      if (op.w.length !== 3) {
        throw new Error(`Invalid w vector size at op ${index}`);
      }
      if (op.w.some(r => r.denominator === 0)) {
        throw new Error(`Zero denominator at op ${index}`);
      }

      const matrix4x4: Matrix4x4 = [
        [op.W[0][0], op.W[0][1], op.W[0][2], op.w[0].numerator / op.w[0].denominator],
        [op.W[1][0], op.W[1][1], op.W[1][2], op.w[1].numerator / op.w[1].denominator],
        [op.W[2][0], op.W[2][1], op.W[2][2], op.w[2].numerator / op.w[2].denominator],
        [0, 0, 0, 1]
      ];

      return {
        id: `${record.settingId}_op_${index}`,
        name: `${record.hmSymbol} op ${index}`,
        type: 'SPACE_GROUP_OP',
        matrix4x4
      };
    });
  }
}
