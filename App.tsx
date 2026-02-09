import React, { useState, useEffect, useCallback } from 'react';
import { AppTab, JournalEntry, Devotional, PrayerRequest, CurrentUserId } from './types';
import JournalTimeline from './components/JournalTimeline';
import WeekTimeline from './components/WeekTimeline';
import StressDashboard from './components/StressDashboard';
import Navigation from './components/Navigation';
import JournalSideTabs, { JournalSubTab } from './components/JournalSideTabs';
import ImmersiveRecording from './components/ImmersiveRecording';
import BreathingMeditation from './components/BreathingMeditation';
import ImmersiveReader from './components/ImmersiveReader';
import EntryEditor from './components/EntryEditor';
import DevotionalSection from './components/DevotionalSection';
import Settings from './components/Settings';
import { getStoredUserId, setStoredUserId, getInitialDataForUser, getAvatarSrc, getDevotionalForUserAndDate } from './data/userData';
import { analyzeJournalEntry, generatePersonalizedDevotional } from './services/geminiService';
import { Search, Settings as SettingsIcon, Plus, Trash2, ChevronRight } from 'lucide-react';
import { subDays, subHours, format, startOfWeek, addDays, startOfDay, isToday } from 'date-fns';

const now = Date.now();
const FALLBACK_VERSES: Array<{ verse: string; reference: string }> = [
  { verse: 'The Lord is my shepherd; I shall not want.', reference: 'Psalm 23:1' },
  { verse: 'Come to me, all who labor and are heavy laden, and I will give you rest.', reference: 'Matthew 11:28' },
  { verse: 'Be still, and know that I am God.', reference: 'Psalm 46:10' },
];

function getInitialState() {
  const userId = getStoredUserId();
  const data = getInitialDataForUser(userId);
  return {
    currentUser: userId,
    entries: data.entries,
    devotional: data.devotional,
    verseList: data.verses.slice(0, 6),
    versePool: data.verses,
    avatarSeed: data.avatarSeed,
    avatarUrl: data.avatarUrl,
  };
}

const App: React.FC = () => {
  const [initial] = useState(getInitialState);
  const [currentUser, setCurrentUser] = useState<CurrentUserId>(initial.currentUser);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.JOURNAL);
  const [journalSubTab, setJournalSubTab] = useState<JournalSubTab>('journal');
  const [entries, setEntries] = useState<JournalEntry[]>(initial.entries);
  const [devotional, setDevotional] = useState<Devotional | null>(initial.devotional);
  const [avatarSeed, setAvatarSeed] = useState<string>(initial.avatarSeed);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initial.avatarUrl);
  const [isLoadingDevo, setIsLoadingDevo] = useState(false);
  const [verseList, setVerseList] = useState<Array<{ verse: string; reference: string }>>(initial.verseList);
  const [versePool, setVersePool] = useState<Array<{ verse: string; reference: string }>>(initial.versePool);
  const [userPrayerRequests, setUserPrayerRequests] = useState<PrayerRequest[]>([]);

  // Week timeline: which week is selected (Sunday date); can change by horizontal swipe
  const [selectedWeekStart, setSelectedWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const getTodayWeekIndex = (weekStart: Date) => {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      if (format(addDays(weekStart, i), 'yyyy-MM-dd') === format(startOfDay(today), 'yyyy-MM-dd')) return i;
    }
    return 0;
  };
  const [selectedDayIndex, setSelectedDayIndex] = useState(() =>
    getTodayWeekIndex(startOfWeek(new Date(), { weekStartsOn: 0 }))
  );

  // All dates that have at least one journal entry (for week timeline dots in any week)
  const datesWithEntries = React.useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => set.add(format(startOfDay(e.timestamp), 'yyyy-MM-dd')));
    return set;
  }, [entries]);

  // Load user-specific data when currentUser changes (e.g. after switching in Settings)
  useEffect(() => {
    const data = getInitialDataForUser(currentUser);
    setEntries(data.entries);
    setDevotional(data.devotional);
    setVerseList(data.verses.slice(0, 6));
    setVersePool(data.verses);
    setAvatarSeed(data.avatarSeed);
    setAvatarUrl(data.avatarUrl);
    setUserPrayerRequests([]);
    // Default week to the one that contains the most recent entry, so notes are visible (e.g. Roman's Jan/Feb 2025)
    if (data.entries.length > 0) {
      const latest = data.entries.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
      setSelectedWeekStart(startOfWeek(new Date(latest.timestamp), { weekStartsOn: 0 }));
    } else {
      setSelectedWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
    }
  }, [currentUser]);

  const handleSwitchUser = (userId: CurrentUserId) => {
    setStoredUserId(userId);
    setCurrentUser(userId);
  };
  const [showImmersiveRecording, setShowImmersiveRecording] = useState(false);
  const [isProcessingRecording, setIsProcessingRecording] = useState(false);
  const [showMeditation, setShowMeditation] = useState(false);
  const [showReader, setShowReader] = useState<'reflection' | 'prayer' | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [newPrayerName, setNewPrayerName] = useState('');
  const [newPrayerRequest, setNewPrayerRequest] = useState('');

  const handleNewRecord = async (transcript: string) => {
    const newId = Math.random().toString(36).substr(2, 9);
    setIsProcessingRecording(true);
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
      setIsProcessingRecording(false);
      setShowImmersiveRecording(false);
    });
  };

  const handleStopRecording = () => {
    setShowImmersiveRecording(false);
    // Simulate processing and generate transcript
    setTimeout(() => {
      const dummyTranscripts = [
        "Today I felt a bit overwhelmed with work, but then I remembered the prayer meeting last night and felt some peace.",
        "Walking through the park this morning was beautiful. I realized I've been holding onto a lot of pride lately.",
        "I'm praying for my sister Sarah, she's going through a hard time at her new job. God, please guide her.",
        "The sunset tonight reminded me that even endings can be beautiful. I'm learning to trust the process more."
      ];
      const randomTranscript = dummyTranscripts[Math.floor(Math.random() * dummyTranscripts.length)];
      handleNewRecord(randomTranscript);
    }, 500);
  };

  const handleCancelRecording = () => {
    setShowImmersiveRecording(false);
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

  // Note: Verse sub-tab uses a local verse list (no refresh button).

  // When we get a new devotional, prepend its verse into the verse list (dedup by reference+verse)
  useEffect(() => {
    if (!devotional) return;
    const next = { verse: devotional.verse, reference: devotional.reference };
    setVerseList((prev) => {
      const key = `${next.reference}::${next.verse}`;
      const seen = new Set(prev.map((v) => `${v.reference}::${v.verse}`));
      if (seen.has(key)) return prev;
      return [next, ...prev].slice(0, 6);
    });
  }, [devotional]);

  const allPrayerRequestsFromEntries: PrayerRequest[] = entries
    .flatMap((e) => e.prayerRequests ?? [])
    .map((pr, idx) => ({
      ...pr,
      id: pr.id || `pr-${idx}`,
    }));
  const displayedPrayerRequests: PrayerRequest[] = [...userPrayerRequests, ...allPrayerRequestsFromEntries];

  const removePrayerRequest = (pr: PrayerRequest) => {
    if (pr.id.startsWith('pr-user-')) {
      setUserPrayerRequests((prev) => prev.filter((p) => p.id !== pr.id));
    } else {
      setEntries((prev) =>
        prev.map((entry) => ({
          ...entry,
          prayerRequests: (entry.prayerRequests ?? []).filter((p) => p.id !== pr.id),
        }))
      );
    }
  };

  const handleEntryClick = (entry: JournalEntry) => {
    setEditingEntry(entry);
  };

  const handleEntrySave = (updatedEntry: JournalEntry) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry))
    );
  };

  const addPrayerRequest = () => {
    const name = newPrayerName.trim();
    const request = newPrayerRequest.trim();
    if (!name || !request) return;
    setUserPrayerRequests((prev) => [
      ...prev,
      {
        id: `pr-user-${Date.now()}`,
        personName: name,
        request,
        status: 'active',
        createdAt: Date.now(),
      },
    ]);
    setNewPrayerName('');
    setNewPrayerRequest('');
  };

  const selectedDate = addDays(selectedWeekStart, selectedDayIndex);
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const displayedDevotional = getDevotionalForUserAndDate(currentUser, selectedDateStr) ?? devotional;

  const getHeaderDateLabel = () => {
    const today = startOfDay(new Date());
    const sel = startOfDay(selectedDate);
    if (isToday(selectedDate)) return 'Today';
    if (format(sel, 'yyyy-MM-dd') === format(addDays(today, -1), 'yyyy-MM-dd')) return 'Yesterday';
    if (format(sel, 'yyyy-MM-dd') === format(addDays(today, 1), 'yyyy-MM-dd')) return 'Tomorrow';
    return format(selectedDate, 'MMMM d');
  };

  return (
    <div className="fixed inset-0 bg-[#fbfbfa] selection:bg-[#4a3a33] selection:text-[#fbfbfa] no-scrollbar overflow-hidden flex flex-col">
      {/* Subtle Binding Shadow */}
      <div className="absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-r from-stone-900/[0.04] via-stone-900/[0.01] to-transparent pointer-events-none z-30" />
      
      {!showMeditation && !showReader && !editingEntry && (
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onRecordFinish={handleNewRecord}
          onStartRecording={() => setShowImmersiveRecording(true)}
        />
      )}

      {/* 
        Fixed Header: Exactly 96px (3 lines of 32px)
      */}
      {!showMeditation && !showReader && !editingEntry && (
      <header className="h-14 px-10 flex justify-between items-center relative z-20 bg-[#fbfbfa] flex-shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab(AppTab.SETTINGS)}
          className="p-2 -ml-2 text-[#4a3a33]/35 hover:text-[#4a3a33] transition-colors"
          aria-label="Settings"
        >
          <SettingsIcon size={18} />
        </button>
        <h1 className="title text-xl font-semibold text-[#4a3a33] tracking-tight leading-none absolute left-1/2 -translate-x-1/2">
          {getHeaderDateLabel()}
        </h1>
        <button className="p-2 text-[#4a3a33]/35 hover:text-[#4a3a33] transition-colors" aria-label="Search">
          <Search size={18} />
        </button>
      </header>
      )}

      {/* Week timeline: spans Journal, Stress, Devo (not Settings) */}
      {!showMeditation && !showReader && !editingEntry &&
        (activeTab === AppTab.JOURNAL || activeTab === AppTab.HEALTH || activeTab === AppTab.DEVOTIONAL) && (
          <WeekTimeline
            selectedWeekStart={selectedWeekStart}
            selectedDayIndex={selectedDayIndex}
            datesWithEntries={datesWithEntries}
            onWeekChange={setSelectedWeekStart}
            onDayClick={setSelectedDayIndex}
          />
      )}

      {/* 
        Main Content Area: 
        - flex-1 and overflow-y-auto to enable scrolling
        - Journal tab has notebook background, other tabs have normal background
        - Journal tab uses overflow-hidden to let JournalTimeline handle scrolling
      */}
      <main 
        className={`flex-1 relative z-10 overscroll-behavior-y-contain ${
          activeTab === AppTab.JOURNAL && journalSubTab === 'journal'
            ? 'overflow-hidden'
            : 'overflow-y-auto no-scrollbar bg-[#fbfbfa]'
        }`}
        style={
          activeTab === AppTab.JOURNAL && journalSubTab !== 'journal'
            ? {
                backgroundImage: `
                  linear-gradient(90deg, transparent 32px, #d8b9b0 32px, #d8b9b0 33px, transparent 33px),
                  repeating-linear-gradient(#fbfbfa, #fbfbfa 31px, #e9e8e6 31px, #e9e8e6 32px)
                `,
                backgroundSize: '100% 100%, 100% 32px',
                backgroundAttachment: 'local',
                backgroundPosition: '0 0'
              }
            : activeTab === AppTab.JOURNAL && journalSubTab === 'journal'
            ? { backgroundColor: '#fbfbfa' }
            : {}
        }
      >
        {activeTab === AppTab.JOURNAL ? (
          <div className={`relative w-full h-full flex flex-col ${currentUser === 'roman' ? 'handwriting-roman' : ''}`}>
            <JournalSideTabs value={journalSubTab} onChange={setJournalSubTab} />

            {journalSubTab === 'journal' && (
              <div className="flex-1 min-h-0">
                <JournalTimeline
                  entries={entries}
                  weekStart={selectedWeekStart}
                  onEntryClick={handleEntryClick}
                  scrollToDayIndex={selectedDayIndex}
                  onPageChange={setSelectedDayIndex}
                  useRomanFont={currentUser === 'roman'}
                />
              </div>
            )}

            {journalSubTab === 'prayer' && (
              <div className="px-10 pt-[32px] pb-44 text-[#4a3a33] max-w-2xl">
                {/* Row 1: Add request label + button — exactly 32px */}
                <div
                  className="flex items-center justify-between gap-4"
                  style={{ height: '32px', lineHeight: '32px', margin: 0, padding: 0 }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#4a3a33]/45" style={{ lineHeight: '32px' }}>
                    Add request
                  </span>
                  <button
                    type="button"
                    onClick={addPrayerRequest}
                    disabled={!newPrayerName.trim() || !newPrayerRequest.trim()}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4a3a33]/70 hover:text-[#4a3a33] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    style={{ lineHeight: '32px' }}
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
                {/* Row 2: Name input — exactly 32px */}
                <input
                  type="text"
                  placeholder="Name"
                  value={newPrayerName}
                  onChange={(e) => setNewPrayerName(e.target.value)}
                  className="w-full bg-transparent border-b border-[#e3e1dc] text-[15px] handwriting text-[#4a3a33] placeholder:text-[#4a3a33]/35 focus:outline-none focus:border-[#4a3a33]/40 block"
                  style={{ height: '32px', lineHeight: '32px', margin: 0, padding: 0 }}
                />
                {/* Rows 3–4: Prayer request textarea — 64px (2 grid lines) */}
                <textarea
                  placeholder="Prayer request…"
                  value={newPrayerRequest}
                  onChange={(e) => setNewPrayerRequest(e.target.value)}
                  rows={2}
                  className="w-full bg-transparent border-b border-[#e3e1dc] text-[15px] handwriting text-[#4a3a33] placeholder:text-[#4a3a33]/35 focus:outline-none focus:border-[#4a3a33]/40 resize-none block"
                  style={{ minHeight: '64px', lineHeight: '32px', margin: 0, padding: 0 }}
                />
                {/* Spacer — 32px */}
                <div style={{ height: '32px' }} />

                {displayedPrayerRequests.length === 0 ? (
                  <p
                    className="handwriting text-[#4a3a33]/45 text-[15px]"
                    style={{ lineHeight: '32px', margin: 0, padding: 0, minHeight: '32px' }}
                  >
                    No prayer requests yet. Add one above or record a journal entry that includes a prayer request.
                  </p>
                ) : (
                  <div>
                    {displayedPrayerRequests.map((pr) => (
                      <div
                        key={pr.id}
                        className="group flex items-start gap-3"
                        style={{ marginBottom: '32px' }}
                      >
                        <div className="flex-1 min-w-0">
                          {/* Person name — exactly 32px row */}
                          <p
                            className="handwriting text-[13px] text-[#4a3a33]/45"
                            style={{ height: '32px', lineHeight: '32px', margin: 0, padding: 0, display: 'block' }}
                          >
                            {pr.personName}
                          </p>
                          {/* Request — 32px line height, aligns to grid */}
                          <p
                            className="handwriting text-[#4a3a33] text-[15px] opacity-90"
                            style={{ lineHeight: '32px', margin: 0, padding: 0, display: 'block', minHeight: '32px' }}
                          >
                            {pr.request}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePrayerRequest(pr)}
                          className="flex-shrink-0 p-2 text-[#4a3a33]/35 hover:text-[#4a3a33] hover:bg-[#4a3a33]/5 rounded-full transition-colors opacity-50 group-hover:opacity-100 mt-0"
                          style={{ marginTop: 0 }}
                          aria-label="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {journalSubTab === 'verse' && (
              <div className="px-10 pt-[32px] pb-44 text-[#4a3a33] max-w-2xl">
                <div className="flex items-center justify-between" style={{ height: '32px', marginBottom: '32px' }}>
                  <button
                    onClick={() => {
                      setVerseList((prev) => {
                        if (versePool.length === 0) return prev;
                        const next = versePool[Math.floor(Math.random() * versePool.length)];
                        const key = `${next.reference}::${next.verse}`;
                        const seen = new Set(prev.map((v) => `${v.reference}::${v.verse}`));
                        if (seen.has(key)) return prev;
                        return [next, ...prev].slice(0, 6);
                      });
                    }}
                    className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#4a3a33]/70 hover:text-[#4a3a33] transition-colors"
                  >
                    Add verse
                  </button>
                </div>

                <div>
                  {verseList.map((v, i) => (
                    <div key={`${v.reference}-${i}`} className="block" style={{ marginBottom: '32px' }}>
                      <p
                        className="handwriting text-[#4a3a33] text-[15px] opacity-90"
                        style={{ lineHeight: '32px', margin: 0, padding: 0, display: 'block', minHeight: '32px' }}
                      >
                        "{v.verse}"
                      </p>
                      <p
                        className="handwriting text-[#4a3a33]/45 text-[13px]"
                        style={{ lineHeight: '32px', margin: 0, padding: 0, display: 'block', minHeight: '32px' }}
                      >
                        — {v.reference}
                      </p>
                      <div style={{ height: '32px' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-10 pt-[32px] pb-32 text-[#4a3a33]">
            {activeTab === AppTab.HEALTH && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl" key={selectedDateStr}>
                <StressDashboard selectedDateKey={selectedDateStr} onStartMeditation={() => setShowMeditation(true)} />
              </div>
            )}

            {activeTab === AppTab.SETTINGS && (
              <Settings currentUser={currentUser} onSwitchUser={handleSwitchUser} />
            )}

            {activeTab === AppTab.DEVOTIONAL && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl">
                {isLoadingDevo ? (
                  <div className="flex flex-col items-center justify-center py-24 text-[#4a3a33]/40">
                    <div className="w-6 h-6 border-2 border-[#e7ded4] border-t-[#4a3a33] rounded-full animate-spin mb-6" />
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] animate-pulse">Consulting the Spirit...</p>
                  </div>
                ) : displayedDevotional ? (
                  <div className="py-6 flex flex-col gap-5">
                    <div className="text-left space-y-4">
                      <p className="melrose-text text-[#4a3a33]">
                        "{displayedDevotional.verse}"
                      </p>
                      <p className="text-[14px] font-bold uppercase tracking-[0.4em] text-[#4a3a33]/45">
                        — {displayedDevotional.reference}
                      </p>
                    </div>

                    {displayedDevotional.quote && (
                      <div className="bg-[#f6f5f3]/50 rounded-2xl p-6 shadow-sm">
                        <p className="melrose-text text-[#4a3a33] italic">
                          "{displayedDevotional.quote}"
                        </p>
                      </div>
                    )}
                    
                    {displayedDevotional.sections && displayedDevotional.sections.length > 0 ? (
                      <div className="flex flex-col gap-5">
                        {displayedDevotional.sections.map((section, idx) => (
                          <DevotionalSection
                            key={idx}
                            title={section.title}
                            content={section.content}
                            defaultExpanded={idx === 0}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5">
                        {displayedDevotional.reflection && (
                          <button
                            type="button"
                            onClick={() => setShowReader('reflection')}
                            className="w-full text-left bg-[#f6f5f3]/50 hover:bg-[#f6f5f3]/70 rounded-2xl p-6 shadow-sm transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-[14px] font-bold uppercase tracking-widest text-[#4a3a33]">
                                The Reflection
                              </h4>
                              <ChevronRight size={18} className="text-[#4a3a33]/40 group-hover:text-[#4a3a33] group-hover:translate-x-1 transition-all" />
                            </div>
                            <p className="melrose-text text-[#4a3a33]/60 mt-3 line-clamp-2">
                              {displayedDevotional.reflection.split('\n\n')[0]}
                            </p>
                          </button>
                        )}

                        {displayedDevotional.prayer && (
                          <button
                            type="button"
                            onClick={() => setShowReader('prayer')}
                            className="w-full text-left bg-[#f6f5f3]/50 hover:bg-[#f6f5f3]/70 rounded-2xl p-6 shadow-sm transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-[14px] font-bold uppercase tracking-widest text-[#4a3a33]">
                                A Simple Prayer
                              </h4>
                              <ChevronRight size={18} className="text-[#4a3a33]/40 group-hover:text-[#4a3a33] group-hover:translate-x-1 transition-all" />
                            </div>
                            <p className="melrose-text text-[#4a3a33]/60 mt-3 line-clamp-2">
                              {displayedDevotional.prayer.split('\n\n')[0]}
                            </p>
                          </button>
                        )}
                      </div>
                    )}
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

      {/* Immersive Recording Interface */}
      {showImmersiveRecording && (
        <ImmersiveRecording
          onStop={handleStopRecording}
          onCancel={handleCancelRecording}
        />
      )}
      {showMeditation && (
        <BreathingMeditation onClose={() => setShowMeditation(false)} />
      )}
      {showReader === 'reflection' && displayedDevotional?.reflection && (
        <ImmersiveReader
          title="The Reflection"
          content={displayedDevotional.reflection}
          onClose={() => setShowReader(null)}
        />
      )}
      {showReader === 'prayer' && displayedDevotional?.prayer && (
        <ImmersiveReader
          title="A Simple Prayer"
          content={displayedDevotional.prayer}
          onClose={() => setShowReader(null)}
        />
      )}
      {editingEntry && (
        <EntryEditor
          entry={editingEntry}
          onSave={handleEntrySave}
          onClose={() => setEditingEntry(null)}
          usePatrickHand={currentUser === 'roman'}
        />
      )}
    </div>
  );
};

export default App;
