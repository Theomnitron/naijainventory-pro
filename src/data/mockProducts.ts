import { Product } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    businessId: 'Beta_Tester_1',
    brand: 'Infinix',
    model: 'Note 40',
    category: 'Phones',
    variants: [
      { id: '1-1', name: '8GB/256GB - Gold', sku: 'INF-N40-8-256-GLD', price: 250000, stock: 12 },
      { id: '1-2', name: '8GB/256GB - Black', sku: 'INF-N40-8-256-BLK', price: 250000, stock: 8 },
    ],
  },
  {
    id: '2',
    businessId: 'Beta_Tester_1',
    brand: 'Tecno',
    model: 'Camon 30',
    category: 'Phones',
    variants: [
      { id: '2-1', name: '12GB/512GB - Silver', sku: 'TEC-C30-12-512-SLV', price: 320000, stock: 5 },
    ],
  },
  {
    id: '3',
    businessId: 'Beta_Tester_1',
    brand: 'Samsung',
    model: 'Galaxy A55',
    category: 'Phones',
    variants: [
      { id: '3-1', name: '8GB/128GB - Awesome Blue', sku: 'SAM-A55-8-128-BLU', price: 450000, stock: 3 },
      { id: '3-2', name: '8GB/256GB - Awesome Navy', sku: 'SAM-A55-8-256-NVY', price: 485000, stock: 7 },
    ],
  },
  {
    id: '4',
    businessId: 'Beta_Tester_1',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    category: 'Phones',
    variants: [
      { id: '4-1', name: '128GB - Natural Titanium', sku: 'APP-I15P-128-NAT', price: 1200000, stock: 2 },
      { id: '4-2', name: '256GB - Blue Titanium', sku: 'APP-I15P-256-BLU', price: 1350000, stock: 1 },
    ],
  },
];
