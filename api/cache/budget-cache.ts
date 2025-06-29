import { BudgetData, CustomerPurchase } from "@shared/schema";

// Edge-compatible cache interface that works in both Node.js and Cloudflare Workers
export interface IBudgetCache {
  // Customer budget operations
  setCustomerBudget(customerId: string, storeId: number, budget: BudgetData): Promise<void>;
  getCustomerBudget(customerId: string, storeId: number): Promise<BudgetData | null>;
  
  // Product pricing cache
  setProductPricing(productId: string, storeId: number, customerId: string, pricing: CachedPricing): Promise<void>;
  getProductPricing(productId: string, storeId: number, customerId: string): Promise<CachedPricing | null>;
  
  // Batch operations for performance
  setMultipleProductPricing(items: BatchPricingItem[]): Promise<void>;
  getMultipleProductPricing(keys: PricingKey[]): Promise<Map<string, CachedPricing>>;
  
  // Cache management
  invalidateCustomerCache(customerId: string, storeId: number): Promise<void>;
  invalidateStoreCache(storeId: number): Promise<void>;
  
  // TTL management
  setWithTTL(key: string, value: any, ttlSeconds: number): Promise<void>;
  get(key: string): Promise<any>;
}

export interface CachedPricing {
  originalPrice: number;
  budgetPrice: number;
  discountPercentage: number;
  budgetCategory: "needs" | "wants" | "savings";
  remainingBudget: number;
  timestamp: number;
  ttl: number;
}

export interface BatchPricingItem {
  productId: string;
  storeId: number;
  customerId: string;
  pricing: CachedPricing;
}

export interface PricingKey {
  productId: string;
  storeId: number;
  customerId: string;
}

// In-memory cache implementation for Node.js
export class MemoryBudgetCache implements IBudgetCache {
  private cache: Map<string, { value: any; expires: number }> = new Map();
  private readonly DEFAULT_TTL = 3600; // 1 hour default TTL
  
  async setCustomerBudget(customerId: string, storeId: number, budget: BudgetData): Promise<void> {
    const key = this.getCustomerBudgetKey(customerId, storeId);
    await this.setWithTTL(key, budget, this.DEFAULT_TTL);
  }
  
  async getCustomerBudget(customerId: string, storeId: number): Promise<BudgetData | null> {
    const key = this.getCustomerBudgetKey(customerId, storeId);
    return await this.get(key);
  }
  
  async setProductPricing(productId: string, storeId: number, customerId: string, pricing: CachedPricing): Promise<void> {
    const key = this.getProductPricingKey(productId, storeId, customerId);
    await this.setWithTTL(key, pricing, pricing.ttl || 300); // 5 min default for product pricing
  }
  
  async getProductPricing(productId: string, storeId: number, customerId: string): Promise<CachedPricing | null> {
    const key = this.getProductPricingKey(productId, storeId, customerId);
    return await this.get(key);
  }
  
  async setMultipleProductPricing(items: BatchPricingItem[]): Promise<void> {
    const promises = items.map(item => 
      this.setProductPricing(item.productId, item.storeId, item.customerId, item.pricing)
    );
    await Promise.all(promises);
  }
  
  async getMultipleProductPricing(keys: PricingKey[]): Promise<Map<string, CachedPricing>> {
    const result = new Map<string, CachedPricing>();
    
    const promises = keys.map(async (key) => {
      const pricing = await this.getProductPricing(key.productId, key.storeId, key.customerId);
      if (pricing) {
        const mapKey = `${key.productId}:${key.storeId}:${key.customerId}`;
        result.set(mapKey, pricing);
      }
    });
    
    await Promise.all(promises);
    return result;
  }
  
  async invalidateCustomerCache(customerId: string, storeId: number): Promise<void> {
    const prefix = `budget:${storeId}:${customerId}`;
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
  
  async invalidateStoreCache(storeId: number): Promise<void> {
    const prefix = `budget:${storeId}:`;
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
  
  async setWithTTL(key: string, value: any, ttlSeconds: number): Promise<void> {
    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expires });
    
    // Limit cache size to prevent memory issues
    if (this.cache.size > 10000) {
      this.evictExpired();
    }
  }
  
  async get(key: string): Promise<any> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  private getCustomerBudgetKey(customerId: string, storeId: number): string {
    return `budget:${storeId}:${customerId}:data`;
  }
  
  private getProductPricingKey(productId: string, storeId: number, customerId: string): string {
    return `budget:${storeId}:${customerId}:product:${productId}`;
  }
  
  private evictExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now > entry.expires) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Cloudflare Workers KV cache implementation
export class CloudflareKVCache implements IBudgetCache {
  constructor(private kv: KVNamespace) {}
  
  async setCustomerBudget(customerId: string, storeId: number, budget: BudgetData): Promise<void> {
    const key = this.getCustomerBudgetKey(customerId, storeId);
    await this.kv.put(key, JSON.stringify(budget), {
      expirationTtl: 3600 // 1 hour
    });
  }
  
  async getCustomerBudget(customerId: string, storeId: number): Promise<BudgetData | null> {
    const key = this.getCustomerBudgetKey(customerId, storeId);
    const value = await this.kv.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async setProductPricing(productId: string, storeId: number, customerId: string, pricing: CachedPricing): Promise<void> {
    const key = this.getProductPricingKey(productId, storeId, customerId);
    await this.kv.put(key, JSON.stringify(pricing), {
      expirationTtl: pricing.ttl || 300
    });
  }
  
  async getProductPricing(productId: string, storeId: number, customerId: string): Promise<CachedPricing | null> {
    const key = this.getProductPricingKey(productId, storeId, customerId);
    const value = await this.kv.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  async setMultipleProductPricing(items: BatchPricingItem[]): Promise<void> {
    // Cloudflare Workers supports bulk operations
    const operations = items.map(item => ({
      key: this.getProductPricingKey(item.productId, item.storeId, item.customerId),
      value: JSON.stringify(item.pricing),
      options: { expirationTtl: item.pricing.ttl || 300 }
    }));
    
    // Note: In real implementation, use KV bulk put when available
    await Promise.all(operations.map(op => 
      this.kv.put(op.key, op.value, op.options)
    ));
  }
  
  async getMultipleProductPricing(keys: PricingKey[]): Promise<Map<string, CachedPricing>> {
    const result = new Map<string, CachedPricing>();
    
    // Note: In real implementation, use KV bulk get when available
    const promises = keys.map(async (key) => {
      const pricing = await this.getProductPricing(key.productId, key.storeId, key.customerId);
      if (pricing) {
        const mapKey = `${key.productId}:${key.storeId}:${key.customerId}`;
        result.set(mapKey, pricing);
      }
    });
    
    await Promise.all(promises);
    return result;
  }
  
  async invalidateCustomerCache(customerId: string, storeId: number): Promise<void> {
    // In Cloudflare Workers, we'd typically use a list pattern or prefix listing
    // For now, we'll invalidate known keys
    const budgetKey = this.getCustomerBudgetKey(customerId, storeId);
    await this.kv.delete(budgetKey);
  }
  
  async invalidateStoreCache(storeId: number): Promise<void> {
    // Similar limitation - in production, use prefix listing
    console.log(`Would invalidate all cache for store ${storeId}`);
  }
  
  async setWithTTL(key: string, value: any, ttlSeconds: number): Promise<void> {
    await this.kv.put(key, JSON.stringify(value), {
      expirationTtl: ttlSeconds
    });
  }
  
  async get(key: string): Promise<any> {
    const value = await this.kv.get(key);
    return value ? JSON.parse(value) : null;
  }
  
  private getCustomerBudgetKey(customerId: string, storeId: number): string {
    return `budget:${storeId}:${customerId}:data`;
  }
  
  private getProductPricingKey(productId: string, storeId: number, customerId: string): string {
    return `budget:${storeId}:${customerId}:product:${productId}`;
  }
}

// Factory to create appropriate cache based on environment
export function createBudgetCache(): IBudgetCache {
  // @ts-ignore - Check for Cloudflare Workers environment
  if (typeof KV !== 'undefined') {
    // @ts-ignore
    return new CloudflareKVCache(KV);
  }
  
  return new MemoryBudgetCache();
}

// Global instance
export const budgetCache = createBudgetCache();