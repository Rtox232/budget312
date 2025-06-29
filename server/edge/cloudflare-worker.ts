// Cloudflare Workers entry point for edge deployment
import { budgetCache, CloudflareKVCache } from "../cache/budget-cache";
import { BudgetEngine } from "../../client/src/lib/budget-engine";
import type { BudgetData, ProductPricing } from "@shared/schema";

export interface Env {
  BUDGET_CACHE: KVNamespace;
  DATABASE_URL: string;
  API_SECRET: string;
}

// Edge-compatible request handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Initialize cache with Cloudflare KV
    const cache = new CloudflareKVCache(env.BUDGET_CACHE);
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers for cross-origin requests
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    };
    
    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers, status: 204 });
    }
    
    try {
      // Route handling
      if (path.startsWith("/api/budget/calculate")) {
        return handleBudgetCalculation(request, cache, headers);
      } else if (path.startsWith("/api/budget/save")) {
        return handleBudgetSave(request, cache, headers);
      } else if (path.startsWith("/api/budget/get")) {
        return handleBudgetGet(request, cache, headers);
      } else if (path.startsWith("/api/pricing/calculate")) {
        return handlePricingCalculation(request, cache, headers);
      } else if (path.startsWith("/api/pricing/batch")) {
        return handleBatchPricing(request, cache, headers);
      } else if (path.startsWith("/api/cache/invalidate")) {
        return handleCacheInvalidation(request, cache, headers);
      }
      
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({ 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers
      });
    }
  },
};

// Handle budget calculation and caching
async function handleBudgetCalculation(
  request: Request, 
  cache: CloudflareKVCache,
  headers: HeadersInit
): Promise<Response> {
  const { income, customerId, storeId } = await request.json();
  
  if (!income || !customerId || !storeId) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers
    });
  }
  
  // Calculate budget using the engine
  const budget = BudgetEngine.calculateBudgetBreakdown(income);
  
  // Cache the budget for future use
  await cache.setCustomerBudget(customerId, storeId, budget);
  
  return new Response(JSON.stringify({ 
    budget,
    cached: true,
    message: "Budget calculated and cached successfully"
  }), {
    status: 200,
    headers
  });
}

// Handle saving budget data
async function handleBudgetSave(
  request: Request,
  cache: CloudflareKVCache,
  headers: HeadersInit
): Promise<Response> {
  const { budget, customerId, storeId } = await request.json();
  
  if (!budget || !customerId || !storeId) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers
    });
  }
  
  await cache.setCustomerBudget(customerId, storeId, budget);
  
  return new Response(JSON.stringify({ 
    success: true,
    message: "Budget saved successfully"
  }), {
    status: 200,
    headers
  });
}

// Handle retrieving cached budget
async function handleBudgetGet(
  request: Request,
  cache: CloudflareKVCache,
  headers: HeadersInit
): Promise<Response> {
  const url = new URL(request.url);
  const customerId = url.searchParams.get("customerId");
  const storeId = url.searchParams.get("storeId");
  
  if (!customerId || !storeId) {
    return new Response(JSON.stringify({ error: "Missing required parameters" }), {
      status: 400,
      headers
    });
  }
  
  const budget = await cache.getCustomerBudget(customerId, parseInt(storeId));
  
  if (!budget) {
    return new Response(JSON.stringify({ 
      error: "Budget not found",
      cached: false
    }), {
      status: 404,
      headers
    });
  }
  
  return new Response(JSON.stringify({ 
    budget,
    cached: true
  }), {
    status: 200,
    headers
  });
}

// Handle product pricing calculation
async function handlePricingCalculation(
  request: Request,
  cache: CloudflareKVCache,
  headers: HeadersInit
): Promise<Response> {
  const { productId, productPrice, customerId, storeId, category } = await request.json();
  
  if (!productId || !productPrice || !customerId || !storeId) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers
    });
  }
  
  // Try to get cached pricing first
  const cachedPricing = await cache.getProductPricing(productId, storeId, customerId);
  if (cachedPricing && (Date.now() - cachedPricing.timestamp) < 300000) { // 5 min cache
    return new Response(JSON.stringify({
      pricing: cachedPricing,
      cached: true
    }), {
      status: 200,
      headers
    });
  }
  
  // Get customer budget
  const budget = await cache.getCustomerBudget(customerId, storeId);
  if (!budget) {
    return new Response(JSON.stringify({ 
      error: "Customer budget not found. Please set budget first."
    }), {
      status: 404,
      headers
    });
  }
  
  // Calculate pricing
  const pricing = BudgetEngine.calculateProductPricing(
    budget,
    productPrice,
    category || "wants"
  );
  
  // Cache the pricing
  const cachedData = {
    ...pricing,
    remainingBudget: budget[`${category || "wants"}Amount`] - pricing.budgetPrice,
    timestamp: Date.now(),
    ttl: 300 // 5 minutes
  };
  
  await cache.setProductPricing(productId, storeId, customerId, cachedData);
  
  return new Response(JSON.stringify({
    pricing: cachedData,
    cached: false
  }), {
    status: 200,
    headers
  });
}

// Handle batch pricing calculations
async function handleBatchPricing(
  request: Request,
  cache: CloudflareKVCache,
  headers: HeadersInit
): Promise<Response> {
  const { products, customerId, storeId } = await request.json();
  
  if (!products || !Array.isArray(products) || !customerId || !storeId) {
    return new Response(JSON.stringify({ error: "Invalid request data" }), {
      status: 400,
      headers
    });
  }
  
  // Get customer budget
  const budget = await cache.getCustomerBudget(customerId, storeId);
  if (!budget) {
    return new Response(JSON.stringify({ 
      error: "Customer budget not found"
    }), {
      status: 404,
      headers
    });
  }
  
  // Check cache for existing pricing
  const keys = products.map(p => ({
    productId: p.id,
    storeId,
    customerId
  }));
  
  const cachedPricings = await cache.getMultipleProductPricing(keys);
  const results = [];
  const toCache = [];
  
  for (const product of products) {
    const cacheKey = `${product.id}:${storeId}:${customerId}`;
    const cached = cachedPricings.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < 300000) {
      results.push({
        productId: product.id,
        pricing: cached,
        cached: true
      });
    } else {
      // Calculate new pricing
      const pricing = BudgetEngine.calculateProductPricing(
        budget,
        product.price,
        product.category || "wants"
      );
      
      const cachedData = {
        ...pricing,
        remainingBudget: budget[`${product.category || "wants"}Amount`] - pricing.budgetPrice,
        timestamp: Date.now(),
        ttl: 300
      };
      
      results.push({
        productId: product.id,
        pricing: cachedData,
        cached: false
      });
      
      toCache.push({
        productId: product.id,
        storeId,
        customerId,
        pricing: cachedData
      });
    }
  }
  
  // Cache new calculations
  if (toCache.length > 0) {
    await cache.setMultipleProductPricing(toCache);
  }
  
  return new Response(JSON.stringify({
    results,
    totalCached: cachedPricings.size,
    totalCalculated: toCache.length
  }), {
    status: 200,
    headers
  });
}

// Handle cache invalidation
async function handleCacheInvalidation(
  request: Request,
  cache: CloudflareKVCache,
  headers: HeadersInit
): Promise<Response> {
  const { customerId, storeId, scope } = await request.json();
  
  if (!storeId) {
    return new Response(JSON.stringify({ error: "Store ID required" }), {
      status: 400,
      headers
    });
  }
  
  if (scope === "store") {
    await cache.invalidateStoreCache(storeId);
  } else if (customerId) {
    await cache.invalidateCustomerCache(customerId, storeId);
  } else {
    return new Response(JSON.stringify({ error: "Invalid scope" }), {
      status: 400,
      headers
    });
  }
  
  return new Response(JSON.stringify({
    success: true,
    message: `Cache invalidated for ${scope}`
  }), {
    status: 200,
    headers
  });
}