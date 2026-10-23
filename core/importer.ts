import { DetailedSymmetryRecord } from './registry';
import { CrystallographicExchangeArtifact } from './schema/crystallographic_exchange';
import { ReferenceArtifactLoader } from './reference_loader';

export interface RawGroupSourceData {
  groupNumber: number;
  settingId: string;
  hmSymbol: string;
  hallSymbol: string;
  operations: {
    W: number[][];
    w: { numerator: number; denominator: number }[];
  }[];
}

export class CrystallographicImporter {
  static readonly SOURCE_PROVENANCE = {
    source: "Gemmi (https://github.com/project-gemmi/gemmi)",
    commitOrVersion: "6ea553a",
    tablePath: "gemmi/include/gemmi/symmetry.hpp",
    license: "MPL-2.0",
    attribution: "International Tables for Crystallography (ITA)",
    normalizationMethod: "Exact rational extraction from Hall symbols"
  };

  /**
   * Normalizes and validates raw crystallographic records into DetailedSymmetryRecord format.
   */
  static importRecords(rawData: RawGroupSourceData[]): DetailedSymmetryRecord[] {
    return rawData.map(raw => {
      // 1. Validation
      if (!raw.groupNumber || raw.groupNumber < 1 || raw.groupNumber > 230) {
        throw new Error(`Invalid group number: ${raw.groupNumber}`);
      }
      if (!raw.settingId || !raw.hallSymbol) {
        throw new Error(`Missing settingId or hallSymbol for group ${raw.groupNumber}`);
      }
      if (!raw.operations || raw.operations.length === 0) {
        throw new Error(`No operations found for setting ${raw.settingId}`);
      }

      // 2. Normalize operations (ensure exact rational representation and matrix dimensions)
      const normalizedOps = raw.operations.map((op, idx) => {
        if (!op.W || op.W.length !== 3 || op.W.some(row => row.length !== 3)) {
          throw new Error(`Invalid rotation matrix W at group ${raw.settingId}, op ${idx}`);
        }
        if (!op.w || op.w.length !== 3) {
          throw new Error(`Invalid translation vector w at group ${raw.settingId}, op ${idx}`);
        }
        for (const t of op.w) {
          if (t.denominator === 0) {
            throw new Error(`Zero denominator in translation at group ${raw.settingId}, op ${idx}`);
          }
        }
        return {
          W: op.W.map(row => [...row]),
          w: op.w.map(t => ({ numerator: t.numerator, denominator: t.denominator }))
        };
      });

      // 3. Construct record
      return {
        groupNumber: raw.groupNumber,
        settingId: raw.settingId,
        hmSymbol: raw.hmSymbol,
        hallSymbol: raw.hallSymbol,
        provenance: `Gemmi/ITA ${this.SOURCE_PROVENANCE.commitOrVersion} (${this.SOURCE_PROVENANCE.license})`,
        provenanceDetails: { ...this.SOURCE_PROVENANCE },
        operations: normalizedOps
      };
    });
  }

  /**
   * Loads and validates a machine-readable reference exchange artifact.
   * Does NOT automatically modify the working catalog.
   */
  static loadReferenceArtifact(filePath: string): CrystallographicExchangeArtifact {
    return ReferenceArtifactLoader.loadFromFile(filePath);
  }
}
