
import React, { useMemo } from 'react';
import { SpaceGroup, CrystalSystem, SynthesisProtocol } from '../types';

interface LatticeVisualizerProps {
  group: SpaceGroup;
  protocol: SynthesisProtocol;
}

const LatticeVisualizer: React.FC<LatticeVisualizerProps> = ({ group, protocol }) => {
  const isHarmonic = protocol === 'HARMONIC_RESONANCE';
  const isUSP = protocol === 'USP_VERIFICATION';

  const points = useMemo(() => {
    const p = [];
    const step = 50;
    const offset = 20;

    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        for (let z = 0; z < 2; z++) {
          let px = x * step + offset;
          let py = y * step + offset;
          
          if (group.crystalSystem === CrystalSystem.Monoclinic) px += y * 15;
          if (group.crystalSystem === CrystalSystem.Trigonal) px += (y % 2) * (step / 2);

          p.push({ x: px, y: py, z, id: `${x}-${y}-${z}` });
        }
      }
    }
    return p;
  }, [group]);

  return (
    <div className={`w-full aspect-square bg-[#030712] rounded-[2.5rem] border-2 transition-all duration-1000 overflow-hidden relative shadow-2xl ${
      isHarmonic ? 'border-indigo-500/40' : isUSP ? 'border-fuchsia-500/40' : 'border-teal-500/30'
    }`}>
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-20" 
           style={{ backgroundImage: `radial-gradient(circle, ${isHarmonic ? '#6366f1' : '#5eead4'} 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
      
      {isHarmonic && (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="w-[150%] h-[150%] animate-[spin_20s_linear_infinite] opacity-10"
               style={{ background: 'conic-gradient(from 0deg, transparent, #6366f1, transparent, #6366f1, transparent)' }} />
        </div>
      )}

      <svg viewBox="0 0 240 240" className="w-full h-full relative z-10 p-4">
        <defs>
          <filter id="glow-point">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        {/* Harmonic Connection Lines */}
        {points.map((p, i) => (
          points.slice(i + 1).map((p2, j) => {
            const dist = Math.sqrt(Math.pow(p.x - p2.x, 2) + Math.pow(p.y - p2.y, 2));
            if (dist > 0 && dist < 60) {
              return (
                <line 
                  key={`l-${p.id}-${p2.id}`} 
                  x1={p.x} y1={p.y} x2={p2.x} y2={p2.y} 
                  stroke={isHarmonic ? "rgba(99, 102, 241, 0.4)" : isUSP ? "rgba(217, 70, 239, 0.3)" : "rgba(94, 234, 212, 0.2)"} 
                  strokeWidth={isHarmonic ? "1.5" : "0.5"}
                  className={`${isHarmonic ? 'animate-pulse' : ''} transition-all duration-1000`}
                />
              );
            }
            return null;
          })
        ))}

        {/* Nodes */}
        {points.map((p) => (
          <g key={p.id}>
            {isHarmonic && (
              <circle cx={p.x} cy={p.y} r="8" fill="none" stroke="#6366f1" strokeWidth="0.5" className="animate-ping opacity-20" />
            )}
            <circle 
              cx={p.x} cy={p.y} 
              r={p.z === 0 ? 4 : 2.5} 
              fill={isHarmonic ? "#818cf8" : isUSP ? "#f5d0fe" : "#5eead4"}
              filter="url(#glow-point)"
              className="transition-all duration-1000"
            />
          </g>
        ))}
      </svg>

      <div className="absolute bottom-6 left-6 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isHarmonic ? 'bg-indigo-500' : isUSP ? 'bg-fuchsia-500' : 'bg-teal-500'}`} />
          <span className="text-[9px] uppercase tracking-[0.3em] font-black text-white/50">
            {protocol.replace('_', ' ')}
          </span>
        </div>
        {isHarmonic && <span className="text-[8px] text-indigo-400/60 font-mono">RESONANCE DELTA: λ-4.2Hz</span>}
      </div>
    </div>
  );
};

export default LatticeVisualizer;
