import React, { useState } from 'react';
import { runSymmetryExperiment } from './core/engine';
import {
  CANONICAL_TETRAHEDRON,
  OPERATION_C3_120,
  OPERATION_NEGATIVE_45,
  OPERATION_REFLECTION_XY
} from './core/canonical';
import { Evidence, VerificationPredicate } from './core/types';
import { TetrahedronViewport } from './components/TetrahedronViewport';
import ClassifierUI from './components/ClassifierUI';
import { CheckCircle2, XCircle, RotateCcw, Copy, Check, Terminal, Play, Microscope } from 'lucide-react';

const App: React.FC = () => {
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [predicate, setPredicate] = useState<VerificationPredicate>('PRESERVES_STRUCTURE');
  const [epsilon, setEpsilon] = useState<number>(1e-5);
  const [copied, setCopied] = useState(false);
  const [activeOpId, setActiveOpId] = useState<string | null>(null);
  const [view, setView] = useState<'experiment' | 'classifier'>('experiment');

  // HUMAN PATH: Calls the exact same deterministic core function
  const handleRunPositive = (pred?: VerificationPredicate) => {
    const activePred = pred || predicate;
    setActiveOpId(OPERATION_C3_120.id);
    const result = runSymmetryExperiment({
      structureId: CANONICAL_TETRAHEDRON.id,
      operationId: OPERATION_C3_120.id,
      predicate: activePred,
      epsilon
    });
    setEvidence(result);
  };

  const handleRunNegative = (pred?: VerificationPredicate) => {
    const activePred = pred || predicate;
    setActiveOpId(OPERATION_NEGATIVE_45.id);
    const result = runSymmetryExperiment({
      structureId: CANONICAL_TETRAHEDRON.id,
      operationId: OPERATION_NEGATIVE_45.id,
      predicate: activePred,
      epsilon
    });
    setEvidence(result);
  };

  const handleRunReflection = (pred?: VerificationPredicate) => {
    const activePred = pred || predicate;
    setActiveOpId(OPERATION_REFLECTION_XY.id);
    const result = runSymmetryExperiment({
      structureId: CANONICAL_TETRAHEDRON.id,
      operationId: OPERATION_REFLECTION_XY.id,
      predicate: activePred,
      epsilon
    });
    setEvidence(result);
  };

  const handleReset = () => {
    setEvidence(null);
    setActiveOpId(null);
  };

  const copyEvidenceJson = () => {
    if (!evidence) return;
    navigator.clipboard.writeText(JSON.stringify(evidence, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#060913] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
            <h1 className="text-base font-bold tracking-tight text-white font-mono uppercase">
              Fedorov Symmetry Reasoning Stand
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            MVP-0: Single Deterministic Symmetry Experiment (Regular Tetrahedron)
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
            <span className="text-slate-500">Core Engine:</span>
            <span className="text-emerald-400 font-semibold">Active & Deterministic</span>
          </div>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1700px] w-full mx-auto">
        {view === 'classifier' ? (
          <div className="lg:col-span-12">
            <ClassifierUI />
          </div>
        ) : (
          <>
            {/* Left Control & Evidence Column (5 cols) */}
            <section className="lg:col-span-5 flex flex-col gap-4 overflow-y-auto pr-1">
          
          {/* Structure Specification Card */}
          <div className="bg-[#080d1a] border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                1. Canonical Structure
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {CANONICAL_TETRAHEDRON.id}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="font-semibold text-sm text-slate-200">{CANONICAL_TETRAHEDRON.name}</span>
              <span className="text-xs text-slate-400 font-mono">Vertices: 4 | Edges: 6</span>
            </div>

            {/* Vertices coordinates grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {CANONICAL_TETRAHEDRON.vertices.map(v => (
                <div key={v.id} className="bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800/60 flex items-center justify-between">
                  <span className="text-indigo-400 font-bold">{v.id}:</span>
                  <span className="text-slate-300">[{v.coords.join(', ')}]</span>
                </div>
              ))}
            </div>
          </div>

          {/* Experiment Actions & Predicate */}
          <div className="bg-[#080d1a] border border-slate-800/80 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                2. Verification Experiment
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setPredicate('PRESERVES_STRUCTURE');
                    if (activeOpId) {
                      const res = runSymmetryExperiment({
                        structureId: CANONICAL_TETRAHEDRON.id,
                        operationId: activeOpId,
                        predicate: 'PRESERVES_STRUCTURE',
                        epsilon
                      });
                      setEvidence(res);
                    }
                  }}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    predicate === 'PRESERVES_STRUCTURE'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  PRESERVES_STRUCTURE
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPredicate('PROPER_ROTATION');
                    if (activeOpId) {
                      const res = runSymmetryExperiment({
                        structureId: CANONICAL_TETRAHEDRON.id,
                        operationId: activeOpId,
                        predicate: 'PROPER_ROTATION',
                        epsilon
                      });
                      setEvidence(res);
                    }
                  }}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    predicate === 'PROPER_ROTATION'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  PROPER_ROTATION
                </button>
              </div>
            </div>

            {/* Epsilon configuration */}
            <div className="flex items-center justify-between bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-800 text-xs font-mono">
              <label htmlFor="epsilonInput" className="text-slate-400">
                Verification Tolerance (ε):
              </label>
              <input
                id="epsilonInput"
                type="number"
                step="0.000001"
                min="0.0000001"
                value={epsilon}
                onChange={(e) => setEpsilon(parseFloat(e.target.value) || 1e-5)}
                className="w-28 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-right text-indigo-300 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2">
              {/* Positive Control Button */}
              <button
                onClick={() => handleRunPositive()}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                  activeOpId === OPERATION_C3_120.id
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-950/40'
                    : 'bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-200 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <div className="text-left">
                    <div>Apply Positive Claim: C3 Rotation (120°)</div>
                    <div className="text-[10px] text-slate-400 font-normal">Axis [1, 1, 1] • Permutation (z, x, y)</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 uppercase">
                  Expected: PASS
                </span>
              </button>

              {/* Mirror Reflection Control Button */}
              <button
                onClick={() => handleRunReflection()}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                  activeOpId === OPERATION_REFLECTION_XY.id
                    ? 'bg-cyan-600/20 border-cyan-500 text-cyan-200 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-200 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                  <div className="text-left">
                    <div>Apply Mirror Reflection: Plane x = y</div>
                    <div className="text-[10px] text-slate-400 font-normal">det(Q) = -1.0 • Inverts Orientation</div>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${
                  predicate === 'PRESERVES_STRUCTURE'
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                    : 'bg-red-950/80 text-red-400 border-red-800/60'
                }`}>
                  {predicate === 'PRESERVES_STRUCTURE' ? 'Expected: PASS' : 'Expected: FAIL'}
                </span>
              </button>

              {/* Negative Control Button */}
              <button
                onClick={() => handleRunNegative()}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-mono font-bold transition-all ${
                  activeOpId === OPERATION_NEGATIVE_45.id
                    ? 'bg-red-600/20 border-red-500 text-red-200 shadow-lg shadow-red-950/40'
                    : 'bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-200 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Play className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                  <div className="text-left">
                    <div>Apply Negative Control: Rotation (45°)</div>
                    <div className="text-[10px] text-slate-400 font-normal">Same Axis [1, 1, 1] • Asymmetric Angle</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60 uppercase">
                  Expected: FAIL
                </span>
              </button>

              {evidence && (
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-400 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Scene to Canonical Base State</span>
                </button>
              )}
            </div>
          </div>

          {/* Verdict Banner & Measurement */}
          {evidence ? (
            <div className={`rounded-xl p-4 border transition-all ${
              evidence.verdict === 'VERIFIED'
                ? 'bg-emerald-950/20 border-emerald-500/60 text-emerald-200'
                : 'bg-red-950/20 border-red-500/60 text-red-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 font-mono font-bold text-sm">
                  {evidence.verdict === 'VERIFIED' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  <span>VERDICT: {evidence.verdict}</span>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40">
                  {evidence.verdict === 'VERIFIED' ? 'PASS' : 'FAIL'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-black/30 p-3 rounded-lg border border-white/5 mb-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Isometry (QᵀQ ≈ I):</span>
                  <span className={`text-sm font-bold ${evidence.is_isometric ? 'text-emerald-400' : 'text-red-400'}`}>
                    {evidence.is_isometric ? 'PRESERVED' : 'VIOLATED'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Linear Det det(Q):</span>
                  <span className={`text-sm font-bold ${evidence.determinant === 1.0 ? 'text-indigo-400' : 'text-amber-400'}`}>
                    {evidence.determinant > 0 ? `+${evidence.determinant.toFixed(4)}` : evidence.determinant.toFixed(4)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Max Delta (δ_max):</span>
                  <span className={`text-sm font-bold ${evidence.max_delta <= evidence.epsilon ? 'text-emerald-400' : 'text-red-400'}`}>
                    {evidence.max_delta.toFixed(8)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Tolerance Threshold (ε):</span>
                  <span className="text-slate-200 text-sm font-bold">
                    {evidence.epsilon}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Bijective Permutation:</span>
                  <span className="text-slate-200 font-bold">
                    {evidence.is_bijective ? 'YES (1-to-1 bijection)' : 'NO (collapsed)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Mean Delta (δ_mean):</span>
                  <span className="text-slate-200 font-bold">
                    {evidence.mean_delta.toFixed(8)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Edge Topology ({evidence.edge_count} edges):</span>
                  <span className={`text-sm font-bold ${
                    evidence.edge_topology_preserved === true
                      ? 'text-emerald-400'
                      : evidence.edge_topology_preserved === false
                      ? 'text-red-400'
                      : 'text-slate-400'
                  }`}>
                    {evidence.edge_topology_preserved === true
                      ? 'PRESERVED'
                      : evidence.edge_topology_preserved === false
                      ? 'VIOLATED'
                      : 'N/A (NO EDGES)'}
                  </span>
                </div>

                {evidence.rejection_reason && (
                  <div className="col-span-2 text-[10px] text-amber-300 bg-amber-950/30 p-2 rounded border border-amber-800/40">
                    <span className="font-bold text-amber-400">Rejection Cause:</span> {evidence.rejection_reason}
                  </div>
                )}
              </div>

              {/* Pairwise Correspondence */}
              <div className="space-y-1 font-mono text-[11px]">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1">
                  Pushforward Correspondence Q(vᵢ) ➔ v_π(i):
                </span>
                {evidence.correspondence.map(c => (
                  <div key={c.originId} className="flex items-center justify-between bg-black/20 px-2 py-1 rounded">
                    <span className="text-slate-300">Q({c.originId}) ➔ {c.targetId}</span>
                    <span className={c.delta <= evidence.epsilon ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      Δ: {c.delta.toFixed(8)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#080d1a] border border-slate-800 rounded-xl p-6 text-center text-slate-500 font-mono text-xs">
              Select an operation above to execute deterministic symmetry verification.
            </div>
          )}

          {/* Evidence JSON Drawer */}
          {evidence && (
            <div className="bg-[#080d1a] border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  3. Deterministic Evidence Artifact
                </span>
                <button
                  onClick={copyEvidenceJson}
                  className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-900 border border-slate-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono bg-black/60 p-3 rounded-lg border border-slate-800/80 text-slate-300 max-h-48 overflow-y-auto leading-relaxed custom-scrollbar">
                {JSON.stringify(evidence, null, 2)}
              </pre>
            </div>
          )}
        </section>

        {/* Right 3D Visualizer & Agent API Column (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-4 min-h-[500px]">
          {/* 3D Viewport Component */}
          <div className="flex-1 w-full min-h-[460px]">
            <TetrahedronViewport
              structure={CANONICAL_TETRAHEDRON}
              evidence={evidence}
            />
          </div>

          {/* Dual Interface Documentation (Agent Path) */}
          <div className="bg-[#080d1a] border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-bold border-b border-slate-800 pb-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>AGENT TOOL PATH (HTTP POST /api/experiment)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              AI-Agents execute the exact same experiment via Tool Call or HTTP POST with identical determinism:
            </p>
            <div className="bg-black/60 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 overflow-x-auto">
              <code>
                curl -X POST http://localhost:3000/api/experiment \<br />
                &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                &nbsp;&nbsp;-d '{JSON.stringify({ structureId: "struct_tetra_01", operationId: activeOpId || "op_rot_c3_120", epsilon: 1e-5 })}'
              </code>
            </div>
            <div className="text-[10px] text-slate-500 flex justify-between pt-1">
              <span>Core parity: 100% Shared Deterministic Engine</span>
              <span>Ground Truth: Bit-identical outputs</span>
            </div>
          </div>
        </section>
          </>
        )}
        </main>
    </div>
  );
};

export default App;
