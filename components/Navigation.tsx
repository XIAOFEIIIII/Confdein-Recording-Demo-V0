
import React, { useState } from 'react';
import { BookOpen, Activity, Square, Loader2, Mic, Moon } from 'lucide-react';
import { AppTab } from '../types';

interface NavigationProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onRecordFinish: (transcript: string) => void;
  onStartRecording?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onRecordFinish, onStartRecording }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const navItems = [
    { id: AppTab.JOURNAL, icon: BookOpen, label: 'Today' },
    { id: AppTab.HEALTH, icon: Activity, label: 'Stress' },
    { id: AppTab.DEVOTIONAL, icon: Moon, label: 'Devo' },
  ];

  const handleRecordToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      setTimeout(() => {
        const dummyTranscripts = [
          "Today I felt a bit overwhelmed with work, but then I remembered the prayer meeting last night and felt some peace.",
          "Walking through the park this morning was beautiful. I realized I've been holding onto a lot of pride lately."
        ];
        const randomTranscript = dummyTranscripts[Math.floor(Math.random() * dummyTranscripts.length)];
        onRecordFinish(randomTranscript);
        setIsProcessing(false);
      }, 1500);
    } else {
      setIsRecording(true);
      // Trigger immersive recording interface
      if (onStartRecording) {
        onStartRecording();
      }
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">
      {/* Floating Status Label */}
      {isRecording && (
        <div className="bg-[#f6f5f3]/70 backdrop-blur-2xl text-[#4a3a33] px-4 py-2 rounded-2xl text-[9px] font-bold uppercase tracking-widest animate-pulse shadow-sm">
          Listening...
        </div>
      )}

      {/* Glass tab bar + record button */}
      <div className="flex items-center gap-2">
        <nav className="bg-[#f6f5f3]/55 backdrop-blur-3xl rounded-full flex items-center p-1.5 shadow-[0_8px_32px_rgba(74,58,51,0.08)] h-14">
          <div className="flex items-center h-full">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center h-full px-5 rounded-full transition-all duration-500 relative ${
                    isActive ? 'text-[#4a3a33]' : 'text-[#4a3a33]/80 hover:text-[#4a3a33]'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-[#f0efed]/90 rounded-full -z-10 shadow-[0_10px_24px_rgba(74,58,51,0.10)]" />
                  )}

                  {item.icon && <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />}

                  <span className={`text-[7px] font-bold uppercase tracking-[0.2em] mt-1 transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-70'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <button
          onClick={handleRecordToggle}
          disabled={isProcessing}
          className={`h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 bg-[#f6f5f3]/55 backdrop-blur-3xl shadow-[0_8px_32px_rgba(74,58,51,0.08)] ${
            isRecording
              ? 'bg-[#4a3a33] text-[#fbfbfa]'
              : isProcessing
                ? 'text-[#4a3a33]/35 cursor-not-allowed'
                : 'text-[#4a3a33] hover:bg-[#f0efed]'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="animate-spin" size={20} />
          ) : isRecording ? (
            <Square size={18} fill="currentColor" />
          ) : (
            <>
              <Mic size={20} strokeWidth={1.5} />
              <span className="sr-only">Record</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Navigation;
