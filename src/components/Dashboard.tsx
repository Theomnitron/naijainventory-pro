import React, { useMemo } from 'react';
import { Shield, ChevronRight } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatNaira } from '../utils/format';
import { AppTab } from '../types';

interface DashboardProps {
  onTabChange: (tab: AppTab) => void;
}

export default function Dashboard({ onTabChange }: DashboardProps) {
  const { products, auditLog, setInventoryFilter, isLoading } = useInventory();

  const { todaySales, monthlySales, totalDiscounts, totalSurplus } = useMemo(() => {
    if (isLoading) return { todaySales: 0, monthlySales: 0, totalDiscounts: 0, totalSurplus: 0 };
    const now = new Date();

    // Start of today
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const startOfToday = today.getTime();

    // Start of month
    const month = new Date(now.getFullYear(), now.getMonth(), 1);
    month.setHours(0, 0, 0, 0);
    const startOfMonth = month.getTime();

    const salesEntries = auditLog.filter(entry =>
      entry.type === 'Sale' &&
      !entry.isVoided
    );

    let sales = 0;
    let mSales = 0;
    let discounts = 0;
    let surplus = 0;

    salesEntries.forEach(entry => {
      const price = entry.price || 0;

      // FIX: Force parse the timestamp to millisecond integer to avoid string mismatch bugs
      const ts = entry.timestamp ? new Date(entry.timestamp).getTime() : 0;

      if (ts >= startOfToday) {
        sales += price;
        const d = entry.discount || 0;
        if (d > 0) discounts += d;
        if (d < 0) surplus += Math.abs(d);
      }

      if (ts >= startOfMonth) {
        mSales += price;
      }
    });

    return {
      todaySales: sales,
      monthlySales: mSales,
      totalDiscounts: discounts,
      totalSurplus: surplus
    };
  }, [auditLog, isLoading]);

  const totalStockValue = products.reduce((acc, p) =>
    acc + p.variants.reduce((vAcc, v) => vAcc + (v.price * v.stock), 0), 0
  );

  const lowStockCount = products.reduce((acc, p) =>
    acc + p.variants.filter(v => v.stock > 0 && v.stock < 5).length, 0
  );

  const outOfStockCount = products.reduce((acc, p) =>
    acc + p.variants.filter(v => v.stock === 0).length, 0
  );

  const metrics = [
    {
      label: 'Today Sales',
      value: formatNaira(todaySales),
      active: true,
      subValue: (
        <div className="flex flex-col gap-0.5 mt-2">
          {totalDiscounts > 0 && (
            <span className="text-[8px] font-black uppercase text-orange-400">₦{formatNaira(totalDiscounts).replace('₦', '')} Total Discounts</span>
          )}
          {totalSurplus > 0 && (
            <span className="text-[8px] font-black uppercase text-emerald-400">₦{formatNaira(totalSurplus).replace('₦', '')} Total Surplus</span>
          )}
        </div>
      )
    },
    { label: 'Out of Stock', value: outOfStockCount.toString(), active: false, filter: 'Out of Stock' },
    { label: 'Low Stock', value: lowStockCount.toString(), active: false, filter: 'Low Stock' },
    { label: 'Monthly Rev', value: formatNaira(monthlySales), active: false },
  ];

  const handleMetricClick = (filter?: string) => {
    if (filter) {
      setInventoryFilter(filter);
      onTabChange('Goods');
    }
  };

  return (
    <div id="dashboard-container" className="p-6 pb-24 transition-colors">
      <h1 id="dashboard-title" className="text-4xl font-black text-black dark:text-white uppercase tracking-tighter mb-2">Summary</h1>
      <p className="text-slate-500 dark:text-slate-400 text-xs font-mono uppercase mb-8">Business Health Metrics</p>

      <div id="metrics-grid" className="grid grid-cols-2 gap-4">
        {metrics.map((item, i) => (
          <button
            key={i}
            onClick={() => handleMetricClick(item.filter)}
            className={`p-4 border transition-colors rounded-xl flex flex-col justify-between text-left group ${item.active
                ? 'bg-black dark:bg-white border-black dark:border-white'
                : 'bg-white dark:bg-black border-slate-200 dark:border-slate-800'
              } ${item.filter ? 'active:scale-95 cursor-pointer' : 'cursor-default'}`}
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className={`text-[10px] uppercase font-bold ${item.active ? 'text-slate-500' : 'text-slate-400 dark:text-slate-600'}`}>{item.label}</p>
                {item.filter && <ChevronRight size={14} className={item.active ? 'text-slate-500' : 'text-slate-400 dark:text-slate-600'} />}
              </div>
              <p className={`text-xl sm:text-2xl font-black truncate ${item.active ? 'text-white dark:text-black' : 'text-black dark:text-white'}`}>
                {isLoading ? '---' : item.value}
              </p>
            </div>
            {item.subValue && !isLoading && (
              <div className="mt-1">{item.subValue}</div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-colors">
        <h3 className="text-black dark:text-white font-bold uppercase text-sm mb-4">Stock Value</h3>
        <p className="text-3xl font-black text-black dark:text-white tracking-tighter">
          {isLoading ? '₦ --,---' : formatNaira(totalStockValue)}
        </p>
        <div className="mt-4 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-black dark:bg-white w-2/3" />
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center justify-center gap-2">
        <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-600 dark:text-emerald-500">
          <Shield size={20} />
        </div>
        <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-widest">End-to-End Encrypted</p>
        <p className="max-w-[200px] text-center text-[8px] font-medium text-slate-400 dark:text-slate-600 uppercase leading-relaxed">
          Your inventory data is encrypted before it leaves this device.
          Only you can see these names and prices.
        </p>
      </div>
    </div>
  );
}
