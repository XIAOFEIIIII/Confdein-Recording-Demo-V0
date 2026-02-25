import React, { useEffect, useRef } from 'react';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import { Check } from 'lucide-react';

const WEEK_STARTS_ON = 0; // Sunday, must match JournalTimeline
const WEEK_OFFSETS = [-2, -1, 0, 1, 2]; // weeks to show: current ±2

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

interface WeekTimelineProps {
  /** Sunday of the currently selected week (can change by horizontal swipe). */
  selectedWeekStart: Date;
  /** Selected day index within that week (0=Sun..6=Sat). */
  selectedDayIndex: number;
  datesWithEntries: Set<string>;
  onWeekChange: (weekStart: Date) => void;
  onDayClick: (index: number) => void;
}

const WeekTimeline: React.FC<WeekTimelineProps> = ({
  selectedWeekStart,
  selectedDayIndex,
  datesWithEntries,
  onWeekChange,
  onDayClick,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const weeks = WEEK_OFFSETS.map(off => addWeeks(selectedWeekStart, off));
  const selectedWeekIndex = 2;

  // Keep selected week in view when selectedWeekStart changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = selectedWeekIndex * el.clientWidth;
  }, [selectedWeekStart.getTime()]);

  // On scroll (debounce): detect which week is snapped and notify parent
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let tick: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(tick);
      tick = setTimeout(() => {
        const scrollLeft = el.scrollLeft;
        const pageWidth = el.clientWidth;
        const index = Math.round(scrollLeft / pageWidth);
        if (index >= 0 && index < weeks.length) {
          const weekStart = weeks[index];
          if (weekStart.getTime() !== selectedWeekStart.getTime()) {
            onWeekChange(weekStart);
          }
        }
      }, 120);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(tick);
      el.removeEventListener('scroll', handleScroll);
    };
  }, [weeks, selectedWeekStart, onWeekChange]);

  return (
    <div
      ref={scrollRef}
      className="flex-shrink-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar border-b border-[#1f1e1d26]"
      style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
    >
      {weeks.map((weekStart) => {
        const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
        return (
          <div
            key={weekStart.getTime()}
            className="flex-shrink-0 w-full flex justify-center py-2 snap-start"
            style={{ minWidth: '100%' }}
          >
            <div className="w-full max-w-4xl px-8 flex items-center justify-between gap-1">
            {days.map((day, index) => {
              const isSelected = selectedDayIndex === index;
              const isTodayDay = isToday(day);
              const dayKey = format(day, 'yyyy-MM-dd');
              const hasEntry = datesWithEntries.has(dayKey);
              return (
                <button
                  type="button"
                  key={day.getTime()}
                  onClick={() => onDayClick(index)}
                  className={`flex flex-col items-center justify-center min-w-[2.5rem] py-2 px-1 rounded-xl transition-colors ${
                    isSelected ? 'bg-[#f5f4ed]' : 'hover:bg-[#1f1e1d26]/40'
                  }`}
                >
                  <span
                    className={`text-[12px] uppercase tracking-wider ${
                      isTodayDay ? 'font-bold' : 'font-semibold'
                    } ${
                      isTodayDay ? 'text-[#141413]' : hasEntry ? 'text-[#141413]/75' : 'text-[#141413]/45'
                    }`}
                  >
                    {format(day, 'EEEE').slice(0, 2)}
                  </span>
                  <span
                    className={`text-[12px] mt-0.5 ${
                      isTodayDay ? 'font-extrabold' : 'font-bold'
                    } ${
                      isTodayDay ? 'text-[#141413]' : hasEntry ? 'text-[#141413]/75' : 'text-[#141413]/45'
                    }`}
                  >
                    {format(day, 'dd')}
                  </span>
                  {/* 对勾行常驻，保持高度一致 */}
                  <span className="mt-1 h-3 flex items-center justify-center">
                    {hasEntry
                      ? <Check size={12} className="text-[#141413]/50 stroke-[2.5]" />
                      : <span className="w-1 h-1 rounded-full bg-[#141413]/25" />
                    }
                  </span>
                </button>
              );
            })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeekTimeline;
