/**
 * Crystallographic Reference Loader & Comparator (KB-13A)
 * 
 * Provides controlled loading and validation of the Gemmi reference exchange artifact,
 * analytical comparison against the working catalog, and exact rational coordinate
 * transformation analysis for space-group setting/origin choices.
 */

import * as fs from 'fs';
import * as crypto from 'crypto';
import {
  CrystallographicExchangeArtifact,
  SpaceGroupRecord,
  ExchangeSymmetryOperation,
  Rational,
  ExactRational,
  validateExchangeRecord,
  canonicalOperationKey
} from './schema/crystallographic_exchange';
import { SymmetryCatalog, DetailedSymmetryRecord } from './registry';

export type ComparisonVerdict =
  | 'MATCH'
  | 'SETTING_MISMATCH'
  | 'OPERATION_MISMATCH'
  | 'INCOMPLETE'
  | 'REFERENCE_INVALID';

export interface OriginShiftAnalysis {
  isEquivalenceProven: boolean;
  shiftVector: [Rational, Rational, Rational];
  details: string;
}

export interface GroupComparisonReport {
  spaceGroupNumber: number;
  settingId: string;
  verdict: ComparisonVerdict;
  details: string;
  referenceRecord?: SpaceGroupRecord;
  workingRecord?: DetailedSymmetryRecord;
  originShiftAnalysis?: OriginShiftAnalysis;
}

export class ReferenceArtifactLoader {
  /**
   * Reads and validates the exchange artifact from file.
   */
  static loadFromFile(filePath: string): CrystallographicExchangeArtifact {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Reference artifact file not found: ${filePath}`);
    }
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    return this.parseAndValidate(rawContent);
  }

  /**
   * Parses JSON and verifies schema, manifest checksum, and record properties.
   */
  static parseAndValidate(jsonContent: string): CrystallographicExchangeArtifact {
    const artifact: CrystallographicExchangeArtifact = JSON.parse(jsonContent);

    if (!artifact.manifest || !Array.isArray(artifact.records)) {
      throw new Error('Invalid artifact structure: missing manifest or records array');
    }

    // Verify canonical records checksum
    const computedSha = this.computeCanonicalSha256(artifact.records);
    if (computedSha !== artifact.manifest.sha256Checksum) {
      throw new Error(
        `Artifact records checksum mismatch: manifest declares ${artifact.manifest.sha256Checksum}, computed ${computedSha}`
      );
    }

    // Validate each record with KB-10 contract
    for (const record of artifact.records) {
      const report = validateExchangeRecord(record, artifact.manifest);
      if (!report.overallValid) {
        const issues = [
          ...report.structural.errors,
          ...report.mathematical.errors,
          ...report.provenance.errors
        ].join('; ');
        throw new Error(`Reference record ${record.settingId} (No. ${record.spaceGroupNumber}) failed contract validation: ${issues}`);
      }
    }

    return artifact;
  }

  /**
   * Computes deterministic canonical SHA-256 hash across sorted record objects.
   */
  static computeCanonicalSha256(records: SpaceGroupRecord[]): string {
    const canonicalize = (obj: any): any => {
      if (Array.isArray(obj)) return obj.map(canonicalize);
      if (obj !== null && typeof obj === 'object') {
        const sorted: Record<string, any> = {};
        Object.keys(obj).sort().forEach(k => {
          sorted[k] = canonicalize(obj[k]);
        });
        return sorted;
      }
      return obj;
    };
    const compactJson = JSON.stringify(canonicalize(records));
    return crypto.createHash('sha256').update(compactJson).digest('hex');
  }
}

export class OriginShiftAnalyzer {
  /**
   * Applies an exact rational origin shift x' = x - x_0 to a symmetry operation (W, w).
   * Transformation law: w' = w + (W - I)*x_0 mod 1.
   */
  static applyOriginShift(
    op: ExchangeSymmetryOperation,
    x0: [Rational, Rational, Rational]
  ): ExchangeSymmetryOperation {
    const x0Exact = [
      ExactRational.fromRational(x0[0]),
      ExactRational.fromRational(x0[1]),
      ExactRational.fromRational(x0[2])
    ];

    const shiftedW: Rational[] = [0, 1, 2].map(i => {
      let shiftTerm = new ExactRational(0, 1);
      for (let j = 0; j < 3; j++) {
        const coeff = op.W[i][j] - (i === j ? 1 : 0);
        shiftTerm = shiftTerm.add(new ExactRational(coeff, 1).mul(x0Exact[j]));
      }
      const initialW = ExactRational.fromRational(op.w[i]);
      return initialW.add(shiftTerm).mod1().toRational();
    });

    return {
      W: op.W.map(row => [...row]),
      w: [shiftedW[0], shiftedW[1], shiftedW[2]],
      triplet: op.triplet
    };
  }

  /**
   * Verifies if two operation sets become identical after applying exact origin shift x0.
   */
  static verifyEquivalenceUnderShift(
    sourceOps: ExchangeSymmetryOperation[],
    targetOps: { W: number[][]; w: Rational[] }[],
    x0: [Rational, Rational, Rational]
  ): boolean {
    if (sourceOps.length !== targetOps.length) return false;

    const shiftedKeys = new Set(
      sourceOps.map(op => {
        const shifted = this.applyOriginShift(op, x0);
        return canonicalOperationKey(shifted);
      })
    );

    const targetKeys = new Set(
      targetOps.map(op => canonicalOperationKey(op as ExchangeSymmetryOperation))
    );

    if (shiftedKeys.size !== targetKeys.size) return false;

    for (const key of shiftedKeys) {
      if (!targetKeys.has(key)) return false;
    }

    return true;
  }
}

export class CrystallographicComparator {
  /**
   * Compares loaded reference records against the working catalog in core/registry.ts.
   * Produces detailed research comparison reports without modifying the working catalog.
   */
  static compareWithWorkingCatalog(
    referenceArtifact: CrystallographicExchangeArtifact
  ): GroupComparisonReport[] {
    const reports: GroupComparisonReport[] = [];

    for (const refRecord of referenceArtifact.records) {
      const workingRecord = SymmetryCatalog.findBySettingId(refRecord.settingId);

      if (!workingRecord) {
        reports.push({
          spaceGroupNumber: refRecord.spaceGroupNumber,
          settingId: refRecord.settingId,
          verdict: 'INCOMPLETE',
          details: `Record settingId '${refRecord.settingId}' is missing in working catalog core/registry.ts`,
          referenceRecord: refRecord
        });
        continue;
      }

      // Check space group number match
      if (workingRecord.groupNumber !== refRecord.spaceGroupNumber) {
        reports.push({
          spaceGroupNumber: refRecord.spaceGroupNumber,
          settingId: refRecord.settingId,
          verdict: 'OPERATION_MISMATCH',
          details: `Group number mismatch: reference has ${refRecord.spaceGroupNumber}, working catalog has ${workingRecord.groupNumber}`,
          referenceRecord: refRecord,
          workingRecord
        });
        continue;
      }

      // Compare operations as canonical sets
      const refKeys = new Set(refRecord.operations.map(op => canonicalOperationKey(op)));
      const workingKeys = new Set(workingRecord.operations.map(op => canonicalOperationKey(op)));

      let directMatch = true;
      if (refKeys.size !== workingKeys.size) {
        directMatch = false;
      } else {
        for (const k of refKeys) {
          if (!workingKeys.has(k)) {
            directMatch = false;
            break;
          }
        }
      }

      if (directMatch) {
        reports.push({
          spaceGroupNumber: refRecord.spaceGroupNumber,
          settingId: refRecord.settingId,
          verdict: 'MATCH',
          details: 'Exact 100% canonical operation match between reference artifact and working catalog',
          referenceRecord: refRecord,
          workingRecord
        });
        continue;
      }

      // If direct match failed, investigate origin shift equivalence (e.g. Group 19)
      const candidateShift: [Rational, Rational, Rational] = [
        { numerator: 1, denominator: 4 },
        { numerator: 1, denominator: 4 },
        { numerator: 1, denominator: 4 }
      ];

      const isShiftEquivalent = OriginShiftAnalyzer.verifyEquivalenceUnderShift(
        refRecord.operations,
        workingRecord.operations,
        candidateShift
      );

      if (isShiftEquivalent) {
        reports.push({
          spaceGroupNumber: refRecord.spaceGroupNumber,
          settingId: refRecord.settingId,
          verdict: 'SETTING_MISMATCH',
          details: `Operations describe the same space group but under different origin conventions. Reference follows standard ITA Vol.A (Hall '${refRecord.hallSymbol}'), while working catalog uses origin shifted by (1/4, 1/4, 1/4).`,
          referenceRecord: refRecord,
          workingRecord,
          originShiftAnalysis: {
            isEquivalenceProven: true,
            shiftVector: candidateShift,
            details: 'Exact rational proof: w_working = (w_ref + (W - I)*x_0) mod 1 holds identically for all operations under x_0 = (1/4, 1/4, 1/4).'
          }
        });
      } else {
        reports.push({
          spaceGroupNumber: refRecord.spaceGroupNumber,
          settingId: refRecord.settingId,
          verdict: 'OPERATION_MISMATCH',
          details: 'Operation sets differ and equivalence under canonical origin shift (1/4, 1/4, 1/4) is not proven.',
          referenceRecord: refRecord,
          workingRecord
        });
      }
    }

    return reports;
  }
}
