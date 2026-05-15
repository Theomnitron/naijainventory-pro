import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { Category } from '../types';

interface AddProductOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    brand: string;
    model: string;
    category: Category;
    variantName: string;
    price: number;
    sku: string;
  };
}

export default function AddProductOverlay({ isOpen, onClose, initialData }: AddProductOverlayProps) {
  const { addProduct } = useInventory();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    category: 'Phones' as Category,
    variantName: '',
    price: '',
    stock: '',
    sku: '',
  });

  // Pre-fill if initialData provided
  React.useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        brand: initialData.brand,
        model: initialData.model,
        category: initialData.category,
        variantName: initialData.variantName,
        price: initialData.price.toString(),
        stock: '',
        sku: initialData.sku
      });
    } else if (isOpen) {
      setFormData({
        brand: '',
        model: '',
        category: 'Phones',
        variantName: '',
        price: '',
        stock: '',
        sku: ''
      });
    }
  }, [initialData, isOpen]);

  const categories: Category[] = ['Phones', 'Laptops', 'Accessories', 'Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Sanitize Price (Strip ₦, commas, etc)
    const rawPrice = formData.price.toString().replace(/[^0-9]/g, '');
    const cleanPrice = Number(rawPrice);
    
    // 2. Validate Stock
    const cleanStock = Number(formData.stock) || 0;
    if (cleanStock <= 0) {
      showToast('Quantity must be at least 1');
      return;
    }

    if (!formData.brand || !formData.model || !formData.variantName || !cleanPrice || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addProduct(
        { 
          brand: formData.brand.trim(), 
          model: formData.model.trim(),
          category: formData.category
        },
        {
          name: formData.variantName.trim(),
          price: cleanPrice,
          stock: cleanStock,
          sku: formData.sku || `SKU-${Date.now()}`,
        }
      );
      onClose();
      setFormData({ 
        brand: '', 
        model: '', 
        category: 'Phones', 
        variantName: '', 
        price: '', 
        stock: '', 
        sku: '' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[60] bg-white dark:bg-black p-6 flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter">
                {initialData ? 'Restock Item' : 'New Goods'}
              </h2>
              <p className="text-slate-500 font-mono text-xs uppercase">
                {initialData ? 'Update Stock Levels' : 'Add Item To Notebook'}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="w-12 h-12 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center text-black dark:text-white disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className={`flex-1 space-y-4 overflow-y-auto pb-10 ${isSubmitting ? 'pointer-events-none opacity-60' : ''}`}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Brand</label>
                <input
                  required
                  placeholder="Infinix"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-black dark:text-white focus:border-black dark:focus:border-white outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                  className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-black dark:text-white focus:border-black dark:focus:border-white outline-none transition-colors appearance-none"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Model Name</label>
              <input
                required
                placeholder="Note 40"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-black dark:text-white focus:border-black dark:focus:border-white outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Variant (RAM/Storage/Color)</label>
              <input
                required
                placeholder="8GB/256GB - Gold"
                value={formData.variantName}
                onChange={(e) => setFormData({ ...formData, variantName: e.target.value })}
                className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-black dark:text-white focus:border-black dark:focus:border-white outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Price (₦)</label>
                <input
                  required
                  type="number"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-black dark:text-white focus:border-black dark:focus:border-white outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-1">Stock</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl font-bold text-black dark:text-white focus:border-black dark:focus:border-white outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.brand || !formData.model || !formData.price}
              className="w-full h-20 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.2em] text-lg rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform mt-4 disabled:opacity-50 disabled:scale-100"
            >
              {isSubmitting ? (
                <>
                  <div className="w-6 h-6 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                  <span className="animate-pulse">Processing...</span>
                </>
              ) : (
                <>
                  <Save size={24} />
                  {initialData ? 'Update Stock' : 'Add to Inventory'}
                </>
              )}
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
