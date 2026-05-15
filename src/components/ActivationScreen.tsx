import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { CreditCard, ShieldCheck, MessageCircle, AlertCircle, Loader2, RefreshCw, X } from 'lucide-react';
import { motion } from 'motion/react';

declare const PaystackPop: any;

interface ActivationScreenProps {
  canClose?: boolean;
  onClose?: () => void;
}

export default function ActivationScreen({ canClose, onClose }: ActivationScreenProps) {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  // Auto-verify when returning to tab
  useEffect(() => {
    const handleFocus = () => {
      handleSync();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleSync = async () => {
    if (!user?.uid || verifying) return;
    setVerifying(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().isPaid) {
        localStorage.removeItem('trial_start_date');
        showToast('ACCOUNT ACTIVATED SUCCESSFULLY');
      } else {
        showToast('Verification failed: No payment record found for this Business ID. Please try again in 5 minutes if you just paid.');
      }
    } catch (err) {
      showToast('SYNC FAILED: Please check your connection.');
    } finally {
      setVerifying(false);
    }
  };

  const handlePayment = async () => {
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      
      if (!publicKey) {
        throw new Error('Paystack Public Key is missing. Please contact support.');
      }

      if (typeof PaystackPop === 'undefined') {
        throw new Error('Payment system could not be loaded. Check your internet connection.');
      }

      const handler = PaystackPop.setup({
        key: publicKey,
        email: profile?.email || user?.email,
        amount: 1000000, // ₦10,000 in kobo
        currency: 'NGN',
        metadata: {
          userId: user?.uid,
          custom_fields: [
            {
              display_name: "Business UID",
              variable_name: "business_uid",
              value: user?.uid
            }
          ]
        },
        callback: function(response: any) {
          if (response.status === 'success') {
            onPaymentSuccess(response);
          } else {
            setLoading(false);
            setError('Something went wrong while connecting to the payment server. Please try again later.');
          }
        },
        onClose: function() {
          setLoading(false);
        }
      });

      handler.openIframe();
    } catch (err: any) {
      setError('Something went wrong while connecting to the payment server. Please try again later.');
      setLoading(false);
    }
  };

  async function onPaymentSuccess(response: any) {
    try {
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          isPaid: true,
          paystackReference: response.reference
        });
        showToast('PAYMENT VERIFIED');
      }
    } catch (fbErr: any) {
      setError(`Activation failed after payment. Reference: ${response.reference}. Please contact support with this code.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center p-6 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-white/10"
      >
        <div className="p-8 pb-0 text-center relative">
          {canClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-black dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-amber-600 dark:text-amber-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">
            {canClose ? 'Unlock Premium' : 'Trial Expired'}
          </h2>
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-sm">
            {canClose 
              ? "You're enjoying the trial! Unlock Lifetime Access now to secure your business data forever."
              : "Your 3-Day Free Trial has ended. Unlock Lifetime Access to your Smart Notebook and continue managing your business data securely."}
          </p>
        </div>

        <div className="p-8 pt-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/50 flex items-center gap-3">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Plan Type</span>
              <span className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase rounded-full tracking-wider">Lifetime</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">₦10,000</span>
              <span className="text-slate-400 font-bold text-xs uppercase">Once</span>
            </div>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                <ShieldCheck size={14} className="text-emerald-500" />
                End-to-End Encrypted Storage
              </li>
              <li className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                <ShieldCheck size={14} className="text-emerald-500" />
                Unlimited SKU Management
              </li>
            </ul>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full h-16 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.2em] text-sm rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : (
              <>
                <CreditCard size={20} />
                Activate Now
              </>
            )}
          </button>

          {canClose && (
            <button
              onClick={onClose}
              className="w-full text-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-black dark:hover:text-white transition-colors"
            >
              Maybe Later
            </button>
          )}

          <div className="flex flex-col items-center gap-4 pt-2">
            <button
              onClick={handleSync}
              disabled={verifying}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <RefreshCw size={12} className={verifying ? 'animate-spin' : ''} />
              {verifying ? 'Verifying...' : 'Already paid? Click here to sync'}
            </button>

            <a 
              href="https://wa.me/2349060194677?text=I%20have%20an%20issue%20with%20my%20Smart%20Notebook%20activation."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-8 flex items-center justify-center gap-2 text-slate-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <MessageCircle size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Talk to Support</span>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
