import React, { useState } from 'react';
import { InputSymmetryOperation } from '../core/operation_set_profile';
import { TwoStageMatchReport } from '../core/operation_set_match';
import { Terminal, Play, Clipboard, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const ClassifierUI: React.FC = () => {
  const [operations, setOperations] = useState<string>('');
  const [report, setReport] = useState<TwoStageMatchReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClassify = async () => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const ops = JSON.parse(operations);
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations: ops }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Classification failed');
      } else {
        setReport(data);
      }
    } catch (e) {
      setError('Invalid JSON or Network Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#080d1a] border border-slate-800 rounded-xl p-6 space-y-6 text-slate-200 font-mono">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-lg font-bold text-white uppercase tracking-tight">Symmetry Classifier</h2>
        <p className="text-xs text-slate-400">Two-stage reasoning stand: 8-setting catalog.</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase">Operation Set (JSON Array)</label>
        <textarea
          value={operations}
          onChange={(e) => setOperations(e.target.value)}
          className="w-full h-40 bg-black/40 border border-slate-700 rounded-lg p-3 text-xs font-mono focus:border-indigo-500 focus:outline-none"
          placeholder="[ { W: [[1,0,0],[0,1,0],[0,0,1]], w: [{numerator: 0, denominator: 1}, ...] } ]"
        />
        <button
          onClick={handleClassify}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
        >
          {loading ? 'Processing...' : <><Play className="w-4 h-4" /> Run Classification</>}
        </button>
      </div>

      {error && <div className="p-4 bg-red-950/30 border border-red-800 text-red-300 text-xs rounded-lg">{error}</div>}

      {report && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <span className="text-xs uppercase font-bold text-slate-400">Verdict</span>
            <span className={`text-sm font-bold ${report.verdict === 'EXACT_MATCH' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {report.verdict}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-400">
            <div className="bg-black/20 p-2 rounded border border-slate-800">
                <span className="block font-bold mb-1 text-slate-200">Filtering Candidates</span>
                <span>Retained: {report.candidateFilter.candidates.length}</span>
            </div>
            <div className="bg-black/20 p-2 rounded border border-slate-800">
                <span className="block font-bold mb-1 text-slate-200">Exact Matches</span>
                <span>Count: {report.exactMatches.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassifierUI;
