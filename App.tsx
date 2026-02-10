import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppTab, JournalEntry, Devotional, PrayerRequest, CurrentUserId, PrayerReminderSettings } from './types';
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
import PrayerReminderBanner from './components/PrayerReminderBanner';
import { getStoredUserId, setStoredUserId, getInitialDataForUser, getAvatarSrc, getDevotionalForUserAndDate, getPrayerReminderSettings, setPrayerReminderSettings, getPrayerCompletionRecord, setPrayerCompletionRecord } from './data/userData';
import { analyzeJournalEntry, generatePersonalizedDevotional } from './services/geminiService';
import { fetchVerseText } from './services/bibleService';
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
  
  // 初始化 verseList：只保留来自 entries 的 scripture
  const entryVerses: Array<{ verse: string; reference: string; entryId: string; source: 'journal' }> = [];
  const seenReferences = new Set<string>();
  
  data.entries.forEach(entry => {
    if (entry.scripture && !seenReferences.has(entry.scripture)) {
      entryVerses.push({
        verse: '',
        reference: entry.scripture,
        entryId: entry.id,
        source: 'journal',
      });
      seenReferences.add(entry.scripture);
    }
  });
  
  const verseList = entryVerses.slice(0, 20);
  
  return {
    currentUser: userId,
    entries: data.entries,
    devotional: data.devotional,
    verseList: verseList,
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
  const [generatingDevotionalForDate, setGeneratingDevotionalForDate] = useState<string | null>(null);
  const [unlockedDevotionalTick, setUnlockedDevotionalTick] = useState(0);
  const [verseList, setVerseList] = useState<Array<{ verse: string; reference: string; entryId?: string; source?: 'journal' }>>(initial.verseList);
  const [versePool, setVersePool] = useState<Array<{ verse: string; reference: string }>>(initial.versePool);
  const [userPrayerRequests, setUserPrayerRequests] = useState<PrayerRequest[]>([]);
  const [prayerReminderSettings, setPrayerReminderSettingsState] = useState<PrayerReminderSettings>(() => getPrayerReminderSettings(initial.currentUser));
  const [activeReminderSlotId, setActiveReminderSlotId] = useState<string | null>(null);
  const [dismissedReminderSlotId, setDismissedReminderSlotId] = useState<string | null>(null);

  // Week timeline: default focus on 2026-01-18
  const defaultFocusDate = new Date(2026, 0, 18); // Jan 18, 2026
  const defaultWeekStart = startOfWeek(defaultFocusDate, { weekStartsOn: 0 });
  const getDayIndexInWeek = (weekStart: Date, date: Date) => {
    const dateStr = format(startOfDay(date), 'yyyy-MM-dd');
    for (let i = 0; i < 7; i++) {
      if (format(addDays(weekStart, i), 'yyyy-MM-dd') === dateStr) return i;
    }
    return 0;
  };
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => defaultWeekStart);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => getDayIndexInWeek(defaultWeekStart, defaultFocusDate));

  // All dates that have at least one journal entry (for week timeline dots in any week)
  const datesWithEntries = React.useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => set.add(format(startOfDay(e.timestamp), 'yyyy-MM-dd')));
    return set;
  }, [entries]);

  const hasUserSwitchedRef = React.useRef(false);

  // Load user-specific data when currentUser changes (e.g. after switching in Settings)
  useEffect(() => {
    const data = getInitialDataForUser(currentUser);
    setEntries(data.entries);
    setDevotional(data.devotional);
    
    // verseList：只保留来自 entries 的 scripture
    const entryVerses: Array<{ verse: string; reference: string; entryId: string; source: 'journal' }> = [];
    const seenRefs = new Set<string>();
    data.entries.forEach(entry => {
      if (entry.scripture && !seenRefs.has(entry.scripture)) {
        entryVerses.push({
          verse: '',
          reference: entry.scripture,
          entryId: entry.id,
          source: 'journal',
        });
        seenRefs.add(entry.scripture);
      }
    });
    setVerseList(entryVerses.slice(0, 20));
    setVersePool(data.verses);
    setAvatarSeed(data.avatarSeed);
    setAvatarUrl(data.avatarUrl);
    setUserPrayerRequests([]);
    setPrayerReminderSettingsState(getPrayerReminderSettings(currentUser));
    // Only move week/day to latest entry when user has explicitly switched (so initial load keeps default 1/25)
    if (hasUserSwitchedRef.current) {
      if (data.entries.length > 0) {
        const latest = data.entries.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
        const weekStart = startOfWeek(new Date(latest.timestamp), { weekStartsOn: 0 });
        setSelectedWeekStart(weekStart);
        setSelectedDayIndex(getDayIndexInWeek(weekStart, new Date(latest.timestamp)));
      } else {
        setSelectedWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
        setSelectedDayIndex(0);
      }
    }
  }, [currentUser]);

  const handleSwitchUser = (userId: CurrentUserId) => {
    hasUserSwitchedRef.current = true;
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
  const [newPrayerTerm, setNewPrayerTerm] = useState<'short' | 'long'>('short');

  // Helper function to find existing Prayer Entry for a slot on a specific date
  const findExistingPrayerEntry = (slotId: string, date: string): JournalEntry | undefined => {
    return entries.find(entry => 
      entry.isPrayerEntry === true && 
      entry.prayerSlotId === slotId && 
      format(new Date(entry.timestamp), 'yyyy-MM-dd') === date
    );
  };

  // Create empty Prayer Entry
  const createEmptyPrayerEntry = (slotId: string, slotLabel: string, timestamp: number): JournalEntry => {
    return {
      id: `prayer-${slotId}-${format(new Date(timestamp), 'yyyy-MM-dd')}-${Date.now()}`,
      timestamp, // Use the exact reminder time
      transcript: '', // Empty content
      summary: '', // Empty summary
      keywords: [],
      moodLevel: detectMoodFromBiometrics(timestamp),
      isPrayerEntry: true,
      prayerSlotId: slotId,
    };
  };

  /** Simulate ring biometric detection: HRV, heart rate variability, stress level -> moodLevel 1-5 */
  const detectMoodFromBiometrics = (timestamp: number): MoodLevel => {
    // Use timestamp as seed for deterministic but varied results
    const hour = new Date(timestamp).getHours();
    const dayOfYear = Math.floor((timestamp - new Date(2026, 0, 1).getTime()) / (1000 * 60 * 60 * 24));
    const seed = (hour * 7 + dayOfYear * 11) % 100;
    
    // Simulate HRV-based mood: higher HRV (lower stress) = better mood
    // Morning (6-9): often lower mood (1-3), midday (10-14): mixed (2-4), evening (15-21): better (3-5)
    let baseMood: number;
    if (hour >= 6 && hour < 10) {
      baseMood = 1 + (seed % 3); // 1-3
    } else if (hour >= 10 && hour < 15) {
      baseMood = 2 + (seed % 3); // 2-4
    } else if (hour >= 15 && hour < 22) {
      baseMood = 3 + (seed % 3); // 3-5
    } else {
      baseMood = 2 + (seed % 2); // 2-3 (late night/early morning)
    }
    
    return Math.max(1, Math.min(5, baseMood)) as MoodLevel;
  };

  const handleNewRecord = async (transcript: string) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const timestamp = Date.now();
    setIsProcessingRecording(true);
    analyzeJournalEntry(transcript).then(analysis => {
      const prayerRequests: PrayerRequest[] | undefined =
        analysis.prayerRequests?.length
          ? analysis.prayerRequests.map((pr, i) => ({
              id: `pr-${newId}-${i}`,
              personName: pr.personName,
              request: pr.request,
              status: 'active' as const,
              createdAt: timestamp,
              term: 'short' as const,
            }))
          : undefined;
      
      // Check if there's an active reminder and an empty Prayer Entry
      if (activeReminderSlotId) {
        const today = format(new Date(), 'yyyy-MM-dd');
        const existingEmptyEntry = entries.find(entry => 
          entry.isPrayerEntry === true && 
          entry.prayerSlotId === activeReminderSlotId && 
          format(new Date(entry.timestamp), 'yyyy-MM-dd') === today &&
          entry.transcript === ''
        );
        
        if (existingEmptyEntry) {
          // Update the empty Prayer Entry with recording content
          const updatedEntry: JournalEntry = {
            ...existingEmptyEntry,
            transcript,
            summary: analysis.summary || "Recorded a thought.",
            keywords: analysis.keywords || [],
            mood: analysis.mood as any,
            moodLevel: detectMoodFromBiometrics(timestamp),
            ...(prayerRequests && { prayerRequests }),
          };
          setEntries(prev => prev.map(e => e.id === existingEmptyEntry.id ? updatedEntry : e));
          setIsProcessingRecording(false);
          setShowImmersiveRecording(false);
          return;
        }
      }
      
      // Create new entry (either no active reminder or no empty entry found)
      const newEntry: JournalEntry = {
        id: newId,
        timestamp,
        transcript,
        summary: analysis.summary || "Recorded a thought.",
        keywords: analysis.keywords || [],
        mood: analysis.mood as any,
        moodLevel: detectMoodFromBiometrics(timestamp), // Auto-detect from ring biometrics
        ...(prayerRequests && { prayerRequests }),
        // Mark as Prayer Entry if there's an active reminder
        ...(activeReminderSlotId && {
          isPrayerEntry: true,
          prayerSlotId: activeReminderSlotId,
        }),
      };
      setEntries(prev => [newEntry, ...prev]);
      setIsProcessingRecording(false);
      setShowImmersiveRecording(false);
    });
  };

  const handleStopRecording = () => {
    setShowImmersiveRecording(false);
    setIsProcessingRecording(true);
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

  const handleUnlockDevotional = useCallback(async (dateKey: string) => {
    // Get entries for the specific date
    const dayEntries = entries.filter((entry) => {
      const entryDateKey = format(new Date(entry.timestamp), 'yyyy-MM-dd');
      return entryDateKey === dateKey;
    });
    
    // Set generating state
    setGeneratingDevotionalForDate(dateKey);
    
    // TODO: Generate devotional based on dayEntries
    // For now, just simulate - in the future, call generatePersonalizedDevotional(dayEntries)
    console.log(`Unlocking devotional for ${dateKey} with ${dayEntries.length} entries`);
    
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Clear generating state
    setGeneratingDevotionalForDate(null);
    
    // Navigate to devotional tab
    setActiveTab(AppTab.DEVOTIONAL);
    
    // Optionally, update selected date to match the unlocked date
    const targetDate = new Date(dateKey + 'T12:00:00');
    const targetWeekStart = startOfWeek(targetDate, { weekStartsOn: 0 });
    const targetDayIndex = Math.floor((targetDate.getTime() - targetWeekStart.getTime()) / (1000 * 60 * 60 * 24));
    setSelectedWeekStart(targetWeekStart);
    setSelectedDayIndex(targetDayIndex);
  }, [entries]);

  useEffect(() => {
    if (activeTab === AppTab.DEVOTIONAL && !devotional) {
      loadDevotional();
    }
  }, [activeTab, devotional, loadDevotional]);

  // Prayer reminder check logic
  useEffect(() => {
    if (!prayerReminderSettings || !prayerReminderSettings.enabled) {
      setActiveReminderSlotId(null);
      return;
    }

    const checkReminderTime = () => {
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const completionRecord = getPrayerCompletionRecord(currentUser, today);
      const completedSlots = completionRecord?.completedSlots || [];

      // Check if current time matches any enabled slot
      const matchingSlot = prayerReminderSettings.timeSlots.find(slot => {
        if (!slot.enabled) return false;
        if (completedSlots.includes(slot.id)) return false;
        if (dismissedReminderSlotId === slot.id) return false;
        return now.getHours() === slot.hour && now.getMinutes() === slot.minute;
      });

      if (matchingSlot) {
        setActiveReminderSlotId(matchingSlot.id);
        
        // Create empty Prayer Entry if it doesn't exist
        setEntries(prev => {
          const existingEntry = prev.find(entry => 
            entry.isPrayerEntry === true && 
            entry.prayerSlotId === matchingSlot.id && 
            format(new Date(entry.timestamp), 'yyyy-MM-dd') === today
          );
          
          if (!existingEntry) {
            const reminderTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), matchingSlot.hour, matchingSlot.minute, 0).getTime();
            const emptyEntry = createEmptyPrayerEntry(matchingSlot.id, matchingSlot.label, reminderTimestamp);
            
            // Mark as completed
            const newCompletionRecord = completionRecord || {
              date: today,
              completedSlots: [],
              completedAt: {},
            };
            if (!newCompletionRecord.completedSlots.includes(matchingSlot.id)) {
              newCompletionRecord.completedSlots.push(matchingSlot.id);
              newCompletionRecord.completedAt[matchingSlot.id] = reminderTimestamp;
              setPrayerCompletionRecord(currentUser, newCompletionRecord);
            }
            
            return [emptyEntry, ...prev];
          }
          return prev;
        });
      } else {
        // Clear reminder if time has passed
        if (activeReminderSlotId) {
          const activeSlot = prayerReminderSettings.timeSlots.find(s => s.id === activeReminderSlotId);
          if (activeSlot) {
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            const slotMinutes = activeSlot.hour * 60 + activeSlot.minute;
            if (nowMinutes > slotMinutes) {
              setActiveReminderSlotId(null);
              setDismissedReminderSlotId(null);
            }
          }
        }
      }
    };

    // Check immediately
    checkReminderTime();

    // Check every minute
    const interval = setInterval(checkReminderTime, 60000);

    return () => clearInterval(interval);
  }, [prayerReminderSettings, currentUser, activeReminderSlotId, dismissedReminderSlotId]);

  // Reset dismissed reminder when date changes
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const checkDateChange = () => {
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      if (currentDate !== today) {
        setDismissedReminderSlotId(null);
        setActiveReminderSlotId(null);
      }
    };
    const interval = setInterval(checkDateChange, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // On app load: create Prayer Entries for today's past reminder times (so Journal shows Morning/Evening slots)
  useEffect(() => {
    if (!prayerReminderSettings || !prayerReminderSettings.enabled) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    setEntries(prev => {
      const newEntries: JournalEntry[] = [];
      let hasChanges = false;

      prayerReminderSettings.timeSlots.forEach(slot => {
        if (!slot.enabled) return;
        const slotMinutes = slot.hour * 60 + slot.minute;
        if (slotMinutes >= nowMinutes) return; // future slot, skip

        const existingEntry = prev.find(entry =>
          entry.isPrayerEntry === true &&
          entry.prayerSlotId === slot.id &&
          format(new Date(entry.timestamp), 'yyyy-MM-dd') === today
        );
        if (existingEntry) return;

        const reminderTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), slot.hour, slot.minute, 0).getTime();
        const emptyEntry = createEmptyPrayerEntry(slot.id, slot.label, reminderTimestamp);
        newEntries.push(emptyEntry);
        hasChanges = true;

        const completionRecord = getPrayerCompletionRecord(currentUser, today) || { date: today, completedSlots: [], completedAt: {} };
        if (!completionRecord.completedSlots.includes(slot.id)) {
          completionRecord.completedSlots.push(slot.id);
          completionRecord.completedAt[slot.id] = reminderTimestamp;
          setPrayerCompletionRecord(currentUser, completionRecord);
        }
      });

      return hasChanges ? [...newEntries, ...prev] : prev;
    });
  }, [prayerReminderSettings, currentUser]);

  const handleReminderComplete = () => {
    if (!activeReminderSlotId) return;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const completionRecord = getPrayerCompletionRecord(currentUser, today) || {
      date: today,
      completedSlots: [],
      completedAt: {},
    };

    // Check if empty Prayer Entry exists, if not create it
    const existingEntry = findExistingPrayerEntry(activeReminderSlotId, today);
    if (!existingEntry) {
      const now = new Date();
      const matchingSlot = prayerReminderSettings?.timeSlots.find(s => s.id === activeReminderSlotId);
      if (matchingSlot) {
        const reminderTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), matchingSlot.hour, matchingSlot.minute, 0).getTime();
        const emptyEntry = createEmptyPrayerEntry(activeReminderSlotId, matchingSlot.label, reminderTimestamp);
        setEntries(prev => [emptyEntry, ...prev]);
        
        if (!completionRecord.completedSlots.includes(activeReminderSlotId)) {
          completionRecord.completedSlots.push(activeReminderSlotId);
          completionRecord.completedAt[activeReminderSlotId] = reminderTimestamp;
        }
      }
    } else {
      // Entry already exists, just update completion record
      if (!completionRecord.completedSlots.includes(activeReminderSlotId)) {
        completionRecord.completedSlots.push(activeReminderSlotId);
        completionRecord.completedAt[activeReminderSlotId] = existingEntry.timestamp;
      }
    }

    setPrayerCompletionRecord(currentUser, completionRecord);
    setActiveReminderSlotId(null);
    setDismissedReminderSlotId(null);
  };

  const handleReminderDismiss = () => {
    if (activeReminderSlotId) {
      setDismissedReminderSlotId(activeReminderSlotId);
      setActiveReminderSlotId(null);
    }
  };

  // Note: Verse sub-tab uses a local verse list. Only verses from journal entries (and manual) are shown; devotional verses are not added.

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
    
    // 自动聚合 scripture 到 Verse tab
    if (updatedEntry.scripture) {
      setVerseList((prev) => {
        const reference = updatedEntry.scripture!;
        const seen = new Set(prev.map((v) => v.reference));
        if (seen.has(reference)) {
          // 如果已存在，更新 entryId 和 source（保留最新的 entry）
          return prev.map((v) => 
            v.reference === reference ? { ...v, entryId: updatedEntry.id, source: 'journal' as const } : v
          );
        }
        
        // 添加到列表开头，限制最多显示 20 条
        return [{
          verse: '', // Entry 中只有 reference，没有 verse 文本
          reference: reference,
          entryId: updatedEntry.id, // 保存来源 entry 的 ID
          source: 'journal' as const,
        }, ...prev].slice(0, 20);
      });
    }
  };

  const handleEntryDelete = (entryId: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
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
        term: newPrayerTerm,
      },
    ]);
    setNewPrayerName('');
    setNewPrayerRequest('');
  };

  const selectedDate = addDays(selectedWeekStart, selectedDayIndex);
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const displayedDevotional = getDevotionalForUserAndDate(currentUser, selectedDateStr);

  const getHeaderDateLabel = () => {
    const today = startOfDay(new Date());
    const sel = startOfDay(selectedDate);
    if (isToday(selectedDate)) return 'Today';
    if (format(sel, 'yyyy-MM-dd') === format(addDays(today, -1), 'yyyy-MM-dd')) return 'Yesterday';
    if (format(sel, 'yyyy-MM-dd') === format(addDays(today, 1), 'yyyy-MM-dd')) return 'Tomorrow';
    return format(selectedDate, 'MMMM d');
  };

  // Get active reminder slot info
  const activeReminderSlot = activeReminderSlotId
    ? prayerReminderSettings?.timeSlots.find(s => s.id === activeReminderSlotId)
    : null;
  const today = format(new Date(), 'yyyy-MM-dd');
  const completionRecord = getPrayerCompletionRecord(currentUser, today);
  const enabledSlots = prayerReminderSettings?.timeSlots.filter(slot => slot.enabled) || [];
  const completedCount = completionRecord?.completedSlots.length || 0;
  const totalCount = enabledSlots.length;

  return (
    <div className="fixed inset-0 bg-[#fbfbfa] selection:bg-[#4a3a33] selection:text-[#fbfbfa] no-scrollbar overflow-hidden flex flex-col">
      {/* Prayer Reminder Banner */}
      {activeReminderSlot && (
        <PrayerReminderBanner
          slotLabel={activeReminderSlot.label}
          slotTime={`${String(activeReminderSlot.hour).padStart(2, '0')}:${String(activeReminderSlot.minute).padStart(2, '0')}`}
          onComplete={handleReminderComplete}
          onDismiss={handleReminderDismiss}
          currentProgress={{ completed: completedCount, total: totalCount }}
        />
      )}
      
      {!showMeditation && !showReader && !editingEntry && (
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onRecordFinish={handleNewRecord}
          onStartRecording={() => setShowImmersiveRecording(true)}
          isRecordingFromApp={showImmersiveRecording}
          isProcessingFromApp={isProcessingRecording}
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
                  repeating-linear-gradient(#fbfbfa, #fbfbfa 31px, #e9e8e6 31px, #e9e8e6 32px)
                `,
                backgroundSize: '100% 32px',
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
                  onUnlockDevotional={handleUnlockDevotional}
                  generatingDevotionalForDate={generatingDevotionalForDate}
                  onNavigateToVerse={() => setJournalSubTab('verse')}
                />
              </div>
            )}

            {journalSubTab === 'prayer' && (
              <div className="px-10 pt-[32px] pb-44 text-[#4a3a33] max-w-2xl">
                {/* Roman: same font sizes as journal (17px main, 15px secondary) */}
                {(() => {
                  const isRoman = currentUser === 'roman';
                  const prayerMain = isRoman ? 'text-[17px]' : 'text-[15px]';
                  const prayerSecondary = isRoman ? 'text-[15px]' : 'text-[13px]';
                  
                  // Calculate prayer reminder progress
                  const today = format(new Date(), 'yyyy-MM-dd');
                  const completionRecord = getPrayerCompletionRecord(currentUser, today);
                  const enabledSlots = prayerReminderSettings?.timeSlots.filter(slot => slot.enabled) || [];
                  const completedCount = completionRecord?.completedSlots.length || 0;
                  const totalCount = enabledSlots.length;
                  
                  const shortTerm = displayedPrayerRequests.filter((pr) => (pr.term ?? 'short') === 'short');
                  const longTerm = displayedPrayerRequests.filter((pr) => pr.term === 'long');
                  const renderPrayerItem = (pr: PrayerRequest) => (
                    <div
                      key={pr.id}
                      className="group flex items-start gap-3"
                      style={{ marginBottom: '32px' }}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className={`handwriting ${prayerSecondary} text-[#4a3a33]/45`}
                          style={{ height: '32px', lineHeight: '32px', margin: 0, padding: 0, display: 'block' }}
                        >
                          {pr.personName}
                        </p>
                        <p
                          className={`handwriting text-[#4a3a33] ${prayerMain} opacity-90`}
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
                  );
                  return (
                    <>
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
                {/* Term selector: Short-term / Long-term */}
                <div className="flex gap-3" style={{ height: '28px', marginTop: '4px', marginBottom: '0' }}>
                  <button
                    type="button"
                    onClick={() => setNewPrayerTerm('short')}
                    className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${newPrayerTerm === 'short' ? 'text-[#4a3a33]' : 'text-[#4a3a33]/50 hover:text-[#4a3a33]/70'}`}
                  >
                    Short-term
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPrayerTerm('long')}
                    className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${newPrayerTerm === 'long' ? 'text-[#4a3a33]' : 'text-[#4a3a33]/50 hover:text-[#4a3a33]/70'}`}
                  >
                    Long-term
                  </button>
                </div>
                {/* Row 2: Name input — exactly 32px */}
                <input
                  type="text"
                  placeholder="Name"
                  value={newPrayerName}
                  onChange={(e) => setNewPrayerName(e.target.value)}
                  className={`w-full bg-transparent border-b border-[#e3e1dc] ${prayerMain} handwriting text-[#4a3a33] placeholder:text-[#4a3a33]/35 focus:outline-none focus:border-[#4a3a33]/40 block`}
                  style={{ height: '32px', lineHeight: '32px', margin: 0, padding: 0 }}
                />
                {/* Rows 3–4: Prayer request textarea — 64px (2 grid lines) */}
                <textarea
                  placeholder="Prayer request…"
                  value={newPrayerRequest}
                  onChange={(e) => setNewPrayerRequest(e.target.value)}
                  rows={2}
                  className={`w-full bg-transparent border-b border-[#e3e1dc] ${prayerMain} handwriting text-[#4a3a33] placeholder:text-[#4a3a33]/35 focus:outline-none focus:border-[#4a3a33]/40 resize-none block`}
                  style={{ minHeight: '64px', lineHeight: '32px', margin: 0, padding: 0 }}
                />
                {/* Spacer — 32px */}
                <div style={{ height: '32px' }} />

                {displayedPrayerRequests.length === 0 ? (
                  <p
                    className={`handwriting text-[#4a3a33]/45 ${prayerMain}`}
                    style={{ lineHeight: '32px', margin: 0, padding: 0, minHeight: '32px' }}
                  >
                    No prayer requests yet. Add one above or record a journal entry that includes a prayer request.
                  </p>
                ) : (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#4a3a33]/45" style={{ marginBottom: '12px' }}>
                      Short-term
                    </p>
                    {shortTerm.length === 0 ? (
                      <p className={`handwriting text-[#4a3a33]/40 ${prayerSecondary}`} style={{ marginBottom: '24px' }}>No short-term requests.</p>
                    ) : (
                      shortTerm.map(renderPrayerItem)
                    )}
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#4a3a33]/45" style={{ marginTop: '8px', marginBottom: '12px' }}>
                      Long-term
                    </p>
                    {longTerm.length === 0 ? (
                      <p className={`handwriting text-[#4a3a33]/40 ${prayerSecondary}`}>No long-term requests.</p>
                    ) : (
                      longTerm.map(renderPrayerItem)
                    )}
                  </div>
                )}
                    </>
                  );
                })()}
              </div>
            )}

            {journalSubTab === 'verse' && (
              <div className="px-10 pt-[32px] pb-44 text-[#4a3a33] max-w-2xl">
                {(() => {
                  const isRoman = currentUser === 'roman';
                  const verseMain = isRoman ? 'text-[17px]' : 'text-[15px]';
                  const verseRef = isRoman ? 'text-[15px]' : 'text-[13px]';
                  return (
                    <>
                <VerseListWithFetch
                  verses={verseList.filter((v) => v.source === 'journal')}
                  entries={entries}
                  verseMain={verseMain}
                  verseRef={verseRef}
                  onNavigateToEntry={(entry) => {
                    setJournalSubTab('journal');
                    handleEntryClick(entry);
                  }}
                  onVerseUpdate={(reference, verseText) => {
                    setVerseList((prev) =>
                      prev.map((v) =>
                        v.reference === reference ? { ...v, verse: verseText } : v
                      )
                    );
                  }}
                />
                    </>
                  );
                })()}
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
              <Settings 
                currentUser={currentUser} 
                onSwitchUser={handleSwitchUser}
                prayerReminderSettings={prayerReminderSettings}
                onUpdatePrayerReminderSettings={(settings) => {
                  setPrayerReminderSettingsState(settings);
                  setPrayerReminderSettings(currentUser, settings);
                }}
              />
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
                              <h4 className="text-[14px] font-bold text-[#4a3a33]">
                                {displayedDevotional.title ?? 'The Reflection'}
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
                  <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                    <p className="text-[#4a3a33]/50 font-light text-lg mb-8">
                      No devotional for this day yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          localStorage.setItem(`devotional_unlocked_${selectedDateStr}`, 'true');
                        }
                        setUnlockedDevotionalTick((v) => v + 1);
                      }}
                      className="px-6 py-3 rounded-xl bg-[#4a3a33]/10 hover:bg-[#4a3a33]/20 text-[#4a3a33] font-medium transition-colors"
                    >
                      Unlock daily devotional
                    </button>
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
          title={displayedDevotional.title ?? 'The Reflection'}
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
          onDelete={handleEntryDelete}
          onClose={() => setEditingEntry(null)}
          usePatrickHand={currentUser === 'roman'}
        />
      )}
    </div>
  );
};

// Verse List Component with Auto-fetch
interface VerseListWithFetchProps {
  verses: Array<{ verse: string; reference: string; entryId?: string; source?: 'journal' }>;
  entries: JournalEntry[];
  verseMain: string;
  verseRef: string;
  onNavigateToEntry: (entry: JournalEntry) => void;
  onVerseUpdate: (reference: string, verseText: string) => void;
}

const VerseListWithFetch: React.FC<VerseListWithFetchProps> = ({
  verses,
  entries,
  verseMain,
  verseRef,
  onNavigateToEntry,
  onVerseUpdate,
}) => {
  // Track which verses are being fetched
  const [fetchingVerses, setFetchingVerses] = useState<Set<string>>(new Set());
  const [fetchedVerses, setFetchedVerses] = useState<Set<string>>(new Set());

  // Find verses that need fetching (have reference but no verse text)
  const versesToFetch = useMemo(() => {
    return verses.filter(v => !v.verse && v.reference && !fetchedVerses.has(v.reference));
  }, [verses, fetchedVerses]);

  // Fetch verse texts for verses that need them
  useEffect(() => {
    if (versesToFetch.length === 0) return;

    versesToFetch.forEach(async (v) => {
      if (fetchingVerses.has(v.reference)) return;
      
      setFetchingVerses(prev => new Set(prev).add(v.reference));
      
      try {
        const verseText = await fetchVerseText(v.reference);
        if (verseText) {
          onVerseUpdate(v.reference, verseText);
        }
        setFetchedVerses(prev => new Set(prev).add(v.reference));
      } catch (error) {
        console.error(`Failed to fetch verse for ${v.reference}:`, error);
        setFetchedVerses(prev => new Set(prev).add(v.reference));
      } finally {
        setFetchingVerses(prev => {
          const next = new Set(prev);
          next.delete(v.reference);
          return next;
        });
      }
    });
  }, [versesToFetch, fetchingVerses, onVerseUpdate]);

  return (
    <div>
      {verses.map((v, i) => {
        const sourceEntry = v.entryId ? entries.find(e => e.id === v.entryId) : null;
        const sourceLabel = 'Journal';
        const isFetching = fetchingVerses.has(v.reference);
        
        return (
          <div key={`${v.reference}-${i}`} className="block group" style={{ marginBottom: '32px' }}>
            <p
              className={`handwriting text-[#4a3a33] ${verseMain} opacity-90`}
              style={{ lineHeight: '32px', margin: 0, padding: 0, display: 'block', minHeight: '32px' }}
            >
              {v.verse ? `"${v.verse}"` : isFetching ? 'Loading...' : v.reference}
            </p>
            {v.verse && (
              <p
                className={`handwriting text-[#4a3a33]/45 ${verseRef}`}
                style={{ lineHeight: '32px', margin: 0, padding: 0, display: 'block', minHeight: '32px' }}
              >
                — {v.reference}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1" style={{ lineHeight: '24px' }}>
              <span className="text-[9px] text-[#4a3a33]/40 uppercase tracking-wider">
                {sourceLabel}
              </span>
              {sourceEntry && (
                <button
                  onClick={() => {
                    onNavigateToEntry(sourceEntry);
                  }}
                  className="text-[10px] text-[#4a3a33]/50 hover:text-[#4a3a33]/70 transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                >
                  ← View entry
                </button>
              )}
            </div>
            <div style={{ height: '32px' }} />
          </div>
        );
      })}
    </div>
  );
};

export default App;
