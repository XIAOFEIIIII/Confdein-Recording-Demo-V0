import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const CYCLE_MS = 10000; // 4s in, 2s hold, 4s out
const PHASE_IN_END = 0.4;
const PHASE_HOLD_END = 0.5;
const PHASE_OUT_END = 0.9;

interface BreathingMeditationProps {
  onClose: () => void;
}

const BreathingMeditation: React.FC<BreathingMeditationProps> = ({ onClose }) => {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const t = ((Date.now() - start) % CYCLE_MS) / CYCLE_MS;
      setElapsed(Date.now() - start);
      if (t < PHASE_IN_END) setPhase('in');
      else if (t < PHASE_HOLD_END) setPhase('hold');
      else if (t < PHASE_OUT_END) setPhase('out');
      else setPhase('hold');
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, []);

  const phaseLabel = phase === 'in' ? 'Breathe in' : phase === 'hold' ? 'Hold' : 'Breathe out';
  const duration = Math.floor(elapsed / 1000);

  return (
    <div className="fixed inset-0 z-[200] bg-[#faf9f5] flex flex-col items-center justify-center">
      <style>{`
        @keyframes breath-cycle {
          0%   { transform: scale(0.65); opacity: 0.4; }
          40%  { transform: scale(1.2);  opacity: 0.25; }
          50%  { transform: scale(1.2);  opacity: 0.25; }
          90%  { transform: scale(0.65); opacity: 0.4; }
          100% { transform: scale(0.65); opacity: 0.4; }
        }
        .breath-circle {
          animation: breath-cycle 10s ease-in-out infinite;
        }
      `}</style>

      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 text-[#141413]/20 hover:text-[#141413]/40 transition-colors z-10"
        aria-label="Close"
      >
        <X size={18} />
      </button>

      <div className="flex flex-col items-center gap-10 px-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#141413]/50">
          Pause for a minute
        </p>

        <div className="relative flex items-center justify-center w-56 h-56">
          <div
            className="breath-circle absolute w-40 h-40 rounded-full border-2 border-[#141413]/20"
            style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.04) 0%, transparent 70%)' }}
          />
        </div>

        <p className="text-[14px] font-medium text-[#141413] tabular-nums">
          {phaseLabel}
        </p>

        <p className="text-[12px] text-[#141413]/50 tabular-nums">
          {duration}s
        </p>
      </div>
    </div>
  );
};

export default BreathingMeditation;
