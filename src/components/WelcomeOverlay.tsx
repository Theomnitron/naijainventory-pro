import React from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Shield, Smartphone, ArrowRight, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export default function WelcomeOverlay() {
  const { profile } = useAuth();

  if (!profile || profile.welcomed) return null;

  const handleAcknowledge = async () => {
    if (profile.uid) {
      await updateDoc(doc(db, 'users', profile.uid), {
        welcomed: true
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden flex flex-col"
      >
        <div className="bg-emerald-500 p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white mb-4">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Registration Deed</h2>
          <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mt-1">Activation Successful</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Business Name</label>
              <p className="text-lg font-black text-black uppercase tracking-tight">{profile.businessName}</p>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Unique Business ID</label>
              <p className="font-mono text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 break-all">{profile.uid}</p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle size={16} />
                <label className="text-[10px] font-black uppercase tracking-widest">AES-256 Master Key</label>
              </div>
              <p className="font-mono text-xs font-black text-amber-900 break-all">{profile.masterKey}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <Smartphone size={20} className="text-slate-400 shrink-0" />
            <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">
              ⚠️ IMPORTANT: Take a screenshot now. This key is the ONLY way to recover your prices and names if you lose access. We do not store this key.
            </p>
          </div>

          <button
            onClick={handleAcknowledge}
            className="w-full h-16 bg-black text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            I Have Saved My Deed
            <ArrowRight size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
