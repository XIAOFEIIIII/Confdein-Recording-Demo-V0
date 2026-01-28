
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StressData } from '../types';
import { Wind, ShieldCheck, Heart } from 'lucide-react';

const dummyData: StressData[] = [
  { time: '6am', level: 20, hrv: 85 },
  { time: '9am', level: 45, hrv: 70 },
  { time: '12pm', level: 65, hrv: 55 },
  { time: '3pm', level: 55, hrv: 62 },
  { time: '6pm', level: 30, hrv: 78 },
  { time: '9pm', level: 15, hrv: 90 },
];

const StressDashboard: React.FC = () => {
  return (
    <div className="space-y-12 py-4">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-[#4a3a33]/45 text-[10px] font-bold uppercase tracking-widest mb-1">State of Heart</h3>
            <p className="text-2xl font-semibold text-[#4a3a33]">Quiet Waters</p>
          </div>
          <div className="w-10 h-10 bg-[#f6f5f3] rounded-full flex items-center justify-center border border-[#e3e1dc] shadow-sm">
            <Heart size={18} className="text-rose-300" />
          </div>
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

      <button className="w-full bg-[#f6f5f3] border border-[#e3e1dc] text-[#4a3a33] h-16 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#f0efed] transition-all group">
        <Wind size={16} className="text-[#4a3a33]/45 group-hover:rotate-90 transition-transform duration-1000" />
        Pause for a Minute
      </button>
    </div>
  );
};

export default StressDashboard;
