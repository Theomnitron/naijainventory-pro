export interface Variant {
  id: string;
  name: string; // e.g., "8GB/256GB - Gold"
  sku: string;
  price: number;
  stock: number;
}

export type Category = 'Phones' | 'Laptops' | 'Accessories' | 'Other';

export interface Product {
  id: string;
  businessId: string;
  brand: string; // e.g., "Infinix"
  model: string; // e.g., "Note 40"
  category: Category;
  variants: Variant[];
}

export interface AuditEntry {
  id: string;
  businessId: string;
  timestamp: number;
  type: 'Sale' | 'Restock';
  productName: string;
  variantName: string;
  quantity: number;
  price?: number;
  discount?: number;
  originalPrice?: number;
  isVoided?: boolean;
  voidedAt?: number;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  businessName: string;
  state: string;
  city: string;
  businessType: string;
  email: string;
  paystackReference: string;
  businessAddress?: string;
  businessPhone?: string;
  adminPin?: string;
  welcomed?: boolean;
  createdAt: any;
  masterKey: string;
  isPaid: boolean;
}

export type AppTab = 'Summ' | 'Goods' | 'Audit' | 'Sett';
