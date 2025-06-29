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

export class ShopifyIntegration extends BaseIntegration {
  platform = "shopify" as const;
  private baseUrl: string;
  private headers: Record<string, string>;
  
  constructor(storeId: number, private credentials: IntegrationCredentials) {
    super(storeId);
    this.initializeRateLimiter();
    this.baseUrl = `https://${credentials.shopDomain}/admin/api/2024-01`;
    this.headers = {
      "X-Shopify-Access-Token": credentials.accessToken || "",
      "Content-Type": "application/json"
    };
  }
  
  async authenticate(credentials: IntegrationCredentials): Promise<AuthResult> {
    // Shopify OAuth flow
    const response = await fetch(`https://${credentials.shopDomain}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: credentials.apiKey,
        client_secret: credentials.apiSecret,
        code: credentials.accessToken // OAuth code in this case
      })
    });
    
    if (!response.ok) {
      throw new Error(`Shopify auth failed: ${await response.text()}`);
    }
    
    const data = await response.json();
    return {
      accessToken: data.access_token,
      scope: data.scope?.split(",") || []
    };
  }
  
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    // Shopify tokens don't expire, so just return existing
    return {
      accessToken: this.credentials.accessToken || "",
      scope: []
    };
  }
  
  validateWebhook(headers: any, body: any): boolean {
    const hmac = headers["x-shopify-hmac-sha256"];
    if (!hmac || !this.credentials.webhookSecret) return false;
    
    const hash = crypto
      .createHmac("sha256", this.credentials.webhookSecret)
      .update(body, "utf8")
      .digest("base64");
    
    return hash === hmac;
  }
  
  async getProduct(productId: string, options?: CacheOptions): Promise<Product | null> {
    const cacheKey = `product:${productId}`;
    
    // Check cache first
    if (!options?.forceRefresh) {
      const cached = this.getCached<Product>(cacheKey, options?.maxAge);
      if (cached) return cached;
    }
    
    await this.checkRateLimit();
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/products/${productId}.json`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch product: ${await response.text()}`);
      }
      
      const data = await response.json();
      const product = this.transformShopifyProduct(data.product);
      
      // Cache the result
      this.setCached(cacheKey, product);
      
      await this.trackApiCall(`products/${productId}`, true, Date.now() - startTime);
      return product;
    } catch (error) {
      await this.trackApiCall(`products/${productId}`, false, Date.now() - startTime);
      throw error;
    }
  }
  
  async getProducts(options?: ProductQueryOptions): Promise<PaginatedProducts> {
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.cursor) params.append("page_info", options.cursor);
    if (options?.collection) params.append("collection_id", options.collection);
    if (options?.vendor) params.append("vendor", options.vendor);
    if (options?.productType) params.append("product_type", options.productType);
    
    await this.checkRateLimit();
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/products.json?${params}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${await response.text()}`);
      }
      
      const data = await response.json();
      const products = data.products.map((p: any) => this.transformShopifyProduct(p));
      
      // Parse pagination from Link header
      const linkHeader = response.headers.get("Link");
      const hasNextPage = linkHeader?.includes('rel="next"') || false;
      const nextCursor = this.extractPageInfo(linkHeader, "next");
      
      await this.trackApiCall("products", true, Date.now() - startTime);
      
      return {
        products,
        hasNextPage,
        cursor: nextCursor
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
      const response = await fetch(`${this.baseUrl}/customers/${customerId}.json`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch customer: ${await response.text()}`);
      }
      
      const data = await response.json();
      const customer = this.transformShopifyCustomer(data.customer);
      
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
      const response = await fetch(
        `${this.baseUrl}/orders.json?customer_id=${customerId}&limit=${limit}&status=any`,
        { headers: this.headers }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${await response.text()}`);
      }
      
      const data = await response.json();
      return data.orders.map((order: any) => this.transformShopifyOrder(order));
    } catch (error) {
      console.error("Failed to fetch purchase history:", error);
      return [];
    }
  }
  
  async createDiscount(discount: DiscountRequest): Promise<DiscountResponse> {
    await this.checkRateLimit();
    
    const priceRule = {
      price_rule: {
        title: discount.code || `BUDGET_${Date.now()}`,
        target_type: discount.appliesTo === "order" ? "line_item" : discount.appliesTo,
        target_selection: discount.appliesTo === "order" ? "all" : "entitled",
        allocation_method: "across",
        value_type: discount.valueType === "percentage" ? "percentage" : "fixed_amount",
        value: discount.valueType === "percentage" ? `-${discount.value}` : `-${discount.value}`,
        customer_selection: discount.customerIds ? "prerequisite" : "all",
        prerequisite_customer_ids: discount.customerIds,
        entitled_product_ids: discount.productIds,
        entitled_collection_ids: discount.collectionIds,
        starts_at: discount.startsAt?.toISOString() || new Date().toISOString(),
        ends_at: discount.endsAt?.toISOString(),
        usage_limit: discount.usageLimit
      }
    };
    
    try {
      // Create price rule
      const priceRuleResponse = await fetch(`${this.baseUrl}/price_rules.json`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(priceRule)
      });
      
      if (!priceRuleResponse.ok) {
        throw new Error(`Failed to create price rule: ${await priceRuleResponse.text()}`);
      }
      
      const priceRuleData = await priceRuleResponse.json();
      const priceRuleId = priceRuleData.price_rule.id;
      
      // Create discount code
      const discountCode = {
        discount_code: {
          code: discount.code || `BUDGET_${Date.now()}`
        }
      };
      
      const discountResponse = await fetch(
        `${this.baseUrl}/price_rules/${priceRuleId}/discount_codes.json`,
        {
          method: "POST",
          headers: this.headers,
          body: JSON.stringify(discountCode)
        }
      );
      
      if (!discountResponse.ok) {
        throw new Error(`Failed to create discount code: ${await discountResponse.text()}`);
      }
      
      const discountData = await discountResponse.json();
      
      return {
        id: discountData.discount_code.id,
        code: discountData.discount_code.code,
        adminUrl: `https://${this.credentials.shopDomain}/admin/discounts/${priceRuleId}`
      };
    } catch (error) {
      console.error("Failed to create discount:", error);
      throw error;
    }
  }
  
  async applyBudgetPricing(orderId: string, pricing: BudgetPricing): Promise<OrderUpdate> {
    // In Shopify, we would typically apply discounts before order creation
    // This method would update draft orders or use the Admin API to modify orders
    try {
      const discountPercentage = Math.min(pricing.discountPercentage, 30); // Cap at 30%
      
      // For draft orders, we can update the applied discount
      const response = await fetch(`${this.baseUrl}/draft_orders/${orderId}.json`, {
        method: "PUT",
        headers: this.headers,
        body: JSON.stringify({
          draft_order: {
            applied_discount: {
              value_type: "percentage",
              value: discountPercentage.toString(),
              title: `Budget ${pricing.budgetCategory} Discount`
            }
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
        updatedTotal: parseFloat(data.draft_order.total_price)
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
    for (const webhook of webhooks) {
      await this.checkRateLimit();
      
      const response = await fetch(`${this.baseUrl}/webhooks.json`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          webhook: {
            topic: webhook.topic,
            address: webhook.endpoint,
            format: webhook.format || "json"
          }
        })
      });
      
      if (!response.ok) {
        console.error(`Failed to register webhook ${webhook.topic}: ${await response.text()}`);
      }
    }
  }
  
  async unregisterWebhooks(webhookIds: string[]): Promise<void> {
    for (const id of webhookIds) {
      await this.checkRateLimit();
      
      const response = await fetch(`${this.baseUrl}/webhooks/${id}.json`, {
        method: "DELETE",
        headers: this.headers
      });
      
      if (!response.ok) {
        console.error(`Failed to unregister webhook ${id}: ${await response.text()}`);
      }
    }
  }
  
  // Helper methods
  private transformShopifyProduct(shopifyProduct: any): Product {
    const variants = shopifyProduct.variants || [];
    const prices = variants.map((v: any) => parseFloat(v.price));
    
    return {
      id: shopifyProduct.id.toString(),
      title: shopifyProduct.title,
      handle: shopifyProduct.handle,
      description: shopifyProduct.body_html || "",
      vendor: shopifyProduct.vendor,
      productType: shopifyProduct.product_type,
      tags: shopifyProduct.tags ? shopifyProduct.tags.split(", ") : [],
      images: (shopifyProduct.images || []).map((img: any) => ({
        id: img.id.toString(),
        url: img.src,
        altText: img.alt,
        position: img.position
      })),
      variants: variants.map((v: any) => this.transformShopifyVariant(v, shopifyProduct.id)),
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      },
      createdAt: new Date(shopifyProduct.created_at),
      updatedAt: new Date(shopifyProduct.updated_at)
    };
  }
  
  private transformShopifyVariant(variant: any, productId: string): ProductVariant {
    return {
      id: variant.id.toString(),
      productId: productId.toString(),
      title: variant.title,
      sku: variant.sku,
      price: parseFloat(variant.price),
      compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : undefined,
      inventoryQuantity: variant.inventory_quantity,
      weight: variant.weight,
      weightUnit: variant.weight_unit,
      options: {
        option1: variant.option1,
        option2: variant.option2,
        option3: variant.option3
      }
    };
  }
  
  private transformShopifyCustomer(customer: any): Customer {
    return {
      id: customer.id.toString(),
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.phone,
      tags: customer.tags ? customer.tags.split(", ") : [],
      totalSpent: parseFloat(customer.total_spent),
      ordersCount: customer.orders_count,
      createdAt: new Date(customer.created_at),
      lastOrderDate: customer.last_order_id ? new Date(customer.updated_at) : undefined
    };
  }
  
  private transformShopifyOrder(order: any): Purchase {
    return {
      id: order.id.toString(),
      orderNumber: order.order_number.toString(),
      customerId: order.customer?.id?.toString() || "",
      total: parseFloat(order.total_price),
      discountTotal: parseFloat(order.total_discounts),
      items: (order.line_items || []).map((item: any) => ({
        productId: item.product_id?.toString() || "",
        variantId: item.variant_id?.toString() || "",
        title: item.title,
        quantity: item.quantity,
        price: parseFloat(item.price),
        discountedPrice: item.discount_allocations?.length > 0 
          ? parseFloat(item.price) - item.discount_allocations.reduce((sum: number, d: any) => sum + parseFloat(d.amount), 0)
          : undefined
      })),
      createdAt: new Date(order.created_at)
    };
  }
  
  private extractPageInfo(linkHeader: string | null, rel: string): string | undefined {
    if (!linkHeader) return undefined;
    
    const links = linkHeader.split(",");
    for (const link of links) {
      if (link.includes(`rel="${rel}"`)) {
        const match = link.match(/page_info=([^>;&]+)/);
        return match?.[1];
      }
    }
    
    return undefined;
  }
}