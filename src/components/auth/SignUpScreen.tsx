import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { 
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { UserPlus, User, Building, Briefcase, Mail, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface SignUpScreenProps {
  onSwitchToLogin: () => void;
}

export default function SignUpScreen({ onSwitchToLogin }: SignUpScreenProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    businessName: '',
    state: '',
    city: '',
    businessType: 'Retail',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.email || !formData.password || !formData.fullName || !formData.businessName) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Firebase User
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      
      // 2. Generate Unique Master Key (Exactly 16 characters)
      const generateKey = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const segments = [
          Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join(''),
          Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join(''),
          Array.from({ length: 3 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('')
        ];
        return `TM-${segments[0]}-${segments[1]}-${segments[2]}`; // 3 + 1 + 4 + 1 + 4 + 1 + 3 = 17?
        // Wait: T(1)M(2)-(3)X(4)X(5)X(6)X(7)-(8)X(9)X(10)X(11)X(12)-(13)X(14)X(15)X(16)
        // That is 16 characters.
      };
      
      const masterKey = generateKey();

      // 3. Create User Profile with Trial fields
      await setDoc(doc(db, 'users', user.uid), {
        fullName: formData.fullName,
        businessName: formData.businessName,
        state: formData.state,
        city: formData.city,
        businessType: formData.businessType,
        email: formData.email,
        masterKey: masterKey, // Secret salt
        isPaid: false,
        businessAddress: '',
        businessPhone: '',
        adminPin: '0000', // Default PIN
        createdAt: serverTimestamp(),
        welcomed: false
      });

      // 3. Store local trial start date as fallback/speed check
      localStorage.setItem('trial_start_date', new Date().toISOString());

    } catch (err: any) {
      if (err.code === 'auth/network-request-failed') {
        setError('Oga! Please check your internet connection.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid Details: Please check your email or password.');
      } else {
        setError(err.message || 'Registration failed. Check your details.');
      }
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center py-12 px-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Register Business</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Join the Network</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-500 text-sm">
              <AlertCircle size={20} />
              <p className="font-medium uppercase text-[10px] tracking-wider">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">CEO Full Name</label>
              <div className="relative">
                <input
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="CHUKWUMA OKORO"
                  className="w-full bg-slate-800 border border-slate-700 h-14 rounded-xl px-12 text-white placeholder:text-slate-600 focus:border-white focus:outline-none transition-colors"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              </div>
            </div>

            {/* Business Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Business Name</label>
              <div className="relative">
                <input
                  name="businessName"
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="PREMIER TECH HUB"
                  className="w-full bg-slate-800 border border-slate-700 h-14 rounded-xl px-12 text-white placeholder:text-slate-600 focus:border-white focus:outline-none transition-colors"
                />
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* State */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">State</label>
                <div className="relative">
                  <input
                    name="state"
                    type="text"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="LAGOS"
                    className="w-full bg-slate-800 border border-slate-700 h-14 rounded-xl px-4 text-white placeholder:text-slate-600 focus:border-white focus:outline-none transition-colors"
                  />
                </div>
              </div>
              {/* City */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">City</label>
                <div className="relative">
                  <input
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="IKEJA"
                    className="w-full bg-slate-800 border border-slate-700 h-14 rounded-xl px-4 text-white placeholder:text-slate-600 focus:border-white focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Business Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Business Type</label>
              <div className="relative">
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 h-14 rounded-xl px-12 text-white appearance-none focus:border-white focus:outline-none transition-colors"
                >
                  <option value="Retail">Retail Store</option>
                  <option value="Wholesale">Wholesale Distributor</option>
                  <option value="Service">Service Center</option>
                </select>
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Email</label>
              <div className="relative">
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="INFO@BUSINESS.COM"
                  className="w-full bg-slate-800 border border-slate-700 h-14 rounded-xl px-12 text-white placeholder:text-slate-600 focus:border-white focus:outline-none transition-colors"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Security Password</label>
              <div className="relative">
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 h-14 rounded-xl px-12 text-white placeholder:text-slate-600 focus:border-white focus:outline-none transition-colors"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[60px] bg-white text-black font-black uppercase tracking-[0.2em] text-sm rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-50 mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={20} />
                Create Free Account
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-500 font-bold text-xs uppercase tracking-widest">
          Already Registered? {' '}
          <button 
            onClick={onSwitchToLogin}
            className="text-white hover:underline underline-offset-4"
          >
            Login to Portal
          </button>
        </p>
      </motion.div>
    </div>
  );
}
