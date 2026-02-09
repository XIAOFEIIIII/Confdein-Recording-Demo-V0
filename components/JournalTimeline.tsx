import React, { useState, useEffect, useRef } from 'react';
import { JournalEntry } from '../types';
import { format, startOfDay, startOfWeek, addDays } from 'date-fns';
import { Quote } from 'lucide-react';

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
}

const WEEK_STARTS_ON = 0; // Sunday

const JournalTimeline: React.FC<JournalTimelineProps> = ({
  entries,
  weekStart: weekStartProp,
  onEntryClick,
  scrollToDayIndex = null,
  onPageChange,
  useRomanFont = false,
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
                    linear-gradient(90deg, transparent 32px, #d8b9b0 32px, #d8b9b0 33px, transparent 33px),
                    repeating-linear-gradient(#fbfbfa, #fbfbfa 31px, #e9e8e6 31px, #e9e8e6 32px)
                  `,
                  backgroundSize: '100% 100%, 100% 32px',
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
                dayEntries.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="relative group animate-in fade-in duration-700 cursor-pointer"
                      onClick={() => onEntryClick?.(entry)}
                    >
                      {/* Time Header: Exactly 32px high, aligned to grid */}
                      <div 
                        className="flex items-center select-none"
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
                                  className={`handwriting text-stone-800 ${textScripture} opacity-90 select-none`}
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

                      {/* Spacer: 32px gap between content and keywords */}
                      <div style={{ height: '32px' }} />

                      {/* Metadata Footer: keywords only, each row 32px so wrap aligns to grid */}
                      <div 
                        className="flex flex-wrap items-stretch gap-x-3 gap-y-0"
                        style={{ 
                          minHeight: '32px',
                          margin: 0,
                          padding: 0
                        }}
                      >
                        {entry.keywords && entry.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className={`${textMeta} text-stone-400 inline-flex items-center`}
                            style={{ height: '32px', lineHeight: '32px' }}
                          >
                            #{kw.toLowerCase()}
                          </span>
                        ))}
                      </div>
                      
                      {/* Entry Spacer: Exactly 32px high (1 row) */}
                      <div style={{ height: '32px', margin: 0, padding: 0 }} />
                    </div>
                ))
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
