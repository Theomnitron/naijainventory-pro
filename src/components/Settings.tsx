import React, { useState, useEffect, useRef } from 'react';
import { Download, Calendar, LogOut, ChevronRight, FileText, User, Shield, Lock, Phone, MapPin, Building, Eye, EyeOff, Upload, FileUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { formatNaira } from '../utils/format';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';

export default function Settings() {
  const { profile, logout, updateProfile, reauthenticate } = useAuth();
  const { auditLog, bulkInventoryUpload } = useInventory();
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = now.toISOString().split('T')[0];
  
  const [dateRange, setDateRange] = useState({ start: firstDay, end: lastDay });

  // Bulk Upload State
  const [showBulkUploadGate, setShowBulkUploadGate] = useState(false);
  const [bulkPin, setBulkPin] = useState('');
  const [showBulkScanner, setShowBulkScanner] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [replaceEntire, setReplaceEntire] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    businessName: profile?.businessName || '',
    businessAddress: profile?.businessAddress || '',
    businessPhone: profile?.businessPhone || '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Security State
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityStep, setSecurityStep] = useState<'password' | 'pin'>('password');
  const [password, setPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [secLoading, setSecLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        businessName: profile.businessName || '',
        businessAddress: profile.businessAddress || '',
        businessPhone: profile.businessPhone || '',
      });
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await updateProfile(profileForm);
      showToast('Business Profile Updated');
    } catch (err) {
      showToast('Update Failed');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleReauth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecLoading(true);
    try {
      await reauthenticate(password);
      setSecurityStep('pin');
    } catch (err) {
      showToast('Invalid Password');
    } finally {
      setSecLoading(false);
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      showToast('PIN MUST BE 4 DIGITS');
      return;
    }
    setSecLoading(true);
    try {
      await updateProfile({ adminPin: newPin });
      showToast('Admin PIN Secured');
      setShowSecurityModal(false);
      setSecurityStep('password');
      setPassword('');
      setNewPin('');
    } catch (err) {
      showToast('Failed to Save PIN');
    } finally {
      setSecLoading(false);
    }
  };

  const handleBulkPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkPin === profile?.adminPin) {
      setShowBulkUploadGate(false);
      setBulkPin('');
      setShowBulkScanner(true);
    } else {
      showToast('INVALID PIN');
      setBulkPin('');
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = "Brand,Model,Category,Variant,Price,Quantity\nApple,iPhone 15 Pro,Phone,256GB - Blue Titanium,1550000,5\nSamsung,Galaxy S24 Ultra,Phone,512GB - Gold,1420000,3";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Notebook_Inventory_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('TEMPLATE DOWNLOADED');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setIsParsing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const required = ['Brand', 'Model', 'Category', 'Variant', 'Price', 'Quantity'];
        const isValid = required.every(h => headers.includes(h));

        if (!isValid) {
          showToast('INVALID CSV HEADERS');
          setIsParsing(false);
          return;
        }

        const items = results.data.map((row: any) => ({
          brand: (row.Brand || '').toString().trim(),
          model: (row.Model || '').toString().trim(),
          category: (row.Category || '').toString().trim(),
          variant: (row.Variant || '').toString().trim(),
          price: Number((row.Price || '0').toString().replace(/[₦, \s]/g, '')),
          quantity: Number((row.Quantity || '0').toString().replace(/[₦, \s]/g, ''))
        })).filter(i => i.brand && i.model);

        if (items.length === 0) {
          showToast('NO VALID ITEMS FOUND');
          setIsParsing(false);
          return;
        }

        setParsedItems(items);
        setIsParsing(false);
      },
      error: () => {
        showToast('CORRUPTED FILE');
        setIsParsing(false);
      }
    });
  };

  const executeUpload = async () => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      await bulkInventoryUpload(parsedItems, replaceEntire, (progress) => {
        setUploadProgress(progress);
      });
      setShowBulkScanner(false);
      setParsedItems([]);
      setReplaceEntire(false);
    } catch (err) {
      showToast('UPLOAD FAILED');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const startMs = new Date(dateRange.start).setHours(0,0,0,0);
      const endMs = new Date(dateRange.end).setHours(23,59,59,999);
      
      const filteredLogs = auditLog.filter(log => log.timestamp >= startMs && log.timestamp <= endMs);
      
      if (filteredLogs.length === 0) {
        showToast('NO DATA IN SELECTED RANGE');
        return;
      }

      const headers = ['Date', 'Action', 'Item', 'Variant', 'Quantity', 'Price', 'Discount', 'Surplus'];
      const rows = filteredLogs.map(log => {
        const date = new Date(log.timestamp).toLocaleDateString();
        const price = log.price || 0;
        const discount = log.discount && log.discount > 0 ? log.discount : 0;
        const surplus = log.discount && log.discount < 0 ? Math.abs(log.discount) : 0;
        
        return [
          date,
          log.type,
          `"${log.productName.replace(/"/g, '""')}"`,
          `"${log.variantName.replace(/"/g, '""')}"`,
          log.quantity,
          `"${formatNaira(price)}"`,
          `"${formatNaira(discount)}"`,
          `"${formatNaira(surplus)}"`
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
        ['', '', '', '', 'TOTAL', `"${formatNaira(rows.reduce((acc, r) => acc + Number(r[5].toString().replace(/[^0-9]/g, '')), 0))}"`, `"${formatNaira(rows.reduce((acc, r) => acc + Number(r[6].toString().replace(/[^0-9]/g, '')), 0))}"`, `"${formatNaira(rows.reduce((acc, r) => acc + Number(r[7].toString().replace(/[^0-9]/g, '')), 0))}"`].join(',')
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Statement_${now.getMonth() + 1}_${now.getFullYear()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('STATEMENT READY');
    } catch (err) {
      showToast('Export failed. Please check phone storage permissions.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div id="settings-container" className="p-6 pb-24 transition-colors">
      <div className="mb-8">
        <h1 id="settings-title" className="text-4xl font-black text-black dark:text-white uppercase tracking-tighter mb-2">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-mono uppercase">Preferences & Exports</p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 mb-4 tracking-widest">Active License</p>
            <h2 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter truncate">{profile?.businessName}</h2>
            <p className="text-slate-500 font-mono text-[10px] truncate">{profile?.email}</p>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[8px] font-black uppercase rounded">
                {profile?.isPaid ? 'Premium License' : 'Trial Active'}
              </span>
            </div>
          </div>
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10 dark:opacity-5 text-black dark:text-white transform -rotate-12">
            <Shield size={100} />
          </div>
        </div>

        {/* Profile Management Section */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 px-2 tracking-widest flex items-center gap-2">
            <Building size={10} /> Business Settings
          </p>
          
          <form onSubmit={handleUpdateProfile} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 pl-1">Business Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={profileForm.businessName}
                    onChange={(e) => setProfileForm({...profileForm, businessName: e.target.value})}
                    placeholder="Enter Business Name"
                    className="w-full h-12 pl-10 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
                  />
                  <Building size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 pl-1">Business Address</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={profileForm.businessAddress}
                    onChange={(e) => setProfileForm({...profileForm, businessAddress: e.target.value})}
                    placeholder="Enter Full Address"
                    className="w-full h-12 pl-10 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
                  />
                  <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 pl-1">Business Phone</label>
                <div className="relative">
                  <input 
                    type="tel" 
                    value={profileForm.businessPhone}
                    onChange={(e) => setProfileForm({...profileForm, businessPhone: e.target.value})}
                    placeholder="+234..."
                    className="w-full h-12 pl-10 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
                  />
                  <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full h-12 bg-black dark:bg-white text-white dark:text-black font-black uppercase text-[10px] tracking-widest rounded-xl active:scale-95 disabled:opacity-50 transition-all"
            >
              Update Profile
            </button>
          </form>
        </div>

        {/* Security Section */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 px-2 tracking-widest flex items-center gap-2">
            <Lock size={10} /> Security
          </p>
          
          <button 
            onClick={() => {
              setShowSecurityModal(true);
              setSecurityStep('password');
            }}
            className="w-full h-16 px-6 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                <Shield size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-black dark:text-white">Admin Access PIN</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase">Change security PIN code</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </button>

          <button 
            onClick={() => setShowBulkUploadGate(true)}
            className="w-full h-16 px-6 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                <FileUp size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-black dark:text-white">Bulk Inventory Upload</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase">Import from CSV Template</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Export Section */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 px-2 tracking-widest">Reporting</p>
          
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 pl-1">Start Date</label>
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-bold text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 pl-1">End Date</label>
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="w-full bg-white dark:bg-black border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-bold text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-all"
                />
              </div>
            </div>

            <button 
              onClick={exportToCSV}
              disabled={isExporting}
              className="w-full h-16 px-6 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center justify-between hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <FileText size={20} />
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase">Export Transaction History</p>
                  <p className="text-[8px] font-bold opacity-60 uppercase">Generate Excel-compatible CSV</p>
                </div>
              </div>
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-slate-400 border-t-white animate-spin rounded-full" />
              ) : (
                <Download size={18} />
              )}
            </button>
          </div>
        </div>

        {/* System Section */}
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 px-2 tracking-widest">System</p>
          
          <button 
            onClick={() => logout()}
            className="w-full h-16 px-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center justify-between hover:bg-red-100 dark:hover:bg-red-900/20 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center text-red-600 dark:text-red-500">
                <LogOut size={20} />
              </div>
              <p className="text-[10px] font-black uppercase text-red-600 dark:text-red-500">Sign Out</p>
            </div>
            <ChevronRight size={18} className="text-red-300 dark:text-red-900/50" />
          </button>
        </div>
      </div>
      
      <div className="mt-20 text-center">
        <p className="text-[8px] font-black uppercase text-slate-300 dark:text-slate-700 tracking-[0.2em]">Inventory Master v2.4.0</p>
      </div>

      <AnimatePresence>
        {showBulkUploadGate && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBulkUploadGate(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg mb-4">
                  <Lock size={32} />
                </div>
                <h3 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter">Enter Admin PIN</h3>
                <p className="text-slate-500 text-[10px] uppercase font-bold">Authorized access only</p>
              </div>
              
              <form onSubmit={handleBulkPinSubmit} className="space-y-6">
                <input 
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  required
                  autoFocus
                  value={bulkPin}
                  onChange={(e) => setBulkPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="XXXX"
                  className="w-full h-24 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-3xl text-center text-4xl font-black text-black dark:text-white tracking-[1em] pl-[1em] outline-none"
                />
                <button 
                  type="submit"
                  className="w-full h-16 bg-black dark:bg-white text-white dark:text-black font-black uppercase rounded-2xl"
                >
                  Confirm PIN
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showBulkScanner && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl h-[80vh] bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start shrink-0">
                <div>
                  <h3 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter">Bulk Import</h3>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Smart Merge Inventory ONBOARDING</p>
                </div>
                <button 
                  onClick={() => setShowBulkScanner(false)}
                  className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 hover:text-black dark:hover:text-white"
                >
                  <EyeOff size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Template Download */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-4">Step 1: Get the format</p>
                  <button 
                    onClick={downloadCSVTemplate}
                    className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase mx-auto hover:bg-slate-50 transition-colors"
                  >
                    <Download size={16} /> Download CSV Template
                  </button>
                </div>

                {/* File Upload */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 pl-2">Step 2: Upload CSV</p>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group"
                  >
                    <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
                      <Upload size={32} />
                    </div>
                    <p className="text-xs font-black uppercase text-slate-500">Tap to Select Inventory File</p>
                  </button>
                </div>

                {/* Parsed Preview */}
                {parsedItems.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end px-2">
                      <p className="text-[10px] font-black uppercase text-emerald-500 flex items-center gap-2">
                        <CheckCircle2 size={12} /> {parsedItems.length} items parsed
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 overflow-x-auto">
                      <table className="w-full text-[10px] font-mono text-left">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-200 dark:border-slate-700">
                            <th className="pb-2 pr-4 uppercase">Brand</th>
                            <th className="pb-2 pr-4 uppercase">Model</th>
                            <th className="pb-2 pr-4 uppercase">Variant</th>
                            <th className="pb-2 pr-4 uppercase">Price</th>
                            <th className="pb-2 uppercase">Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedItems.slice(0, 5).map((item, idx) => (
                            <tr key={idx} className="text-black dark:text-white border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                              <td className="py-2 pr-4 truncate max-w-[80px]">{item.brand}</td>
                              <td className="py-2 pr-4 truncate max-w-[80px]">{item.model}</td>
                              <td className="py-2 pr-4 truncate max-w-[100px]">{item.variant}</td>
                              <td className="py-2 pr-4 font-bold">{formatNaira(item.price)}</td>
                              <td className="py-2 font-bold">{item.quantity}</td>
                            </tr>
                          ))}
                          {parsedItems.length > 5 && (
                            <tr>
                              <td colSpan={5} className="py-2 text-center text-slate-400 font-bold italic">
                                + {parsedItems.length - 5} more items...
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Replace Entire Toggle */}
                    <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500">
                            <AlertTriangle size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-red-600">CLEAN SLATE MODE</p>
                            <p className="text-[8px] font-bold text-red-400 uppercase tracking-tighter">WIPE Current Inventory before upload</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setReplaceEntire(!replaceEntire)}
                          className={`w-12 h-6 rounded-full relative transition-colors ${replaceEntire ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${replaceEntire ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="p-8 border-t border-slate-100 dark:border-slate-800 shrink-0">
                {isUploading ? (
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-emerald-500"
                      />
                    </div>
                    <div className="flex justify-between">
                      <p className="text-[10px] font-black uppercase text-slate-400">Processing Items...</p>
                      <p className="text-[10px] font-black text-emerald-500">{Math.round(uploadProgress)}%</p>
                    </div>
                  </div>
                ) : (
                  <button 
                    disabled={parsedItems.length === 0}
                    onClick={() => replaceEntire ? setShowConfirmModal(true) : executeUpload()}
                    className="w-full h-20 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.2em] rounded-3xl text-sm flex items-center justify-center gap-4 disabled:opacity-30 active:scale-95 transition-all shadow-2xl"
                  >
                    <Upload size={24} /> Process Batch Upload
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showConfirmModal && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto text-white mb-6 shadow-2xl animate-pulse">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter mb-2">High Alert!</h3>
              <p className="text-slate-500 text-xs font-bold leading-relaxed mb-8 uppercase px-4">
                This will <span className="text-red-500 underline font-black">DELETE EVERYTHING</span> currently in your notebook. This action is final.
              </p>
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    setShowConfirmModal(false);
                    executeUpload();
                  }}
                  className="w-full h-16 bg-red-600 text-white font-black uppercase rounded-2xl active:scale-95 transition-all"
                >
                  YES, WIPE & UPLOAD
                </button>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase rounded-2xl"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showSecurityModal && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSecurityModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="text-center space-y-4 mb-8">
                <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center mx-auto text-white dark:text-black shadow-lg">
                  <Shield size={32} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter">Security Gate</h2>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                    {securityStep === 'password' ? 'Confirm Admin Identity' : 'Set New Admin PIN'}
                  </p>
                </div>
              </div>

              {securityStep === 'password' ? (
                <form onSubmit={handleReauth} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 pl-1">Enter Master Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-16 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-2xl px-6 text-black dark:text-white text-lg font-mono outline-none focus:border-black dark:focus:border-white transition-all shadow-inner"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={secLoading}
                    className="w-full h-16 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                  >
                    {secLoading ? <div className="w-6 h-6 border-2 border-slate-400 border-t-white dark:border-t-black animate-spin rounded-full" /> : 'verify identity'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowSecurityModal(false)}
                    className="w-full text-[10px] font-black uppercase text-slate-400 tracking-widest py-2"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSetPin} className="space-y-6">
                  <div className="space-y-2 text-center">
                    <label className="text-[10px] font-black uppercase text-slate-400">Enter New 4-Digit PIN</label>
                    <input 
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      required
                      autoFocus
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="XXXX"
                      className="w-full h-24 bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-800 rounded-3xl text-center text-4xl font-black text-black dark:text-white tracking-[1em] pl-[1em] outline-none focus:border-black dark:focus:border-white transition-all shadow-inner"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={secLoading}
                    className="w-full h-16 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                  >
                    {secLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : 'SAVE ADMIN PIN'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSecurityStep('password')}
                    className="w-full text-[10px] font-black uppercase text-slate-400 tracking-widest py-2"
                  >
                    Go Back
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
