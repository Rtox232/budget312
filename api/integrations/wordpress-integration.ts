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

export class WordPressIntegration extends BaseIntegration {
  platform = "wordpress" as const;
  private baseUrl: string;
  private headers: Record<string, string>;
  
  constructor(storeId: number, private credentials: IntegrationCredentials) {
    super(storeId);
    this.initializeRateLimiter();
    this.baseUrl = `https://${credentials.shopDomain}/wp-json`;
    
    // WooCommerce uses basic auth or OAuth 1.0a
    const auth = Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`).toString("base64");
    this.headers = {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json"
    };
  }
  
  async authenticate(credentials: IntegrationCredentials): Promise<AuthResult> {
    // WooCommerce REST API uses API keys, not OAuth flow
    // Verify credentials by making a test request
    const response = await fetch(`${this.baseUrl}/wc/v3/system_status`, {
      headers: {
        "Authorization": `Basic ${Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`).toString("base64")}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`WooCommerce auth failed: ${await response.text()}`);
    }
    
    return {
      accessToken: credentials.apiKey, // API key serves as access token
      scope: ["read", "write"]
    };
  }
  
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    // WooCommerce API keys don't expire
    return {
      accessToken: this.credentials.apiKey,
      scope: ["read", "write"]
    };
  }
  
  validateWebhook(headers: any, body: any): boolean {
    const signature = headers["x-wc-webhook-signature"];
    if (!signature || !this.credentials.webhookSecret) return false;
    
    const hash = crypto
      .createHmac("sha256", this.credentials.webhookSecret)
      .update(JSON.stringify(body))
      .digest("base64");
    
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
      const response = await fetch(`${this.baseUrl}/wc/v3/products/${productId}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch product: ${await response.text()}`);
      }
      
      const data = await response.json();
      const product = this.transformWooCommerceProduct(data);
      
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
    if (options?.limit) params.append("per_page", options.limit.toString());
    if (options?.cursor) params.append("page", options.cursor);
    if (options?.minPrice) params.append("min_price", options.minPrice.toString());
    if (options?.maxPrice) params.append("max_price", options.maxPrice.toString());
    if (options?.tags?.length) params.append("tag", options.tags.join(","));
    if (options?.sortBy) {
      const sortMap: Record<string, string> = {
        price: "price",
        title: "title",
        created: "date",
        updated: "modified"
      };
      params.append("orderby", sortMap[options.sortBy] || "date");
      params.append("order", options.sortOrder || "desc");
    }
    
    await this.checkRateLimit();
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/wc/v3/products?${params}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${await response.text()}`);
      }
      
      const data = await response.json();
      const products = data.map((item: any) => this.transformWooCommerceProduct(item));
      
      // WooCommerce provides pagination in headers
      const totalPages = parseInt(response.headers.get("X-WP-TotalPages") || "1");
      const currentPage = parseInt(options?.cursor || "1");
      
      await this.trackApiCall("products", true, Date.now() - startTime);
      
      return {
        products,
        hasNextPage: currentPage < totalPages,
        cursor: (currentPage + 1).toString(),
        totalCount: parseInt(response.headers.get("X-WP-Total") || "0")
      };
    } catch (error) {
      await this.trackApiCall("products", false, Date.now() - startTime);
      throw error;
    }
  }
  
  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    await this.checkRateLimit();
    
    try {
      const response = await fetch(`${this.baseUrl}/wc/v3/products/${productId}/variations`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        return [];
      }
      
      const variations = await response.json();
      return variations.map((v: any) => this.transformWooCommerceVariant(v, productId));
    } catch (error) {
      console.error("Failed to fetch variations:", error);
      return [];
    }
  }
  
  async getCustomer(customerId: string): Promise<Customer | null> {
    const cacheKey = `customer:${customerId}`;
    const cached = this.getCached<Customer>(cacheKey, 300);
    if (cached) return cached;
    
    await this.checkRateLimit();
    
    try {
      const response = await fetch(`${this.baseUrl}/wc/v3/customers/${customerId}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch customer: ${await response.text()}`);
      }
      
      const data = await response.json();
      const customer = this.transformWooCommerceCustomer(data);
      
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
      const params = new URLSearchParams({
        customer: customerId,
        per_page: limit.toString(),
        status: "completed,processing"
      });
      
      const response = await fetch(`${this.baseUrl}/wc/v3/orders?${params}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${await response.text()}`);
      }
      
      const data = await response.json();
      return data.map((order: any) => this.transformWooCommerceOrder(order));
    } catch (error) {
      console.error("Failed to fetch purchase history:", error);
      return [];
    }
  }
  
  async createDiscount(discount: DiscountRequest): Promise<DiscountResponse> {
    await this.checkRateLimit();
    
    try {
      const coupon = {
        code: discount.code || `BUDGET_${Date.now()}`,
        discount_type: discount.valueType === "percentage" ? "percent" : "fixed_cart",
        amount: discount.value.toString(),
        individual_use: false,
        exclude_sale_items: false,
        minimum_amount: discount.minimumAmount?.toString(),
        usage_limit: discount.usageLimit,
        usage_limit_per_user: 1,
        email_restrictions: discount.customerIds ? await this.getCustomerEmails(discount.customerIds) : [],
        product_ids: discount.productIds?.map(id => parseInt(id)) || [],
        date_expires: discount.endsAt?.toISOString()
      };
      
      const response = await fetch(`${this.baseUrl}/wc/v3/coupons`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(coupon)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create coupon: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      return {
        id: data.id.toString(),
        code: data.code,
        adminUrl: `https://${this.credentials.shopDomain}/wp-admin/post.php?post=${data.id}&action=edit`
      };
    } catch (error) {
      console.error("Failed to create discount:", error);
      throw error;
    }
  }
  
  async applyBudgetPricing(orderId: string, pricing: BudgetPricing): Promise<OrderUpdate> {
    try {
      // Create a coupon for this specific order
      const discountResponse = await this.createDiscount({
        value: pricing.discountPercentage,
        valueType: "percentage",
        appliesTo: "order",
        usageLimit: 1
      });
      
      // Apply coupon to order
      const response = await fetch(`${this.baseUrl}/wc/v3/orders/${orderId}`, {
        method: "PUT",
        headers: this.headers,
        body: JSON.stringify({
          coupon_lines: [{
            code: discountResponse.code
          }],
          meta_data: [{
            key: "_budget_category",
            value: pricing.budgetCategory
          }, {
            key: "_budget_discount",
            value: pricing.discountPercentage
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update order: ${await response.text()}`);
      }
      
      const data = await response.json();
      
      return {
        orderId,
        status: "success",
        updatedTotal: parseFloat(data.total)
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
      
      const response = await fetch(`${this.baseUrl}/wc/v3/webhooks`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          name: `BudgetPrice ${webhook.topic}`,
          topic: webhook.topic,
          delivery_url: webhook.endpoint,
          secret: this.credentials.webhookSecret
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
      
      const response = await fetch(`${this.baseUrl}/wc/v3/webhooks/${id}`, {
        method: "DELETE",
        headers: this.headers
      });
      
      if (!response.ok) {
        console.error(`Failed to unregister webhook ${id}: ${await response.text()}`);
      }
    }
  }
  
  // Helper methods
  private transformWooCommerceProduct(product: any): Product {
    const images = product.images || [];
    const variations = product.variations || [];
    
    // Calculate price range
    let minPrice = parseFloat(product.price || 0);
    let maxPrice = parseFloat(product.price || 0);
    
    if (product.type === "variable" && product.price_range) {
      minPrice = parseFloat(product.price_range.min_price || product.price);
      maxPrice = parseFloat(product.price_range.max_price || product.price);
    }
    
    return {
      id: product.id.toString(),
      title: product.name,
      handle: product.slug,
      description: product.description || product.short_description || "",
      vendor: product.brands?.[0]?.name,
      productType: product.type,
      tags: product.tags.map((tag: any) => tag.name),
      images: images.map((img: any, index: number) => ({
        id: img.id?.toString() || index.toString(),
        url: img.src,
        altText: img.alt || img.name,
        position: index
      })),
      variants: variations.length > 0 ? [] : [{
        id: product.id.toString(),
        productId: product.id.toString(),
        title: product.name,
        sku: product.sku,
        price: parseFloat(product.price || 0),
        compareAtPrice: product.regular_price ? parseFloat(product.regular_price) : undefined,
        inventoryQuantity: product.stock_quantity,
        weight: parseFloat(product.weight || 0),
        weightUnit: "kg",
        options: {}
      }],
      priceRange: {
        min: minPrice,
        max: maxPrice
      },
      createdAt: new Date(product.date_created),
      updatedAt: new Date(product.date_modified)
    };
  }
  
  private transformWooCommerceVariant(variant: any, productId: string): ProductVariant {
    const options: Record<string, string> = {};
    variant.attributes?.forEach((attr: any) => {
      options[attr.name] = attr.option;
    });
    
    return {
      id: variant.id.toString(),
      productId: productId.toString(),
      title: variant.name || variant.attributes?.map((a: any) => a.option).join(" / "),
      sku: variant.sku,
      price: parseFloat(variant.price || 0),
      compareAtPrice: variant.regular_price ? parseFloat(variant.regular_price) : undefined,
      inventoryQuantity: variant.stock_quantity,
      weight: parseFloat(variant.weight || 0),
      weightUnit: "kg",
      options
    };
  }
  
  private transformWooCommerceCustomer(customer: any): Customer {
    return {
      id: customer.id.toString(),
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: customer.billing?.phone || customer.shipping?.phone,
      tags: [],
      totalSpent: parseFloat(customer.total_spent || 0),
      ordersCount: customer.orders_count || 0,
      createdAt: new Date(customer.date_created),
      lastOrderDate: customer.last_order_date ? new Date(customer.last_order_date) : undefined
    };
  }
  
  private transformWooCommerceOrder(order: any): Purchase {
    return {
      id: order.id.toString(),
      orderNumber: order.number,
      customerId: order.customer_id?.toString() || "",
      total: parseFloat(order.total),
      discountTotal: parseFloat(order.discount_total),
      items: (order.line_items || []).map((item: any) => ({
        productId: item.product_id?.toString() || "",
        variantId: item.variation_id?.toString() || item.product_id?.toString() || "",
        title: item.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        discountedPrice: parseFloat(item.total) / item.quantity
      })),
      createdAt: new Date(order.date_created)
    };
  }
  
  private async getCustomerEmails(customerIds: string[]): Promise<string[]> {
    const emails: string[] = [];
    
    for (const id of customerIds) {
      const customer = await this.getCustomer(id);
      if (customer?.email) {
        emails.push(customer.email);
      }
    }
    
    return emails;
  }
}