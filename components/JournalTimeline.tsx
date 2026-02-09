import React, { useState, useEffect, useRef, useMemo } from 'react';
import { JournalEntry } from '../types';
import { format, startOfDay, startOfWeek, addDays, parse } from 'date-fns';
import { Quote, Lock, Moon, BookOpen, ChevronRight, Loader2 } from 'lucide-react';

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
  const textMain = useRomanFont ? 'text-[17px]' : 'text-[15px]';
  const textScripture = useRomanFont ? 'text-[15px]' : 'text-[13px]';
  const textTime = useRomanFont ? 'text-[13px]' : 'text-[12px]';
  const textMeta = useRomanFont ? 'text-[13px]' : 'text-[12px]';
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollToDayIndexRef = useRef<number | null>(null);

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

  // Scroll to day when parent sets scrollToDayIndex (e.g. week timeline click)
  useEffect(() => {
    if (scrollToDayIndex == null || scrollToDayIndex === scrollToDayIndexRef.current) return;
    if (scrollToDayIndex === currentPageIndex) {
      scrollToDayIndexRef.current = scrollToDayIndex;
      return;
    }
    scrollToDayIndexRef.current = scrollToDayIndex;
    const container = scrollContainerRef.current;
    if (!container) return;
    setIsScrolling(true);
    container.scrollTo({
      left: scrollToDayIndex * container.clientWidth,
      behavior: 'smooth'
    });
    setCurrentPageIndex(scrollToDayIndex);
    onPageChange?.(scrollToDayIndex);
    setTimeout(() => setIsScrolling(false), 500);
  }, [scrollToDayIndex, currentPageIndex, onPageChange]);

  // Update current page when user scrolls (with snap, each swipe lands on one page)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isScrolling) return;
      const scrollLeft = container.scrollLeft;
      const pageWidth = container.clientWidth;
      const newPageIndex = Math.round(scrollLeft / pageWidth);
      if (newPageIndex !== currentPageIndex && newPageIndex >= 0 && newPageIndex < 7) {
        setCurrentPageIndex(newPageIndex);
        onPageChange?.(newPageIndex);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentPageIndex, isScrolling, onPageChange]);

  const handlePageIndicatorClick = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    setIsScrolling(true);
    container.scrollTo({
      left: index * container.clientWidth,
      behavior: 'smooth'
    });
    setCurrentPageIndex(index);
    onPageChange?.(index);
    setTimeout(() => setIsScrolling(false), 500);
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ height: '100%' }}>
      <div
        ref={scrollContainerRef}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          height: '100%'
        }}
      >
        {dayKeys.map((dayKey) => {
          const dayEntries = groupedEntries[dayKey] ?? [];
          return (
            <div
              key={dayKey}
              className="flex-shrink-0 w-full h-full snap-start"
              style={{
                width: '100%',
                minWidth: '100%',
                height: '100%'
              }}
            >
              {/* Each day page - scrollable vertically; grid on this element so it scrolls with content */}
              <div
                className="h-full overflow-y-auto no-scrollbar px-10 pb-[160px]"
                style={{
                  paddingTop: '0px',
                  marginTop: '0px',
                  height: '100%',
                  backgroundImage: `
                    repeating-linear-gradient(#fbfbfa, #fbfbfa 31px, #e9e8e6 31px, #e9e8e6 32px)
                  `,
                  backgroundSize: '100% 32px',
                  backgroundAttachment: 'local',
                  backgroundPosition: '0 0'
                }}
              >
                {dayEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 px-6 text-stone-300">
                    <Quote size={28} className="opacity-20 mb-4" />
                    <p className={`handwriting ${useRomanFont ? 'text-lg' : 'text-base'} text-center italic opacity-50`}>
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
                      {/* Time Header: Exactly 32px high, aligned to grid */}
                      <div 
                        className="flex items-center gap-2 select-none"
                        style={{ 
                          height: '32px',
                          lineHeight: '32px',
                          margin: 0,
                          padding: 0
                        }}
                      >
                        <span className={`${textTime} font-bold text-stone-200 tracking-widest uppercase`} style={{ lineHeight: '32px' }}>
                          {format(entry.timestamp, 'HH:mm')}
                        </span>
                        <span className="text-stone-300 font-mono" style={{ lineHeight: '32px', fontSize: '18px' }}>
                          {entry.moodLevel === 1 ? ':(' : entry.moodLevel === 2 ? ':/' : entry.moodLevel === 3 ? ':|' : entry.moodLevel === 4 ? ':)' : ':D'}
                        </span>
                        <span className="text-stone-200/40" style={{ lineHeight: '32px' }}>|</span>
                        {(() => {
                          const stressLevel = getStressLevelAtTime(entry.timestamp);
                          const state = getStressState(stressLevel);
                          return (
                            <span className={`${textTime} text-stone-300 lowercase`} style={{ lineHeight: '32px' }}>
                              {state}
                            </span>
                          );
                        })()}
                      </div>
                      
                      {/* Handwriting Content Area: title, then scripture line, then body */}
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
                              className={`handwriting ${useRomanFont ? 'text-[15px]' : 'text-[14px]'} ${isGenerating ? 'text-purple-700/70' : canUnlock || isUnlocked ? 'text-purple-800/80' : 'text-purple-600/50'}`}
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
                                className={`handwriting text-purple-500/60 ${useRomanFont ? 'text-[13px]' : 'text-[12px]'} italic`}
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
      </div>
    </div>
  );
};

export default JournalTimeline;
