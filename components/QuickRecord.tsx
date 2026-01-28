
import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface QuickRecordProps {
  onFinish: (transcript: string) => void;
}

const QuickRecord: React.FC<QuickRecordProps> = ({ onFinish }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Simulation for MVP
  const handleToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      // Simulate speech-to-text delay
      setTimeout(() => {
        const dummyTranscripts = [
          "Today I felt a bit overwhelmed with work, but then I remembered the prayer meeting last night and felt some peace.",
          "I'm praying for my sister Sarah, she's going through a hard time at her new job. God, please guide her.",
          "Walking through the park this morning was beautiful. I realized I've been holding onto a lot of pride lately."
        ];
        const randomTranscript = dummyTranscripts[Math.floor(Math.random() * dummyTranscripts.length)];
        onFinish(randomTranscript);
        setIsProcessing(false);
      }, 1500);
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div className="fixed bottom-24 right-6 flex flex-col items-end gap-3 z-50">
      {isRecording && (
        <div className="bg-red-50 text-red-500 px-4 py-2 rounded-full text-xs font-semibold animate-pulse shadow-sm border border-red-100 mb-2">
          Recording from Ring...
        </div>
      )}
      <button
        onClick={handleToggle}
        disabled={isProcessing}
        className={`w-16 h-16 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95 ${
          isRecording 
            ? 'bg-red-500 text-white ring-4 ring-red-100' 
            : isProcessing 
              ? 'bg-stone-200 cursor-not-allowed'
              : 'bg-stone-900 text-white hover:bg-stone-800'
        }`}
      >
        {isProcessing ? (
          <Loader2 className="animate-spin" size={28} />
        ) : isRecording ? (
          <Square size={28} />
        ) : (
          <Mic size={28} />
        )}
      </button>
    </div>
  );
};

export default QuickRecord;
