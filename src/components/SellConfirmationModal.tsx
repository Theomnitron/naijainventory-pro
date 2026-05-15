import React, { useState } from 'react';
import { X, DollarSign, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatNaira } from '../utils/format';

interface SellConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (finalPrice: number) => void;
  productName: string;
  variantName: string;
  expectedPrice: number;
}

export default function SellConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  productName, 
  variantName, 
  expectedPrice 
}: SellConfirmationModalProps) {
  const [finalPrice, setFinalPrice] = useState(expectedPrice.toString());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Scrub price (Strip ₦, commas, etc)
    const rawPrice = finalPrice.toString().replace(/[^0-9]/g, '');
    const price = Number(rawPrice);

    if (!rawPrice || price < 100) {
      setError('Price required (Min ₦100)');
      return;
    }

    setIsProcessing(true);
    try {
      await onConfirm(price);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter">Confirm Sale</h2>
                  <p className="text-slate-500 font-mono text-xs uppercase underline">Final Haggle & Price</p>
                </div>
                {!isProcessing && (
                  <button
                    onClick={onClose}
                    className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-black dark:hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Item Details</p>
                <p className="text-sm font-bold text-black dark:text-white truncate">{productName}</p>
                <p className="text-xs font-medium text-slate-500">{variantName}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 px-1 tracking-widest">
                    Final Haggled Price (₦)
                  </label>
                  {error && (
                    <p className="text-[10px] font-bold text-red-500 uppercase mb-2 px-1 tracking-tighter">
                      {error}
                    </p>
                  )}
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors">
                      <DollarSign size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      disabled={isProcessing}
                      value={finalPrice}
                      onChange={(e) => setFinalPrice(e.target.value)}
                      className="w-full h-16 pl-14 pr-8 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-black dark:focus:border-white rounded-2xl text-xl font-black tracking-tighter transition-all placeholder:text-slate-300 outline-none dark:text-white disabled:opacity-50"
                      placeholder="0"
                    />
                  </div>
                  <div className="mt-2 flex justify-between items-center px-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Expected: {formatNaira(expectedPrice)}</p>
                    {Number(finalPrice.replace(/[^0-9]/g, '')) < expectedPrice && (
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter italic">Sold at discount</p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full h-16 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.2em] text-sm rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                        <span className="animate-pulse">Processing...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={20} />
                        COMPLETE SALE
                      </>
                    )}
                  </button>
                  <p className="mt-4 text-center text-[8px] font-black uppercase text-slate-400 tracking-widest leading-relaxed">
                    Once clicked, 1 unit will be deducted <br /> from stock and sale will be logged.
                  </p>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
