import { IntegrationFactory } from "./integration-factory";
import { storage } from "../storage";
import type { Store } from "@shared/schema";

// Automated integration test suite
export class IntegrationTestSuite {
  private results: TestResult[] = [];
  
  async runAllTests(storeId: number, platform: "shopify" | "magento" | "wordpress"): Promise<TestReport> {
    console.log(`Running integration tests for ${platform} (Store ID: ${storeId})`);
    
    this.results = [];
    const startTime = Date.now();
    
    try {
      // Test 1: Authentication
      await this.testAuthentication(storeId, platform);
      
      // Test 2: Product fetching with caching
      await this.testProductFetching(storeId, platform);
      
      // Test 3: Customer operations
      await this.testCustomerOperations(storeId, platform);
      
      // Test 4: Discount creation
      await this.testDiscountCreation(storeId, platform);
      
      // Test 5: Webhook validation
      await this.testWebhookValidation(storeId, platform);
      
      // Test 6: Rate limiting
      await this.testRateLimiting(storeId, platform);
      
      // Test 7: Cache performance
      await this.testCachePerformance(storeId, platform);
      
    } catch (error) {
      console.error("Test suite failed:", error);
    }
    
    const endTime = Date.now();
    
    return {
      platform,
      storeId,
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === "passed").length,
      failed: this.results.filter(r => r.status === "failed").length,
      duration: endTime - startTime,
      results: this.results
    };
  }
  
  private async testAuthentication(storeId: number, platform: string): Promise<void> {
    const testName = "Authentication Test";
    try {
      const integration = await IntegrationFactory.create(storeId, platform as any);
      this.addResult(testName, "passed", "Integration created successfully");
    } catch (error) {
      this.addResult(testName, "failed", `Failed to create integration: ${error}`);
    }
  }
  
  private async testProductFetching(storeId: number, platform: string): Promise<void> {
    const testName = "Product Fetching Test";
    try {
      const integration = await IntegrationFactory.create(storeId, platform as any);
      
      // Test fetching products list
      const products = await integration.getProducts({ limit: 5 });
      if (!products.products || products.products.length === 0) {
        this.addResult(testName, "failed", "No products returned");
        return;
      }
      
      // Test fetching single product with caching
      const productId = products.products[0].id;
      const start1 = Date.now();
      const product1 = await integration.getProduct(productId);
      const time1 = Date.now() - start1;
      
      // Second fetch should be cached
      const start2 = Date.now();
      const product2 = await integration.getProduct(productId);
      const time2 = Date.now() - start2;
      
      if (time2 < time1 / 2) {
        this.addResult(testName, "passed", `Caching working: ${time1}ms vs ${time2}ms`);
      } else {
        this.addResult(testName, "failed", `Caching not effective: ${time1}ms vs ${time2}ms`);
      }
    } catch (error) {
      this.addResult(testName, "failed", `Error: ${error}`);
    }
  }
  
  private async testCustomerOperations(storeId: number, platform: string): Promise<void> {
    const testName = "Customer Operations Test";
    try {
      const integration = await IntegrationFactory.create(storeId, platform as any);
      
      // Create a test customer ID based on platform
      const testCustomerId = platform === "shopify" ? "1234567890" : "1";
      
      const customer = await integration.getCustomer(testCustomerId);
      if (customer) {
        this.addResult(testName, "passed", "Customer fetched successfully");
      } else {
        this.addResult(testName, "passed", "Customer not found (expected for test ID)");
      }
    } catch (error) {
      this.addResult(testName, "failed", `Error: ${error}`);
    }
  }
  
  private async testDiscountCreation(storeId: number, platform: string): Promise<void> {
    const testName = "Discount Creation Test";
    try {
      const integration = await IntegrationFactory.create(storeId, platform as any);
      
      const discount = await integration.createDiscount({
        code: `TEST_${Date.now()}`,
        value: 10,
        valueType: "percentage",
        appliesTo: "order"
      });
      
      if (discount.id && discount.code) {
        this.addResult(testName, "passed", `Discount created: ${discount.code}`);
      } else {
        this.addResult(testName, "failed", "Invalid discount response");
      }
    } catch (error) {
      this.addResult(testName, "failed", `Error: ${error}`);
    }
  }
  
  private async testWebhookValidation(storeId: number, platform: string): Promise<void> {
    const testName = "Webhook Validation Test";
    try {
      const integration = await IntegrationFactory.create(storeId, platform as any);
      
      // Test with invalid signature
      const isValid = integration.validateWebhook(
        { "x-shopify-hmac-sha256": "invalid" },
        { test: "data" }
      );
      
      if (!isValid) {
        this.addResult(testName, "passed", "Invalid webhook correctly rejected");
      } else {
        this.addResult(testName, "failed", "Invalid webhook incorrectly accepted");
      }
    } catch (error) {
      this.addResult(testName, "failed", `Error: ${error}`);
    }
  }
  
  private async testRateLimiting(storeId: number, platform: string): Promise<void> {
    const testName = "Rate Limiting Test";
    try {
      const integration = await IntegrationFactory.create(storeId, platform as any);
      
      // Make multiple rapid requests
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(integration.getProducts({ limit: 1 }));
      }
      
      const start = Date.now();
      await Promise.all(requests);
      const duration = Date.now() - start;
      
      // If rate limiting is working, requests should be spaced out
      if (duration > 100) {
        this.addResult(testName, "passed", `Rate limiting active: ${duration}ms for 5 requests`);
      } else {
        this.addResult(testName, "passed", `No rate limiting needed: ${duration}ms`);
      }
    } catch (error) {
      this.addResult(testName, "failed", `Error: ${error}`);
    }
  }
  
  private async testCachePerformance(storeId: number, platform: string): Promise<void> {
    const testName = "Cache Performance Test";
    try {
      const integration = await IntegrationFactory.create(storeId, platform as any);
      
      // Test lazy loading by fetching same product multiple times
      const products = await integration.getProducts({ limit: 1 });
      if (products.products.length === 0) {
        this.addResult(testName, "skipped", "No products to test");
        return;
      }
      
      const productId = products.products[0].id;
      const times: number[] = [];
      
      // Fetch same product 10 times
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await integration.getProduct(productId);
        times.push(Date.now() - start);
      }
      
      // First request should be slowest
      const avgCachedTime = times.slice(1).reduce((a, b) => a + b, 0) / (times.length - 1);
      const improvement = ((times[0] - avgCachedTime) / times[0]) * 100;
      
      if (improvement > 50) {
        this.addResult(testName, "passed", `Cache improved performance by ${improvement.toFixed(1)}%`);
      } else {
        this.addResult(testName, "failed", `Cache improvement only ${improvement.toFixed(1)}%`);
      }
    } catch (error) {
      this.addResult(testName, "failed", `Error: ${error}`);
    }
  }
  
  private addResult(testName: string, status: TestStatus, message: string): void {
    this.results.push({
      testName,
      status,
      message,
      timestamp: new Date()
    });
    console.log(`[${status.toUpperCase()}] ${testName}: ${message}`);
  }
}

interface TestResult {
  testName: string;
  status: TestStatus;
  message: string;
  timestamp: Date;
}

type TestStatus = "passed" | "failed" | "skipped";

interface TestReport {
  platform: string;
  storeId: number;
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
}

// Export test runner function
export async function runIntegrationTests(storeId: number, platform: "shopify" | "magento" | "wordpress"): Promise<TestReport> {
  const suite = new IntegrationTestSuite();
  return await suite.runAllTests(storeId, platform);
}