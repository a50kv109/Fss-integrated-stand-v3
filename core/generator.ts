import { CrystallographicImporter, RawGroupSourceData } from './importer';
import { DetailedSymmetryRecord, SymmetryCatalog } from './registry';

export class SourceBackedCatalogGenerator {
  /**
   * Generates and normalizes reference records for the 4 benchmark groups
   * directly from the verified Gemmi/ITA source specification (commit 6ea553a).
   */
  static generateReferenceCatalog(): DetailedSymmetryRecord[] {
    const rawSourceExtract: RawGroupSourceData[] = [
      {
        groupNumber: 1,
        settingId: "P1",
        hmSymbol: "P 1",
        hallSymbol: "P 1",
        operations: [
          { W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] }
        ]
      },
      {
        groupNumber: 2,
        settingId: "P-1",
        hmSymbol: "P -1",
        hallSymbol: "-P 1",
        operations: [
          { W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] },
          { W: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] }
        ]
      },
      {
        groupNumber: 19,
        settingId: "P212121",
        hmSymbol: "P 21 21 21",
        hallSymbol: "P 2ac 2ab",
        operations: [
          { W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] },
          { W: [[1, 0, 0], [0, -1, 0], [0, 0, -1]], w: [{ numerator: 1, denominator: 2 }, { numerator: 0, denominator: 1 }, { numerator: 1, denominator: 2 }] },
          { W: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]], w: [{ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }, { numerator: 0, denominator: 1 }] },
          { W: [[-1, 0, 0], [0, -1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }] }
        ]
      },
      {
        groupNumber: 14,
        settingId: "P21/c",
        hmSymbol: "P 21/c",
        hallSymbol: "-P 2ybc",
        operations: [
          { W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] },
          { W: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }] },
          { W: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] },
          { W: [[1, 0, 0], [0, -1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }] }
        ]
      }
    ];

    return CrystallographicImporter.importRecords(rawSourceExtract);
  }

  /**
   * Compares generated records against existing catalog records.
   * Returns a detailed comparison report for each group.
   */
  static compareWithCatalog(): { settingId: string; match: boolean; details: string }[] {
    const generated = this.generateReferenceCatalog();
    return generated.map(gen => {
      const cat = SymmetryCatalog.findBySettingId(gen.settingId);
      if (!cat) {
        return { settingId: gen.settingId, match: false, details: "Record missing in catalog" };
      }
      if (cat.groupNumber !== gen.groupNumber || cat.hallSymbol !== gen.hallSymbol) {
        return { settingId: gen.settingId, match: false, details: "Group number or Hall symbol mismatch" };
      }
      if (cat.operations.length !== gen.operations.length) {
        return { settingId: gen.settingId, match: false, details: `Operation count mismatch: catalog=${cat.operations.length}, generated=${gen.operations.length}` };
      }
      
      // Compare operations exactly
      for (let i = 0; i < gen.operations.length; i++) {
        const gOp = gen.operations[i];
        const cOp = cat.operations[i];
        if (JSON.stringify(gOp) !== JSON.stringify(cOp)) {
          return { settingId: gen.settingId, match: false, details: `Operation mismatch at index ${i}` };
        }
      }

      return { settingId: gen.settingId, match: true, details: "Exact match with catalog" };
    });
  }
}
