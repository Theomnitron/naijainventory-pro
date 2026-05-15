/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import AuditHistory from './components/AuditHistory';
import Settings from './components/Settings';
import MasterKeyUnlock from './components/MasterKeyUnlock';
import LoginScreen from './components/auth/LoginScreen';
import SignUpScreen from './components/auth/SignUpScreen';
import GlobalHeader from './components/GlobalHeader';
import WelcomeOverlay from './components/WelcomeOverlay';
import TrialBanner from './components/TrialBanner';
import ActivationScreen from './components/ActivationScreen';
import { AppTab } from './types';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';

function AppContent() {
  const { user, loading, profile, wasLoggedIn } = useAuth();
  const { isLocked } = useInventory();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    if (wasLoggedIn && !user && !loading) {
      showToast('Session expired. Please log in again');
    }
  }, [user, wasLoggedIn, loading]);
  const [activeTab, setActiveTab] = useState<AppTab>('Summ');
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [isExpired, setIsExpired] = useState(false);

  const isDarkMode = theme === 'dark';
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);

  useEffect(() => {
    if (profile && !profile.isPaid && profile.createdAt) {
      const startTime = profile.createdAt.seconds 
        ? profile.createdAt.seconds * 1000 
        : new Date(profile.createdAt).getTime();
      
      const checkExpiry = () => {
        const now = Date.now();
        const trialDuration = 72 * 60 * 60 * 1000;
        
        // Sync to localStorage as requested
        if (!localStorage.getItem('trial_start_date')) {
          localStorage.setItem('trial_start_date', new Date(startTime).toISOString());
        }

        if (now - startTime > trialDuration) {
          setIsExpired(true);
        } else {
          setIsExpired(false);
        }
      };

      if (profile.isPaid) {
        localStorage.removeItem('trial_start_date');
      }

      checkExpiry();
      const interval = setInterval(checkExpiry, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return authView === 'login' ? (
      <LoginScreen onSwitchToSignUp={() => setAuthView('signup')} />
    ) : (
      <SignUpScreen onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  const isOverlayVisible = (isExpired || showPaymentOverlay) && !profile.isPaid;

  return (
    <div id="app-root" className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300">
      {isOverlayVisible && (
        <ActivationScreen 
          canClose={!isExpired} 
          onClose={() => setShowPaymentOverlay(false)} 
        />
      )}
      <TrialBanner onActivateClick={() => setShowPaymentOverlay(true)} />
      <WelcomeOverlay />
      <GlobalHeader isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      
      <main id="tab-content" className="max-w-md mx-auto min-h-screen border-x border-slate-200 dark:border-slate-900 overflow-x-hidden">
        {activeTab === 'Summ' && <Dashboard onTabChange={setActiveTab} />}
        {activeTab === 'Goods' && <InventoryList />}
        {activeTab === 'Audit' && <AuditHistory />}
        {activeTab === 'Sett' && <Settings />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      {isLocked && <MasterKeyUnlock />}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ThemeProvider>
        <AuthProvider>
          <InventoryProvider>
            <AppContent />
          </InventoryProvider>
        </AuthProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}
