import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StressData } from '../types';
import { Wind, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

interface StressDashboardProps {
  /** Date key (yyyy-MM-dd) for the curve; when user selects a day in the week, this changes. */
  selectedDateKey?: string;
  onStartMeditation: () => void;
}

const STRESSED_THRESHOLD = 55; // level >= this is "Stressed" band

const STRESS_COMFORT_VERSES: Array<{ verse: string; reference: string }> = [
  { verse: 'Come to me, all who labor and are heavy laden, and I will give you rest.', reference: 'Matthew 11:28' },
  { verse: 'Be still, and know that I am God.', reference: 'Psalm 46:10' },
  { verse: 'My grace is sufficient for you, for my power is made perfect in weakness.', reference: '2 Corinthians 12:9' },
  { verse: 'Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled.', reference: 'John 14:27' },
  { verse: 'The Lord is near to the brokenhearted and saves the crushed in spirit.', reference: 'Psalm 34:18' },
];

/** Date key (yyyy-MM-dd) -> several distinct 0..1 seeds so adjacent dates look very different */
function dateSeeds(dateKey: string): [number, number, number, number] {
  const parts = dateKey.split('-').map(Number);
  const y = parts[0] ?? 2026;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const n = y * 372 + m * 31 + d;
  const mix = (a: number, b: number) => ((a * 7919 + b * 7907) % 10007) / 10007;
  return [
    mix(n, 1),
    mix(n, 2),
    mix(n, 3),
    mix(n, 4),
  ];
}

/** Gaussian bump for smooth curves */
const bump = (t: number, center: number, width: number, height: number) =>
  height * Math.exp(-Math.pow((t - center) / width, 2));

/** Generate daily stress curve: shape and level vary clearly by date (different peak times, dip depth, pattern type). */
function getDailyCurveData(dateKey: string): StressData[] {
  const [s0, s1, s2, s3] = dateSeeds(dateKey);
  const times = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  // Pick a distinct pattern type so curves don't all look the same
  const pattern = Math.floor(s0 * 4) % 4; // 0..3
  const morningPeak = 0.2 + s1 * 0.35;   // when morning hump happens
  const afternoonPeak = 0.45 + s2 * 0.35; // when afternoon hump happens
  const peakHeight = 28 + s3 * 24;        // 28..52
  const dipDepth = 12 + s0 * 22;           // 12..34
  const baseLevel = 18 + (s1 - 0.5) * 12; // overall shift

  return times.map((h) => {
    const t = (h - 6) / 15; // 0 at 6am, 1 at 9pm
    let level: number;
    if (pattern === 0) {
      // Early peak, then gentle decline
      level = baseLevel + bump(t, morningPeak, 0.2, peakHeight) + 15 * (1 - t) * (1 - t);
    } else if (pattern === 1) {
      // Afternoon peak, low morning
      level = baseLevel + bump(t, afternoonPeak, 0.25, peakHeight) + 8 * Math.exp(-Math.pow((t - 0.15) / 0.2, 2));
    } else if (pattern === 2) {
      // Midday dip (calm lunch), rise again then evening drop
      const midday = dipDepth * Math.sin(Math.PI * t);
      level = baseLevel + bump(t, 0.2, 0.18, 20) + bump(t, 0.7, 0.2, 18) - midday;
    } else {
      // Double hump: morning and afternoon
      level = baseLevel + bump(t, morningPeak, 0.2, peakHeight * 0.7) + bump(t, afternoonPeak, 0.22, peakHeight * 0.8);
    }
    level = Math.max(10, Math.min(68, level));
    const hrv = Math.round(92 - level * 0.9 + Math.sin(t * Math.PI) * 4);
    const timeLabel = h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`;
    return { time: timeLabel, level: Math.round(level * 10) / 10, hrv: Math.max(42, Math.min(92, hrv)) };
  });
}

const getInitialVerseIndex = () => {
  return Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % STRESS_COMFORT_VERSES.length;
};

const StressDashboard: React.FC<StressDashboardProps> = ({ selectedDateKey, onStartMeditation }) => {
  const dateKey = useMemo(() => {
    if (selectedDateKey) return selectedDateKey;
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, [selectedDateKey]);
  const chartData = useMemo(() => getDailyCurveData(dateKey), [dateKey]);
  const maxLevel = Math.max(...chartData.map((d) => d.level));
  const isStressed = maxLevel >= STRESSED_THRESHOLD;
  const [verseIndex, setVerseIndex] = useState(getInitialVerseIndex);
  const recommendedVerse = STRESS_COMFORT_VERSES[verseIndex];

  const goPrevVerse = () => {
    setVerseIndex((i) => (i - 1 + STRESS_COMFORT_VERSES.length) % STRESS_COMFORT_VERSES.length);
  };
  const goNextVerse = () => {
    setVerseIndex((i) => (i + 1) % STRESS_COMFORT_VERSES.length);
  };

  return (
    <div className="py-4 flex flex-col gap-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-[#141413]/45 text-[10px] font-bold uppercase tracking-widest mb-1">State of Heart</h3>
          <p className="text-[16px] font-semibold text-[#141413]">Quiet Waters</p>
        </div>
        
        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%" key={dateKey}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#141413" stopOpacity={0.07}/>
                  <stop offset="95%" stopColor="#141413" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                cursor={{ stroke: '#1f1e1d66', strokeWidth: 1 }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.05)', backgroundColor: 'rgba(255,255,255,0.9)' }}
              />
              <Area 
                type="monotone" 
                dataKey="level" 
                stroke="#141413" 
                strokeWidth={1}
                fillOpacity={1} 
                fill="url(#colorLevel)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-[10px] text-[#141413]/45 font-bold uppercase tracking-widest">
          <span>Rise</span>
          <span>Noon</span>
          <span>Now</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 border-t border-[#1f1e1d66] pt-6">
        <div>
          <p className="text-[#141413]/45 text-[10px] font-bold uppercase tracking-widest mb-2">HRV Score</p>
          <div className="flex items-baseline gap-1">
            <p className="text-[16px] font-normal text-[#141413]">84</p>
            <span className="text-[10px] text-[#141413]/45 font-bold uppercase">ms</span>
          </div>
        </div>
        <div>
          <p className="text-[#141413]/45 text-[10px] font-bold uppercase tracking-widest mb-2">Daily Load</p>
          <p className="text-[16px] font-normal text-[#141413]">Gentle</p>
        </div>
      </div>

      {isStressed && (
        <div className="border-t border-[#1f1e1d66] pt-6">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-[#141413]/45" />
              <p className="text-[#141413]/45 text-[10px] font-bold uppercase tracking-widest">When you’re stressed</p>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={goPrevVerse}
                className="p-2 text-[#141413]/45 hover:text-[#141413] hover:bg-[#141413]/5 rounded-full transition-colors"
                aria-label="Previous verse"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={goNextVerse}
                className="p-2 text-[#141413]/45 hover:text-[#141413] hover:bg-[#141413]/5 rounded-full transition-colors"
                aria-label="Next verse"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="bg-[#f5f4ed]/50 rounded-2xl p-4 shadow-sm h-[120px] flex flex-col overflow-hidden">
            <p className="melrose-text text-[#141413] overflow-y-auto flex-1 min-h-0">"{recommendedVerse.verse}"</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#141413]/45 mt-2 flex-shrink-0">
              — {recommendedVerse.reference}
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onStartMeditation}
        className="w-full bg-[#f5f4ed]/50 text-[#141413] h-14 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#f5f4ed]/70 transition-all group shadow-sm"
      >
        <Wind size={16} className="text-[#141413]/45 group-hover:rotate-90 transition-transform duration-1000" />
        Pause for a Minute
      </button>
    </div>
  );
};

export default StressDashboard;
