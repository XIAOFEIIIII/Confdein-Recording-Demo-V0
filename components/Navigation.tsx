
import React, { useState } from 'react';
import { BookOpen, Activity, Square, Loader2 } from 'lucide-react';
import { AppTab } from '../types';

interface NavigationProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onRecordFinish: (transcript: string) => void;
}

// Custom Minimalist Moon SVG for the Devotional tab
const MoonIcon = ({ size = 20, strokeWidth = 1.5, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

// Custom Styled Plus
const PlusIcon = ({ size = 20, strokeWidth = 1.5 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onRecordFinish }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const navItems = [
    { id: AppTab.JOURNAL, icon: BookOpen, label: 'Today' },
    { id: AppTab.HEALTH, icon: Activity, label: 'Vitals' },
    { id: AppTab.DEVOTIONAL, icon: null, label: 'Devo' },
  ];

  const handleRecordToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      setTimeout(() => {
        const dummyTranscripts = [
          "Today I felt a bit overwhelmed with work, but then I remembered the prayer meeting last night and felt some peace.",
          "I'm praying for my sister Sarah, she's going through a hard time at her new job. God, please guide her.",
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
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-fit z-50 flex flex-col items-center gap-4">
      {/* Floating Status Label */}
      {isRecording && (
        <div className="bg-white/70 backdrop-blur-2xl text-stone-900 px-4 py-2 rounded-2xl text-[9px] font-bold uppercase tracking-widest animate-pulse shadow-sm border border-white/40">
          Listening...
        </div>
      )}

      {/* Unified Design System: Adjacent Glass Elements */}
      <div className="flex items-center gap-2">
        {/* Main Tab Bar */}
        <nav className="bg-white/60 backdrop-blur-3xl border border-white/40 rounded-full flex items-center p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.04)] h-14">
          <div className="flex items-center h-full">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center h-full px-5 rounded-full transition-all duration-500 relative ${
                    isActive ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-stone-900/5 rounded-full scale-90 -z-10 animate-in fade-in zoom-in-95 duration-300" />
                  )}
                  {item.id === AppTab.DEVOTIONAL ? (
                    <MoonIcon size={18} strokeWidth={isActive ? 2 : 1.5} />
                  ) : (
                    item.icon && <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                  )}
                  <span className={`text-[7px] font-bold uppercase tracking-[0.2em] mt-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Record Button Circle - Separate but adjacent with identical height and style */}
        <button
          onClick={handleRecordToggle}
          disabled={isProcessing}
          className={`h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 bg-white/60 backdrop-blur-3xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] ${
            isRecording 
              ? 'bg-red-500/80 text-white border-red-400/20' 
              : isProcessing 
                ? 'text-stone-300 cursor-not-allowed'
                : 'text-stone-900 hover:bg-white/80'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="animate-spin text-stone-400" size={20} />
          ) : isRecording ? (
            <Square size={18} fill="currentColor" />
          ) : (
            <PlusIcon size={24} strokeWidth={1.2} />
          )}
        </button>
      </div>
    </div>
  );
};

export default Navigation;
