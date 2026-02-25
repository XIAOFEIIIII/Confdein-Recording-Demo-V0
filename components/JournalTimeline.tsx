import React, { useState, useEffect, useRef, useMemo } from 'react';
import { JournalEntry } from '../types';
import { format, startOfDay, startOfWeek, addDays, parse } from 'date-fns';
import { Quote, Lock, Moon, BookOpen, ChevronRight, Loader2 } from 'lucide-react';

const PRAYER_SLOT_LABEL: Record<string, string> = { morning: 'MORNING PRAYER', evening: 'EVENING REFLECTION' };

/** Date key (yyyy-MM-dd) -> several distinct 0..1 seeds */
function dateSeeds(dateKey: string): [number, number, number, number] {
  const parts = dateKey.split('-').map(Number);
  const y = parts[0] ?? 2026;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const n = y * 372 + m * 31 + d;
  const mix = (a: number, b: number) => ((a * 7919 + b * 7907) % 10007) / 10007;
  return [
    mix(n, 1),
    mix(n, 2),
    mix(n, 3),
    mix(n, 4),
  ];
}

/** Gaussian bump for smooth curves */
const bump = (t: number, center: number, width: number, height: number) =>
  height * Math.exp(-Math.pow((t - center) / width, 2));

/** Get stress level at a specific timestamp (using same logic as StressDashboard) */
function getStressLevelAtTime(timestamp: number): number {
  const date = new Date(timestamp);
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const hour = date.getHours();
  const [s0, s1, s2, s3] = dateSeeds(dateKey);
  const pattern = Math.floor(s0 * 4) % 4;
  const morningPeak = 0.2 + s1 * 0.35;
  const afternoonPeak = 0.45 + s2 * 0.35;
  const peakHeight = 28 + s3 * 24;
  const dipDepth = 12 + s0 * 22;
  const baseLevel = 18 + (s1 - 0.5) * 12;
  
  // Clamp hour to 6-21 range (curve only covers these hours)
  const clampedHour = Math.max(6, Math.min(21, hour));
  const t = (clampedHour - 6) / 15; // 0 at 6am, 1 at 9pm
  
  let level: number;
  if (pattern === 0) {
    level = baseLevel + bump(t, morningPeak, 0.2, peakHeight) + 15 * (1 - t) * (1 - t);
  } else if (pattern === 1) {
    level = baseLevel + bump(t, afternoonPeak, 0.25, peakHeight) + 8 * Math.exp(-Math.pow((t - 0.15) / 0.2, 2));
  } else if (pattern === 2) {
    const midday = dipDepth * Math.sin(Math.PI * t);
    level = baseLevel + bump(t, 0.2, 0.18, 20) + bump(t, 0.7, 0.2, 18) - midday;
  } else {
    level = baseLevel + bump(t, morningPeak, 0.2, peakHeight * 0.7) + bump(t, afternoonPeak, 0.22, peakHeight * 0.8);
  }
  return Math.max(10, Math.min(68, Math.round(level * 10) / 10));
}

/** Get stress state label based on level */
function getStressState(level: number): string {
  if (level <= 25) {
    return 'restored';
  } else if (level <= 40) {
    return 'relaxed';
  } else if (level <= 55) {
    return 'engaged';
  } else {
    return 'stressed';
  }
}

interface JournalTimelineProps {
  entries: JournalEntry[];
  /** Sunday of the week to show (week can be changed by swiping week timeline). */
  weekStart?: Date;
  onEntryClick?: (entry: JournalEntry) => void;
  /** Scroll to this day index (0=Sun..6=Sat) when changed from parent (e.g. week timeline click). */
  scrollToDayIndex?: number | null;
  /** Called when user scrolls to a different day. */
  onPageChange?: (index: number) => void;
  /** When true (Roman), use slightly larger font sizes for readability with Patrick Hand. */
  useRomanFont?: boolean;
  /** Called when user unlocks devotional for a date. Should navigate to devotional tab. */
  onUnlockDevotional?: (dateKey: string) => void;
  /** Date key (yyyy-MM-dd) for which devotional is currently being generated. */
  generatingDevotionalForDate?: string | null;
  /** Called when user clicks on scripture in entry to navigate to Verse tab. */
  onNavigateToVerse?: () => void;
}

const WEEK_STARTS_ON = 0; // Sunday

const JournalTimeline: React.FC<JournalTimelineProps> = ({
  entries,
  weekStart: weekStartProp,
  onEntryClick,
  scrollToDayIndex = null,
  onPageChange,
  useRomanFont = false,
  onUnlockDevotional,
  generatingDevotionalForDate = null,
  onNavigateToVerse,
}) => {
  const textMain = 'text-[14px]';
  const textScripture = 'text-[14px]';
  const textTime = useRomanFont ? 'text-[14px]' : 'text-[12px]';
  const textMeta = useRomanFont ? 'text-[14px]' : 'text-[12px]';
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const scrollToDayIndexRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number>(0);

  const today = new Date();
  const weekStart = weekStartProp ?? startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON });
  const dayKeys = Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStart, i), 'yyyy-MM-dd')
  );

  // Group entries by day
  const groupedEntries: { [key: string]: JournalEntry[] } = {};
  dayKeys.forEach(k => { groupedEntries[k] = []; });
  [...entries]
    .sort((a, b) => b.timestamp - a.timestamp)
    .forEach(entry => {
      const dayKey = format(startOfDay(entry.timestamp), 'yyyy-MM-dd');
      if (groupedEntries[dayKey]) groupedEntries[dayKey].push(entry);
    });

  // Scripture API fetching disabled - just show reference

  // Initial page = today's index in week
  const todayIndex = dayKeys.indexOf(format(startOfDay(today), 'yyyy-MM-dd'));
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (initialized) return;
    setCurrentPageIndex(todayIndex >= 0 ? todayIndex : 0);
    setInitialized(true);
  }, [todayIndex, initialized]);

  // Navigate to a page using CSS transform (no native scroll needed)
  const goToPage = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentPageIndex(index);
    onPageChange?.(index);
    scrollToDayIndexRef.current = index;
    setTimeout(() => setIsAnimating(false), 320);
  };

  // Respond to parent-driven day selection (WeekTimeline click)
  useEffect(() => {
    if (scrollToDayIndex == null || scrollToDayIndex === scrollToDayIndexRef.current) return;
    scrollToDayIndexRef.current = scrollToDayIndex;
    setCurrentPageIndex(scrollToDayIndex);
    onPageChange?.(scrollToDayIndex);
  }, [scrollToDayIndex, onPageChange]);

  const findNextWithEntries = (from: number, direction: 1 | -1): number | null => {
    let i = from + direction;
    while (i >= 0 && i < 7) {
      if ((groupedEntries[dayKeys[i]]?.length ?? 0) > 0) return i;
      i += direction;
    }
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isAnimating) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(deltaX) < 30) return;
    const direction = deltaX < 0 ? 1 : -1;
    const target = findNextWithEntries(currentPageIndex, direction as 1 | -1);
    if (target !== null) goToPage(target);
  };

  const handlePageIndicatorClick = (index: number) => {
    goToPage(index);
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ height: '100%' }}>
      <div
        className="flex-1 overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ height: '100%' }}
      >
        {/* 内层用 transform 滑动，无原生滚动依赖 */}
        <div
          className="flex h-full"
          style={{
            transform: `translateX(${-currentPageIndex * 100}%)`,
            transition: isAnimating ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            willChange: 'transform',
          }}
        >
        {dayKeys.map((dayKey) => {
          // 每天内部：按时间倒序（越新越靠上）
          const dayEntries = (groupedEntries[dayKey] ?? []).sort((a, b) => b.timestamp - a.timestamp);
          return (
            <div
              key={dayKey}
              className="flex-shrink-0 h-full"
              style={{ width: '100vw', minWidth: '100vw', height: '100%' }}
            >
              {/* Each day page - scrollable vertically; grid on this element so it scrolls with content */}
              <div
                className="h-full overflow-y-auto no-scrollbar px-10 pb-[160px]"
                style={{
                  paddingTop: '0px',
                  marginTop: '0px',
                  height: '100%',
                  backgroundImage: `
                    repeating-linear-gradient(#faf9f5, #faf9f5 31px, #1f1e1d26 31px, #1f1e1d26 32px)
                  `,
                  backgroundSize: '100% 32px',
                  backgroundAttachment: 'local',
                  backgroundPosition: '0 0'
                }}
              >
                {dayEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 px-6 text-stone-300">
                    <Quote size={28} className="opacity-20 mb-4" />
                    <p className={`handwriting text-[14px] text-center italic opacity-50`}>
                      The page is waiting for your voice...
                    </p>
                  </div>
                ) : (
                  <>
                    {dayEntries.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="relative group animate-in fade-in duration-700 cursor-pointer"
                      onClick={() => onEntryClick?.(entry)}
                    >
                      {/* Time Header: Exactly 32px high; for prayer entries show label instead of time, same font as timestamp */}
                      <div 
                        className="flex items-center gap-2 select-none"
                        style={{ 
                          height: '32px',
                          lineHeight: '32px',
                          margin: 0,
                          padding: 0
                        }}
                      >
                        <span className={`${textTime} font-bold tracking-widest uppercase ${entry.isPrayerEntry && entry.prayerSlotId ? 'text-stone-400/90' : 'text-stone-200'}`} style={{ lineHeight: '32px' }}>
                          {entry.isPrayerEntry && entry.prayerSlotId
                            ? (PRAYER_SLOT_LABEL[entry.prayerSlotId] ?? entry.prayerSlotId)
                            : format(entry.timestamp, 'HH:mm')}
                        </span>
                        <span className="text-stone-300 font-mono" style={{ lineHeight: '32px', fontSize: '18px' }}>
                          {entry.moodLevel === 1 ? ':(' : entry.moodLevel === 2 ? ':/' : entry.moodLevel === 3 ? ':|' : entry.moodLevel === 4 ? ':)' : ':D'}
                        </span>
                      </div>
                      {/* Ring-sync status rows (Transmitting / Transcribing) — 静态示意用 */}
                      {entry.ringStatus === 'transmitting' && (
                        <div
                          className="flex flex-col justify-center"
                          style={{
                            height: '32px',
                            margin: 0,
                            padding: 0,
                          }}
                        >
                          <div className="w-full h-1.5 rounded-full bg-stone-200 overflow-hidden mb-1">
                            <div className="h-full w-2/3 bg-stone-400 rounded-full" />
                          </div>
                          <p
                            className={`${textMeta} text-stone-400`}
                            style={{
                              lineHeight: '16px',
                              margin: 0,
                              padding: 0,
                            }}
                          >
                            Transmitting...
                          </p>
                        </div>
                      )}
                      {entry.ringStatus === 'transcribing' && (
                        <div
                          className="flex items-center gap-2 text-stone-300"
                          style={{
                            height: '32px',
                            margin: 0,
                            padding: 0,
                          }}
                        >
                          <span
                            className="inline-flex items-center justify-center rounded-full border border-stone-300/70"
                            style={{ width: '16px', height: '16px' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-300/70" />
                          </span>
                          <span
                            className={`${textMeta} text-stone-400`}
                            style={{ lineHeight: '16px' }}
                          >
                            Transcribing...
                          </span>
                        </div>
                      )}
                      {/* Handwriting Content Area: title, then scripture line, then body */}
                      {entry.transcript && (
                        <div 
                          className="block"
                          style={{ 
                            lineHeight: '32px',
                            margin: 0,
                            padding: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                          }}
                        >
                          {(() => {
                            const idx = entry.transcript.indexOf('\n\n');
                            const title = idx >= 0 ? entry.transcript.slice(0, idx) : entry.transcript;
                            const body = idx >= 0 ? entry.transcript.slice(idx + 2) : '';
                            const hasTitle = idx >= 0 && body.length > 0;
                            return (
                              <>
                                <p 
                                  className={`handwriting text-stone-800 ${textMain} opacity-90 select-none whitespace-pre-line ${hasTitle ? 'journal-transcript' : ''}`}
                                  style={{
                                    lineHeight: '32px',
                                    margin: 0,
                                    padding: 0,
                                    display: 'block',
                                    height: 'auto',
                                    minHeight: '32px'
                                  }}
                                >
                                  {title}
                                </p>
                                {entry.scripture && (
                                  <p 
                                    className={`handwriting text-stone-800 ${textScripture} opacity-90 select-none cursor-pointer hover:text-purple-600/70 transition-colors`}
                                    onClick={() => {
                                      onNavigateToVerse?.();
                                    }}
                                    style={{
                                      lineHeight: '32px',
                                      margin: 0,
                                      padding: 0,
                                      display: 'block',
                                      minHeight: '32px'
                                    }}
                                  >
                                    {entry.scripture}
                                  </p>
                                )}
                                {body && (
                                  <p 
                                    className={`handwriting text-stone-800 ${textMain} opacity-90 select-none whitespace-pre-line`}
                                    style={{
                                      lineHeight: '32px',
                                      margin: 0,
                                      padding: 0,
                                      display: 'block',
                                      height: 'auto',
                                      minHeight: '32px'
                                    }}
                                  >
                                    {body}
                                  </p>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {/* Keywords: no gap from content */}
                      {entry.keywords && entry.keywords.length > 0 && (
                        <div 
                          className="flex flex-wrap items-stretch gap-x-3 gap-y-0"
                          style={{ 
                            minHeight: '32px',
                            margin: 0,
                            padding: 0
                          }}
                        >
                          {entry.keywords.map((kw, i) => (
                            <span
                              key={i}
                              className={`${textMeta} text-stone-400 inline-flex items-center`}
                              style={{ height: '32px', lineHeight: '32px' }}
                            >
                              #{kw.toLowerCase()}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Entry Spacer: Exactly 32px high (1 row) */}
                      <div style={{ height: '32px', margin: 0, padding: 0 }} />
                    </div>
                    ))}
                    
                    {/* Unlock Devotional Module - naturally embedded at the bottom with highlighter effect */}
                    {(() => {
                      const dayDate = parse(dayKey, 'yyyy-MM-dd', new Date());
                      const now = new Date();
                      const currentHour = now.getHours();
                      const isSameDay = format(dayDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
                      const hasEntries = dayEntries.length > 0;
                      const canUnlock = hasEntries || (isSameDay && currentHour >= 21);
                      const isUnlocked = typeof window !== 'undefined' && localStorage.getItem(`devotional_unlocked_${dayKey}`) === 'true';
                      const isGenerating = generatingDevotionalForDate === dayKey;
                      
                      return (
                        <div style={{ marginTop: '32px', marginBottom: '32px' }}>
                          <button
                            onClick={() => {
                              if (isUnlocked && !isGenerating) {
                                if (onUnlockDevotional) {
                                  onUnlockDevotional(dayKey);
                                }
                              } else if (canUnlock && onUnlockDevotional && !isGenerating) {
                                // Mark as unlocked
                                if (typeof window !== 'undefined') {
                                  localStorage.setItem(`devotional_unlocked_${dayKey}`, 'true');
                                }
                                onUnlockDevotional(dayKey);
                              }
                            }}
                            disabled={(!canUnlock && !isUnlocked) || isGenerating}
                            className={`w-full flex items-center gap-3 group transition-all ${
                              ((canUnlock || isUnlocked) && !isGenerating) ? 'cursor-pointer' : 'cursor-not-allowed'
                            }`}
                            style={{ 
                              height: '32px',
                              lineHeight: '32px',
                              margin: 0,
                              padding: '0 4px',
                              position: 'relative',
                              backgroundColor: isGenerating 
                                ? 'rgba(196, 181, 253, 0.3)' 
                                : (canUnlock || isUnlocked) 
                                  ? 'rgba(196, 181, 253, 0.25)' 
                                  : 'rgba(196, 181, 253, 0.15)',
                              borderRadius: '2px',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if ((canUnlock || isUnlocked) && !isGenerating) {
                                e.currentTarget.style.backgroundColor = 'rgba(196, 181, 253, 0.35)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = isGenerating 
                                ? 'rgba(196, 181, 253, 0.3)' 
                                : (canUnlock || isUnlocked) 
                                  ? 'rgba(196, 181, 253, 0.25)' 
                                  : 'rgba(196, 181, 253, 0.15)';
                            }}
                          >
                            <span style={{ lineHeight: '32px', fontSize: '18px' }}>
                              {isGenerating ? (
                                <Loader2 size={18} className="text-purple-600/70 animate-spin" />
                              ) : (
                                <Moon size={18} className={canUnlock || isUnlocked ? 'text-purple-600/70' : 'text-purple-400/50'} />
                              )}
                            </span>
                            <span 
                              className={`handwriting text-[14px] ${isGenerating ? 'text-purple-700/70' : canUnlock || isUnlocked ? 'text-purple-800/80' : 'text-purple-600/50'}`}
                              style={{ lineHeight: '32px' }}
                            >
                              {isGenerating 
                                ? 'generating devotional...' 
                                : isUnlocked 
                                  ? 'View Devotional for the day' 
                                  : 'unlock devotional'}
                            </span>
                            {!canUnlock && !isUnlocked && !isGenerating && (
                              <span 
                                className={`handwriting text-purple-500/60 text-[12px] italic`}
                                style={{ lineHeight: '32px', marginLeft: '8px' }}
                              >
                                {!hasEntries ? 'need at least 1 entry to unlock' : 'available after 9pm'}
                              </span>
                            )}
                            {(canUnlock || isUnlocked) && !isGenerating && (
                              <span className="ml-auto text-purple-400/60 group-hover:text-purple-600/80 transition-colors" style={{ lineHeight: '32px' }}>
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          );
        })}
        </div>{/* end transform inner */}
      </div>
    </div>
  );
};

export default JournalTimeline;
