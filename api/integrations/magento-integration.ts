import crypto from "crypto";
import { 
  BaseIntegration, 
  IntegrationCredentials, 
  AuthResult, 
  Product, 
  ProductVariant,
  Customer,
  Purchase,
  DiscountRequest,
  DiscountResponse,
  BudgetPricing,
  OrderUpdate,
  WebhookConfig,
  CacheOptions,
  ProductQueryOptions,
  PaginatedProducts
} from "./base-integration";

export class MagentoIntegration extends BaseIntegration {
  platform = "magento" as const;
  private baseUrl: string;
  private headers: Record<string, string>;
  
  constructor(storeId: number, private credentials: IntegrationCredentials) {
    super(storeId);
    this.initializeRateLimiter();
    this.baseUrl = `https://${credentials.shopDomain}/rest/V1`;
    this.headers = {
      "Authorization": `Bearer ${credentials.accessToken}`,
      "Content-Type": "application/json"
    };
  }
  
  async authenticate(credentials: IntegrationCredentials): Promise<AuthResult> {
    // Magento OAuth 2.0 flow
    const response = await fetch(`https://${credentials.shopDomain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code: credentials.accessToken, // OAuth code
        client_id: credentials.apiKey,
        client_secret: credentials.apiSecret
      })
    });
    
    if (!response.ok) {
      throw new Error(`Magento auth failed: ${await response.text()}`);
    }
    
    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope?.split(" ") || []
    };
  }
  
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    const response = await fetch(`https://${this.credentials.shopDomain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: this.credentials.apiKey,
        client_secret: this.credentials.apiSecret
      })
    });
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${await response.text()}`);
    }
    
    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope?.split(" ") || []
    };
  }
  
  validateWebhook(headers: any, body: any): boolean {
    const signature = headers["x-magento-webhook-signature"];
    if (!signature || !this.credentials.webhookSecret) return false;
    
    const hash = crypto
      .createHmac("sha256", this.credentials.webhookSecret)
      .update(JSON.stringify(body))
      .digest("hex");
    
    return hash === signature;
  }
  
  async getProduct(productId: string, options?: CacheOptions): Promise<Product | null> {
    const cacheKey = `product:${productId}`;
    
    if (!options?.forceRefresh) {
      const cached = this.getCached<Product>(cacheKey, options?.maxAge);
      if (cached) return cached;
    }
    
    await this.checkRateLimit();
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/products/${productId}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch product: ${await response.text()}`);
      }
      
      const data = await response.json();
      const product = this.transformMagentoProduct(data);
      
      this.setCached(cacheKey, product);
      await this.trackApiCall(`products/${productId}`, true, Date.now() - startTime);
      return product;
    } catch (error) {
      await this.trackApiCall(`products/${productId}`, false, Date.now() - startTime);
      throw error;
    }
  }
  
  async getProducts(options?: ProductQueryOptions): Promise<PaginatedProducts> {
    const searchCriteria: any = {
      searchCriteria: {
        filterGroups: [],
        pageSize: options?.limit || 20,
        currentPage: options?.cursor ? parseInt(options.cursor) : 1
      }
    };
    
    // Add filters
    if (options?.minPrice || options?.maxPrice) {
      const priceFilter: any = { filters: [] };
      if (options.minPrice) {
        priceFilter.filters.push({
          field: "price",
          value: options.minPrice.toString(),
          conditionType: "gteq"
        });
      }
      if (options.maxPrice) {
        priceFilter.filters.push({
          field: "price",
          value: options.maxPrice.toString(),
          conditionType: "lteq"
        });
      }
      searchCriteria.searchCriteria.filterGroups.push(priceFilter);
    }
    
    await this.checkRateLimit();
    const startTime = Date.now();
    
    try {
      const queryString = new URLSearchParams(this.flattenObject(searchCriteria)).toString();
      const response = await fetch(`${this.baseUrl}/products?${queryString}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${await response.text()}`);
      }
      
      const data = await response.json();
      const products = data.items.map((item: any) => this.transformMagentoProduct(item));
      
      await this.trackApiCall("products", true, Date.now() - startTime);
      
      return {
        products,
        hasNextPage: data.total_count > (searchCriteria.searchCriteria.currentPage * searchCriteria.searchCriteria.pageSize),
        cursor: (searchCriteria.searchCriteria.currentPage + 1).toString(),
        totalCount: data.total_count
      };
    } catch (error) {
      await this.trackApiCall("products", false, Date.now() - startTime);
      throw error;
    }
  }
  
  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    const product = await this.getProduct(productId);
    return product?.variants || [];
  }
  
  async getCustomer(customerId: string): Promise<Customer | null> {
    const cacheKey = `customer:${customerId}`;
    const cached = this.getCached<Customer>(cacheKey, 300);
    if (cached) return cached;
    
    await this.checkRateLimit();
    
    try {
      const response = await fetch(`${this.baseUrl}/customers/${customerId}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch customer: ${await response.text()}`);
      }
      
      const data = await response.json();
      const customer = this.transformMagentoCustomer(data);
      
      this.setCached(cacheKey, customer);
      return customer;
    } catch (error) {
      console.error("Failed to fetch customer:", error);
      return null;
    }
  }
  
  async getCustomerPurchaseHistory(customerId: string, limit: number = 10): Promise<Purchase[]> {
    await this.checkRateLimit();
    
    try {
      const searchCriteria = {
        searchCriteria: {
          filterGroups: [{
            filters: [{
              field: "customer_id",
              value: customerId,
              conditionType: "eq"
            }]
          }],
          pageSize: limit
        }
      };
      
      const queryString = new URLSearchParams(this.flattenObject(searchCriteria)).toString();
      const response = await fetch(`${this.baseUrl}/orders?${queryString}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${await response.text()}`);
      }
      
      const data = await response.json();
      return data.items.map((order: any) => this.transformMagentoOrder(order));
    } catch (error) {
      console.error("Failed to fetch purchase history:", error);
      return [];
    }
  }
  
  async createDiscount(discount: DiscountRequest): Promise<DiscountResponse> {
    await this.checkRateLimit();
    
    try {
      // Create cart price rule in Magento
      const rule = {
        name: discount.code || `BUDGET_${Date.now()}`,
        is_active: true,
        simple_action: discount.valueType === "percentage" ? "by_percent" : "by_fixed",
        discount_amount: discount.value,
        apply_to_shipping: false,
        stop_rules_processing: false,
        customer_group_ids: [0, 1], // General and logged in customers
        website_ids: [1], // Default website
        coupon_type: "specific",
        uses_per_customer: discount.usageLimit || 0,
        from_date: discount.startsAt?.toISOString().split('T')[0],
        to_date: discount.endsAt?.toISOString().split('T')[0]
      };
      
      const response = await fetch(`${this.baseUrl}/salesrules/rule`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ rule })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create price rule: ${await response.text()}`);
      }
      
      const ruleData = await response.json();
      
      // Generate coupon code
      const couponResponse = await fetch(`${this.baseUrl}/salesrules/coupons/generate`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          couponSpec: {
            rule_id: ruleData.rule_id,
            format: discount.code || `BUDGET_${Date.now()}`,
            quantity: 1,
            length: 12
          }
        })
      });
      
      if (!couponResponse.ok) {
        throw new Error(`Failed to generate coupon: ${await couponResponse.text()}`);
      }
      
      const couponData = await couponResponse.json();
      
      return {
        id: ruleData.rule_id.toString(),
        code: couponData[0],
        adminUrl: `https://${this.credentials.shopDomain}/admin/sales_rule/promo_quote/edit/id/${ruleData.rule_id}/`
      };
    } catch (error) {
      console.error("Failed to create discount:", error);
      throw error;
    }
  }
  
  async applyBudgetPricing(orderId: string, pricing: BudgetPricing): Promise<OrderUpdate> {
    try {
      // In Magento, we typically apply discounts to quotes/carts before order creation
      const discountAmount = pricing.originalPrice * (pricing.discountPercentage / 100);
      
      // Update order with custom discount
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        method: "PUT",
        headers: this.headers,
        body: JSON.stringify({
          entity: {
            discount_amount: discountAmount,
            discount_description: `Budget ${pricing.budgetCategory} Discount`
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update order: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      return {
        orderId,
        status: "success",
        updatedTotal: parseFloat(data.grand_total)
      };
    } catch (error) {
      return {
        orderId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  
  async registerWebhooks(webhooks: WebhookConfig[]): Promise<void> {
    // Magento uses different approach - typically configured in integration settings
    console.log("Webhook registration for Magento should be configured in admin panel");
  }
  
  async unregisterWebhooks(webhookIds: string[]): Promise<void> {
    console.log("Webhook unregistration for Magento should be configured in admin panel");
  }
  
  // Helper methods
  private transformMagentoProduct(product: any): Product {
    const prices = product.price || 0;
    const images = product.media_gallery_entries || [];
    
    // Get configurable options if available
    const variants = this.extractMagentoVariants(product);
    
    return {
      id: product.id.toString(),
      title: product.name,
      handle: product.url_key || product.sku,
      description: product.custom_attributes?.find((attr: any) => attr.attribute_code === "description")?.value || "",
      vendor: product.custom_attributes?.find((attr: any) => attr.attribute_code === "manufacturer")?.value,
      productType: product.type_id,
      tags: [],
      images: images.map((img: any, index: number) => ({
        id: img.id?.toString() || index.toString(),
        url: `https://${this.credentials.shopDomain}/media/catalog/product${img.file}`,
        altText: img.label,
        position: img.position
      })),
      variants,
      priceRange: {
        min: parseFloat(prices),
        max: parseFloat(prices)
      },
      createdAt: new Date(product.created_at),
      updatedAt: new Date(product.updated_at)
    };
  }
  
  private extractMagentoVariants(product: any): ProductVariant[] {
    // For simple products
    if (product.type_id === "simple") {
      return [{
        id: product.id.toString(),
        productId: product.id.toString(),
        title: product.name,
        sku: product.sku,
        price: parseFloat(product.price || 0),
        inventoryQuantity: product.extension_attributes?.stock_item?.qty,
        weight: product.weight,
        weightUnit: "kg",
        options: {}
      }];
    }
    
    // For configurable products, we'd need additional API calls
    // This is simplified for demonstration
    return [];
  }
  
  private transformMagentoCustomer(customer: any): Customer {
    return {
      id: customer.id.toString(),
      email: customer.email,
      firstName: customer.firstname,
      lastName: customer.lastname,
      phone: customer.addresses?.[0]?.telephone,
      tags: [],
      totalSpent: 0, // Would need additional API call
      ordersCount: 0, // Would need additional API call
      createdAt: new Date(customer.created_at),
      lastOrderDate: undefined
    };
  }
  
  private transformMagentoOrder(order: any): Purchase {
    return {
      id: order.entity_id.toString(),
      orderNumber: order.increment_id,
      customerId: order.customer_id?.toString() || "",
      total: parseFloat(order.grand_total),
      discountTotal: Math.abs(parseFloat(order.discount_amount || 0)),
      items: (order.items || []).map((item: any) => ({
        productId: item.product_id?.toString() || "",
        variantId: item.item_id?.toString() || "",
        title: item.name,
        quantity: item.qty_ordered,
        price: parseFloat(item.price),
        discountedPrice: item.discount_amount > 0 
          ? parseFloat(item.price) - (parseFloat(item.discount_amount) / item.qty_ordered)
          : undefined
      })),
      createdAt: new Date(order.created_at)
    };
  }
  
  private flattenObject(obj: any, prefix = ""): Record<string, string> {
    const flattened: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}[${key}]` : key;
      
      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === "object") {
            Object.assign(flattened, this.flattenObject(item, `${newKey}[${index}]`));
          } else {
            flattened[`${newKey}[${index}]`] = String(item);
          }
        });
      } else {
        flattened[newKey] = String(value);
      }
    }
    
    return flattened;
  }
}