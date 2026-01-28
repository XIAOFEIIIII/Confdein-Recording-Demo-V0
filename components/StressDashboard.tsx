
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StressData } from '../types';
import { Wind, ShieldCheck } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">Current State</h3>
            <p className="text-2xl font-semibold text-stone-900">Holy Pause Recommended</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="text-amber-500" />
          </div>
        </div>
        
        <div className="h-48 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dummyData}>
              <defs>
                <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d6d3d1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#d6d3d1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area 
                type="monotone" 
                dataKey="level" 
                stroke="#78716c" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorLevel)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-[10px] text-stone-400 font-bold uppercase mt-2">
          <span>Morning</span>
          <span>Now</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-stone-900 p-5 rounded-3xl text-white">
          <p className="text-stone-400 text-xs font-medium mb-1">HRV Avg</p>
          <p className="text-3xl font-light">72 <span className="text-sm opacity-50">ms</span></p>
          <div className="mt-3 text-[10px] text-emerald-400 font-bold">+12% from yesterday</div>
        </div>
        <div className="bg-stone-50 p-5 rounded-3xl border border-stone-100">
          <p className="text-stone-500 text-xs font-medium mb-1">Stress Level</p>
          <p className="text-3xl font-light text-stone-900">Moderate</p>
          <div className="mt-3 text-[10px] text-stone-400 font-bold italic">Reflecting on "Work"</div>
        </div>
      </div>

      <button className="w-full bg-white border-2 border-stone-900 text-stone-900 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-stone-900 hover:text-white transition-all group">
        <Wind size={20} className="group-hover:animate-bounce" />
        Start 1-Min Holy Pause
      </button>
    </div>
  );
};

export default StressDashboard;
