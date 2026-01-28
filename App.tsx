
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
    timestamp: Date.now() - 3600000 * 2,
    transcript: "Spent some time in the garden this morning. It's amazing how much peace a quiet moment with God can bring amidst a chaotic week. I've been worrying about the upcoming project, but I feel lighter now.",
    summary: "Found peace through morning gardening and prayer, releasing anxiety about work.",
    keywords: ["peace", "nature", "work-anxiety"],
    mood: 'peaceful'
  },
  {
    id: 'entry-2',
    timestamp: Date.now() - 3600000 * 24,
    transcript: "Feeling a bit heavy today. It's hard to stay positive when things feel like they're moving so slowly. I'm praying for patience and for a clear sign of the next steps for our family transition.",
    summary: "Struggling with slow progress and seeking divine patience and guidance for family plans.",
    keywords: ["patience", "family", "transition"],
    mood: 'heavy'
  },
  {
    id: 'entry-3',
    timestamp: Date.now() - 3600000 * 48,
    transcript: "I'm so grateful for my friend Mark. He reached out today just when I needed it. It reminded me that God often speaks through the people around us. We had a great conversation about faith.",
    summary: "Experienced a timely connection with a friend, seeing it as a spiritual affirmation.",
    keywords: ["friendship", "gratitude", "faith"],
    mood: 'grateful'
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.JOURNAL);
  const [entries, setEntries] = useState<JournalEntry[]>(MOCK_ENTRIES);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [isLoadingDevo, setIsLoadingDevo] = useState(false);

  // Initialize with some dummy prayers
  useEffect(() => {
    setPrayers([
      { id: '1', personName: 'Sarah', request: 'Healing for her knee surgery recovery', status: 'active', createdAt: Date.now() - 86400000 },
      { id: '2', personName: 'David', request: 'Guidance in career transition', status: 'active', createdAt: Date.now() - 172800000 }
    ]);
  }, []);

  const handleNewRecord = async (transcript: string) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const analysis = await analyzeJournalEntry(transcript);
    
    const newEntry: JournalEntry = {
      id: newId,
      timestamp: Date.now(),
      transcript,
      summary: analysis.summary || "Recorded a thought.",
      keywords: analysis.keywords || [],
      mood: analysis.mood as any,
    };

    setEntries(prev => [newEntry, ...prev]);

    // Check for prayer requests in analysis
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
    <div className="max-w-md mx-auto min-h-screen relative pb-20 overflow-x-hidden">
      {/* Header */}
      <header className="p-6 pb-2 flex justify-between items-center sticky top-0 bg-stone-50/80 backdrop-blur-md z-40">
        <div>
          <h1 className="serif text-2xl font-semibold text-stone-900 tracking-tight">Confidein</h1>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">
            {activeTab === AppTab.JOURNAL && 'Daily Timeline'}
            {activeTab === AppTab.HEALTH && 'Vital Spirits'}
            {activeTab === AppTab.DEVOTIONAL && 'Personal Devo'}
            {activeTab === AppTab.PRAYER && 'Intercessions'}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="p-2 text-stone-400 hover:text-stone-900"><Search size={20} /></button>
          <button className="p-2 text-stone-400 hover:text-stone-900 relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-stone-50" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-6 py-4">
        {activeTab === AppTab.JOURNAL && (
          <JournalTimeline entries={entries} />
        )}

        {activeTab === AppTab.HEALTH && (
          <StressDashboard />
        )}

        {activeTab === AppTab.DEVOTIONAL && (
          <div className="space-y-6">
            {isLoadingDevo ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin mb-4" />
                <p className="text-sm italic animate-pulse">Waiting for a word...</p>
              </div>
            ) : devotional ? (
              <div className="space-y-8 fade-in">
                <div className="text-center space-y-4 px-4 py-8 bg-stone-900 text-stone-50 rounded-3xl shadow-xl">
                  <QuoteIcon />
                  <p className="serif text-xl italic leading-relaxed">
                    "{devotional.verse}"
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                    — {devotional.reference}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400">Reflection</h4>
                  <p className="text-stone-700 leading-relaxed bg-white p-6 rounded-2xl border border-stone-100 italic">
                    {devotional.reflection}
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400">A Gentle Prayer</h4>
                  <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                    <p className="text-emerald-900 leading-relaxed font-medium serif italic">
                      {devotional.prayer}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={loadDevotional}
                  className="w-full text-stone-400 text-xs font-bold uppercase tracking-widest pt-4 hover:text-stone-900"
                >
                  Refresh for Tomorrow
                </button>
              </div>
            ) : (
              <div className="text-center py-20 text-stone-400 italic">
                Record a few journals to generate your personalized devotional.
              </div>
            )}
          </div>
        )}

        {activeTab === AppTab.PRAYER && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-stone-900 font-semibold text-lg">Active Requests</h3>
              <button className="bg-stone-900 text-white p-1 rounded-lg"><Plus size={18} /></button>
            </div>
            
            <div className="space-y-3">
              {prayers.map(prayer => (
                <div 
                  key={prayer.id} 
                  onClick={() => togglePrayer(prayer.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    prayer.status === 'answered' 
                      ? 'bg-stone-50 border-stone-100 opacity-60' 
                      : 'bg-white border-stone-100 shadow-sm hover:border-stone-300'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-900 text-white px-1.5 py-0.5 rounded">
                          {prayer.personName}
                        </span>
                        <span className="text-[10px] text-stone-400 uppercase tracking-widest">
                          {format(prayer.createdAt, 'MMM dd')}
                        </span>
                      </div>
                      <p className={`text-sm ${prayer.status === 'answered' ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                        {prayer.request}
                      </p>
                    </div>
                    {prayer.status === 'answered' && <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Ring Button */}
      <QuickRecord onFinish={handleNewRecord} />

      {/* Bottom Nav */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

const QuoteIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto text-amber-400 opacity-40">
    <path d="M11.303 9.68836C9.8355 9.68836 8.5605 10.4284 7.828 11.5309C7.3005 10.4284 6.183 9.68836 4.888 9.68836C3.0605 9.68836 1.5755 11.1734 1.5755 13.0009C1.5755 14.8284 3.0605 16.3134 4.888 16.3134C6.183 16.3134 7.3005 15.5734 7.828 14.4709C8.5605 15.5734 9.8355 16.3134 11.303 16.3134C13.1305 16.3134 14.6155 14.8284 14.6155 13.0009C14.6155 11.1734 13.1305 9.68836 11.303 9.68836ZM4.888 14.6559C3.973 14.6559 3.233 13.9159 3.233 13.0009C3.233 12.0859 3.973 11.3459 4.888 11.3459C5.803 11.3459 6.543 12.0859 6.543 13.0009C6.543 13.9159 5.803 14.6559 4.888 14.6559ZM11.303 14.6559C10.388 14.6559 9.648 13.9159 9.648 13.0009C9.648 12.0859 10.388 11.3459 11.303 11.3459C12.218 11.3459 12.958 12.0859 12.958 13.0009C12.958 13.9159 12.218 14.6559 11.303 14.6559Z" fill="currentColor"/>
    <path d="M18.112 4C15.842 4 14 5.842 14 8.112C14 10.382 15.842 12.224 18.112 12.224C20.382 12.224 22.224 10.382 22.224 8.112C22.224 5.842 20.382 4 18.112 4ZM18.112 10.5665C16.759 10.5665 15.6575 9.465 15.6575 8.112C15.6575 6.759 16.759 5.6575 18.112 5.6575C19.465 5.6575 20.5665 6.759 20.5665 8.112C20.5665 9.465 19.465 10.5665 18.112 10.5665Z" fill="currentColor"/>
  </svg>
);

export default App;
