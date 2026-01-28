
import React, { useState } from 'react';
import { BookOpen, Activity, Square, Loader2, Mic } from 'lucide-react';
import { AppTab } from '../types';

interface NavigationProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onRecordFinish: (transcript: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onRecordFinish }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const navItems = [
    { id: AppTab.JOURNAL, label: 'Today', color: 'bg-stone-800' },
    { id: AppTab.HEALTH, label: 'Health', color: 'bg-stone-600' },
    { id: AppTab.DEVOTIONAL, label: 'Devo', color: 'bg-stone-400' },
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
    }
  };

  return (
    <>
      {/* Vertical Index Tabs on the right edge */}
      <div className="absolute top-24 right-0 flex flex-col gap-0 z-30">
        {navItems.map((item, idx) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                relative w-10 h-24 flex items-center justify-center transition-all duration-500
                rounded-l-lg origin-right
                ${isActive 
                  ? `${item.color} text-white translate-x-[-4px] shadow-[-8px_0_15px_rgba(0,0,0,0.1)] scale-110 z-10` 
                  : 'bg-stone-100/80 text-stone-400 hover:text-stone-600 translate-x-0 z-0'
                }
              `}
              style={{ top: `${idx * 4}px` }}
            >
              <span 
                className="text-[9px] font-bold uppercase tracking-[0.3em] whitespace-nowrap -rotate-90 select-none"
              >
                {item.label}
              </span>
              {/* Tab indicator for the active one */}
              {isActive && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20" />
              )}
            </button>
          );
        })}
      </div>

      {/* Record Interaction Integrated onto Page Bottom */}
      <div className="absolute bottom-10 right-8 z-30 flex items-center gap-3">
        {isRecording && (
          <div className="bg-white/80 backdrop-blur-sm text-stone-900 px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm border border-stone-100 animate-pulse">
            Listening...
          </div>
        )}
        
        <button
          onClick={handleRecordToggle}
          disabled={isProcessing}
          className={`
            h-16 w-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl
            active:scale-90 relative
            ${isRecording 
              ? 'bg-red-500 text-white' 
              : isProcessing 
                ? 'bg-stone-100 text-stone-300' 
                : 'bg-stone-900 text-white hover:bg-black'
            }
          `}
        >
          {isProcessing ? (
            <Loader2 className="animate-spin" size={24} />
          ) : isRecording ? (
            <Square size={22} fill="currentColor" />
          ) : (
            <>
              <Mic size={24} strokeWidth={1.5} />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-stone-900 border-2 border-white rounded-full" />
            </>
          )}
        </button>
      </div>
    </>
  );
};

export default Navigation;
