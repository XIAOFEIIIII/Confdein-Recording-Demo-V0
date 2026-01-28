
import React, { useState, useEffect, useCallback } from 'react';
import { AppTab, JournalEntry, Devotional } from './types';
import JournalTimeline from './components/JournalTimeline';
import StressDashboard from './components/StressDashboard';
import Navigation from './components/Navigation';
import { analyzeJournalEntry, generatePersonalizedDevotional } from './services/geminiService';
import { Search, Bell } from 'lucide-react';
import { subDays, startOfHour, subHours } from 'date-fns';

const now = Date.now();
const MOCK_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-1',
    timestamp: now - 1000 * 60 * 30, // 30 mins ago
    transcript: "Quiet time this morning was much needed. The sunrise was a gentle reminder that every day is a fresh start. I'm focusing on patience today, especially with the upcoming product launch. God, give me the words to speak with kindness.",
    summary: "Morning reflection on patience and fresh starts.",
    keywords: ["patience", "morning", "kindness"],
    mood: 'peaceful'
  },
  {
    id: 'entry-2',
    timestamp: now - 1000 * 60 * 60 * 3, // 3 hours ago
    transcript: "The meeting today was intense. I felt my chest tightening when the timeline was moved up. I took a deep breath and remembered that I don't have to carry this alone. 'My grace is sufficient for you.'",
    summary: "Managing work pressure with spiritual focus.",
    keywords: ["work", "stress", "grace"],
    mood: 'heavy'
  },
  {
    id: 'entry-3',
    timestamp: subHours(now, 24).getTime(), // Yesterday
    transcript: "Had a wonderful dinner with Sarah. We talked about our childhood dreams and how far we've come. It's amazing to see how the dots connect over time. Truly grateful for lifelong friendships that feel like home.",
    summary: "Dinner with Sarah and reflecting on growth.",
    keywords: ["friendship", "gratitude", "growth"],
    mood: 'grateful'
  },
  {
    id: 'entry-4',
    timestamp: subHours(now, 28).getTime(),
    transcript: "Felt quite anxious tonight. The house was too quiet and my thoughts started racing about things I can't control. I need to practice more surrender. Letting go is a muscle I'm still learning to use.",
    summary: "Nighttime anxiety and the practice of surrender.",
    keywords: ["surrender", "anxiety", "letting go"],
    mood: 'anxious'
  },
  {
    id: 'entry-5',
    timestamp: subDays(now, 2).getTime(), // 2 days ago
    transcript: "The rain outside is so soothing. I'm sitting here watching the droplets race down the window pane. It's a reminder that even the storms serve a purpose—they nourish the soil for what's coming next.",
    summary: "Reflecting on the purpose of life's storms.",
    keywords: ["nature", "growth", "peace"],
    mood: 'peaceful'
  },
  {
    id: 'entry-6',
    timestamp: subDays(now, 2).getTime() - 1000 * 60 * 60 * 5,
    transcript: "I was a bit short with my mom on the phone today. I feel bad about it now. I need to apologize and be more mindful of her feelings. Patience is easy when things go my way, hard when I'm tired.",
    summary: "Reflecting on a difficult conversation with mom.",
    keywords: ["family", "forgiveness", "patience"],
    mood: 'heavy'
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

  const getTabTitle = () => {
    switch(activeTab) {
      case AppTab.JOURNAL: return "Journal";
      case AppTab.HEALTH: return "Stress";
      case AppTab.DEVOTIONAL: return "Devo for Your Day";
      default: return "Journal";
    }
  };

  return (
    <div className="fixed inset-0 bg-[#fbfbfa] selection:bg-[#4a3a33] selection:text-[#fbfbfa] no-scrollbar overflow-hidden flex flex-col">
      {/* Subtle Binding Shadow */}
      <div className="absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-r from-stone-900/[0.04] via-stone-900/[0.01] to-transparent pointer-events-none z-30" />
      
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onRecordFinish={handleNewRecord}
      />

      {/* 
        Fixed Header: Exactly 96px (3 lines of 32px)
      */}
      <header className="h-[96px] px-10 flex justify-between items-center relative z-20 bg-[#fbfbfa] flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 -ml-2 rounded-full overflow-hidden bg-white border border-stone-100 shadow-sm flex-shrink-0 flex items-center justify-center p-0.5">
            <img 
              src="https://api.dicebear.com/7.x/notionists/svg?seed=Lulu&backgroundColor=ffffff" 
              alt="Avatar" 
              className="w-full h-full object-contain scale-125 translate-y-1"
            />
          </div>
          <div>
            <h1 className="title text-xl font-semibold text-[#4a3a33] tracking-tight leading-none">
              {getTabTitle()}
            </h1>
          </div>
        </div>
        
        <div className="flex gap-1">
          <button className="p-2 text-[#4a3a33]/35 hover:text-[#4a3a33] transition-colors"><Search size={18} /></button>
          <button className="p-2 text-[#4a3a33]/35 hover:text-[#4a3a33] relative transition-colors">
            <Bell size={18} />
            <span className="absolute top-2.5 right-2.5 w-1 h-1 bg-[#4a3a33] rounded-full ring-2 ring-[#fbfbfa]" />
          </button>
        </div>
      </header>

      {/* 
        Main Content Area: 
        - flex-1 and overflow-y-auto to enable scrolling
        - Journal tab has notebook background, other tabs have normal background
        - Journal tab uses overflow-hidden to let JournalTimeline handle scrolling
      */}
      <main 
        className={`flex-1 relative z-10 overscroll-behavior-y-contain ${
          activeTab === AppTab.JOURNAL ? 'overflow-hidden' : 'overflow-y-auto no-scrollbar bg-[#fbfbfa]'
        }`}
        style={
          activeTab === AppTab.JOURNAL
            ? {
                backgroundImage: `
                  linear-gradient(90deg, transparent 32px, #d8b9b0 32px, #d8b9b0 33px, transparent 33px),
                  repeating-linear-gradient(#fbfbfa, #fbfbfa 31px, #e9e8e6 31px, #e9e8e6 32px)
                `,
                backgroundSize: '100% 100%, 100% 32px',
                backgroundAttachment: 'local',
                backgroundPosition: '0 0'
              }
            : {}
        }
      >
        {activeTab === AppTab.JOURNAL ? (
          <JournalTimeline entries={entries} />
        ) : (
          <div className="px-10 pt-[32px] pb-32 text-[#4a3a33]">
            {activeTab === AppTab.HEALTH && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl">
                <StressDashboard />
              </div>
            )}

            {activeTab === AppTab.DEVOTIONAL && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl">
                {isLoadingDevo ? (
                  <div className="flex flex-col items-center justify-center py-24 text-[#4a3a33]/40">
                    <div className="w-6 h-6 border-2 border-[#e7ded4] border-t-[#4a3a33] rounded-full animate-spin mb-6" />
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] animate-pulse">Consulting the Spirit...</p>
                  </div>
                ) : devotional ? (
                  <div className="space-y-12 py-8">
                    <div className="text-left space-y-6">
                      <p className="melrose-text text-[#4a3a33]">
                        "{devotional.verse}"
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#4a3a33]/45">
                        — {devotional.reference}
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#4a3a33]/35">The Reflection</h4>
                      <p className="melrose-text text-[#4a3a33]">
                        {devotional.reflection}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#4a3a33]/35">A Simple Prayer</h4>
                      <p className="melrose-text text-[#4a3a33]">
                        {devotional.prayer}
                      </p>
                    </div>

                    <button 
                      onClick={loadDevotional}
                      className="w-full text-[#4a3a33]/45 text-[9px] font-bold uppercase tracking-[0.3em] py-12 hover:text-[#4a3a33] transition-colors border-t border-[#e7ded4]"
                    >
                      Seek a fresh word
                    </button>
                  </div>
                ) : (
                  <div className="text-left py-24 text-[#4a3a33]/40 italic font-light text-xl">
                    Record your thoughts to receive a blessing.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
