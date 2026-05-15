import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ShoppingCart, ChevronDown, ChevronRight, Search, PackageOpen } from 'lucide-react';
import { Product, Variant, Category } from '../types';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import AddProductOverlay from './AddProductOverlay';
import { formatNaira } from '../utils/format';

import SellConfirmationModal from './SellConfirmationModal';

type FilterType = 'All' | Category | 'Out of Stock' | 'Low Stock';

export default function InventoryList() {
  const { products, isLoading, sellVariant, inventoryFilter, setInventoryFilter } = useInventory();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAddingGoods, setIsAddingGoods] = useState(false);
  const [restockData, setRestockData] = useState<any>(null);
  const [sellModalData, setSellModalData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hideOutOfStock, setHideOutOfStock] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleRestockModal = (product: Product, variant: Variant) => {
    setRestockData({
      brand: product.brand,
      model: product.model,
      category: product.category,
      variantName: variant.name,
      price: variant.price,
      sku: variant.sku
    });
    setIsAddingGoods(true);
  };

  const closeOverlay = () => {
    setIsAddingGoods(false);
    setRestockData(null);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (hideOutOfStock && product.variants.every(v => v.stock === 0)) return false;

      const matchesSearch = 
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.model.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (inventoryFilter === 'All') return true;
      if (inventoryFilter === 'Out of Stock') {
        return product.variants.some(v => v.stock === 0);
      }
      if (inventoryFilter === 'Low Stock') {
        return product.variants.some(v => v.stock > 0 && v.stock < 5);
      }
      return product.category === inventoryFilter;
    });
  }, [products, searchQuery, inventoryFilter, hideOutOfStock]);

  const filterTabs: FilterType[] = ['All', 'Phones', 'Laptops', 'Accessories', 'Out of Stock', 'Low Stock'];

  if (isLoading) {
    return (
      <div className="p-20 text-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-black dark:border-slate-800 dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Opening Notebook...</p>
      </div>
    );
  }

  return (
    <div id="inventory-container" className="pb-32 transition-colors">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-black sticky top-0 z-20 transition-colors space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 id="inventory-title" className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter">The Notebook</h1>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-mono uppercase">Inventory Master List</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="SEARCH BRAND OR MODEL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-black dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 outline-none focus:border-black dark:focus:border-white transition-all"
          />
        </div>

        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
          <div className="flex gap-2 min-w-max">
            {filterTabs.map((filter) => (
              <button
                key={filter}
                onClick={() => setInventoryFilter(filter)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                  inventoryFilter === filter
                    ? 'bg-black dark:bg-white border-black dark:border-white text-white dark:text-black'
                    : 'bg-white dark:bg-black border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 min-w-max pr-4">
            <button 
              onClick={() => setHideOutOfStock(!hideOutOfStock)}
              className={`flex items-center gap-2 text-[8px] font-black uppercase tracking-tighter transition-colors ${hideOutOfStock ? 'text-black dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}
            >
              <div className={`w-8 h-4 rounded-full relative transition-colors ${hideOutOfStock ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${hideOutOfStock ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
              </div>
              Hide Out of Stock
            </button>
          </div>
        </div>
      </div>

      <div id="product-list" className="divide-y divide-slate-200 dark:divide-slate-800">
        <AnimatePresence mode="popLayout">
          {products.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 mx-auto">
                <PackageOpen size={32} />
              </div>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest px-10">
                No goods found.<br />Tap + to add items!
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 mx-auto">
                <Search size={32} />
              </div>
              <p className="text-slate-300 dark:text-slate-800 font-black uppercase tracking-tighter text-2xl px-10">No items match your search</p>
              <p className="text-slate-500 text-xs mt-2 font-mono uppercase">Try another brand or model</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <ProductItem 
                key={product.id} 
                product={product} 
                expandedId={expandedId}
                toggleExpand={toggleExpand}
                handleRestockModal={handleRestockModal}
                setSellModalData={setSellModalData}
                sellVariant={sellVariant}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      <SellConfirmationModal
        isOpen={!!sellModalData}
        onClose={() => setSellModalData(null)}
        productName={sellModalData?.productName || ''}
        variantName={sellModalData?.variantName || ''}
        expectedPrice={sellModalData?.expectedPrice || 0}
        onConfirm={async (finalPrice) => {
          if (sellModalData) {
            const success = await sellVariant(sellModalData.productId, sellModalData.variantId, finalPrice);
            if (success) {
              setSellModalData(null);
            }
          }
        }}
      />

      <button
        id="floating-add-btn"
        onClick={() => setIsAddingGoods(true)}
        className="fixed bottom-28 right-6 w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-95 transition-transform border border-slate-800 dark:border-slate-200"
      >
        <Plus size={32} />
      </button>

      <AddProductOverlay 
        isOpen={isAddingGoods} 
        onClose={closeOverlay} 
        initialData={restockData}
      />
    </div>
  );
}

const ProductItem = React.memo(({ 
  product, 
  expandedId, 
  toggleExpand, 
  handleRestockModal, 
  setSellModalData,
  sellVariant 
}: { 
  product: Product; 
  expandedId: string | null; 
  toggleExpand: (id: string) => void;
  handleRestockModal: (p: Product, v: Variant) => void;
  setSellModalData: (data: any) => void;
  sellVariant: any;
}) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      id={`product-item-${product.id}`} 
      className="bg-white dark:bg-black transition-colors border-b border-slate-200 dark:border-slate-800"
    >
      <button
        onClick={() => toggleExpand(product.id)}
        className="w-full h-20 px-6 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
      >
        <div>
          <h2 className="text-black dark:text-white font-bold text-lg uppercase leading-none">{product.brand}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{product.model}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right mr-2">
            <span className="block text-[10px] font-black uppercase text-slate-300 dark:text-slate-700">{product.category}</span>
            <span className="text-slate-400 dark:text-slate-600 font-mono text-xs">{product.variants.length} SKU</span>
          </div>
          {expandedId === product.id ? (
            <ChevronDown className="text-black dark:text-white" size={24} />
          ) : (
            <ChevronRight className="text-slate-400 dark:text-slate-600" size={24} />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expandedId === product.id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden bg-slate-100 dark:bg-slate-900/50"
          >
            <div className="p-2 space-y-2">
              {product.variants.map((variant) => (
                <VariantRow 
                  key={variant.id} 
                  variant={variant} 
                  productId={product.id}
                  onRestock={() => handleRestockModal(product, variant)}
                  onSellClick={() => setSellModalData({
                    productId: product.id,
                    variantId: variant.id,
                    productName: `${product.brand} ${product.model}`,
                    variantName: variant.name,
                    expectedPrice: variant.price
                  })}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

interface VariantRowProps {
  variant: Variant;
  productId: string;
  onRestock: () => void;
  onSellClick: () => void;
}

const VariantRow: React.FC<VariantRowProps> = ({ variant, productId, onRestock, onSellClick }) => {
  const [isProcessing] = useState(false);

  return (
    <div id={`variant-row-${variant.id}`} className={`bg-white dark:bg-black border p-4 rounded-xl flex flex-col gap-4 transition-all ${
      variant.stock === 0 
        ? 'border-red-200 dark:border-red-900 shadow-inner' 
        : 'border-slate-200 dark:border-slate-800'
    } ${isProcessing ? 'opacity-50 grayscale' : ''}`}>
      <div className="flex justify-between items-start">
        <div className={variant.stock === 0 ? 'opacity-40' : ''}>
          <h3 className="text-black dark:text-white font-bold text-sm uppercase">{variant.name}</h3>
          <p className="text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase mt-1">{variant.sku}</p>
        </div>
        <div className="text-right">
          <p className={`font-black text-lg ${variant.stock === 0 ? 'text-slate-300 dark:text-slate-700 line-through' : 'text-black dark:text-white'}`}>
            {formatNaira(variant.price)}
          </p>
          <p className={`text-[11px] font-bold uppercase ${variant.stock < 5 ? 'text-red-600 dark:text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
            Stock: {variant.stock}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {variant.stock === 0 ? (
          <div className="flex-1 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 font-black uppercase tracking-[0.3em] text-[10px] rounded-lg flex items-center justify-center gap-2 border border-red-100 dark:border-red-900/50">
            Out of Stock
          </div>
        ) : (
          <button
            id={`sell-btn-${variant.id}`}
            onClick={onSellClick}
            className="flex-1 h-16 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-sm rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <ShoppingCart size={20} className="fill-white dark:fill-black" />
            Sell
          </button>
        )}

        <button
          id={`restock-btn-${variant.id}`}
          onClick={onRestock}
          className="w-20 h-16 bg-slate-100 dark:bg-slate-800 text-black dark:text-white flex items-center justify-center rounded-lg active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
};
