import React from 'react';

export type JournalSubTab = 'journal' | 'prayer' | 'verse';

interface JournalSideTabsProps {
  value: JournalSubTab;
  onChange: (next: JournalSubTab) => void;
}

const ITEMS: Array<{ id: JournalSubTab; label: string }> = [
  { id: 'journal', label: 'Journal' },
  { id: 'prayer', label: 'Prayer' },
  { id: 'verse', label: 'Verse' },
];

const STICKY_COLORS: Record<JournalSubTab, { active: string; inactive: string }> = {
  // pastel sticky-note vibes (very light)
  journal: { active: 'bg-[#f7dfe6]/85', inactive: 'bg-[#f7dfe6]/55' }, // pink
  prayer: { active: 'bg-[#fbf3c9]/85', inactive: 'bg-[#fbf3c9]/55' }, // yellow
  verse: { active: 'bg-[#d9e9fb]/85', inactive: 'bg-[#d9e9fb]/55' },  // blue
};

const JournalSideTabs: React.FC<JournalSideTabsProps> = ({ value, onChange }) => {
  return (
    <div className="absolute top-24 right-0 flex flex-col gap-0.5 z-40">
      {ITEMS.map((item) => {
        const isActive = value === item.id;
        const colors = STICKY_COLORS[item.id];
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`
              relative w-7 flex items-center justify-center transition-all duration-300
              rounded-l-md shadow-sm
              ${isActive
                ? `h-28 ${colors.active} text-[#141413] shadow-[0_8px_20px_rgba(0,0,0,0.06)] z-10`
                : `h-20 ${colors.inactive} text-[#141413]/85 hover:text-[#141413] z-0`
              }
            `}
          >
            <span className="text-[8px] font-bold uppercase tracking-[0.25em] whitespace-nowrap -rotate-90 select-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default JournalSideTabs;

