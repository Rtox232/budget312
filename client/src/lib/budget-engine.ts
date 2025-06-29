import { BudgetData, ProductPricing } from "@/types";

export class BudgetEngine {
  // Default 50/30/20 rule percentages
  private static DEFAULT_NEEDS = 0.5;
  private static DEFAULT_WANTS = 0.3;
  private static DEFAULT_SAVINGS = 0.2;

  /**
   * Calculate budget breakdown using 50/30/20 rule
   */
  static calculateBudgetBreakdown(
    monthlyIncome: number,
    customRules?: { needs?: number; wants?: number; savings?: number }
  ): BudgetData {
    const needsPercentage = customRules?.needs ?? this.DEFAULT_NEEDS;
    const wantsPercentage = customRules?.wants ?? this.DEFAULT_WANTS;
    const savingsPercentage = customRules?.savings ?? this.DEFAULT_SAVINGS;

    return {
      monthlyIncome,
      needsAmount: monthlyIncome * needsPercentage,
      wantsAmount: monthlyIncome * wantsPercentage,
      savingsAmount: monthlyIncome * savingsPercentage,
      category: "wants", // Default category
    };
  }

  /**
   * Calculate product pricing based on customer budget
   */
  static calculateProductPricing(
    productId: string,
    basePrice: number,
    customerBudget: BudgetData,
    category: "needs" | "wants" | "savings" = "wants",
    shopifyDiscounts: number = 0,
    maxDiscountPercentage: number = 0.25
  ): ProductPricing {
    // Get available budget for the category
    const availableBudget = category === "needs" 
      ? customerBudget.needsAmount 
      : category === "wants" 
      ? customerBudget.wantsAmount 
      : customerBudget.savingsAmount;

    // Calculate price after existing Shopify discounts
    const priceAfterShopifyDiscounts = basePrice - shopifyDiscounts;
    
    let budgetDiscount = 0;
    let finalPrice = priceAfterShopifyDiscounts;

    // Calculate required discount to fit within budget
    if (priceAfterShopifyDiscounts > availableBudget) {
      budgetDiscount = priceAfterShopifyDiscounts - availableBudget;
      
      // Cap at maximum discount percentage
      const maxAllowedDiscount = basePrice * maxDiscountPercentage;
      if (budgetDiscount > maxAllowedDiscount) {
        budgetDiscount = maxAllowedDiscount;
      }
      
      finalPrice = priceAfterShopifyDiscounts - budgetDiscount;
    }

    const totalDiscount = shopifyDiscounts + budgetDiscount;
    const discountPercentage = (totalDiscount / basePrice) * 100;

    return {
      productId,
      basePrice,
      shopifyDiscounts,
      budgetDiscount: Math.round(budgetDiscount * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100,
      discountPercentage: Math.round(discountPercentage * 100) / 100,
      availableBudget: Math.round(availableBudget * 100) / 100,
      withinBudget: finalPrice <= availableBudget,
    };
  }

  /**
   * Calculate purchase impact on budget
   */
  static calculatePurchaseImpact(
    price: number,
    customerBudget: BudgetData,
    category: "needs" | "wants" | "savings" = "wants"
  ) {
    const categoryBudget = category === "needs" 
      ? customerBudget.needsAmount 
      : category === "wants" 
      ? customerBudget.wantsAmount 
      : customerBudget.savingsAmount;

    const categoryPercentage = (price / categoryBudget) * 100;
    const totalPercentage = (price / customerBudget.monthlyIncome) * 100;

    return {
      categoryPercentage: Math.round(categoryPercentage * 100) / 100,
      totalPercentage: Math.round(totalPercentage * 100) / 100,
      remainingCategoryBudget: Math.max(0, categoryBudget - price),
      affordableWithinCategory: price <= categoryBudget,
    };
  }

  /**
   * Get pricing recommendation text
   */
  static getPricingRecommendation(
    pricing: ProductPricing,
    impact: ReturnType<typeof BudgetEngine.calculatePurchaseImpact>
  ): { message: string; type: "success" | "warning" | "error" } {
    if (pricing.withinBudget && impact.categoryPercentage <= 100) {
      return {
        message: "Great choice! This fits perfectly within your budget.",
        type: "success"
      };
    } else if (impact.categoryPercentage <= 120) {
      return {
        message: "This is slightly over your budget. Consider our payment plans.",
        type: "warning"
      };
    } else {
      return {
        message: "This purchase would significantly exceed your budget. Consider saving up or looking at alternatives.",
        type: "error"
      };
    }
  }

  /**
   * Save budget data to storage (GDPR compliant)
   */
  static async saveBudgetToStorage(
    budgetData: BudgetData,
    persistent: boolean = false,
    customerId: string = "anonymous",
    storeId: number = 1
  ): Promise<void> {
    const storage = persistent ? localStorage : sessionStorage;
    const storageKey = "budgetprice_budget_data";
    
    try {
      // Save locally first
      storage.setItem(storageKey, JSON.stringify({
        ...budgetData,
        timestamp: Date.now(),
        persistent,
      }));

      // Also save to server cache for cross-device/session access
      if (persistent || customerId !== "anonymous") {
        await fetch("/api/budget/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            monthlyIncome: budgetData.monthlyIncome,
            category: budgetData.category,
            customerId,
            storeId
          })
        });
      }
    } catch (error) {
      console.warn("Failed to save budget data:", error);
    }
  }

  /**
   * Load budget data from storage
   */
  static loadBudgetFromStorage(): BudgetData | null {
    try {
      // Try localStorage first, then sessionStorage
      let data = localStorage.getItem("budgetprice_budget_data");
      let storage: Storage = localStorage;
      
      if (!data) {
        data = sessionStorage.getItem("budgetprice_budget_data");
        storage = sessionStorage;
      }

      if (!data) return null;

      const parsed = JSON.parse(data);
      
      // Check if data is expired (older than 30 days)
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - parsed.timestamp > thirtyDaysMs) {
        storage.removeItem("budgetprice_budget_data");
        return null;
      }

      return {
        monthlyIncome: parsed.monthlyIncome,
        needsAmount: parsed.needsAmount,
        wantsAmount: parsed.wantsAmount,
        savingsAmount: parsed.savingsAmount,
        category: parsed.category,
      };
    } catch (error) {
      console.warn("Failed to load budget data:", error);
      return null;
    }
  }

  /**
   * Clear budget data from storage (GDPR compliance)
   */
  static clearBudgetFromStorage(): void {
    try {
      localStorage.removeItem("budgetprice_budget_data");
      sessionStorage.removeItem("budgetprice_budget_data");
    } catch (error) {
      console.warn("Failed to clear budget data:", error);
    }
  }
}
