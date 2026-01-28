
import React from 'react';
import { JournalEntry, Mood } from '../types';
import { format, startOfDay } from 'date-fns';
import { Quote, Clock } from 'lucide-react';

interface JournalTimelineProps {
  entries: JournalEntry[];
}

const MOOD_CONFIG: Record<Mood, { label: string; color: string; bg: string }> = {
  peaceful: { label: '🕊️ Peaceful', color: 'text-sky-700', bg: 'bg-sky-50' },
  anxious: { label: '😟 Anxious', color: 'text-orange-700', bg: 'bg-orange-50' },
  grateful: { label: '🌿 Grateful', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  heavy: { label: '☁️ Heavy', color: 'text-stone-600', bg: 'bg-stone-100' },
  hopeful: { label: '✨ Hopeful', color: 'text-rose-600', bg: 'bg-rose-50' },
};

const JournalTimeline: React.FC<JournalTimelineProps> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-300">
        <Quote size={40} className="opacity-20 mb-4" />
        <p className="text-sm italic font-light">Waiting for your soul to speak...</p>
      </div>
    );
  }

  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  const groupedEntries: { [key: string]: JournalEntry[] } = {};
  sortedEntries.forEach(entry => {
    const dayKey = format(startOfDay(entry.timestamp), 'yyyy-MM-dd');
    if (!groupedEntries[dayKey]) {
      groupedEntries[dayKey] = [];
    }
    groupedEntries[dayKey].push(entry);
  });

  const dayKeys = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-10 pb-32">
      {dayKeys.map((dayKey) => {
        const dayEntries = groupedEntries[dayKey];
        const dateObj = new Date(dayKey);
        
        return (
          <div key={dayKey} className="relative animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Daily "Page" Card */}
            <div className="bg-white border border-stone-200/60 rounded-[2.5rem] shadow-sm overflow-hidden">
              
              {/* Daily Header - Embedded in the page */}
              <div className="px-8 pt-8 pb-4 border-b border-stone-100/50 flex items-baseline justify-between">
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.3em] mb-1">
                    Daily Chapter
                  </span>
                  <h2 className="serif text-2xl font-semibold text-stone-900 tracking-tight">
                    {format(dateObj, 'EEEE, MMM d')}
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center">
                   <span className="text-[11px] font-bold text-stone-400">{dayEntries.length}</span>
                </div>
              </div>

              {/* Entries Layer */}
              <div className="divide-y divide-stone-50">
                {dayEntries.map((entry, index) => {
                  const moodInfo = entry.mood ? MOOD_CONFIG[entry.mood] : null;
                  
                  return (
                    <div 
                      key={entry.id} 
                      className={`p-8 hover:bg-stone-50/30 transition-colors duration-300 group`}
                    >
                      {/* Meta: Time */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-200 group-hover:bg-stone-400 transition-colors" />
                        <span className="text-[9px] font-bold text-stone-400 tracking-widest uppercase">
                          {format(entry.timestamp, 'HH:mm')}
                        </span>
                      </div>

                      {/* Content: Handwriting */}
                      <div className="mb-6">
                        <p className="handwriting text-stone-800 leading-relaxed text-[21px] px-1 opacity-90 group-hover:opacity-100 transition-opacity">
                          {entry.transcript}
                        </p>
                      </div>
                      
                      {/* Footer: Mood Label & Tags at the bottom */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        {moodInfo && (
                          <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest ${moodInfo.bg} ${moodInfo.color} border border-stone-200/20 shadow-sm`}>
                            {moodInfo.label}
                          </span>
                        )}
                        
                        {entry.keywords && entry.keywords.length > 0 && (
                          <div className="flex gap-2">
                            {entry.keywords.map((kw, i) => (
                              <span key={i} className="text-[9px] font-bold uppercase tracking-widest text-stone-300 group-hover:text-stone-400 transition-colors">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Page Footer Decoration */}
              <div className="h-4 bg-stone-50/50 w-full" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default JournalTimeline;
