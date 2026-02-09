import React, { useEffect, useRef } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
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

  // On scroll (debounce): detect which week is in view and notify parent
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
      className="flex-shrink-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar border-b border-[#e9e8e6] bg-[#fbfbfa]"
      style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
    >
      {weeks.map((weekStart) => {
        const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
        return (
          <div
            key={weekStart.getTime()}
            className="flex-shrink-0 w-full flex justify-center py-3 snap-start"
            style={{ minWidth: '100%' }}
          >
            <div className="w-full max-w-4xl px-8 flex items-center justify-between gap-1">
            {days.map((day, index) => {
              const isSelected = selectedDayIndex === index;
              const dayKey = format(day, 'yyyy-MM-dd');
              const hasEntry = datesWithEntries.has(dayKey);
              return (
                <button
                  type="button"
                  key={day.getTime()}
                  onClick={() => onDayClick(index)}
                  className={`flex flex-col items-center justify-center min-w-[2.5rem] py-2 px-1 rounded-xl transition-colors ${
                    isSelected ? 'bg-[#e9e8e6]/80' : 'hover:bg-[#e9e8e6]/40'
                  }`}
                >
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                      isSelected ? 'text-[#4a3a33]' : hasEntry ? 'text-[#4a3a33]/75' : 'text-[#4a3a33]/45'
                    }`}
                  >
                    {format(day, 'EEEE').slice(0, 2)}
                  </span>
                  <span
                    className={`text-[12px] font-bold mt-0.5 ${
                      isSelected ? 'text-[#4a3a33]' : hasEntry ? 'text-[#4a3a33]/75' : 'text-[#4a3a33]/45'
                    }`}
                  >
                    {format(day, 'dd')}
                  </span>
                  {hasEntry && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4a3a33]/40 mt-1" aria-hidden />
                  )}
                  {isSelected && (
                    <Check size={12} className="text-[#4a3a33] mt-1 stroke-[2.5]" />
                  )}
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
