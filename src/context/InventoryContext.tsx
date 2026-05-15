import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  writeBatch,
  orderBy,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { Product, Variant, AuditEntry, Category } from '../types';
import { db, serverTimestamp, Timestamp } from '../services/firebase';
import { encryptData, decryptData } from '../utils/encryption';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface BulkUploadItem {
  brand: string;
  model: string;
  category: string;
  variant: string;
  price: number;
  quantity: number;
}

interface InventoryContextType {
  products: Product[];
  auditLog: AuditEntry[];
  sellVariant: (productId: string, variantId: string, finalPrice?: number) => Promise<boolean>;
  restockVariant: (productId: string, variantId: string, quantity: number) => Promise<void>;
  addProduct: (newProduct: Omit<Product, 'id' | 'businessId' | 'variants'>, initialVariant: Omit<Variant, 'id'>) => Promise<void>;
  isLoading: boolean;
  inventoryFilter: string;
  setInventoryFilter: (filter: string) => void;
  isLocked: boolean;
  unlock: (key: string) => boolean;
  voidTransaction: (entryId: string) => Promise<boolean>;
  bulkInventoryUpload: (items: BulkUploadItem[], replaceEntire: boolean, onProgress: (progress: number) => void) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryFilter, setInventoryFilter] = useState('All');
  const [localKey, setLocalKey] = useState<string | null>(localStorage.getItem('MASTER_KEY'));
  const [isLocked, setIsLocked] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(0);
  const [pinLockUntil, setPinLockUntil] = useState<number | null>(null);

  useEffect(() => {
    if (user && profile) {
      if (!localKey) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    }
  }, [user, profile, localKey]);

  useEffect(() => {
    const savedAttempts = localStorage.getItem('PIN_ATTEMPTS');
    const savedLock = localStorage.getItem('PIN_LOCK_UNTIL');
    if (savedAttempts) setPinAttempts(parseInt(savedAttempts, 10));
    if (savedLock) setPinLockUntil(parseInt(savedLock, 10));
  }, []);

  const timestampToMs = (ts: any): number => {
    if (!ts) return Date.now();
    if (typeof ts === 'number') return ts;
    if (ts.toMillis) return ts.toMillis();
    if (ts.seconds) return ts.seconds * 1000;
    return Date.now();
  };

  const voidTransaction = async (entryId: string): Promise<boolean> => {
    if (!user || !localKey) return false;
    if (!checkNetwork()) return false;

    const entry = auditLog.find(e => e.id === entryId);
    if (!entry || entry.type !== 'Sale' || entry.isVoided) return false;

    const userKey = localKey;
    const batch = writeBatch(db);
    
    const product = products.find(p => `${p.brand} ${p.model}` === entry.productName);
    if (product) {
      const variantIndex = product.variants.findIndex(v => v.name === entry.variantName);
      if (variantIndex !== -1) {
        const variant = product.variants[variantIndex];
        const productRef = doc(db, 'users', user.uid, 'products', product.id);
        const updatedVariants = [...product.variants];
        updatedVariants[variantIndex] = { ...variant, stock: variant.stock + 1 };
        
        batch.update(productRef, {
          variants: updatedVariants.map(v => ({
            ...v,
            name: encryptData(v.name, userKey),
            price: encryptData(v.price, userKey)
          }))
        });
      }
    }

    const auditRef = doc(db, 'users', user.uid, 'audit', entryId);
    batch.update(auditRef, {
      isVoided: true,
      voidedAt: serverTimestamp()
    });

    try {
      await batch.commit();
      showToast('Sale Voided & Stock Restored');
      return true;
    } catch (error) {
      showToast('Connection Error: Update not recorded. Please check your data.');
      return false;
    }
  };

  const unlock = (key: string): boolean => {
    if (!profile) return false;
    if (key.trim().toUpperCase() === profile.masterKey.toUpperCase()) {
      localStorage.setItem('MASTER_KEY', key.trim().toUpperCase());
      setLocalKey(key.trim().toUpperCase());
      setIsLocked(false);
      showToast('INVENTORY UNLOCKED');
      return true;
    }
    return false;
  };

  // Real-time Products Sync
  useEffect(() => {
    if (!user || !localKey) {
      if (!user) {
        setProducts([]);
        setIsLoading(false);
      }
      return;
    }

    const q = collection(db, 'users', user.uid, 'products');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productData: Product[] = [];
      const userKey = localKey;

      snapshot.forEach((doc) => {
        const rawData = doc.data();
        try {
          const decryptedProduct = {
            ...rawData,
            id: doc.id,
            brand: decryptData(rawData.brand, userKey),
            model: decryptData(rawData.model, userKey),
            variants: (rawData.variants || []).map((v: any) => ({
              ...v,
              name: decryptData(v.name, userKey),
              price: Number(decryptData(v.price, userKey))
            }))
          } as any;
          productData.push(decryptedProduct as Product);
        } catch (e) {
          // Decryption failed - likely wrong key in local storage
          localStorage.removeItem('MASTER_KEY');
          setLocalKey(null);
        }
      });
      setProducts(productData);
      setIsLoading(false);
    }, (error) => {
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, localKey]);

  // Real-time Audit Log Sync
  useEffect(() => {
    if (!user || !localKey) {
      if (!user) setAuditLog([]);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'audit'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const auditData: AuditEntry[] = [];
      const userKey = localKey;

      snapshot.forEach((doc) => {
        const rawData = doc.data();
        try {
          const decryptedEntry = {
            ...rawData,
            id: doc.id,
            productName: decryptData(rawData.productName, userKey),
            variantName: decryptData(rawData.variantName, userKey),
            timestamp: timestampToMs(rawData.timestamp),
            price: rawData.price ? Number(decryptData(rawData.price, userKey)) : undefined,
            discount: rawData.discount ? Number(decryptData(rawData.discount, userKey)) : undefined,
            originalPrice: rawData.originalPrice ? Number(decryptData(rawData.originalPrice, userKey)) : undefined,
            voidedAt: rawData.voidedAt ? timestampToMs(rawData.voidedAt) : undefined
          } as any;
          auditData.push(decryptedEntry as AuditEntry);
        } catch (e) {
          // skip failing entries or handle key error
        }
      });
      setAuditLog(auditData);
    });

    return () => unsubscribe();
  }, [user, localKey]);

  const checkNetwork = () => {
    if (!navigator.onLine) {
      showToast('Connection Error: Sale not recorded. Please check your data.');
      return false;
    }
    return true;
  };

  const sellVariant = async (productId: string, variantId: string, finalPrice?: number) => {
    if (!user || !localKey) return false;
    if (!checkNetwork()) return false;
    
    const userKey = localKey;
    const product = products.find(p => p.id === productId);
    if (!product) return false;

    const variantIndex = product.variants.findIndex(v => v.id === variantId);
    if (variantIndex === -1) return false;

    const variant = product.variants[variantIndex];
    if (variant.stock <= 0) return false;

    const batch = writeBatch(db);
    const productRef = doc(db, 'users', user.uid, 'products', productId);
    const auditRef = doc(collection(db, 'users', user.uid, 'audit'));

    const updatedVariants = [...product.variants];
    updatedVariants[variantIndex] = { ...variant, stock: variant.stock - 1 };

    batch.update(productRef, { 
      variants: updatedVariants.map(v => ({
        ...v,
        name: encryptData(v.name, userKey),
        price: encryptData(v.price, userKey)
      })) 
    });
    
    const salePrice = finalPrice !== undefined ? finalPrice : variant.price;
    const discount = variant.price - salePrice;

    batch.set(auditRef, {
      timestamp: serverTimestamp(),
      type: 'Sale',
      productName: encryptData(`${product.brand} ${product.model}`, userKey),
      variantName: encryptData(variant.name, userKey),
      quantity: 1,
      price: encryptData(salePrice, userKey),
      originalPrice: encryptData(variant.price, userKey),
      discount: encryptData(discount, userKey),
    });

    try {
      await batch.commit();
      showToast('SALE RECORDED');
      return true;
    } catch (error) {
      showToast('Connection Error: Sale not recorded. Please check your data.');
      return false;
    }
  };

  const restockVariant = async (productId: string, variantId: string, quantity: number) => {
    if (!user || !localKey) return;
    if (!checkNetwork()) return;

    const userKey = localKey;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const variantIndex = product.variants.findIndex(v => v.id === variantId);
    if (variantIndex === -1) return;

    const variant = product.variants[variantIndex];
    
    const batch = writeBatch(db);
    const productRef = doc(db, 'users', user.uid, 'products', productId);
    const auditRef = doc(collection(db, 'users', user.uid, 'audit'));

    const updatedVariants = [...product.variants];
    updatedVariants[variantIndex] = { ...variant, stock: variant.stock + quantity };

    batch.update(productRef, { 
      variants: updatedVariants.map(v => ({
        ...v,
        name: encryptData(v.name, userKey),
        price: encryptData(v.price, userKey)
      })) 
    });
    batch.set(auditRef, {
      timestamp: serverTimestamp(),
      type: 'Restock',
      productName: encryptData(`${product.brand} ${product.model}`, userKey),
      variantName: encryptData(variant.name, userKey),
      quantity: quantity,
    });

    try {
      await batch.commit();
      showToast('STOCK UPDATED!');
    } catch (error) {
      showToast('Connection Error: Update not recorded. Please check your data.');
    }
  };

  const addProduct = async (newProduct: Omit<Product, 'id' | 'businessId' | 'variants'>, initialVariant: Omit<Variant, 'id'>) => {
    if (!user || !localKey) return;
    if (!checkNetwork()) return;

    const userKey = localKey;
    const cleanBrand = newProduct.brand.trim();
    const cleanModel = newProduct.model.trim();
    const cleanVariantName = initialVariant.name.trim();

    const existingProduct = products.find(p => 
      p.brand.trim().toLowerCase() === cleanBrand.toLowerCase() && 
      p.model.trim().toLowerCase() === cleanModel.toLowerCase()
    );

    const batch = writeBatch(db);
    const auditRef = doc(collection(db, 'users', user.uid, 'audit'));
    
    if (existingProduct) {
      const variantIndex = existingProduct.variants.findIndex(v => 
        v.name.trim().toLowerCase() === cleanVariantName.toLowerCase()
      );

      const productRef = doc(db, 'users', user.uid, 'products', existingProduct.id);
      const updatedVariants = [...existingProduct.variants];

      if (variantIndex !== -1) {
        const v = updatedVariants[variantIndex];
        updatedVariants[variantIndex] = { ...v, stock: v.stock + initialVariant.stock };
      } else {
        const variantId = `var-${Date.now()}`;
        updatedVariants.push({
          ...initialVariant,
          id: variantId,
          name: cleanVariantName,
          price: initialVariant.price
        });
      }

      batch.update(productRef, {
        variants: updatedVariants.map(v => ({
          ...v,
          name: encryptData(v.name.trim(), userKey),
          price: encryptData(v.price, userKey)
        }))
      });

      batch.set(auditRef, {
        timestamp: serverTimestamp(),
        type: 'Restock',
        productName: encryptData(`${cleanBrand} ${cleanModel}`, userKey),
        variantName: encryptData(cleanVariantName, userKey),
        quantity: initialVariant.stock,
      });

    } else {
      const productRef = doc(collection(db, 'users', user.uid, 'products'));
      const variantId = `var-${Date.now()}`;

      const productInstance = {
        brand: encryptData(cleanBrand, userKey),
        model: encryptData(cleanModel, userKey),
        category: newProduct.category,
        variants: [{ 
          ...initialVariant, 
          id: variantId,
          name: encryptData(cleanVariantName, userKey),
          price: encryptData(initialVariant.price, userKey)
        }],
      };

      batch.set(productRef, productInstance);
      batch.set(auditRef, {
        timestamp: serverTimestamp(),
        type: 'Restock',
        productName: encryptData(`${cleanBrand} ${cleanModel}`, userKey),
        variantName: encryptData(cleanVariantName, userKey),
        quantity: initialVariant.stock,
      });
    }

    try {
      await batch.commit();
      showToast('ITEM REGISTERED!');
    } catch (error) {
      showToast('Connection Error: Registration not recorded. Please check your data.');
    }
  };

  const bulkInventoryUpload = async (items: BulkUploadItem[], replaceEntire: boolean, onProgress: (progress: number) => void) => {
    if (!user || !localKey) return;
    if (!checkNetwork()) return;

    const userKey = localKey;
    
    try {
      // 1. Clear inventory if requested
      if (replaceEntire) {
        const q = collection(db, 'users', user.uid, 'products');
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        onProgress(10); 
      }

      // 2. Prepare logic
      const localProducts = replaceEntire ? [] : [...products];
      const productsToUpdate = new Map<string, Product>();

      for (const item of items) {
        const matchKey = `${item.brand.trim().toLowerCase()}_${item.model.trim().toLowerCase()}`;
        
        let mappedCategory: Category = 'Other';
        const rawCat = item.category.trim().toLowerCase();
        if (rawCat === 'phone' || rawCat === 'phones') mappedCategory = 'Phones';
        else if (rawCat === 'laptop' || rawCat === 'laptops') mappedCategory = 'Laptops';
        else if (rawCat === 'accessories') mappedCategory = 'Accessories';

        let product = productsToUpdate.get(matchKey) || localProducts.find(p => 
          p.brand.trim().toLowerCase() === item.brand.trim().toLowerCase() && 
          p.model.trim().toLowerCase() === item.model.trim().toLowerCase()
        );

        if (product) {
          const variantIndex = product.variants.findIndex(v => 
            v.name.trim().toLowerCase() === item.variant.trim().toLowerCase()
          );

          if (variantIndex !== -1) {
            product.variants[variantIndex].stock += item.quantity;
            product.variants[variantIndex].price = item.price;
          } else {
            product.variants.push({
              id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              name: item.variant.trim(),
              sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase(),
              price: item.price,
              stock: item.quantity
            });
          }
          product.category = mappedCategory; // Update category if provided
          productsToUpdate.set(matchKey, product);
        } else {
          const newProd: Product = {
            id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            businessId: user.uid,
            brand: item.brand.trim(),
            model: item.model.trim(),
            category: mappedCategory,
            variants: [{
              id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              name: item.variant.trim(),
              sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase(),
              price: item.price,
              stock: item.quantity
            }]
          };
          productsToUpdate.set(matchKey, newProd);
        }
      }

      // 3. Batch Write
      const finalProducts = Array.from(productsToUpdate.values());
      let currentBatch = writeBatch(db);
      let opCount = 0;
      let batchesCommitted = 0;
      const totalBatches = Math.ceil(finalProducts.length / 450);

      for (const product of finalProducts) {
        const productRef = product.id.startsWith('new-') 
          ? doc(collection(db, 'users', user.uid, 'products'))
          : doc(db, 'users', user.uid, 'products', product.id);

        const dataToSet = {
          brand: encryptData(product.brand, userKey),
          model: encryptData(product.model, userKey),
          category: product.category,
          variants: product.variants.map(v => ({
            ...v,
            name: encryptData(v.name, userKey),
            price: encryptData(v.price, userKey)
          }))
        };

        currentBatch.set(productRef, dataToSet);
        opCount++;

        if (opCount >= 450) {
          await currentBatch.commit();
          batchesCommitted++;
          onProgress(20 + (batchesCommitted / totalBatches) * 70);
          currentBatch = writeBatch(db);
          opCount = 0;
        }
      }

      if (opCount > 0) {
        await currentBatch.commit();
      }

      // Audit
      const auditRef = doc(collection(db, 'users', user.uid, 'audit'));
      await writeBatch(db).set(auditRef, {
        timestamp: serverTimestamp(),
        type: 'Restock',
        productName: encryptData(`BULK UPLOAD`, userKey),
        variantName: encryptData(`${items.length} items processed`, userKey),
        quantity: items.reduce((acc, i) => acc + i.quantity, 0),
      }).commit();

      onProgress(100);
      showToast(`${items.length} ITEMS PROCESSED SUCCESSFULLY`);
    } catch (err) {
      showToast('UPLOAD FAILED: Check your connection');
      console.error(err);
    }
  };

  return (
    <InventoryContext.Provider value={{ 
      products, 
      auditLog, 
      sellVariant, 
      restockVariant, 
      addProduct, 
      isLoading, 
      inventoryFilter, 
      setInventoryFilter,
      isLocked,
      unlock,
      voidTransaction,
      bulkInventoryUpload
    }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
