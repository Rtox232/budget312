import { IIntegration, IntegrationCredentials } from "./base-integration";
import { ShopifyIntegration } from "./shopify-integration";
import { MagentoIntegration } from "./magento-integration";
import { WordPressIntegration } from "./wordpress-integration";
import { db } from "../db";
import { stores } from "../../packages/shared/schema.js";
import { eq } from "drizzle-orm";

export type Platform = "shopify" | "magento" | "wordpress";

export class IntegrationFactory {
  private static instances: Map<string, IIntegration> = new Map();
  
  static async create(storeId: number, platform: Platform): Promise<IIntegration> {
    const cacheKey = `${storeId}-${platform}`;
    
    // Return cached instance if available
    if (this.instances.has(cacheKey)) {
      return this.instances.get(cacheKey)!;
    }
    
    // Get store credentials from database
    const [store] = await db.select().from(stores).where(eq(stores.id, storeId));
    if (!store) {
      throw new Error(`Store ${storeId} not found`);
    }
    
    const credentials: IntegrationCredentials = {
      shopDomain: store.domain || store.shopifyDomain,
      apiKey: store.apiKey || "",
      apiSecret: store.apiSecret || "",
      accessToken: store.accessToken || "",
      webhookSecret: store.webhookSecret || ""
    };
    
    let integration: IIntegration;
    
    switch (platform) {
      case "shopify":
        integration = new ShopifyIntegration(storeId, credentials);
        break;
      case "magento":
        integration = new MagentoIntegration(storeId, credentials);
        break;
      case "wordpress":
        integration = new WordPressIntegration(storeId, credentials);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
    
    // Cache the instance
    this.instances.set(cacheKey, integration);
    
    return integration;
  }
  
  static clearCache(storeId?: number, platform?: Platform): void {
    if (storeId && platform) {
      this.instances.delete(`${storeId}-${platform}`);
    } else if (storeId) {
      // Clear all integrations for a store
      for (const key of this.instances.keys()) {
        if (key.startsWith(`${storeId}-`)) {
          this.instances.delete(key);
        }
      }
    } else {
      // Clear all cached instances
      this.instances.clear();
    }
  }
}