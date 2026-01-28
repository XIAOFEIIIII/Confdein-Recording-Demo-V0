
import React, { useState, useEffect, useCallback } from 'react';
import { AppTab, JournalEntry, PrayerRequest, Devotional } from './types';
import Navigation from './components/Navigation';
import QuickRecord from './components/QuickRecord';
import JournalTimeline from './components/JournalTimeline';
import StressDashboard from './components/StressDashboard';
import { analyzeJournalEntry, generatePersonalizedDevotional } from './services/geminiService';
import { Search, Bell, User, CheckCircle2, Plus } from 'lucide-react';
import { format } from 'date-fns';

const MOCK_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-1',
    timestamp: Date.now() - 3600000 * 1,
    transcript: "Just finished a quiet morning prayer. I'm feeling a deep sense of gratitude for the simple things, like the steam rising from my coffee and the light hitting the oak tree outside.",
    summary: "Morning gratitude in small moments.",
    keywords: ["gratitude", "morning", "peace"],
    mood: 'peaceful'
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
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [isLoadingDevo, setIsLoadingDevo] = useState(false);

  useEffect(() => {
    setPrayers([
      { id: '1', personName: 'Sarah', request: 'Healing for her knee surgery recovery', status: 'active', createdAt: Date.now() - 86400000 },
      { id: '2', personName: 'David', request: 'Guidance in career transition', status: 'active', createdAt: Date.now() - 172800000 }
    ]);
  }, []);

  const handleNewRecord = async (transcript: string) => {
    const newId = Math.random().toString(36).substr(2, 9);
    // 异步分析
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

      if (analysis.prayerRequests && analysis.prayerRequests.length > 0) {
        const newPrayers: PrayerRequest[] = analysis.prayerRequests.map(pr => ({
          id: Math.random().toString(36).substr(2, 9),
          personName: pr.personName,
          request: pr.request,
          status: 'active',
          createdAt: Date.now()
        }));
        setPrayers(prev => [...newPrayers, ...prev]);
      }
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

  const togglePrayer = (id: string) => {
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'active' ? 'answered' : 'active' } : p));
  };

  return (
    <div className="bg-stone-50 min-h-screen">
      <div className="max-w-md mx-auto min-h-screen relative pb-24 shadow-2xl shadow-stone-200 bg-stone-50 border-x border-stone-100">
        {/* Header */}
        <header className="px-6 pt-10 pb-4 flex justify-between items-end sticky top-0 bg-stone-50/90 backdrop-blur-md z-40 border-b border-transparent transition-all">
          <div>
            <h1 className="serif text-3xl font-semibold text-stone-900 tracking-tight">Confidein</h1>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mt-2">
              {activeTab === AppTab.JOURNAL && 'Daily Timeline'}
              {activeTab === AppTab.HEALTH && 'Vital Spirits'}
              {activeTab === AppTab.DEVOTIONAL && 'Personal Devo'}
              {activeTab === AppTab.PRAYER && 'Intercessions'}
            </p>
          </div>
          <div className="flex gap-2 mb-1">
            <button className="p-2 text-stone-400 hover:text-stone-900 transition-colors"><Search size={20} /></button>
            <button className="p-2 text-stone-400 hover:text-stone-900 relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-400 rounded-full ring-2 ring-stone-50" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="px-6 py-6">
          {activeTab === AppTab.JOURNAL && (
            <JournalTimeline entries={entries} />
          )}

          {activeTab === AppTab.HEALTH && (
            <StressDashboard />
          )}

          {activeTab === AppTab.DEVOTIONAL && (
            <div className="space-y-10">
              {isLoadingDevo ? (
                <div className="flex flex-col items-center justify-center py-20 text-stone-300">
                  <div className="w-10 h-10 border-[3px] border-stone-200 border-t-stone-800 rounded-full animate-spin mb-6" />
                  <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Gathering Divine Whispers...</p>
                </div>
              ) : devotional ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="text-center space-y-6 px-8 py-12 bg-stone-900 text-stone-50 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-stone-800/50 rounded-full -mr-16 -mt-16 blur-3xl" />
                    
                    <QuoteIcon />
                    <p className="serif text-2xl italic leading-relaxed relative z-10">
                      "{devotional.verse}"
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500">
                      — {devotional.reference}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Reflection</h4>
                    <div className="text-stone-700 leading-relaxed bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-stone-100 italic text-[16px] shadow-sm">
                      {devotional.reflection}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">A Gentle Prayer</h4>
                    <div className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100 shadow-sm">
                      <p className="text-emerald-900 leading-relaxed font-medium serif italic text-[16px]">
                        {devotional.prayer}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={loadDevotional}
                    className="w-full text-stone-400 text-[10px] font-bold uppercase tracking-[0.2em] py-8 hover:text-stone-900 transition-colors"
                  >
                    Seek a new word
                  </button>
                </div>
              ) : (
                <div className="text-center py-24 text-stone-300 italic">
                  Journal your journey to receive spiritual guidance.
                </div>
              )}
            </div>
          )}

          {activeTab === AppTab.PRAYER && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="serif text-2xl font-semibold text-stone-900">Intercessions</h3>
                <button className="bg-stone-900 text-white p-2 rounded-xl shadow-lg hover:bg-stone-800 transition-all active:scale-95">
                  <Plus size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                {prayers.length > 0 ? prayers.map(prayer => (
                  <div 
                    key={prayer.id} 
                    onClick={() => togglePrayer(prayer.id)}
                    className={`p-6 rounded-[2rem] border transition-all cursor-pointer select-none ${
                      prayer.status === 'answered' 
                        ? 'bg-stone-50 border-stone-100 opacity-60' 
                        : 'bg-white border-stone-100 shadow-sm hover:border-stone-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[9px] font-bold uppercase tracking-widest bg-stone-900 text-white px-2 py-0.5 rounded-full">
                            {prayer.personName}
                          </span>
                          <span className="text-[10px] text-stone-300 font-bold uppercase tracking-widest">
                            {format(prayer.createdAt, 'MMM dd')}
                          </span>
                        </div>
                        <p className={`text-[15px] leading-relaxed ${prayer.status === 'answered' ? 'line-through text-stone-400 font-light' : 'text-stone-700 font-light'}`}>
                          {prayer.request}
                        </p>
                      </div>
                      {prayer.status === 'answered' && (
                        <div className="bg-emerald-100 rounded-full p-1 translate-y-1">
                           <CheckCircle2 className="text-emerald-600" size={18} />
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                   <div className="text-center py-24 text-stone-300 italic">
                    Add someone to your prayer list.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Floating Action Ring Button */}
        <QuickRecord onFinish={handleNewRecord} />

        {/* Navigation */}
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};

const QuoteIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto text-amber-500 opacity-30">
    <path d="M11.303 9.68836C9.8355 9.68836 8.5605 10.4284 7.828 11.5309C7.3005 10.4284 6.183 9.68836 4.888 9.68836C3.0605 9.68836 1.5755 11.1734 1.5755 13.0009C1.5755 14.8284 3.0605 16.3134 4.888 16.3134C6.183 16.3134 7.3005 15.5734 7.828 14.4709C8.5605 15.5734 9.8355 16.3134 11.303 16.3134C13.1305 16.3134 14.6155 14.8284 14.6155 13.0009C14.6155 11.1734 13.1305 9.68836 11.303 9.68836ZM4.888 14.6559C3.973 14.6559 3.233 13.9159 3.233 13.0009C3.233 12.0859 3.973 11.3459 4.888 11.3459C5.803 11.3459 6.543 12.0859 6.543 13.0009C6.543 13.9159 5.803 14.6559 4.888 14.6559ZM11.303 14.6559C10.388 14.6559 9.648 13.9159 9.648 13.0009C9.648 12.0859 10.388 11.3459 11.303 11.3459C12.218 11.3459 12.958 12.0859 12.958 13.0009C12.958 13.9159 12.218 14.6559 11.303 14.6559Z" fill="currentColor"/>
    <path d="M18.112 4C15.842 4 14 5.842 14 8.112C14 10.382 15.842 12.224 18.112 12.224C20.382 12.224 22.224 10.382 22.224 8.112C22.224 5.842 20.382 4 18.112 4ZM18.112 10.5665C16.759 10.5665 15.6575 9.465 15.6575 8.112C15.6575 6.759 16.759 5.6575 18.112 5.6575C19.465 5.6575 20.5665 6.759 20.5665 8.112C20.5665 9.465 19.465 10.5665 18.112 10.5665Z" fill="currentColor"/>
  </svg>
);

export default App;
