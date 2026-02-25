
import React, { useState, useEffect } from 'react';
import { Square, X } from 'lucide-react';

interface ImmersiveRecordingProps {
  onStop: () => void;
  onCancel: () => void;
}

const ImmersiveRecording: React.FC<ImmersiveRecordingProps> = ({ onStop, onCancel }) => {
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#faf9f5] flex flex-col items-center justify-center">
      <style>{`
        @keyframes gentle-pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.25); }
        }
        .pulse-circle {
          animation: gentle-pulse 2s ease-in-out infinite;
        }
      `}</style>
      {/* Close button */}
      <button
        onClick={onCancel}
        className="absolute top-6 right-6 p-2 text-[#141413]/50 hover:text-[#141413] transition-colors"
      >
        <X size={18} />
      </button>

      {/* Main content */}
      <div className="flex flex-col items-center gap-8 px-10">
        {/* Recording indicator */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {/* Pulsing circle */}
            <div className="absolute inset-0 rounded-full bg-[#141413] pulse-circle" />
            <div className="relative w-24 h-24 rounded-full bg-[#141413]/20 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-[#141413]/40" />
            </div>
          </div>

          {/* Recording text */}
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#141413]/60 mb-2">
              Recording
            </p>
            <p className="text-[16px] font-light text-[#141413] tabular-nums">
              {formatTime(recordingTime)}
            </p>
          </div>
        </div>

        {/* Stop button */}
        <button
          onClick={onStop}
          className="px-8 py-3 bg-[#f5f4ed]/55 backdrop-blur-3xl text-[#141413] rounded-full text-[16px] font-bold uppercase tracking-[0.2em] hover:bg-[#ffffff]/70 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
        >
          Stop Recording
        </button>
      </div>
    </div>
  );
};

export default ImmersiveRecording;
