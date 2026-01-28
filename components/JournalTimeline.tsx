
import React from 'react';
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

  return (
    <div className="w-full">
      <div className="px-16 pb-[160px]">
        {dayKeys.map((dayKey) => {
          const dayEntries = groupedEntries[dayKey];
          const entryDate = new Date(dayKey);
          const showDateHeader = !isToday(entryDate);
          
          return (
            <div key={dayKey} className="flex flex-col">
              {/* 
                Date Header Block: Exactly 64px high (2 rows) 
              */}
              {showDateHeader ? (
                <div className="h-[64px] flex items-end pb-2">
                  <span className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.4em] border-b border-stone-100 pb-1">
                    {format(entryDate, 'MMMM d, yyyy')}
                  </span>
                </div>
              ) : (
                /* Today just gets a small breathing space of 32px if there are entries below */
                <div className="h-8" />
              )}
              
              {dayEntries.map((entry) => {
                const mood = entry.mood ? MOOD_CONFIG[entry.mood] : null;
                return (
                  <div key={entry.id} className="relative group animate-in fade-in duration-700">
                    {/* Time/Mood Header: Exactly 32px high */}
                    <div className="flex items-center gap-4 h-8 select-none">
                       <span className="text-[9px] font-bold text-stone-200 tracking-widest uppercase">
                        {format(entry.timestamp, 'HH:mm')}
                      </span>
                      {mood && (
                        <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs">{mood.icon}</span>
                          <span className={`text-[8px] font-bold uppercase tracking-widest ${mood.color}`}>{entry.mood}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* 
                      Handwriting Content Area:
                      - The parent container is block to ensure it flows correctly.
                      - leading-[32px] is absolute to stay on grid.
                      - translate-y-[10px] for Playwrite AU NSW to sit perfectly on the line.
                    */}
                    <div className="block">
                      <p className="handwriting text-stone-800 leading-[32px] text-[15px] opacity-90 select-none translate-y-[10px]">
                        {entry.transcript}
                      </p>
                    </div>

                    {/* 
                      Metadata Footer: Exactly 32px high 
                      Note: We add a dummy row here if there are no tags to keep rhythm.
                    */}
                    <div className="h-8 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 mt-2">
                      {entry.keywords && entry.keywords.map((kw, i) => (
                        <span key={i} className="text-[8px] font-bold uppercase tracking-widest text-stone-300">
                          #{kw}
                        </span>
                      ))}
                    </div>
                    
                    {/* Entry Spacer: Exactly 32px high (1 row) */}
                    <div className="h-8" />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JournalTimeline;
