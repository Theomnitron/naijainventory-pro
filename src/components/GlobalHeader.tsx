import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GlobalHeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export default function GlobalHeader({ isDarkMode, toggleTheme }: GlobalHeaderProps) {
  const { profile, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!profile) return null;

  const initials = profile.businessName ? profile.businessName.charAt(0).toUpperCase() : 'B';

  return (
    <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-black transition-colors sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-sm font-black uppercase text-black dark:text-white tracking-widest leading-tight">
            {profile.businessName}
          </h1>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-tight mt-0.5 truncate max-w-[180px]">
            {profile.businessAddress || `${profile.city} | ${profile.state}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-900 flex items-center justify-center text-slate-400 hover:text-black dark:hover:text-white transition-colors"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-white text-sm font-black shadow-lg active:scale-95 transition-transform"
            >
              {initials}
            </button>

            <AnimatePresence>
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-20 overflow-hidden p-2"
                  >
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Signed in as</p>
                      <p className="text-xs font-bold text-black dark:text-white truncate">{profile.fullName}</p>
                    </div>
                    
                    <div className="px-2 pb-1">
                      <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] px-2 mb-1">Manage Shop</p>
                      <button
                        onClick={() => {
                          logout();
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 transition-colors"
                      >
                        <LogOut size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
