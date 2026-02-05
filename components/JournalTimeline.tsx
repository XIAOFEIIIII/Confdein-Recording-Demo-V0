
import React, { useState, useEffect, useRef } from 'react';
import { JournalEntry } from '../types';
import { format, startOfDay, isToday } from 'date-fns';
import { Quote } from 'lucide-react';

interface JournalTimelineProps {
  entries: JournalEntry[];
}

const JournalTimeline: React.FC<JournalTimelineProps> = ({ entries }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-10 text-stone-200">
        <Quote size={32} className="opacity-10 mb-6" />
        <p className="handwriting text-xl text-center italic opacity-40">
          The page is waiting for your voice...
        </p>
      </div>
    );
  }

  // Group entries by day
  const groupedEntries: { [key: string]: JournalEntry[] } = {};
  [...entries]
    .sort((a, b) => b.timestamp - a.timestamp)
    .forEach(entry => {
      const dayKey = format(startOfDay(entry.timestamp), 'yyyy-MM-dd');
      if (!groupedEntries[dayKey]) groupedEntries[dayKey] = [];
      groupedEntries[dayKey].push(entry);
    });

  const dayKeys = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

  // Handle scroll to update current page
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isScrolling) return;
      
      const scrollLeft = container.scrollLeft;
      const pageWidth = container.clientWidth;
      const newPageIndex = Math.round(scrollLeft / pageWidth);
      
      if (newPageIndex !== currentPageIndex && newPageIndex >= 0 && newPageIndex < dayKeys.length) {
        setCurrentPageIndex(newPageIndex);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentPageIndex, isScrolling, dayKeys.length]);

  // Scroll to page on index change (only when clicking indicator)
  const handlePageIndicatorClick = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setIsScrolling(true);
    container.scrollTo({
      left: index * container.clientWidth,
      behavior: 'smooth'
    });
    
    setTimeout(() => setIsScrolling(false), 500);
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ height: '100%' }}>
      {/* Horizontal scrollable container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          height: '100%'
        }}
      >
        {dayKeys.map((dayKey, dayIndex) => {
          const dayEntries = groupedEntries[dayKey];
          const entryDate = new Date(dayKey);
          const isTodayPage = isToday(entryDate);
          
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
                {/* Date Header Block: Exactly 64px high */}
                <div 
                  className="flex items-end"
                  style={{ 
                    height: '64px',
                    margin: 0,
                    padding: 0,
                    paddingBottom: '2px'
                  }}
                >
                  <div className="flex items-baseline" style={{ lineHeight: '32px' }}>
                    <span
                      className={`uppercase tracking-[0.2em] ${
                        isTodayPage ? 'text-[15px] font-bold text-stone-900' : 'text-sm font-bold text-stone-700'
                      }`}
                      style={{ lineHeight: '32px' }}
                    >
                      {format(entryDate, 'MMMM d')}
                    </span>
                  </div>
                </div>
                
                {dayEntries.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="relative group animate-in fade-in duration-700"
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
                        <span className="text-[12px] font-bold text-stone-200 tracking-widest uppercase" style={{ lineHeight: '32px' }}>
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
                          return (
                            <>
                              <p 
                                className="handwriting text-stone-800 text-[15px] opacity-90 select-none whitespace-pre-line journal-transcript"
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
                                  className="handwriting text-stone-800 text-[13px] opacity-90 select-none"
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
                                  className="handwriting text-stone-800 text-[15px] opacity-90 select-none whitespace-pre-line"
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
                            className="text-[12px] text-stone-500 inline-flex items-center px-2 py-1 rounded-full bg-stone-200/60"
                            style={{ height: '32px', lineHeight: '32px' }}
                          >
                            #{kw.toLowerCase()}
                          </span>
                        ))}
                      </div>
                      
                      {/* Entry Spacer: Exactly 32px high (1 row) */}
                      <div style={{ height: '32px', margin: 0, padding: 0 }} />
                    </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JournalTimeline;
