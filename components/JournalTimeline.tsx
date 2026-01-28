
import React from 'react';
import { JournalEntry } from '../types';
import { format, startOfDay } from 'date-fns';
import { Quote, Clock } from 'lucide-react';

interface JournalTimelineProps {
  entries: JournalEntry[];
}

const JournalTimeline: React.FC<JournalTimelineProps> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-300">
        <Quote size={40} className="opacity-20 mb-4" />
        <p className="text-sm italic font-light">Waiting for your soul to speak...</p>
      </div>
    );
  }

  // 排序：按时间倒序
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  // 按天聚合逻辑
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
    <div className="space-y-16 pb-32">
      {dayKeys.map((dayKey) => {
        const dayEntries = groupedEntries[dayKey];
        const dateObj = new Date(dayKey);
        
        return (
          <div key={dayKey} className="relative">
            {/* 每日聚合标题 */}
            <div className="sticky top-16 bg-stone-50/40 backdrop-blur-sm z-10 py-2 mb-8">
              <div className="flex items-baseline gap-3">
                <h2 className="serif text-2xl font-medium text-stone-800">
                  {format(dateObj, 'EEEE, MMM d')}
                </h2>
                <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">
                  {dayEntries.length} {dayEntries.length === 1 ? 'Moment' : 'Moments'}
                </span>
              </div>
            </div>

            {/* 当天条目流 */}
            <div className="relative ml-1 space-y-10">
              {/* 贯穿全天的垂直线 - 增强聚合感 */}
              <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-stone-200" />

              {dayEntries.map((entry, index) => (
                <div key={entry.id} className="relative pl-8 group">
                  {/* 时间线连接点 */}
                  <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border border-stone-300 transition-colors group-hover:border-stone-900 z-10`} />
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-stone-400">
                      <Clock size={10} />
                      <span className="text-[10px] font-bold tracking-wider">
                        {format(entry.timestamp, 'HH:mm')}
                      </span>
                    </div>

                    <div className="pr-4">
                      <p className="text-stone-700 leading-relaxed font-light text-[15px] select-none">
                        {entry.transcript}
                      </p>
                      
                      {entry.keywords && entry.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {entry.keywords.map((kw, i) => (
                            <span key={i} className="text-[9px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors cursor-default">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 分隔符（非最后一项） */}
                  {index !== dayEntries.length - 1 && (
                    <div className="mt-10 border-b border-stone-100/50 w-full" />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default JournalTimeline;
