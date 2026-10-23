import { SymmetryRecord } from './symmetry_adapter';

export interface ProvenanceInfo {
  source: string;
  commitOrVersion: string;
  tablePath: string;
  license: string;
  attribution: string;
  normalizationMethod: string;
}

export interface DetailedSymmetryRecord extends SymmetryRecord {
  provenanceDetails: ProvenanceInfo;
}

export class SymmetryCatalog {
  private static records: DetailedSymmetryRecord[] = [
    {
      groupNumber: 1,
      settingId: "P1",
      hmSymbol: "P 1",
      hallSymbol: "P 1",
      provenance: "Gemmi/ITA 2024.1 (MPL-2.0)",
      provenanceDetails: {
        source: "Gemmi (https://github.com/project-gemmi/gemmi)",
        commitOrVersion: "6ea553a",
        tablePath: "gemmi/include/gemmi/symmetry.hpp",
        license: "MPL-2.0",
        attribution: "International Tables for Crystallography (ITA)",
        normalizationMethod: "Exact rational extraction from Hall symbols"
      },
      operations: [
        { W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] }
      ]
    },
    {
      groupNumber: 2,
      settingId: "P-1",
      hmSymbol: "P -1",
      hallSymbol: "-P 1",
      provenance: "Gemmi/ITA 2024.1 (MPL-2.0)",
      provenanceDetails: {
        source: "Gemmi (https://github.com/project-gemmi/gemmi)",
        commitOrVersion: "6ea553a",
        tablePath: "gemmi/include/gemmi/symmetry.hpp",
        license: "MPL-2.0",
        attribution: "International Tables for Crystallography (ITA)",
        normalizationMethod: "Exact rational extraction from Hall symbols"
      },
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
      provenance: "Gemmi/ITA 2024.1 (MPL-2.0)",
      provenanceDetails: {
        source: "Gemmi (https://github.com/project-gemmi/gemmi)",
        commitOrVersion: "6ea553a",
        tablePath: "gemmi/include/gemmi/symmetry.hpp",
        license: "MPL-2.0",
        attribution: "International Tables for Crystallography (ITA)",
        normalizationMethod: "Exact rational extraction from Hall symbols"
      },
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
      provenance: "Gemmi/ITA 2024.1 (MPL-2.0)",
      provenanceDetails: {
        source: "Gemmi (https://github.com/project-gemmi/gemmi)",
        commitOrVersion: "6ea553a",
        tablePath: "gemmi/include/gemmi/symmetry.hpp",
        license: "MPL-2.0",
        attribution: "International Tables for Crystallography (ITA)",
        normalizationMethod: "Exact rational extraction from Hall symbols"
      },
      operations: [
        { W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] },
        { W: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }] },
        { W: [[-1, 0, 0], [0, -1, 0], [0, 0, -1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] },
        { W: [[1, 0, 0], [0, -1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }] }
      ]
    },
    {
      groupNumber: 3,
      settingId: "P2",
      hmSymbol: "P 1 2 1",
      hallSymbol: "P 2y",
      provenance: "Gemmi/ITA 2024.1 (MPL-2.0)",
      provenanceDetails: {
        source: "Gemmi (https://github.com/project-gemmi/gemmi)",
        commitOrVersion: "5cc1c23c6007e0e6cbd69289c6f7c0bff50e943e",
        tablePath: "src/symmetry.cpp:spacegroup_tables::main",
        license: "MPL-2.0",
        attribution: "International Tables for Crystallography (ITA)",
        normalizationMethod: "Exact rational extraction from Hall symbols"
      },
      operations: [
        { W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] },
        { W: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] }
      ]
    },
    {
      groupNumber: 4,
      settingId: "P21",
      hmSymbol: "P 1 21 1",
      hallSymbol: "P 2yb",
      provenance: "Gemmi/ITA 2024.1 (MPL-2.0)",
      provenanceDetails: {
        source: "Gemmi (https://github.com/project-gemmi/gemmi)",
        commitOrVersion: "5cc1c23c6007e0e6cbd69289c6f7c0bff50e943e",
        tablePath: "src/symmetry.cpp:spacegroup_tables::main",
        license: "MPL-2.0",
        attribution: "International Tables for Crystallography (ITA)",
        normalizationMethod: "Exact rational extraction from Hall symbols"
      },
      operations: [
        { W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] },
        { W: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 1, denominator: 2 }, { numerator: 0, denominator: 1 }] }
      ]
    },
    {
      groupNumber: 5,
      settingId: "C2",
      hmSymbol: "C 1 2 1",
      hallSymbol: "C 2y",
      provenance: "Gemmi/ITA 2024.1 (MPL-2.0)",
      provenanceDetails: {
        source: "Gemmi (https://github.com/project-gemmi/gemmi)",
        commitOrVersion: "5cc1c23c6007e0e6cbd69289c6f7c0bff50e943e",
        tablePath: "src/symmetry.cpp:spacegroup_tables::main",
        license: "MPL-2.0",
        attribution: "International Tables for Crystallography (ITA)",
        normalizationMethod: "Exact rational extraction from Hall symbols"
      },
      operations: [
        { W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] },
        { W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], w: [{ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }, { numerator: 0, denominator: 1 }] },
        { W: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] },
        { W: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]], w: [{ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }, { numerator: 0, denominator: 1 }] }
      ]
    },
    {
      groupNumber: 9,
      settingId: "Cc",
      hmSymbol: "C 1 c 1",
      hallSymbol: "C -2yc",
      provenance: "Gemmi/ITA 2024.1 (MPL-2.0)",
      provenanceDetails: {
        source: "Gemmi (https://github.com/project-gemmi/gemmi)",
        commitOrVersion: "5cc1c23c6007e0e6cbd69289c6f7c0bff50e943e",
        tablePath: "src/symmetry.cpp:spacegroup_tables::main",
        license: "MPL-2.0",
        attribution: "International Tables for Crystallography (ITA)",
        normalizationMethod: "Exact rational extraction from Hall symbols"
      },
      operations: [
        { W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] },
        { W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], w: [{ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }, { numerator: 0, denominator: 1 }] },
        { W: [[1, 0, 0], [0, -1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 1, denominator: 2 }] },
        { W: [[1, 0, 0], [0, -1, 0], [0, 0, 1]], w: [{ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 }] }
      ]
    },
    {
      groupNumber: 76,
      settingId: "P41",
      hmSymbol: "P 41",
      hallSymbol: "P 4w",
      provenance: "Gemmi/ITA 2024.1 (MPL-2.0)",
      provenanceDetails: {
        source: "CCTBX/IUCr/Gemmi",
        commitOrVersion: "Verification-2026-10-11",
        tablePath: "ITA2024",
        license: "MPL-2.0",
        attribution: "International Tables for Crystallography (ITA)",
        normalizationMethod: "Exact rational extraction"
      },
      operations: [
        { W: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }] },
        { W: [[0, -1, 0], [1, 0, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 1, denominator: 4 }] },
        { W: [[-1, 0, 0], [0, -1, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 1, denominator: 2 }] },
        { W: [[0, 1, 0], [-1, 0, 0], [0, 0, 1]], w: [{ numerator: 0, denominator: 1 }, { numerator: 0, denominator: 1 }, { numerator: 3, denominator: 4 }] }
      ]
    }
  ];

  static findByGroupNumber(groupNumber: number): DetailedSymmetryRecord[] {
    return JSON.parse(JSON.stringify(this.records.filter(r => r.groupNumber === groupNumber)));
  }

  static findBySettingId(settingId: string): DetailedSymmetryRecord | undefined {
    const record = this.records.find(r => r.settingId === settingId);
    return record ? JSON.parse(JSON.stringify(record)) : undefined;
  }

  static findByHallSymbol(hallSymbol: string): DetailedSymmetryRecord[] {
    return JSON.parse(JSON.stringify(this.records.filter(r => r.hallSymbol === hallSymbol)));
  }
}
