import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { auth } from '../../services/firebase';
import { LogIn, Mail, Lock, AlertCircle, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface LoginScreenProps {
  onSwitchToSignUp: () => void;
}

export default function LoginScreen({ onSwitchToSignUp }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { resetPassword } = useAuth();
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err.code === 'auth/network-request-failed') {
        showToast('Oga! Please check your internet connection.');
        setError('Oga! Please check your internet connection.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        showToast('Invalid Login Details');
        setError('Invalid Login Details: Please check your email or password.');
      } else {
        setError(err.message || 'Login failed. Check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please provide your email to receive a reset link.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      showToast('Password Reset Email Sent');
    } catch (err: any) {
      setError('Could not send reset email. Verify address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Naija<span className="text-slate-500">Inventory</span></h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Business Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-500 text-sm">
              <AlertCircle size={20} />
              <p className="font-medium uppercase text-[10px] tracking-wider">{error}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="CEO@BUSINESS.COM"
                className="w-full bg-slate-800 border border-slate-700 h-16 rounded-2xl px-12 text-white placeholder:text-slate-600 focus:border-white focus:outline-none transition-colors"
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 h-16 rounded-2xl px-12 text-white placeholder:text-slate-600 focus:border-white focus:outline-none transition-colors"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            </div>
            <div className="flex justify-end pt-1">
              <button 
                type="button"
                onClick={handleForgotPassword}
                className="text-[9px] font-black uppercase text-slate-500 hover:text-white transition-colors flex items-center gap-1.1"
              >
                <HelpCircle size={10} /> Forgot Password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[60px] bg-white text-black font-black uppercase tracking-[0.2em] text-sm rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50 mt-8"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={20} />
                Access Inventory
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-500 font-bold text-xs uppercase tracking-widest">
          New Business? {' '}
          <button 
            onClick={onSwitchToSignUp}
            className="text-white hover:underline underline-offset-4"
          >
            Register Here
          </button>
        </p>
      </motion.div>
    </div>
  );
}
