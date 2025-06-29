/**
 * Shopify Storefront API integration for budget-aware pricing
 * This would integrate with actual Shopify APIs in production
 */

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  images: Array<{
    id: string;
    url: string;
    altText?: string;
  }>;
  variants: Array<{
    id: string;
    title: string;
    price: number;
    compareAtPrice?: number;
    availableForSale: boolean;
    selectedOptions: Array<{
      name: string;
      value: string;
    }>;
  }>;
  priceRange: {
    minVariantPrice: number;
    maxVariantPrice: number;
  };
}

export interface ShopifyDiscount {
  id: string;
  title: string;
  code?: string;
  value: number;
  valueType: "PERCENTAGE" | "FIXED_AMOUNT";
  usageLimit?: number;
  appliesTo: "ALL" | "SPECIFIC_PRODUCTS" | "SPECIFIC_COLLECTIONS";
  minimumRequirement?: {
    type: "SUBTOTAL" | "QUANTITY";
    value: number;
  };
}

export class ShopifyAPI {
  private domain: string;
  private accessToken: string;

  constructor(domain: string, accessToken: string = "") {
    this.domain = domain;
    this.accessToken = accessToken || process.env.VITE_SHOPIFY_STOREFRONT_TOKEN || "";
  }

  /**
   * Fetch product by handle
   */
  async getProduct(handle: string): Promise<ShopifyProduct | null> {
    // In production, this would make actual Shopify Storefront API calls
    // For demo purposes, return mock data
    return this.getMockProduct(handle);
  }

  /**
   * Fetch active discounts for a product
   */
  async getProductDiscounts(productId: string): Promise<ShopifyDiscount[]> {
    // In production, this would fetch actual discount codes and automatic discounts
    // For demo purposes, return mock discounts
    return [
      {
        id: "discount_1",
        title: "Holiday Sale",
        value: 10,
        valueType: "PERCENTAGE",
        appliesTo: "ALL",
      },
      {
        id: "discount_2",
        title: "Free Shipping",
        value: 0,
        valueType: "FIXED_AMOUNT",
        appliesTo: "ALL",
        minimumRequirement: {
          type: "SUBTOTAL",
          value: 50,
        },
      },
    ];
  }

  /**
   * Calculate total discount amount for a product
   */
  async calculateShopifyDiscounts(
    productId: string,
    variantId: string,
    quantity: number = 1
  ): Promise<number> {
    const discounts = await this.getProductDiscounts(productId);
    const product = await this.getProduct(productId);
    
    if (!product) return 0;

    const variant = product.variants.find(v => v.id === variantId);
    if (!variant) return 0;

    let totalDiscount = 0;
    const subtotal = variant.price * quantity;

    for (const discount of discounts) {
      // Check if discount applies
      if (discount.minimumRequirement) {
        const { type, value } = discount.minimumRequirement;
        if (type === "SUBTOTAL" && subtotal < value) continue;
        if (type === "QUANTITY" && quantity < value) continue;
      }

      // Calculate discount amount
      if (discount.valueType === "PERCENTAGE") {
        totalDiscount += (variant.price * discount.value) / 100;
      } else {
        totalDiscount += discount.value;
      }
    }

    return Math.min(totalDiscount, variant.price); // Don't exceed product price
  }

  /**
   * Extract theme colors from Shopify store
   */
  async getThemeColors(): Promise<Record<string, string>> {
    // In production, this would extract colors from the active theme's CSS
    // For demo purposes, return Shopify-like colors
    return {
      primary: "#00A651",
      secondary: "#7C2D8E",
      accent: "#4A90E2",
      background: "#FFFFFF",
      foreground: "#202223",
      text: "#202223",
      muted: "#8C9196",
      border: "#E1E3E5",
    };
  }

  /**
   * Mock product data for demo
   */
  private getMockProduct(handle: string): ShopifyProduct {
    const mockProducts: Record<string, ShopifyProduct> = {
      "macbook-pro": {
        id: "gid://shopify/Product/1",
        title: "MacBook Pro 14\" M3",
        handle: "macbook-pro",
        description: "The most advanced Mac laptop ever built for professionals.",
        images: [
          {
            id: "img_1",
            url: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
            altText: "MacBook Pro on desk",
          },
        ],
        variants: [
          {
            id: "variant_1",
            title: "512GB / Space Gray",
            price: 1999,
            compareAtPrice: 2199,
            availableForSale: true,
            selectedOptions: [
              { name: "Storage", value: "512GB" },
              { name: "Color", value: "Space Gray" },
            ],
          },
          {
            id: "variant_2",
            title: "1TB / Space Gray",
            price: 2399,
            compareAtPrice: 2599,
            availableForSale: true,
            selectedOptions: [
              { name: "Storage", value: "1TB" },
              { name: "Color", value: "Space Gray" },
            ],
          },
        ],
        priceRange: {
          minVariantPrice: 1999,
          maxVariantPrice: 2399,
        },
      },
      "iphone-15": {
        id: "gid://shopify/Product/2",
        title: "iPhone 15",
        handle: "iphone-15",
        description: "The latest iPhone with advanced camera system.",
        images: [
          {
            id: "img_2",
            url: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
            altText: "iPhone 15",
          },
        ],
        variants: [
          {
            id: "variant_3",
            title: "128GB / Blue",
            price: 799,
            compareAtPrice: 899,
            availableForSale: true,
            selectedOptions: [
              { name: "Storage", value: "128GB" },
              { name: "Color", value: "Blue" },
            ],
          },
        ],
        priceRange: {
          minVariantPrice: 799,
          maxVariantPrice: 799,
        },
      },
    };

    return mockProducts[handle] || mockProducts["macbook-pro"];
  }

  /**
   * Get Shopify store domain from environment or current URL
   */
  static getStoreDomain(): string {
    // In production, this would be dynamically determined
    return process.env.VITE_SHOPIFY_DOMAIN || "demo-store.myshopify.com";
  }

  /**
   * Initialize Shopify integration
   */
  static async initialize(domain?: string): Promise<ShopifyAPI> {
    const storeDomain = domain || this.getStoreDomain();
    const api = new ShopifyAPI(storeDomain);
    
    // Validate connection in production
    // await api.validateConnection();
    
    return api;
  }
}
