import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export default function Toast({ message, onClose }: ToastProps) {
  const isError = message?.toLowerCase().includes('fail') || message?.toLowerCase().includes('error') || message?.toLowerCase().includes('wrong');

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onAnimationComplete={() => {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
          }}
          className="fixed bottom-8 left-4 right-4 z-[10000] flex justify-center pointer-events-none"
        >
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border pointer-events-auto ${
            isError 
              ? 'bg-red-600 dark:bg-red-500 text-white border-red-400' 
              : 'bg-black dark:bg-white text-white dark:text-black border-slate-800 dark:border-slate-200'
          }`}>
            {isError ? <AlertCircle size={20} /> : <CheckCircle2 size={24} className="text-emerald-500" />}
            <span className="font-black uppercase tracking-widest text-[10px] sm:text-xs text-center">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
