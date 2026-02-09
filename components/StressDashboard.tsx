import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StressData } from '../types';
import { Wind, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

interface StressDashboardProps {
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

const dummyData: StressData[] = [
  { time: '6am', level: 20, hrv: 85 },
  { time: '9am', level: 45, hrv: 70 },
  { time: '12pm', level: 65, hrv: 55 },
  { time: '3pm', level: 55, hrv: 62 },
  { time: '6pm', level: 30, hrv: 78 },
  { time: '9pm', level: 15, hrv: 90 },
];

const getInitialVerseIndex = () => {
  return Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % STRESS_COMFORT_VERSES.length;
};

const StressDashboard: React.FC<StressDashboardProps> = ({ onStartMeditation }) => {
  const maxLevel = Math.max(...dummyData.map((d) => d.level));
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
    <div className="space-y-12 py-4">
      <div className="space-y-6">
        <div>
          <h3 className="text-[#4a3a33]/45 text-[10px] font-bold uppercase tracking-widest mb-1">State of Heart</h3>
          <p className="text-2xl font-semibold text-[#4a3a33]">Quiet Waters</p>
        </div>
        
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dummyData}>
              <defs>
                <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4a3a33" stopOpacity={0.07}/>
                  <stop offset="95%" stopColor="#4a3a33" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                cursor={{ stroke: '#e3e1dc', strokeWidth: 1 }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.05)', backgroundColor: 'rgba(255,255,255,0.9)' }}
              />
              <Area 
                type="monotone" 
                dataKey="level" 
                stroke="#4a3a33" 
                strokeWidth={1}
                fillOpacity={1} 
                fill="url(#colorLevel)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-[9px] text-[#4a3a33]/45 font-bold uppercase tracking-widest">
          <span>Rise</span>
          <span>Noon</span>
          <span>Now</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 border-t border-[#e3e1dc] pt-8">
        <div>
          <p className="text-[#4a3a33]/45 text-[9px] font-bold uppercase tracking-widest mb-2">HRV Score</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-normal text-[#4a3a33]">84</p>
            <span className="text-[10px] text-[#4a3a33]/45 font-bold uppercase">ms</span>
          </div>
        </div>
        <div>
          <p className="text-[#4a3a33]/45 text-[9px] font-bold uppercase tracking-widest mb-2">Daily Load</p>
          <p className="text-3xl font-normal text-[#4a3a33]">Gentle</p>
        </div>
      </div>

      {isStressed && (
        <div className="border-t border-[#e3e1dc] pt-8">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-[#4a3a33]/45" />
              <p className="text-[#4a3a33]/45 text-[9px] font-bold uppercase tracking-widest">When you’re stressed</p>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={goPrevVerse}
                className="p-2 text-[#4a3a33]/45 hover:text-[#4a3a33] hover:bg-[#4a3a33]/5 rounded-full transition-colors"
                aria-label="Previous verse"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={goNextVerse}
                className="p-2 text-[#4a3a33]/45 hover:text-[#4a3a33] hover:bg-[#4a3a33]/5 rounded-full transition-colors"
                aria-label="Next verse"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="bg-[#f6f5f3]/50 rounded-2xl p-5 shadow-sm h-[144px] flex flex-col overflow-hidden">
            <p className="melrose-text text-[#4a3a33] overflow-y-auto flex-1 min-h-0">"{recommendedVerse.verse}"</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#4a3a33]/45 mt-3 flex-shrink-0">
              — {recommendedVerse.reference}
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onStartMeditation}
        className="w-full bg-[#f6f5f3]/50 text-[#4a3a33] h-16 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#f6f5f3]/70 transition-all group shadow-sm"
      >
        <Wind size={16} className="text-[#4a3a33]/45 group-hover:rotate-90 transition-transform duration-1000" />
        Pause for a Minute
      </button>
    </div>
  );
};

export default StressDashboard;
