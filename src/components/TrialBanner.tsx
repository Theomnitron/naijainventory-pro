import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, AlertTriangle, Infinity } from 'lucide-react';
import { motion } from 'motion/react';

interface TrialBannerProps {
  onActivateClick: () => void;
}

export default function TrialBanner({ onActivateClick }: TrialBannerProps) {
  const { profile } = useAuth();
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; expired: boolean } | null>(null);

  useEffect(() => {
    if (!profile || profile.isPaid) return;

    // Use Firestore createdAt if available, otherwise localStorage fallback
    let startTime: number;
    if (profile.createdAt) {
      startTime = profile.createdAt.seconds 
        ? profile.createdAt.seconds * 1000 
        : new Date(profile.createdAt).getTime();
    } else {
      const localStart = localStorage.getItem('trial_start_date');
      startTime = localStart ? new Date(localStart).getTime() : Date.now();
    }

    const timer = setInterval(() => {
      const now = Date.now();
      const trialDuration = 72 * 60 * 60 * 1000; // 3 days in ms
      const elapsed = now - startTime;
      const remaining = trialDuration - elapsed;

      if (remaining <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, expired: true });
        clearInterval(timer);
      } else {
        const d = Math.floor(remaining / (24 * 60 * 60 * 1000));
        const h = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const m = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        setTimeLeft({ d, h, m, expired: false });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [profile]);

  if (!profile || profile.isPaid || !timeLeft) return null;

  const totalHoursRemaining = timeLeft.d * 24 + timeLeft.h;
  const isUrgent = totalHoursRemaining < 24;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`px-6 py-2 flex items-center justify-between transition-colors ${
        isUrgent 
          ? 'bg-amber-500 text-black' 
          : 'bg-blue-600 text-white'
      }`}
    >
      <div className="flex items-center gap-2">
        {isUrgent ? <AlertTriangle size={14} className="animate-pulse" /> : <Clock size={14} />}
        <p className="text-[10px] font-black uppercase tracking-widest">
          {timeLeft.expired 
            ? 'Trial Expired' 
            : `Trial: ${timeLeft.d}d ${timeLeft.h}h ${timeLeft.m}m remaining`}
        </p>
      </div>
      <button 
        onClick={onActivateClick}
        className="text-[9px] font-black uppercase border-b border-current leading-tight active:scale-95 transition-transform"
      >
        Activate Now
      </button>
    </motion.div>
  );
}
