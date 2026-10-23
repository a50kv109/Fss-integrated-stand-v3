/**
 * Mathematical Passport Schema V1 (FSS)
 * 
 * Defines TypeScript interfaces for Mathematical Passports, claims,
 * verification contracts, and runtime verification results.
 * 
 * Adheres to FSS principles:
 * - YAML holds declarative descriptive metadata.
 * - Operations reference core/registry.ts (no duplication).
 * - Verification results are computed dynamically (no static VERIFIED in YAML).
 */

export type PassportMode = 'implementation-linked' | 'reference-only';

export type VerificationStatus = 'VERIFIED' | 'REJECTED' | 'CONFLICT' | 'PENDING' | 'STALE';

export interface ProvenanceMeta {
  sourceArtifact: string;
  sourceLibrary: string;
  sourceCommit: string;
  checksumSha256: string;
}

export interface MathematicalClaim {
  id: string;
  description: string;
  formula: string;
  verificationContractId: string;
}

export interface VerificationContract {
  id: string;
  targetFunction: string;
  testFile: string;
  assertionType: string;
}

export interface VerificationResult {
  claimId: string;
  contractId: string;
  status: VerificationStatus;
  computedAt: string;
  provenanceHash: string;
  details?: Record<string, unknown>;
}

export interface VisualizationBinding {
  exampleTarget: string;
  renderPrimitives: Array<{
    type: 'point' | 'segment' | 'plane';
    role: string;
    coordinatesSource: string;
  }>;
}

export interface MathematicalPassportRecord {
  schemaVersion: string;
  groupId: number;
  hmSymbol: string;
  hallSymbol: string;
  settingId: string;
  crystalSystem: string;
  mode: PassportMode;
  provenance: ProvenanceMeta;
  registryReference?: {
    module: string;
    registryEntryKey: string;
  };
  mathematicalClaims: MathematicalClaim[];
  verificationContracts: VerificationContract[];
  visualizationBinding?: VisualizationBinding;
  limitations: string[];
}
