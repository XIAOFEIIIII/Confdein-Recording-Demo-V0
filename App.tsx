
import React, { useState, useEffect, useCallback } from 'react';
import { AppTab, JournalEntry, PrayerRequest, Devotional } from './types';
import Navigation from './components/Navigation';
import JournalTimeline from './components/JournalTimeline';
import StressDashboard from './components/StressDashboard';
import { analyzeJournalEntry, generatePersonalizedDevotional } from './services/geminiService';
import { Search, Bell } from 'lucide-react';

const MOCK_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-1',
    timestamp: Date.now() - 3600000 * 1,
    transcript: "Just finished a quiet morning prayer. I'm feeling a deep sense of gratitude for the simple things, like the steam rising from my coffee and the light hitting the oak tree outside.",
    summary: "Morning gratitude in small moments.",
    keywords: ["gratitude", "morning", "peace"],
    mood: 'grateful'
  },
  {
    id: 'entry-2',
    timestamp: Date.now() - 3600000 * 4,
    transcript: "Work is feeling quite heavy today. The deadlines are stacking up, and I can feel my chest tightening. I need to remember to breathe and trust the process.",
    summary: "Managing work-related stress through breath.",
    keywords: ["work", "stress", "trust"],
    mood: 'heavy'
  },
  {
    id: 'entry-3',
    timestamp: Date.now() - 3600000 * 25,
    transcript: "Had a long conversation with Mark about the new mission project. I'm excited but also a bit apprehensive about the logistics. Praying for clarity.",
    summary: "Reflecting on project logistics and seeking clarity.",
    keywords: ["mission", "clarity", "future"],
    mood: 'hopeful'
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.JOURNAL);
  const [entries, setEntries] = useState<JournalEntry[]>(MOCK_ENTRIES);
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [isLoadingDevo, setIsLoadingDevo] = useState(false);

  const handleNewRecord = async (transcript: string) => {
    const newId = Math.random().toString(36).substr(2, 9);
    analyzeJournalEntry(transcript).then(analysis => {
      const newEntry: JournalEntry = {
        id: newId,
        timestamp: Date.now(),
        transcript,
        summary: analysis.summary || "Recorded a thought.",
        keywords: analysis.keywords || [],
        mood: analysis.mood as any,
      };
      setEntries(prev => [newEntry, ...prev]);
    });
  };

  const loadDevotional = useCallback(async () => {
    if (entries.length > 0) {
      setIsLoadingDevo(true);
      const devo = await generatePersonalizedDevotional(entries.slice(0, 5));
      setDevotional(devo);
      setIsLoadingDevo(false);
    }
  }, [entries]);

  useEffect(() => {
    if (activeTab === AppTab.DEVOTIONAL && !devotional) {
      loadDevotional();
    }
  }, [activeTab, devotional, loadDevotional]);

  return (
    <div className="bg-stone-50 min-h-screen selection:bg-stone-900 selection:text-white no-scrollbar">
      <div className="max-w-md mx-auto min-h-screen relative pb-44">
        {/* Main Header */}
        <header className="px-6 pt-12 pb-6 flex justify-between items-end sticky top-0 bg-stone-50/90 backdrop-blur-md z-40 transition-all">
          <div>
            <h1 className="serif text-3xl font-semibold text-stone-900 tracking-tight">Confidein</h1>
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.3em] mt-2">
              {activeTab === AppTab.JOURNAL && 'Daily Archive'}
              {activeTab === AppTab.HEALTH && 'Vitality Scan'}
              {activeTab === AppTab.DEVOTIONAL && 'Quiet Reflection'}
            </p>
          </div>
          <div className="flex gap-1 mb-1">
            <button className="p-2 text-stone-400 hover:text-stone-900 transition-colors"><Search size={20} /></button>
            <button className="p-2 text-stone-400 hover:text-stone-900 relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-stone-900 rounded-full ring-2 ring-stone-50" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="px-6 py-4">
          {activeTab === AppTab.JOURNAL && (
            <JournalTimeline entries={entries} />
          )}

          {activeTab === AppTab.HEALTH && (
            <StressDashboard />
          )}

          {activeTab === AppTab.DEVOTIONAL && (
            <div className="space-y-10 py-4">
              {isLoadingDevo ? (
                <div className="flex flex-col items-center justify-center py-24 text-stone-300">
                  <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin mb-6" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse text-stone-400 text-center">Consulting the Spirit...</p>
                </div>
              ) : devotional ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="text-center space-y-6 px-8 py-14 bg-stone-900 text-stone-50 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
                    <p className="serif text-2xl italic leading-relaxed relative z-10 px-2 font-medium">
                      "{devotional.verse}"
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-stone-500">
                      — {devotional.reference}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-300 ml-2">The Reflection</h4>
                    <div className="text-stone-700 leading-relaxed bg-white border border-stone-200/60 p-8 rounded-[2.5rem] italic text-[16px] shadow-sm">
                      {devotional.reflection}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-300 ml-2">A Simple Prayer</h4>
                    <div className="bg-white/50 p-8 rounded-[2.5rem] border border-stone-200/40">
                      <p className="text-stone-800 leading-relaxed font-medium serif italic text-[17px]">
                        {devotional.prayer}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={loadDevotional}
                    className="w-full text-stone-400 text-[10px] font-bold uppercase tracking-[0.3em] py-12 hover:text-stone-900 transition-colors"
                  >
                    Breath in a new word
                  </button>
                </div>
              ) : (
                <div className="text-center py-24 text-stone-300 italic font-light">
                  Record a moment to receive a devotional.
                </div>
              )}
            </div>
          )}
        </main>

        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onRecordFinish={handleNewRecord}
        />
      </div>
    </div>
  );
};

export default App;
