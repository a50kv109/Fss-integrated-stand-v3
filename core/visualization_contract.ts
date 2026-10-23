/**
 * SG-002 Visualization Boundary Contract
 * 
 * Defines the strict boundary structure for transferring exact crystallographic
 * computation results from the core math engine to the visualization layer.
 * 
 * Rule: Exact rational coordinates (ExactRational) are preserved across the core boundary.
 * Screen coordinate projection and rendering transforms happen strictly in the UI layer.
 */

import { ExactRational } from './schema/crystallographic_exchange';

export interface ExactVector3 {
  x: ExactRational;
  y: ExactRational;
  z: ExactRational;
}

export interface SG002VisualizationPayload {
  structureId: "SG-002";
  settingId: "P-1";
  inputPointP: ExactVector3;
  transformedPointPPrime: ExactVector3;
  inversionCenter: ExactVector3;
  inversionInvariantSatisfied: boolean;
  computedAt: string;
}

export function createSG002VisualizationPayload(
  pointP: ExactVector3,
  transformedPPrime: ExactVector3,
  center: ExactVector3,
  satisfied: boolean
): SG002VisualizationPayload {
  return {
    structureId: "SG-002",
    settingId: "P-1",
    inputPointP: pointP,
    transformedPointPPrime: transformedPPrime,
    inversionCenter: center,
    inversionInvariantSatisfied: satisfied,
    computedAt: new Date().toISOString()
  };
}
