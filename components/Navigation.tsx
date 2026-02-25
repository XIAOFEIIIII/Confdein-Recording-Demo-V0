import React, { useState, useEffect } from 'react';
import { BookOpen, Activity, Moon, Mic, Square, Loader2, X } from 'lucide-react';
import { AppTab, JournalEntry, CurrentUserId, PrayerReminderSettings } from '../types';
import { format, isToday, isYesterday, startOfDay } from 'date-fns';
import { getAvatarSrc } from '../data/userData';
import Settings from './Settings';

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
  settingsProps: {
    currentUser: CurrentUserId;
    onSwitchUser: (userId: CurrentUserId) => void;
    prayerReminderSettings: PrayerReminderSettings | null;
    onUpdatePrayerReminderSettings: (settings: PrayerReminderSettings) => void;
  };
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
  settingsProps,
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

      {/* Sidebar panel: settings-focused */}
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

        {/* ── Settings content ── */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pb-4">
          <Settings
            currentUser={settingsProps.currentUser}
            onSwitchUser={settingsProps.onSwitchUser}
            prayerReminderSettings={settingsProps.prayerReminderSettings}
            onUpdatePrayerReminderSettings={settingsProps.onUpdatePrayerReminderSettings}
          />
        </div>
      </div>

      {/* Bottom tab bar + separate record button (like previous design) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3">
        <nav className="flex items-center h-14 bg-[#f5f4ed]/95 backdrop-blur-xl rounded-full px-2 shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
          {[
            { id: AppTab.JOURNAL, icon: BookOpen, label: 'Journal' },
            { id: AppTab.HEALTH, icon: Activity, label: 'Stress' },
            { id: AppTab.DEVOTIONAL, icon: Moon, label: 'Devo' },
          ].map(item => {
            const isActive = activeTab === item.id;
            return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex flex-col items-center justify-center gap-1 px-6 h-11 rounded-full text-[11px] transition-all ${
                    isActive
                      ? 'bg-[#faf9f5] text-[#141413] shadow-[0_8px_20px_rgba(0,0,0,0.08)]'
                      : 'text-[#141413]/70 hover:text-[#141413]'
                  }`}
                >
                  <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                  <span className="leading-none">{item.label}</span>
                </button>
            );
          })}
        </nav>

        {/* Record button as separate circle */}
        <button
          onClick={handleRecordToggle}
          disabled={isProcessingAny}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-[0_18px_40px_rgba(0,0,0,0.10)] ${
            isRecordingAny
              ? 'bg-[#141413] text-[#faf9f5]'
              : isProcessingAny
                ? 'bg-[#f5f4ed] text-[#141413]/35 cursor-not-allowed'
                : 'bg-[#faf9f5] text-[#141413] hover:bg-[#f5f4ed]'
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
