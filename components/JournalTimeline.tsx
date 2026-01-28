
import React from 'react';
import { JournalEntry } from '../types';
import { format } from 'date-fns';
import { Quote, Sparkles } from 'lucide-react';

interface JournalTimelineProps {
  entries: JournalEntry[];
}

const JournalTimeline: React.FC<JournalTimelineProps> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-400">
        <Quote size={48} className="opacity-10 mb-4" />
        <p className="text-sm italic">"Let your soul speak through the ring..."</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      {entries.sort((a,b) => b.timestamp - a.timestamp).map((entry) => (
        <div key={entry.id} className="relative pl-6 border-l border-stone-200">
          <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-stone-900" />
          
          <div className="mb-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              {format(entry.timestamp, 'MMM dd, HH:mm')}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 group transition-all hover:shadow-md">
            <p className="text-stone-800 leading-relaxed mb-4">
              {entry.transcript}
            </p>
            
            {entry.summary && (
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100/50 flex gap-3">
                <Sparkles size={16} className="text-amber-400 shrink-0 mt-1" />
                <p className="text-xs text-stone-500 italic leading-snug">
                  {entry.summary}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {entry.keywords.map((kw, i) => (
                <span key={i} className="text-[9px] font-bold uppercase tracking-wider bg-stone-100 text-stone-500 px-2 py-1 rounded">
                  #{kw}
                </span>
              ))}
              {entry.mood && (
                 <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2 py-1 rounded">
                 {entry.mood}
               </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JournalTimeline;
