
import { SpaceGroup, CrystalSystem } from './types';

export const FEDOROV_GROUPS: SpaceGroup[] = [
  { number: 1, symbol: 'P 1', shortSymbol: 'P1', pointGroup: '1', crystalSystem: CrystalSystem.Triclinic, hallSymbol: 'P 1' },
  { number: 2, symbol: 'P -1', shortSymbol: 'P-1', pointGroup: '-1', crystalSystem: CrystalSystem.Triclinic, hallSymbol: '-P 1' },
  { number: 3, symbol: 'P 2', shortSymbol: 'P2', pointGroup: '2', crystalSystem: CrystalSystem.Monoclinic, hallSymbol: 'P 2' },
  { number: 16, symbol: 'P 2 2 2', shortSymbol: 'P222', pointGroup: '222', crystalSystem: CrystalSystem.Orthorhombic, hallSymbol: 'P 2 2' },
  { number: 75, symbol: 'P 4', shortSymbol: 'P4', pointGroup: '4', crystalSystem: CrystalSystem.Tetragonal, hallSymbol: 'P 4' },
  { number: 143, symbol: 'P 3', shortSymbol: 'P3', pointGroup: '3', crystalSystem: CrystalSystem.Trigonal, hallSymbol: 'P 3' },
  { number: 168, symbol: 'P 6', shortSymbol: 'P6', pointGroup: '6', crystalSystem: CrystalSystem.Hexagonal, hallSymbol: 'P 6' },
  { number: 195, symbol: 'P 2 3', shortSymbol: 'P23', pointGroup: '23', crystalSystem: CrystalSystem.Cubic, hallSymbol: 'P 2 3' },
  { number: 221, symbol: 'P m -3 m', shortSymbol: 'Pm-3m', pointGroup: 'm-3m', crystalSystem: CrystalSystem.Cubic, hallSymbol: '-P 4 2 3' },
  { number: 225, symbol: 'F m -3 m', shortSymbol: 'Fm-3m', pointGroup: 'm-3m', crystalSystem: CrystalSystem.Cubic, hallSymbol: '-F 4 2 3' },
  { number: 227, symbol: 'F d -3 m', shortSymbol: 'Fd-3m', pointGroup: 'm-3m', crystalSystem: CrystalSystem.Cubic, hallSymbol: 'F 4d 2 3 -1d' },
  { number: 230, symbol: 'I a -3 d', shortSymbol: 'Ia-3d', pointGroup: 'm-3m', crystalSystem: CrystalSystem.Cubic, hallSymbol: '-I 4bd 2c 3' },
  // Adding a few more to fill the list
  { number: 14, symbol: 'P 21/c', shortSymbol: 'P21/c', pointGroup: '2/m', crystalSystem: CrystalSystem.Monoclinic, hallSymbol: '-P 2ybc' },
  { number: 62, symbol: 'P n m a', shortSymbol: 'Pnma', pointGroup: 'mmm', crystalSystem: CrystalSystem.Orthorhombic, hallSymbol: '-P 2ac 2n' },
  { number: 141, symbol: 'I 41/a m d', shortSymbol: 'I41/amd', pointGroup: '4/mmm', crystalSystem: CrystalSystem.Tetragonal, hallSymbol: '-I 4bd 2' },
  { number: 194, symbol: 'P 63/m m c', shortSymbol: 'P63/mmc', pointGroup: '6/mmm', crystalSystem: CrystalSystem.Hexagonal, hallSymbol: '-P 6c 2c' },
];

// Generate synthetic records for visualization if needed, but here we'll stick to real ones or expand them
// In a production app, this would be a complete 230 group list.
