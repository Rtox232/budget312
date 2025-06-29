import { z } from "zod";
import { db } from "../db";
import { stores, analytics } from "@shared/schema";
import { eq } from "drizzle-orm";

// Base integration interface that all platform integrations must implement
export interface IIntegration {
  platform: "shopify" | "magento" | "wordpress";
  
  // Authentication methods
  authenticate(credentials: IntegrationCredentials): Promise<AuthResult>;
  refreshToken(refreshToken: string): Promise<AuthResult>;
  validateWebhook(headers: any, body: any): boolean;
  
  // Product methods with caching
  getProduct(productId: string, options?: CacheOptions): Promise<Product | null>;
  getProducts(options?: ProductQueryOptions): Promise<PaginatedProducts>;
  getProductVariants(productId: string): Promise<ProductVariant[]>;
  
  // Customer methods
  getCustomer(customerId: string): Promise<Customer | null>;
  getCustomerPurchaseHistory(customerId: string, limit?: number): Promise<Purchase[]>;
  
  // Order methods
  createDiscount(discount: DiscountRequest): Promise<DiscountResponse>;
  applyBudgetPricing(orderId: string, pricing: BudgetPricing): Promise<OrderUpdate>;
  
  // Webhook registration
  registerWebhooks(webhooks: WebhookConfig[]): Promise<void>;
  unregisterWebhooks(webhookIds: string[]): Promise<void>;
}

// Shared types
export interface IntegrationCredentials {
  shopDomain?: string;
  apiKey: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  webhookSecret?: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string[];
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  vendor?: string;
  productType?: string;
  tags: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  priceRange: {
    min: number;
    max: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  position: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  title: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  inventoryQuantity?: number;
  weight?: number;
  weightUnit?: string;
  options: Record<string, string>;
}

export interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags: string[];
  totalSpent: number;
  ordersCount: number;
  createdAt: Date;
  lastOrderDate?: Date;
}

export interface Purchase {
  id: string;
  orderNumber: string;
  customerId: string;
  total: number;
  discountTotal: number;
  items: PurchaseItem[];
  createdAt: Date;
}

export interface PurchaseItem {
  productId: string;
  variantId: string;
  title: string;
  quantity: number;
  price: number;
  discountedPrice?: number;
}

export interface DiscountRequest {
  code?: string;
  value: number;
  valueType: "percentage" | "fixed";
  appliesTo: "order" | "products" | "collections";
  productIds?: string[];
  collectionIds?: string[];
  minimumAmount?: number;
  usageLimit?: number;
  customerIds?: string[];
  startsAt?: Date;
  endsAt?: Date;
}

export interface DiscountResponse {
  id: string;
  code: string;
  adminUrl?: string;
}

export interface BudgetPricing {
  originalPrice: number;
  budgetPrice: number;
  discountPercentage: number;
  budgetCategory: "needs" | "wants" | "savings";
  customerId: string;
  appliedRuleId?: number;
}

export interface OrderUpdate {
  orderId: string;
  status: "success" | "failed";
  updatedTotal?: number;
  error?: string;
}

export interface WebhookConfig {
  topic: string;
  endpoint: string;
  format?: "json" | "xml";
}

export interface CacheOptions {
  maxAge?: number; // Cache duration in seconds
  forceRefresh?: boolean;
}

export interface ProductQueryOptions extends CacheOptions {
  limit?: number;
  cursor?: string;
  collection?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price" | "title" | "created" | "updated";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedProducts {
  products: Product[];
  hasNextPage: boolean;
  cursor?: string;
  totalCount?: number;
}

// Base integration class with common functionality
export abstract class BaseIntegration implements IIntegration {
  abstract platform: "shopify" | "magento" | "wordpress";
  protected cache: Map<string, CacheEntry> = new Map();
  protected rateLimiter: RateLimiter | null = null;
  
  constructor(protected storeId: number) {
    // Rate limiter will be initialized in concrete classes
  }
  
  protected initializeRateLimiter(): void {
    this.rateLimiter = new RateLimiter(this.platform);
  }
  
  // Abstract methods that must be implemented by each platform
  abstract authenticate(credentials: IntegrationCredentials): Promise<AuthResult>;
  abstract refreshToken(refreshToken: string): Promise<AuthResult>;
  abstract validateWebhook(headers: any, body: any): boolean;
  abstract getProduct(productId: string, options?: CacheOptions): Promise<Product | null>;
  abstract getProducts(options?: ProductQueryOptions): Promise<PaginatedProducts>;
  abstract getProductVariants(productId: string): Promise<ProductVariant[]>;
  abstract getCustomer(customerId: string): Promise<Customer | null>;
  abstract getCustomerPurchaseHistory(customerId: string, limit?: number): Promise<Purchase[]>;
  abstract createDiscount(discount: DiscountRequest): Promise<DiscountResponse>;
  abstract applyBudgetPricing(orderId: string, pricing: BudgetPricing): Promise<OrderUpdate>;
  abstract registerWebhooks(webhooks: WebhookConfig[]): Promise<void>;
  abstract unregisterWebhooks(webhookIds: string[]): Promise<void>;
  
  // Common cache management
  protected getCached<T>(key: string, maxAge: number = 300): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const age = (Date.now() - entry.timestamp) / 1000;
    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  protected setCached(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  // Rate limiting
  protected async checkRateLimit(): Promise<void> {
    if (!this.rateLimiter) {
      throw new Error("Rate limiter not initialized");
    }
    await this.rateLimiter.checkLimit();
  }
  
  // Analytics tracking
  protected async trackApiCall(endpoint: string, success: boolean, responseTime: number): Promise<void> {
    try {
      await db.insert(analytics).values({
        storeId: this.storeId,
        eventType: "api_call",
        eventData: {
          platform: this.platform,
          endpoint,
          success,
          responseTime
        }
      });
    } catch (error) {
      console.error("Failed to track API call:", error);
    }
  }
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

// Rate limiter for API calls
class RateLimiter {
  private requests: number[] = [];
  private limits: Record<string, { requests: number; window: number }> = {
    shopify: { requests: 40, window: 60 }, // 40 requests per minute
    magento: { requests: 100, window: 60 }, // 100 requests per minute
    wordpress: { requests: 60, window: 60 } // 60 requests per minute
  };
  
  constructor(private platform: string) {}
  
  async checkLimit(): Promise<void> {
    const now = Date.now();
    const limit = this.limits[this.platform];
    const windowStart = now - (limit.window * 1000);
    
    // Remove old requests
    this.requests = this.requests.filter(time => time > windowStart);
    
    // Check if limit exceeded
    if (this.requests.length >= limit.requests) {
      const oldestRequest = this.requests[0];
      const waitTime = oldestRequest + (limit.window * 1000) - now;
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.requests.push(now);
  }
}