
import React, { useState, useEffect, useCallback } from 'react';
import { AppTab, JournalEntry, Devotional, PrayerRequest } from './types';
import JournalTimeline from './components/JournalTimeline';
import StressDashboard from './components/StressDashboard';
import Navigation from './components/Navigation';
import JournalSideTabs, { JournalSubTab } from './components/JournalSideTabs';
import ImmersiveRecording from './components/ImmersiveRecording';
import BreathingMeditation from './components/BreathingMeditation';
import ImmersiveReader from './components/ImmersiveReader';
import DevotionalSection from './components/DevotionalSection';
import { analyzeJournalEntry, generatePersonalizedDevotional } from './services/geminiService';
import { Search, Bell, Plus, Trash2, ChevronRight } from 'lucide-react';
import { subDays, startOfHour, subHours } from 'date-fns';

const now = Date.now();
const MOCK_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-1',
    timestamp: now - 1000 * 60 * 30,
    transcript: "Jesus and sexual purity\n\nJesus took the issue of sexual purity further when he said that anyone who even looks at a woman with lust has already committed adultery in his heart. Similarly, we should avoid entertaining or fantasizing about what God has forbidden.\n\nLove fulfills the requirements of the commandments.",
    summary: "Jesus on purity and love fulfilling the law.",
    keywords: ["purity", "lust", "love", "commandments"],
    mood: 'peaceful',
    scripture: 'Lev 18:5, 20',
  },
  {
    id: 'entry-2',
    timestamp: now - 1000 * 60 * 60 * 3,
    transcript: "Respect for the elderly\n\nPeople often find it easy to dismiss the opinions of the elderly and avoid taking time to visit with them. But the fact that God commanded the Israelites to show respect for the elderly shows how seriously we should take the responsibility of respecting those older than we are. Their wisdom gained from experience can save us from many pitfalls.",
    summary: "Honoring the elderly and valuing their wisdom.",
    keywords: ["elderly", "respect", "wisdom", "honor"],
    mood: 'hopeful',
    scripture: 'Lev 19:32',
    prayerRequests: [
      {
        id: 'pr-1',
        personName: 'Grandma',
        request: 'Help me visit and honor my elders with patience and listen to their wisdom.',
        status: 'active',
        createdAt: now - 1000 * 60 * 60 * 2,
      },
    ],
  },
  {
    id: 'entry-3',
    timestamp: subHours(now, 24).getTime(),
    transcript: "Child sacrifice\n\nSacrificing children to the gods was a common practice in ancient religions. The Ammonites, Israel's neighbors, made child sacrifices to Molech (their national god) as part of their religion. They and other surrounding pagan nations saw their children as the greatest gift they could offer to ward off evil or appease angry gods. God made it clear that this practice was detestable and strictly forbidden. In Old Testament times, just as today, His character made human sacrifice unthinkable.\n\nUnlike the pagan gods, He is a God of love, who does not need to be appeased.\nHe is a God of life, who prohibits murder and encourages practices that lead to health and happiness.\nHe is a God of the helpless, who shows special concern for children.\nHe is a God of unselfishness, who, instead of demanding human sacrifices, sacrificed Himself for us.",
    summary: "God's character versus pagan sacrifice; His care for the helpless.",
    keywords: ["sacrifice", "Molech", "children", "God's character"],
    mood: 'grateful',
    scripture: 'Lev 18:21; 20:2–5',
  },
  {
    id: 'entry-4',
    timestamp: subHours(now, 28).getTime(),
    transcript: "Summarizing the law\n\nSome people think the Bible is nothing but a book of rules. But Jesus neatly summarized all these rules when he said to love God with all your heart, and to love your neighbor as yourself. He called these the greatest commandments (or rules) of all. By carrying out Jesus' simple commands, we find ourselves following all of God's other laws as well.",
    summary: "Jesus' summary: love God and love your neighbor.",
    keywords: ["law", "commandments", "love", "Jesus"],
    mood: 'peaceful',
    scripture: 'Lev 19:18',
  },
  {
    id: 'entry-5',
    timestamp: subDays(now, 2).getTime(),
    transcript: "Foreigners and compassion\n\nHow do you feel when you encounter foreigners, especially those who don't speak your language? Are you impatient? Do you think or act as if they should go back to where they came from? Are you tempted to take advantage of them? God says to treat foreigners as you'd treat fellow citizens, to love them as you love yourself. In reality, we are all foreigners in this world because it is only our temporary home. View your interactions with strangers, newcomers, and foreigners as opportunities to demonstrate God's love.",
    summary: "Treating foreigners with compassion as God commands.",
    keywords: ["foreigners", "compassion", "love", "strangers"],
    mood: 'hopeful',
    scripture: 'Lev 19:33–34',
    prayerRequests: [
      {
        id: 'pr-2',
        personName: 'New neighbors',
        request: 'Give me a heart to welcome and love newcomers and foreigners as You do.',
        status: 'active',
        createdAt: subDays(now, 2).getTime() - 1000 * 60 * 60 * 2,
      },
    ],
  },
  {
    id: 'entry-6',
    timestamp: subDays(now, 2).getTime() - 1000 * 60 * 60 * 5,
    transcript: "THE OCCULT\n\nEveryone is interested in what the future holds, and we often look to others for guidance. But God warned about looking to the occult for advice. Mediums and spiritists were outlawed because God was not the source of their information. At best, occult practitioners are fakes whose predictions cannot be trusted. At worst, they are in contact with evil spirits and are thus extremely dangerous. We don't need to look to the occult for information about the future. God has given us the Bible so that we may obtain all the information we need—the Bible's teachings are trustworthy.",
    summary: "Avoiding the occult; trusting Scripture for the future.",
    keywords: ["occult", "mediums", "Bible", "future"],
    mood: 'peaceful',
    scripture: 'Lev 19:31; 20:6, 27',
  },
];

const MOCK_VERSES: Array<{ verse: string; reference: string }> = [
  { verse: 'The Lord is my shepherd; I shall not want.', reference: 'Psalm 23:1' },
  { verse: 'Come to me, all who labor and are heavy laden, and I will give you rest.', reference: 'Matthew 11:28' },
  { verse: 'Be still, and know that I am God.', reference: 'Psalm 46:10' },
  { verse: 'My grace is sufficient for you, for my power is made perfect in weakness.', reference: '2 Corinthians 12:9' },
  { verse: 'Peace I leave with you; my peace I give to you.', reference: 'John 14:27' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.JOURNAL);
  const [journalSubTab, setJournalSubTab] = useState<JournalSubTab>('journal');
  const [entries, setEntries] = useState<JournalEntry[]>(MOCK_ENTRIES);
  const [devotional, setDevotional] = useState<Devotional | null>({
    verse: 'You shall not do as they do in the land of Egypt, where you lived, and you shall not do as they do in the land of Canaan, to which I am bringing you. You shall not walk in their statutes.',
    reference: 'Leviticus 18:3',
    reflection: '',
    prayer: '',
    quote: "Our problem with sex doesn't begin with lust, with bad choices, or with sexual misbehavior. Our problem with sex begins when we forget that God must be at the center of this part of our lives as he must be with any other' - Paul Tripp",
    reflection: `The importance of spirituality over sexuality

Israel's sexual morality is here portrayed as something that marks it off from its neighbors as the Lord's special people. Ch. 17 stressed that Israel was not to compromise her witness by worshipping demons or eating blood. Chapter 18 insists that certain standards of sexual morality are equally decisive marks of religious allegiance.

It is not surprising, then, that the section of Leviticus concerning the behavior of the Israelites should be peppered with a reminder of who they are, and who their God is. This identification of Yahweh as their God (and not any other) occurs more than thirty times in chapters 18–22!

Conformity and God's standards

God is talking with Moses about peer pressure. He is speaking to the people as creatures tempted to conform. God is speaking to them, and to us, as people for whom the question is not, "Will you or will you not conform?" Rather, the question is, "To what will you conform?" That's just how we are. We were designed to be led, to serve, to worship.

The issue here is specifically sexual conformity. The place from which they came, and the place to which they were going, both had practices, customs, perspectives, standards related to sexual behavior. The same is true for us today.

No matter where you are coming from or where you are going in our culture, you will always be surrounded by voices promoting practices, customs, perspectives, standards related to sexual behavior.

But as God makes clear to the Israelites in these verses, those standards will always be at odds with His standards; always, no matter the person, place, or period of time in question. Why? Because we live in a fallen world, a world in rebellion against God. In rejecting God, men and women have rejected God's design for their bodies and their lives.

Spirituality before sexuality

This is precisely why God is calling them in verses 4 and 5, to put spirituality before sexuality. That means answering those 'meaning of life' questions first, then letting the answers guide us in terms of all our feelings and desires, including sexual feelings and desires. We often reverse these two things, and thus, look for a system of meaning and morals that fits with our existing feelings and desires.

God declares three times in these five verses, "I am the LORD (Yahweh)", or "I am [Yahweh] your God". That is the starting point. The expression, "I am the LORD your God," is the fundamental truth on which the following verses, and on which the following chapters must stand.

God is orderly, and therefore He expects that His creation do all things "decently and in order" (1 Corinthians 14:40). God is not some kind of a cosmic drill sergeant who delights simply in giving orders; rather, our loving God gives us orders in order that we might have life, and that we might have it abundantly (John 10:10).`,
    prayer: `Lord, I thank you that you created human sexuality and said that it was very good. But man has corrupted it. Help me when I am living in this world with its different worldviews about sexuality, to make a difference. Amen.`,
    sections: []
  });
  const [isLoadingDevo, setIsLoadingDevo] = useState(false);
  const [verseList, setVerseList] = useState<Array<{ verse: string; reference: string }>>(MOCK_VERSES.slice(0, 3));
  const [userPrayerRequests, setUserPrayerRequests] = useState<PrayerRequest[]>([]);
  const [showImmersiveRecording, setShowImmersiveRecording] = useState(false);
  const [isProcessingRecording, setIsProcessingRecording] = useState(false);
  const [showMeditation, setShowMeditation] = useState(false);
  const [showReader, setShowReader] = useState<'reflection' | 'prayer' | null>(null);
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
      
      {!showMeditation && !showReader && (
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
      {!showMeditation && !showReader && (
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
          <div className="relative w-full h-full">
            <JournalSideTabs value={journalSubTab} onChange={setJournalSubTab} />

            {journalSubTab === 'journal' && (
              <JournalTimeline entries={entries} />
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
                        const next = MOCK_VERSES[Math.floor(Math.random() * MOCK_VERSES.length)];
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
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl">
                <StressDashboard onStartMeditation={() => setShowMeditation(true)} />
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
                  <div className="space-y-8 py-8">
                    <div className="text-left space-y-6">
                      <p className="melrose-text text-[#4a3a33]">
                        "{devotional.verse}"
                      </p>
                      <p className="text-[14px] font-bold uppercase tracking-[0.4em] text-[#4a3a33]/45">
                        — {devotional.reference}
                      </p>
                    </div>

                    {devotional.quote && (
                      <div className="bg-[#f6f5f3]/50 rounded-2xl p-6 border border-[#e7ded4]">
                        <p className="melrose-text text-[#4a3a33] italic">
                          "{devotional.quote}"
                        </p>
                      </div>
                    )}
                    
                    {devotional.sections && devotional.sections.length > 0 ? (
                      <div className="space-y-0">
                        {devotional.sections.map((section, idx) => (
                          <DevotionalSection
                            key={idx}
                            title={section.title}
                            content={section.content}
                            defaultExpanded={idx === 0}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {devotional.reflection && (
                          <button
                            type="button"
                            onClick={() => setShowReader('reflection')}
                            className="w-full text-left bg-[#f6f5f3]/50 hover:bg-[#f6f5f3]/70 rounded-2xl p-6 border border-[#e7ded4] transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-[14px] font-bold uppercase tracking-widest text-[#4a3a33]">
                                The Reflection
                              </h4>
                              <ChevronRight size={18} className="text-[#4a3a33]/40 group-hover:text-[#4a3a33] group-hover:translate-x-1 transition-all" />
                            </div>
                            <p className="melrose-text text-[#4a3a33]/60 mt-3 line-clamp-2">
                              {devotional.reflection.split('\n\n')[0]}
                            </p>
                          </button>
                        )}

                        {devotional.prayer && (
                          <button
                            type="button"
                            onClick={() => setShowReader('prayer')}
                            className="w-full text-left bg-[#f6f5f3]/50 hover:bg-[#f6f5f3]/70 rounded-2xl p-6 border border-[#e7ded4] transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-[14px] font-bold uppercase tracking-widest text-[#4a3a33]">
                                A Simple Prayer
                              </h4>
                              <ChevronRight size={18} className="text-[#4a3a33]/40 group-hover:text-[#4a3a33] group-hover:translate-x-1 transition-all" />
                            </div>
                            <p className="melrose-text text-[#4a3a33]/60 mt-3 line-clamp-2">
                              {devotional.prayer.split('\n\n')[0]}
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
      {showReader === 'reflection' && devotional?.reflection && (
        <ImmersiveReader
          title="The Reflection"
          content={devotional.reflection}
          onClose={() => setShowReader(null)}
        />
      )}
      {showReader === 'prayer' && devotional?.prayer && (
        <ImmersiveReader
          title="A Simple Prayer"
          content={devotional.prayer}
          onClose={() => setShowReader(null)}
        />
      )}
    </div>
  );
};

export default App;
