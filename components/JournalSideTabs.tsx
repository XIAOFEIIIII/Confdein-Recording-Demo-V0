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
    <div className="absolute top-24 right-0 flex flex-col gap-0 z-40">
      {ITEMS.map((item, idx) => {
        const isActive = value === item.id;
        const colors = STICKY_COLORS[item.id];
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`
              relative w-10 h-24 flex items-center justify-center transition-all duration-500
              rounded-l-lg origin-right shadow-sm
              ${isActive
                ? `${colors.active} text-[#4a3a33] translate-x-[-4px] shadow-[0_10px_24px_rgba(74,58,51,0.10)] scale-110 z-10`
                : `${colors.inactive} text-[#4a3a33]/85 hover:text-[#4a3a33] translate-x-0 z-0`
              }
            `}
            style={{ top: `${idx * 4}px` }}
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] whitespace-nowrap -rotate-90 select-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default JournalSideTabs;

