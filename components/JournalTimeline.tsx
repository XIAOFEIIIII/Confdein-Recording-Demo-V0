
import React, { useState, useEffect, useRef } from 'react';
import { JournalEntry, Mood } from '../types';
import { format, startOfDay, isToday } from 'date-fns';
import { Quote } from 'lucide-react';

interface JournalTimelineProps {
  entries: JournalEntry[];
}

const MOOD_CONFIG: Record<Mood, { icon: string; color: string }> = {
  peaceful: { icon: '🕊️', color: 'text-sky-600' },
  anxious: { icon: '😟', color: 'text-orange-600' },
  grateful: { icon: '🌿', color: 'text-emerald-600' },
  heavy: { icon: '☁️', color: 'text-stone-500' },
  hopeful: { icon: '✨', color: 'text-rose-600' },
};

const JournalTimeline: React.FC<JournalTimelineProps> = ({ entries }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-16 text-stone-200">
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
              {/* Each day page - scrollable vertically */}
              <div className="h-full overflow-y-auto no-scrollbar px-16 pb-[160px]" style={{ paddingTop: '0px', marginTop: '0px', height: '100%' }}>
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
                  <span className="text-sm font-bold text-stone-700 uppercase tracking-[0.2em]" style={{ lineHeight: '32px' }}>
                    {format(entryDate, 'MMMM d')}
                  </span>
                </div>
                
                {dayEntries.map((entry, entryIndex) => {
                  const mood = entry.mood ? MOOD_CONFIG[entry.mood] : null;
                  
                  return (
                    <div 
                      key={entry.id} 
                      className="relative group animate-in fade-in duration-700"
                    >
                      {/* Time/Mood Header: Exactly 32px high, aligned to grid */}
                      <div 
                        className="flex items-center gap-4 select-none"
                        style={{ 
                          height: '32px',
                          lineHeight: '32px',
                          margin: 0,
                          padding: 0
                        }}
                      >
                         <span className="text-[9px] font-bold text-stone-200 tracking-widest uppercase" style={{ lineHeight: '32px' }}>
                          {format(entry.timestamp, 'HH:mm')}
                        </span>
                        {mood && (
                          <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity" style={{ lineHeight: '32px' }}>
                            <span className="text-xs" style={{ lineHeight: '32px' }}>{mood.icon}</span>
                            <span className={`text-[8px] font-bold uppercase tracking-widest ${mood.color}`} style={{ lineHeight: '32px' }}>{entry.mood}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Handwriting Content Area */}
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
                        <p 
                          className="handwriting text-stone-800 text-[15px] opacity-90 select-none"
                          style={{
                            lineHeight: '32px',
                            margin: 0,
                            padding: 0,
                            display: 'block',
                            height: 'auto',
                            minHeight: '32px'
                          }}
                        >
                          {entry.transcript}
                        </p>
                      </div>

                      {/* Metadata Footer: Exactly 32px high */}
                      <div 
                        className="flex items-center gap-3"
                        style={{ 
                          height: '32px',
                          lineHeight: '32px',
                          margin: 0,
                          padding: 0
                        }}
                      >
                        {entry.keywords && entry.keywords.map((kw, i) => (
                          <span key={i} className="text-[8px] font-bold uppercase tracking-widest text-stone-300" style={{ lineHeight: '32px' }}>
                            #{kw}
                          </span>
                        ))}
                      </div>
                      
                      {/* Entry Spacer: Exactly 32px high (1 row) */}
                      <div style={{ height: '32px', margin: 0, padding: 0 }} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JournalTimeline;
