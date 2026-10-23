
export enum CrystalSystem {
  Triclinic = 'Triclinic',
  Monoclinic = 'Monoclinic',
  Orthorhombic = 'Orthorhombic',
  Tetragonal = 'Tetragonal',
  Trigonal = 'Trigonal',
  Hexagonal = 'Hexagonal',
  Cubic = 'Cubic'
}

export type SynthesisProtocol = 'CLASSICAL' | 'USP_VERIFICATION' | 'HARMONIC_RESONANCE';

export interface SpaceGroup {
  number: number;
  symbol: string;
  shortSymbol: string;
  pointGroup: string;
  crystalSystem: CrystalSystem;
  hallSymbol: string;
  setting?: string;
}

export interface AppState {
  selectedGroup: SpaceGroup | null;
  searchQuery: string;
  filterSystem: CrystalSystem | 'All';
  isAiLoading: boolean;
  aiResponse: string | null;
  activeProtocol: SynthesisProtocol;
}
