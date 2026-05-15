import { LayoutDashboard, Package, History, Settings } from 'lucide-react';
import { AppTab } from '../types';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'Summ', label: 'Summ.', icon: LayoutDashboard },
    { id: 'Goods', label: 'Goods', icon: Package },
    { id: 'Audit', label: 'Audit', icon: History },
    { id: 'Sett', label: 'Sett.', icon: Settings },
  ] as const;

  return (
    <nav id="bottom-nav" className="fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-black border-t border-slate-200 dark:border-slate-800 px-4 flex items-center justify-around z-50 transition-colors">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id.toLowerCase()}`}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center h-16 w-1/3 transition-colors ${
              isActive ? 'text-black dark:text-white' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Icon size={24} className={isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'} />
            <span className="text-[10px] font-bold uppercase mt-1 tracking-wider">{tab.label}</span>
            {isActive && <div id={`nav-indicator-${tab.id.toLowerCase()}`} className="absolute bottom-2 w-1 h-1 bg-black dark:bg-white rounded-full" />}
          </button>
        );
      })}
    </nav>
  );
}
