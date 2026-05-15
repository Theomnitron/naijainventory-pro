import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export default function MasterKeyUnlock() {
  const { unlock } = useInventory();
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    const success = unlock(keyInput);
    if (!success) {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto text-white">
            <Lock size={32} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Inventory Locked</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Master Key Required</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Enter Master Key (TM-XXXX...)</label>
            <input
              type="text"
              required
              autoFocus
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="TM-XXXX-XXXX-XXX"
              className={`w-full bg-slate-800 border ${error ? 'border-red-500' : 'border-slate-700'} h-16 rounded-2xl px-6 text-white text-center font-mono tracking-widest placeholder:text-slate-700 outline-none focus:border-white transition-all`}
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-red-500 justify-center"
            >
              <AlertCircle size={14} />
              <p className="text-[10px] font-black uppercase tracking-wider">Invalid Master Key</p>
            </motion.div>
          )}

          <button
            type="submit"
            className="w-full h-16 bg-white text-black font-black uppercase tracking-[0.2em] text-sm rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <ShieldCheck size={20} />
            Unlock inventory
          </button>
        </form>

        <p className="text-center text-[9px] font-medium text-slate-500 uppercase leading-relaxed px-4">
          Forgot your key? Check the email sent during registration or contact administrator. 
          Your key ensures even we cannot read your data.
        </p>
      </motion.div>
    </div>
  );
}
