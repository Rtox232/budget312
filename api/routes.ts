import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  budgetDataSchema, 
  productPricingSchema,
  insertBudgetSessionSchema,
  insertAnalyticsSchema 
} from "../shared/schema.js";
import { z } from "zod";
import { IntegrationFactory, Platform } from "./integrations/integration-factory";
import { budgetCache } from "./cache/budget-cache";
import { budgetProtection } from "./security/budget-protection";
import { errorFortress } from "./security/error-fortress";
import { cartTrackingService } from "./services/cart-tracking.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply global security middleware
  app.use(errorFortress.requestLogger);
  app.use(budgetProtection.ipBlockingMiddleware);

  // Budget calculation endpoint with protection
  app.post("/api/budget/calculate", 
    budgetProtection.rateLimitMiddleware,
    budgetProtection.budgetValidationMiddleware,
    errorFortress.budgetCalculationProtection,
    async (req, res) => {
    try {
      const budgetData = budgetDataSchema.parse(req.body);
      const { storeId = 1, customerId = "anonymous" } = req.body;
      
      // Calculate budget breakdown using 50/30/20 rule
      const needs = budgetData.monthlyIncome * 0.5;
      const wants = budgetData.monthlyIncome * 0.3;
      const savings = budgetData.monthlyIncome * 0.2;
      
      const response = {
        monthlyIncome: budgetData.monthlyIncome,
        needsAmount: needs,
        wantsAmount: wants,
        savingsAmount: savings,
        category: budgetData.category,
      };
      
      // Cache the budget for quick access on subsequent products
      await budgetCache.setCustomerBudget(customerId, storeId, response);
      
      // Store in database for persistence
      const session = await storage.createBudgetSession({
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        storeId,
        customerId,
        budgetData: response
      });
      
      res.json({
        ...response,
        sessionId: session.sessionId,
        cached: true
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid budget data" });
    }
  });

  // Product pricing calculation endpoint
  // Get cached budget endpoint
  app.get("/api/budget/get", async (req, res) => {
    try {
      const { customerId, storeId } = req.query;
      
      if (!customerId || !storeId) {
        return res.status(400).json({ error: "Missing customerId or storeId" });
      }
      
      const cachedBudget = await budgetCache.getCustomerBudget(
        customerId as string, 
        parseInt(storeId as string)
      );
      
      if (cachedBudget) {
        return res.json({ budget: cachedBudget, cached: true });
      }
      
      res.status(404).json({ error: "Budget not found" });
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve budget" });
    }
  });

  app.post("/api/pricing/calculate", 
    budgetProtection.rateLimitMiddleware,
    budgetProtection.pricingValidationMiddleware,
    errorFortress.pricingCalculationProtection,
    async (req, res) => {
    try {
      const pricingRequest = z.object({
        productId: z.string(),
        basePrice: z.number().min(0),
        customerBudget: z.number().min(0),
        category: z.enum(["needs", "wants", "savings"]).default("wants"),
        shopifyDiscounts: z.number().min(0).default(0),
        storeId: z.number().optional(),
        customerId: z.string().optional(),
      }).parse(req.body);

      // Get store's pricing rules
      let pricingRule;
      if (pricingRequest.storeId) {
        pricingRule = await storage.getActivePricingRule(pricingRequest.storeId);
      }

      // Default to 50/30/20 if no custom rules
      const categoryPercentage = pricingRule ? 
        (pricingRequest.category === "needs" ? parseFloat(pricingRule.needsPercentage ?? "50") : 
         pricingRequest.category === "wants" ? parseFloat(pricingRule.wantsPercentage ?? "30") : 
         parseFloat(pricingRule.savingsPercentage ?? "20")) / 100 : 
        (pricingRequest.category === "needs" ? 0.5 : 
         pricingRequest.category === "wants" ? 0.3 : 0.2);

      const maxDiscountPercentage = pricingRule ? 
        parseFloat(pricingRule.maxDiscountPercentage ?? "25") / 100 : 0.25;

      // Calculate available budget for this category
      const availableBudget = pricingRequest.customerBudget * categoryPercentage;
      
      // Calculate required discount to fit budget
      const priceAfterShopifyDiscounts = pricingRequest.basePrice - pricingRequest.shopifyDiscounts;
      let budgetDiscount = 0;
      let finalPrice = priceAfterShopifyDiscounts;

      if (priceAfterShopifyDiscounts > availableBudget) {
        budgetDiscount = priceAfterShopifyDiscounts - availableBudget;
        
        // Cap at maximum discount percentage
        const maxAllowedDiscount = pricingRequest.basePrice * maxDiscountPercentage;
        if (budgetDiscount > maxAllowedDiscount) {
          budgetDiscount = maxAllowedDiscount;
        }
        
        finalPrice = priceAfterShopifyDiscounts - budgetDiscount;
      }

      const totalDiscount = pricingRequest.shopifyDiscounts + budgetDiscount;
      const discountPercentage = (totalDiscount / pricingRequest.basePrice) * 100;

      const response: any = {
        productId: pricingRequest.productId,
        basePrice: pricingRequest.basePrice,
        shopifyDiscounts: pricingRequest.shopifyDiscounts,
        budgetDiscount: budgetDiscount,
        finalPrice: finalPrice,
        discountPercentage: discountPercentage,
        availableBudget: availableBudget,
        withinBudget: finalPrice <= availableBudget,
        originalPrice: pricingRequest.basePrice,
        budgetPrice: finalPrice,
        budgetCategory: pricingRequest.category,
        remainingBudget: availableBudget - finalPrice,
        timestamp: Date.now(),
        ttl: 300
      };

      // Cache the pricing if we have customer and store info
      if (pricingRequest.customerId && pricingRequest.storeId) {
        try {
          await budgetCache.setProductPricing(
            pricingRequest.productId,
            pricingRequest.storeId,
            pricingRequest.customerId,
            response
          );
        } catch (cacheError) {
          console.error("Failed to cache pricing:", cacheError);
        }
      }

      res.json(response);
    } catch (error) {
      res.status(400).json({ error: "Invalid pricing request" });
    }
  });

  // Store configuration endpoint
  app.get("/api/store/:domain", async (req, res) => {
    try {
      const { domain } = req.params;
      const store = await storage.getStoreByDomain(domain);
      
      if (!store) {
        return res.status(404).json({ error: "Store not found" });
      }

      // Don't expose sensitive data
      const { accessToken, ...safeStore } = store;
      res.json(safeStore);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch store configuration" });
    }
  });

  // Pricing rules endpoint
  app.get("/api/store/:storeId/pricing-rules", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const rules = await storage.getPricingRulesByStoreId(storeId);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pricing rules" });
    }
  });

  // Update pricing rules endpoint
  app.post("/api/store/:storeId/pricing-rules", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const ruleData = req.body;

      // Deactivate existing rules
      const existingRules = await storage.getPricingRulesByStoreId(storeId);
      for (const rule of existingRules) {
        await storage.updatePricingRule(rule.id, { isActive: false });
      }

      // Create new rule
      const newRule = await storage.createPricingRule({
        storeId,
        name: ruleData.name || "Custom Rule",
        needsPercentage: ruleData.needsPercentage?.toString() || "50.00",
        wantsPercentage: ruleData.wantsPercentage?.toString() || "30.00",
        savingsPercentage: ruleData.savingsPercentage?.toString() || "20.00",
        maxDiscountPercentage: ruleData.maxDiscountPercentage?.toString() || "25.00",
        isActive: true,
      });

      res.json(newRule);
    } catch (error) {
      res.status(500).json({ error: "Failed to update pricing rules" });
    }
  });

  // Budget session management
  app.post("/api/budget-session", async (req, res) => {
    try {
      const sessionData = insertBudgetSessionSchema.parse(req.body);
      const session = await storage.createBudgetSession(sessionData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: "Invalid session data" });
    }
  });

  app.get("/api/budget-session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getBudgetSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  // Analytics endpoint
  app.post("/api/analytics", async (req, res) => {
    try {
      const eventData = insertAnalyticsSchema.parse(req.body);
      const event = await storage.createAnalyticsEvent(eventData);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid analytics data" });
    }
  });

  app.get("/api/analytics/:storeId", async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const limit = parseInt(req.query.limit as string) || 100;
      const events = await storage.getAnalyticsByStoreId(storeId, limit);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Batch pricing endpoint for multiple products
  app.post("/api/pricing/batch", 
    budgetProtection.rateLimitMiddleware,
    async (req, res) => {
    try {
      const { products, customerId, storeId } = req.body;
      
      if (!products || !Array.isArray(products)) {
        return res.status(400).json({ error: "Products array required" });
      }
      
      const results = [];
      const fromCache = [];
      const calculated = [];
      
      // Get customer budget once
      let customerBudget = null;
      if (customerId && storeId) {
        customerBudget = await budgetCache.getCustomerBudget(customerId, storeId);
      }
      
      for (const product of products) {
        // Check cache first
        if (customerId && storeId) {
          const cached = await budgetCache.getProductPricing(
            product.id,
            storeId,
            customerId
          );
          
          if (cached && (Date.now() - cached.timestamp) < 300000) {
            results.push({ productId: product.id, pricing: cached, cached: true });
            fromCache.push(product.id);
            continue;
          }
        }
        
        // Calculate pricing
        const pricing = {
          originalPrice: product.price,
          budgetPrice: product.price * 0.9, // Simple 10% discount for demo
          discountPercentage: 10,
          budgetCategory: product.category || "wants",
          remainingBudget: customerBudget ? customerBudget.wantsAmount - (product.price * 0.9) : 0,
          timestamp: Date.now(),
          ttl: 300
        };
        
        results.push({ productId: product.id, pricing, cached: false });
        calculated.push(product.id);
        
        // Cache the result
        if (customerId && storeId) {
          await budgetCache.setProductPricing(product.id, storeId, customerId, pricing);
        }
      }
      
      res.json({
        results,
        stats: {
          total: products.length,
          fromCache: fromCache.length,
          calculated: calculated.length
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process batch pricing" });
    }
  });

  // Security monitoring endpoints
  app.get("/api/admin/security/stats", (req, res) => {
    const protectionStats = budgetProtection.getStats();
    const errorStats = errorFortress.getErrorStats();
    
    res.json({
      protection: protectionStats,
      errors: errorStats,
      timestamp: new Date().toISOString()
    });
  });

  app.post("/api/admin/security/block-ip", (req, res) => {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ error: "IP address required" });
    }
    
    budgetProtection.blockIP(ip);
    res.json({ message: `IP ${ip} has been blocked` });
  });

  app.post("/api/admin/security/unblock-ip", (req, res) => {
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ error: "IP address required" });
    }
    
    budgetProtection.unblockIP(ip);
    res.json({ message: `IP ${ip} has been unblocked` });
  });

  app.post("/api/admin/security/block-customer", (req, res) => {
    const { customerId } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: "Customer ID required" });
    }
    
    budgetProtection.blockCustomer(customerId);
    res.json({ message: `Customer ${customerId} has been blocked` });
  });

  // Health check endpoint with security status
  app.get("/api/health", (req, res) => {
    const protectionStats = budgetProtection.getStats();
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      security: {
        activeTrackers: protectionStats.activeTrackers,
        blockedEntities: protectionStats.blockedIPs + protectionStats.blockedCustomers
      }
    });
  });

  // Integration test endpoint
  app.post("/api/test-integration/:storeId/:platform", async (req, res) => {
    try {
      const { storeId, platform } = req.params;
      const { runIntegrationTests } = await import("./integrations/integration-tests");
      
      const report = await runIntegrationTests(
        parseInt(storeId), 
        platform as "shopify" | "magento" | "wordpress"
      );
      
      res.json(report);
    } catch (error) {
      console.error("Integration test failed:", error);
      res.status(500).json({ error: "Integration test failed" });
    }
  });

  // Integration routes with lazy loading
  const lazyLoadIntegration = async (req: any, res: any, next: any) => {
    try {
      const { storeId, platform } = req.params;
      
      if (!storeId || !platform) {
        return res.status(400).json({ error: "Store ID and platform are required" });
      }
      
      if (!["shopify", "magento", "wordpress"].includes(platform)) {
        return res.status(400).json({ error: "Invalid platform" });
      }
      
      req.integration = await IntegrationFactory.create(parseInt(storeId), platform as Platform);
      next();
    } catch (error) {
      console.error("Failed to load integration:", error);
      res.status(500).json({ error: "Failed to load integration" });
    }
  };

  // Get product with caching
  app.get("/api/stores/:storeId/:platform/products/:productId", lazyLoadIntegration, async (req, res) => {
    try {
      const { productId } = req.params;
      const { maxAge, forceRefresh } = req.query;
      
      const product = await req.integration.getProduct(productId, {
        maxAge: maxAge ? parseInt(maxAge as string) : undefined,
        forceRefresh: forceRefresh === "true"
      });
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Failed to fetch product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Get products with filters
  app.get("/api/stores/:storeId/:platform/products", lazyLoadIntegration, async (req, res) => {
    try {
      const options = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        cursor: req.query.cursor as string,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any
      };
      
      const products = await req.integration.getProducts(options);
      res.json(products);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Get customer
  app.get("/api/stores/:storeId/:platform/customers/:customerId", lazyLoadIntegration, async (req, res) => {
    try {
      const { customerId } = req.params;
      const customer = await req.integration.getCustomer(customerId);
      
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      console.error("Failed to fetch customer:", error);
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  // Create discount
  app.post("/api/stores/:storeId/:platform/discounts", lazyLoadIntegration, async (req, res) => {
    try {
      const response = await req.integration.createDiscount(req.body);
      res.json(response);
    } catch (error) {
      console.error("Failed to create discount:", error);
      res.status(500).json({ error: "Failed to create discount" });
    }
  });

  // Webhook validation endpoint
  app.post("/api/webhooks/:storeId/:platform", async (req, res) => {
    try {
      const { storeId, platform } = req.params;
      const integration = await IntegrationFactory.create(parseInt(storeId), platform as Platform);
      
      if (!integration.validateWebhook(req.headers, req.body)) {
        return res.status(401).json({ error: "Invalid webhook signature" });
      }
      
      // Process webhook based on platform and topic
      const topic = req.headers["x-shopify-topic"] || 
                    req.headers["x-magento-event"] || 
                    req.headers["x-wc-webhook-topic"];
      
      console.log(`Received ${platform} webhook for store ${storeId}: ${topic}`);
      
      // Clear cache on product/customer updates
      if (topic?.includes("product") || topic?.includes("customer")) {
        IntegrationFactory.clearCache(parseInt(storeId), platform as Platform);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // Premium Cart Tracking Routes
  app.post("/api/cart/track", budgetProtection.rateLimitMiddleware, async (req, res) => {
    try {
      const schema = z.object({
        storeId: z.number(),
        customerId: z.string(),
        sessionId: z.string(),
        cartItems: z.array(z.object({
          productId: z.string(),
          variantId: z.string().optional(),
          title: z.string(),
          price: z.number().min(0),
          quantity: z.number().min(1),
          budgetCategory: z.enum(["needs", "wants", "savings"]),
          budgetImpact: z.number(),
          discountApplied: z.number().default(0),
          fitsInBudget: z.boolean()
        })),
        budget: budgetDataSchema
      });

      const { storeId, customerId, sessionId, cartItems, budget } = schema.parse(req.body);

      // Check if store has premium cart tracking enabled
      const store = await storage.getStore(storeId);
      if (!store?.premiumCartTracking) {
        return res.status(403).json({ error: "Premium cart tracking not enabled" });
      }

      const cartSession = await cartTrackingService.updateCartSession(
        storeId, customerId, sessionId, cartItems, budget
      );

      // Generate recommendations if enabled
      let recommendations: any[] = [];
      if (store.productRecommendationsEnabled) {
        const remainingBudget = cartSession.remainingBudget as any;
        recommendations = await cartTrackingService.generateProductRecommendations(
          storeId, customerId, remainingBudget
        );
      }

      // Check for auto discounts if enabled
      let appliedDiscounts: any[] = [];
      if (store.autoDiscountEnabled) {
        const totalCartValue = parseFloat(cartSession.totalCartValue);
        const minimumThreshold = parseFloat(store.minimumDiscountThreshold || "50");
        appliedDiscounts = await cartTrackingService.checkAndApplyDiscounts(
          storeId, customerId, cartSession.id, totalCartValue, minimumThreshold
        );
      }

      res.json({
        cartSession,
        recommendations,
        appliedDiscounts,
        features: {
          autoDiscountEnabled: store.autoDiscountEnabled,
          productRecommendationsEnabled: store.productRecommendationsEnabled,
          budgetRemainingDisplayEnabled: store.budgetRemainingDisplayEnabled
        }
      });
    } catch (error) {
      console.error("Cart tracking error:", error);
      res.status(500).json({ error: "Failed to track cart" });
    }
  });

  // Get cart session
  app.get("/api/cart/:storeId/:customerId/:sessionId", async (req, res) => {
    try {
      const { storeId, customerId, sessionId } = req.params;
      
      const cartSession = await cartTrackingService.getActiveCartSession(
        parseInt(storeId), customerId, sessionId
      );

      if (!cartSession) {
        return res.status(404).json({ error: "Cart session not found" });
      }

      const recommendations = await cartTrackingService.getProductRecommendations(
        parseInt(storeId), customerId
      );

      res.json({ cartSession, recommendations });
    } catch (error) {
      console.error("Get cart session error:", error);
      res.status(500).json({ error: "Failed to get cart session" });
    }
  });

  // Track recommendation click
  app.post("/api/recommendations/:id/click", async (req, res) => {
    try {
      const { id } = req.params;
      await cartTrackingService.trackRecommendationClick(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Track recommendation click error:", error);
      res.status(500).json({ error: "Failed to track click" });
    }
  });

  // Track recommendation purchase
  app.post("/api/recommendations/:id/purchase", async (req, res) => {
    try {
      const { id } = req.params;
      await cartTrackingService.trackRecommendationPurchase(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Track recommendation purchase error:", error);
      res.status(500).json({ error: "Failed to track purchase" });
    }
  });

  // Update store premium features
  app.put("/api/stores/premium-features", async (req, res) => {
    try {
      const schema = z.object({
        storeId: z.number().optional(),
        premiumCartTracking: z.boolean().optional(),
        autoDiscountEnabled: z.boolean().optional(),
        productRecommendationsEnabled: z.boolean().optional(),
        budgetRemainingDisplayEnabled: z.boolean().optional(),
        minimumDiscountThreshold: z.number().min(0).optional()
      });

      const updates = schema.parse(req.body);
      const storeId = updates.storeId || 1; // Default to demo store

      const updatedStore = await storage.updateStore(storeId, {
        premiumCartTracking: updates.premiumCartTracking,
        autoDiscountEnabled: updates.autoDiscountEnabled,
        productRecommendationsEnabled: updates.productRecommendationsEnabled,
        budgetRemainingDisplayEnabled: updates.budgetRemainingDisplayEnabled,
        minimumDiscountThreshold: updates.minimumDiscountThreshold?.toString()
      });

      res.json(updatedStore);
    } catch (error) {
      console.error("Update premium features error:", error);
      res.status(500).json({ error: "Failed to update premium features" });
    }
  });

  // Apply global error handler (must be last)
  app.use(errorFortress.globalErrorHandler);

  const httpServer = createServer(app);
  return httpServer;
}
