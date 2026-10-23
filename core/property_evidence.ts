/**
 * Crystallographic Property Evidence Generator (KB-15)
 * 
 * Binds derived mathematical group properties (KB-14) to the FSS evidence framework,
 * ensuring complete provenance traceability, independent verification levels,
 * immutable rational arithmetic, and explicit limitation boundaries.
 */

import * as crypto from 'crypto';
import {
  Rational,
  ExactRational,
  SpaceGroupRecord,
  ExchangeManifest,
  validateStructuralRecord,
  validateMathematicalGroup,
  canonicalOperationKey
} from './schema/crystallographic_exchange';
import {
  CrystallographicGroupProperties,
  LinearPartAnalysis,
  InversionAnalysis,
  OperationPowerAnalysis,
  SpaceGroupPropertyReport
} from './group_properties';
import {
  GroupComparisonReport,
  CrystallographicComparator,
  ReferenceArtifactLoader
} from './reference_loader';

export type EvidenceVerificationLevel =
  | 'SOURCE_VERIFIED'
  | 'STRUCTURALLY_VALID'
  | 'GROUP_AXIOMS_VERIFIED'
  | 'PROPERTY_COMPUTED'
  | 'PROPERTY_VERIFIED'
  | 'REFERENCE_VERIFIED'
  | 'INCOMPLETE'
  | 'CONFLICT';

export interface OperationReference {
  operationIndex: number;
  triplet?: string;
  matrixKey: string;
  linearOrder: number;
}

export interface PropertyEvidence<T = any> {
  evidenceId: string;
  subject: {
    spaceGroupNumber: number;
    settingId: string;
    hmSymbol: string;
    hallSymbol: string;
  };
  property: string;
  sourceRecordId: string;
  sourceChecksum: string;
  operationReferences: OperationReference[];
  method: {
    name: string;
    version: string;
    description: string;
  };
  inputs: {
    operationsCount: number;
    coordinateConvention: string;
    originShiftVector?: [Rational, Rational, Rational];
    latticeAssumed: string;
  };
  result: T;
  verificationStatus: EvidenceVerificationLevel;
  limitations: string[];
  timestamp: string;
}

export interface EvidenceBackedGroupReport {
  passport: {
    spaceGroupNumber: number;
    settingId: string;
    hmSymbol: string;
    hallSymbol: string;
    crystalSystem?: string;
    centering?: string;
  };
  sourceProvenance: {
    sourceName: string;
    sourceCommit: string;
    sourceVersion: string;
    artifactChecksum: string;
    isSourceVerified: boolean;
  };
  validationSummary: {
    structural: { valid: boolean; errors: string[] };
    mathematicalAxioms: {
      valid: boolean;
      hasIdentity: boolean;
      hasInverses: boolean;
      isClosed: boolean;
      errors: string[];
    };
  };
  catalogComparison: {
    verdict: string;
    details: string;
    originShiftProven?: boolean;
    shiftVector?: [Rational, Rational, Rational];
  };
  evidenceList: PropertyEvidence[];
  unresolvedQuestionsAndLimitations: string[];
}

export class CrystallographicEvidenceGenerator {
  static readonly ALGORITHM_VERSION = '1.0.0';

  /**
   * Generates deterministic evidence ID.
   */
  static createEvidenceId(
    spaceGroupNumber: number,
    settingId: string,
    propertyName: string,
    extraSalt: string = ''
  ): string {
    const raw = `FSS-EVID-SG${spaceGroupNumber}-${settingId}-${propertyName}-${extraSalt}`;
    const hash = crypto.createHash('sha256').update(raw).digest('hex').substring(0, 12);
    return `EVID-SG${spaceGroupNumber}-${propertyName.toUpperCase()}-${hash}`;
  }

  /**
   * Builds an Evidence-backed report for a single space group record.
   */
  static generateReportForRecord(
    record: SpaceGroupRecord,
    manifest: ExchangeManifest,
    comparisonReport?: GroupComparisonReport
  ): EvidenceBackedGroupReport {
    const timestamp = '2026-10-10T00:00:00.000Z'; // deterministic ISO timestamp for reproducible evidence

    // 1. Schema & Axiom Validations
    const structuralResult = validateStructuralRecord(record);
    const mathematicalResult = validateMathematicalGroup(record);

    // 2. Computed Properties (KB-14)
    const propertiesReport = CrystallographicGroupProperties.analyzeSpaceGroup(record);

    // 3. Build Operation References
    const opRefs: OperationReference[] = (record.operations || []).map((op, idx) => ({
      operationIndex: idx,
      triplet: op.triplet,
      matrixKey: JSON.stringify(op.W),
      linearOrder: propertiesReport.operationPowers.value[idx]?.linearOrder ?? 1
    }));

    const evidenceList: PropertyEvidence[] = [];

    // Check baseline source verification
    const isChecksumValid = manifest && typeof manifest.sha256Checksum === 'string' && manifest.sha256Checksum.length === 64;
    const isSourceVerified = manifest?.isSourceVerified === true && isChecksumValid;

    // EVIDENCE A: Linear Parts & Point Group Action
    const linearStatus: EvidenceVerificationLevel = !structuralResult.valid
      ? 'INCOMPLETE'
      : !isSourceVerified
      ? 'CONFLICT'
      : mathematicalResult.valid
      ? 'PROPERTY_VERIFIED'
      : 'PROPERTY_COMPUTED';

    evidenceList.push({
      evidenceId: this.createEvidenceId(record.spaceGroupNumber, record.settingId, 'linear_parts'),
      subject: {
        spaceGroupNumber: record.spaceGroupNumber,
        settingId: record.settingId,
        hmSymbol: record.hmSymbol,
        hallSymbol: record.hallSymbol
      },
      property: 'LINEAR_PARTS_SET',
      sourceRecordId: `${manifest.sourceName}:${record.settingId}`,
      sourceChecksum: manifest.sha256Checksum,
      operationReferences: opRefs,
      method: {
        name: 'ExactIntegerMatrixOrderAnalysis',
        version: this.ALGORITHM_VERSION,
        description: 'Exact integer determinant, trace, and power cycle verification (order in {1,2,3,4,6})'
      },
      inputs: {
        operationsCount: record.operations ? record.operations.length : 0,
        coordinateConvention: "x' = W x + w",
        latticeAssumed: record.crystalSystem || 'unspecified'
      },
      result: propertiesReport.linearParts.value,
      verificationStatus: linearStatus,
      limitations: propertiesReport.linearParts.limitations,
      timestamp
    });

    // EVIDENCE B: Centrosymmetry & Inversion Center
    const centroStatus: EvidenceVerificationLevel = !structuralResult.valid
      ? 'INCOMPLETE'
      : !isSourceVerified
      ? 'CONFLICT'
      : mathematicalResult.valid
      ? 'PROPERTY_VERIFIED'
      : 'PROPERTY_COMPUTED';

    const invOpIndex = propertiesReport.centrosymmetry.value.inversionOpIndex;
    const invRefs = invOpIndex !== null ? [opRefs[invOpIndex]] : [];

    evidenceList.push({
      evidenceId: this.createEvidenceId(record.spaceGroupNumber, record.settingId, 'centrosymmetry'),
      subject: {
        spaceGroupNumber: record.spaceGroupNumber,
        settingId: record.settingId,
        hmSymbol: record.hmSymbol,
        hallSymbol: record.hallSymbol
      },
      property: 'CENTROSYMMETRY_AND_INVERSION_CENTER',
      sourceRecordId: `${manifest.sourceName}:${record.settingId}`,
      sourceChecksum: manifest.sha256Checksum,
      operationReferences: invRefs,
      method: {
        name: 'ExactInversionCenterMidpoint',
        version: this.ALGORITHM_VERSION,
        description: 'Identification of W = -I_3 and exact rational midpoint x_0 = (1/2)*w mod 1'
      },
      inputs: {
        operationsCount: record.operations ? record.operations.length : 0,
        coordinateConvention: "x' = -x + w",
        latticeAssumed: record.crystalSystem || 'unspecified'
      },
      result: propertiesReport.centrosymmetry.value,
      verificationStatus: centroStatus,
      limitations: propertiesReport.centrosymmetry.limitations,
      timestamp
    });

    // EVIDENCE C: Operation Powers & Intrinsic Translations (tau)
    for (let i = 0; i < propertiesReport.operationPowers.value.length; i++) {
      const powAnalysis = propertiesReport.operationPowers.value[i];
      const opStatus: EvidenceVerificationLevel = !structuralResult.valid
        ? 'INCOMPLETE'
        : !isSourceVerified
        ? 'CONFLICT'
        : mathematicalResult.valid
        ? 'PROPERTY_VERIFIED'
        : 'PROPERTY_COMPUTED';

      evidenceList.push({
        evidenceId: this.createEvidenceId(
          record.spaceGroupNumber,
          record.settingId,
          `op_power_${i}`,
          `k${powAnalysis.linearOrder}`
        ),
        subject: {
          spaceGroupNumber: record.spaceGroupNumber,
          settingId: record.settingId,
          hmSymbol: record.hmSymbol,
          hallSymbol: record.hallSymbol
        },
        property: `OPERATION_POWER_AND_INTRINSIC_TRANSLATION_OP_${i}`,
        sourceRecordId: `${manifest.sourceName}:${record.settingId}`,
        sourceChecksum: manifest.sha256Checksum,
        operationReferences: [opRefs[i]],
        method: {
          name: 'ExactAffinePowerWithoutModuloReduction',
          version: this.ALGORITHM_VERSION,
          description: 'Composition (W, w)^k in exact rational arithmetic preserving unreduced translation sum'
        },
        inputs: {
          operationsCount: 1,
          coordinateConvention: "x' = W x + w",
          latticeAssumed: record.crystalSystem || 'unspecified'
        },
        result: {
          linearOrder: powAnalysis.linearOrder,
          unreducedTranslationAtOrder: powAnalysis.unreducedTranslationAtOrder,
          mod1TranslationAtOrder: powAnalysis.mod1TranslationAtOrder,
          intrinsicTranslation: powAnalysis.intrinsicTranslation,
          isUnreducedTranslationLatticeVector: powAnalysis.isUnreducedTranslationLatticeVector,
          hasNonZeroIntrinsicTranslation: powAnalysis.hasNonZeroIntrinsicTranslation
        },
        verificationStatus: opStatus,
        limitations: powAnalysis.limitations,
        timestamp
      });
    }

    // Unresolved questions and limitations
    const unresolved: string[] = [
      ...propertiesReport.overallLimitations
    ];

    if (comparisonReport && comparisonReport.verdict === 'SETTING_MISMATCH') {
      unresolved.push(
        `Working catalog uses shifted origin: ${comparisonReport.details}. Equivalence is proven under origin shift, but standard ITA setting is preserved in reference.`
      );
    }

    return {
      passport: {
        spaceGroupNumber: record.spaceGroupNumber,
        settingId: record.settingId,
        hmSymbol: record.hmSymbol,
        hallSymbol: record.hallSymbol,
        crystalSystem: record.crystalSystem,
        centering: record.centering
      },
      sourceProvenance: {
        sourceName: manifest.sourceName,
        sourceCommit: manifest.sourceCommit || 'unknown',
        sourceVersion: manifest.sourceVersion || manifest.extractorVersion || 'unknown',
        artifactChecksum: manifest.sha256Checksum || 'unknown',
        isSourceVerified: manifest.isSourceVerified
      },
      validationSummary: {
        structural: structuralResult,
        mathematicalAxioms: mathematicalResult
      },
      catalogComparison: {
        verdict: comparisonReport?.verdict ?? 'NOT_EVALUATED',
        details: comparisonReport?.details ?? 'Catalog comparison not performed',
        originShiftProven: comparisonReport?.originShiftAnalysis?.isEquivalenceProven,
        shiftVector: comparisonReport?.originShiftAnalysis?.shiftVector
      },
      evidenceList,
      unresolvedQuestionsAndLimitations: unresolved
    };
  }

  /**
   * Generates full evidence reports for all 4 benchmark groups loaded from artifact.
   */
  static generateBenchmarkReports(artifactFilePath: string): EvidenceBackedGroupReport[] {
    const artifact = ReferenceArtifactLoader.loadFromFile(artifactFilePath);
    const comparisons = CrystallographicComparator.compareWithWorkingCatalog(artifact);
    const comparisonMap = new Map<string, GroupComparisonReport>();
    comparisons.forEach(c => comparisonMap.set(c.settingId, c));

    return artifact.records.map(record => {
      const cmp = comparisonMap.get(record.settingId);
      return this.generateReportForRecord(record, artifact.manifest, cmp);
    });
  }
}
