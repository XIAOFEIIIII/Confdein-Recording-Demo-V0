import React, { useState, useEffect } from 'react';
import { BookOpen, Activity, Moon, Settings, Mic, Square, Loader2, X } from 'lucide-react';
import { AppTab, JournalEntry, CurrentUserId } from '../types';
import { format, isToday, isYesterday, startOfDay } from 'date-fns';
import { getAvatarSrc } from '../data/userData';

interface NavigationProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onRecordFinish: (transcript: string) => void;
  onStartRecording?: () => void;
  isRecordingFromApp?: boolean;
  isProcessingFromApp?: boolean;
  ringSyncState?: 'idle' | 'transmitting' | 'transcribing';
  entries: JournalEntry[];
  currentUser: CurrentUserId;
  avatarUrl?: string;
  avatarSeed: string;
  onEntrySelect?: (entry: JournalEntry) => void;
}

const USER_DISPLAY_NAMES: Record<CurrentUserId, string> = {
  erica: 'Erica',
  roman: 'Roman',
  angela: 'Angela',
};

function getEntryDateLabel(ts: number): string {
  const d = startOfDay(ts);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

function getEntryTitle(entry: JournalEntry): string {
  if (entry.summary) return entry.summary;
  return entry.transcript.slice(0, 60) + (entry.transcript.length > 60 ? '…' : '');
}

const Navigation: React.FC<NavigationProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onRecordFinish,
  onStartRecording,
  isRecordingFromApp = false,
  isProcessingFromApp = false,
  ringSyncState = 'idle',
  entries,
  currentUser,
  avatarUrl,
  avatarSeed,
  onEntrySelect,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isRecordingFromApp && isRecording) setIsRecording(false);
  }, [isRecordingFromApp, isRecording]);

  const handleRecordToggle = () => {
    onClose();
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      setTimeout(() => {
        const dummies = [
          "Today I felt a bit overwhelmed with work, but then I remembered the prayer meeting last night and felt some peace.",
          "Walking through the park this morning was beautiful. I realized I've been holding onto a lot of pride lately.",
        ];
        onRecordFinish(dummies[Math.floor(Math.random() * dummies.length)]);
        setIsProcessing(false);
      }, 1500);
    } else {
      setIsRecording(true);
      if (onStartRecording) onStartRecording();
    }
  };

  const isProcessingAny = isProcessing || isProcessingFromApp;
  const isRecordingAny  = isRecording && isRecordingFromApp;

  const isRingTransmitting = ringSyncState === 'transmitting';
  const isRingTranscribing = ringSyncState === 'transcribing';
  const showListening     = isRecordingFromApp ?? isRecording;
  const showTranscribing  = isProcessingAny && !showListening;

  const navItems = [
    { id: AppTab.JOURNAL,    icon: BookOpen, label: 'Journal' },
    { id: AppTab.HEALTH,     icon: Activity, label: 'Stress' },
    { id: AppTab.DEVOTIONAL, icon: Moon,     label: 'Devotional' },
    { id: AppTab.SETTINGS,   icon: Settings, label: 'Settings' },
  ];

  // Recents: non-prayer entries, most recent first
  const recentEntries = entries
    .filter(e => !e.isPrayerEntry)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);

  const avatarSrc = getAvatarSrc(avatarUrl, avatarSeed);
  const displayName = USER_DISPLAY_NAMES[currentUser];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[#141413]/20 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar panel */}
      <div
        className={`fixed left-0 top-0 bottom-0 z-50 w-[82%] max-w-[320px] flex flex-col bg-[#faf9f5] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-14 pb-5">
          <h1 className="text-[22px] font-semibold text-[#141413] tracking-tight">
            Confidein
          </h1>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#141413]/40 hover:text-[#141413] hover:bg-[#f5f4ed] transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Nav items ── */}
        <nav className="px-3 space-y-0.5">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] transition-colors ${
                  isActive
                    ? 'bg-[#f5f4ed] text-[#141413] font-medium'
                    : 'text-[#141413]/70 hover:bg-[#f5f4ed] hover:text-[#141413]'
                }`}
              >
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Recents ── */}
        <div className="mt-5 flex-1 min-h-0 flex flex-col">
          <span className="px-6 mb-2 text-[11px] font-medium text-[#141413]/40 uppercase tracking-wider">
            Recents
          </span>
          <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-0.5 pb-4">
            {recentEntries.map(entry => (
              <button
                key={entry.id}
                onClick={() => { onEntrySelect?.(entry); onClose(); }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#f5f4ed] transition-colors group"
              >
                <p className="text-[15px] text-[#141413] leading-snug line-clamp-1">
                  {getEntryTitle(entry)}
                </p>
                <p className="text-[11px] text-[#141413]/35 mt-0.5">
                  {getEntryDateLabel(entry.timestamp)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Bottom: user + record ── */}
        <div className="border-t border-[#1f1e1d1a] px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-8 h-8 rounded-full bg-[#f5f4ed] object-cover"
            />
            <span className="text-[14px] font-medium text-[#141413]">{displayName}</span>
          </div>

          {/* Record button */}
          <button
            onClick={handleRecordToggle}
            disabled={isProcessingAny}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-sm ${
              isRecordingAny
                ? 'bg-[#141413] text-[#faf9f5]'
                : isProcessingAny
                  ? 'bg-[#f5f4ed] text-[#141413]/35 cursor-not-allowed'
                  : 'bg-[#F26D3D] text-white hover:bg-[#e85f2e]'
            }`}
            aria-label="Record"
          >
            {isProcessingAny ? (
              <Loader2 className="animate-spin" size={20} />
            ) : isRecordingAny ? (
              <Square size={16} fill="currentColor" />
            ) : (
              <Mic size={20} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Floating status label (shown when sidebar is closed) */}
      {!isOpen && (isRingTransmitting || isRingTranscribing || showListening || showTranscribing) && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-[#f5f4ed]/80 backdrop-blur-xl text-[#141413] px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse shadow-sm">
            {isRingTransmitting ? 'Transmitting from ring…'
              : isRingTranscribing ? 'Transcribing…'
              : showListening ? 'Listening…'
              : 'Transcribing…'}
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
