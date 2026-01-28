
import React from 'react';
import { BookOpen, Activity, Heart, Bookmark } from 'lucide-react';
import { AppTab } from '../types';

interface NavigationProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: AppTab.JOURNAL, icon: BookOpen, label: 'Journal' },
    { id: AppTab.HEALTH, icon: Activity, label: 'Health' },
    { id: AppTab.DEVOTIONAL, icon: Heart, label: 'Devo' },
    { id: AppTab.PRAYER, icon: Bookmark, label: 'Prayer' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-stone-100 flex justify-around items-center py-4 px-2 safe-area-inset-bottom z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all ${
              isActive ? 'text-stone-900 scale-110' : 'text-stone-400'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;
