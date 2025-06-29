import { 
  CartSession, InsertCartSession, ProductRecommendation, InsertProductRecommendation,
  AutoDiscount, InsertAutoDiscount, CartItem, CartBudgetBreakdown, BudgetData,
  ProductRecommendationData, AutoDiscountData, cartSessions, productRecommendations, autoDiscounts
} from "../../shared/schema.js";
import { db } from "../db.js";
import { eq, and, desc } from "drizzle-orm";

export class PremiumCartTrackingService {
  
  // Update cart session when items are added/removed
  async updateCartSession(
    storeId: number,
    customerId: string,
    sessionId: string,
    cartItems: CartItem[],
    budget: BudgetData
  ): Promise<CartSession> {
    const budgetBreakdown = this.calculateBudgetBreakdown(cartItems, budget);
    const totalCartValue = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const remainingBudget = this.calculateRemainingBudget(budgetBreakdown);

    // Check for existing session
    const existingSession = await db
      .select()
      .from(cartSessions)
      .where(and(
        eq(cartSessions.storeId, storeId),
        eq(cartSessions.customerId, customerId),
        eq(cartSessions.sessionId, sessionId),
        eq(cartSessions.isActive, true)
      ))
      .limit(1);

    const cartData = {
      items: cartItems,
      totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: totalCartValue
    };

    if (existingSession.length > 0) {
      // Update existing session
      const [updated] = await db
        .update(cartSessions)
        .set({
          cartData,
          budgetBreakdown,
          totalCartValue: totalCartValue.toString(),
          remainingBudget,
          updatedAt: new Date()
        })
        .where(eq(cartSessions.id, existingSession[0].id))
        .returning();
      
      return updated;
    } else {
      // Create new session
      const [created] = await db
        .insert(cartSessions)
        .values({
          storeId,
          customerId,
          sessionId,
          cartData,
          budgetBreakdown,
          totalCartValue: totalCartValue.toString(),
          remainingBudget,
          appliedDiscounts: [],
          recommendedProducts: []
        })
        .returning();

      return created;
    }
  }

  // Calculate budget breakdown per category
  private calculateBudgetBreakdown(cartItems: CartItem[], budget: BudgetData): CartBudgetBreakdown {
    const needsItems = cartItems.filter(item => item.budgetCategory === "needs");
    const wantsItems = cartItems.filter(item => item.budgetCategory === "wants");
    const savingsItems = cartItems.filter(item => item.budgetCategory === "savings");

    const needsSpent = needsItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const wantsSpent = wantsItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const savingsSpent = savingsItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
      needs: {
        allocated: budget.needsAmount,
        spent: needsSpent,
        remaining: budget.needsAmount - needsSpent,
        items: needsItems
      },
      wants: {
        allocated: budget.wantsAmount,
        spent: wantsSpent,
        remaining: budget.wantsAmount - wantsSpent,
        items: wantsItems
      },
      savings: {
        allocated: budget.savingsAmount,
        spent: savingsSpent,
        remaining: budget.savingsAmount - savingsSpent,
        items: savingsItems
      }
    };
  }

  // Calculate remaining budget across all categories
  private calculateRemainingBudget(breakdown: CartBudgetBreakdown) {
    return {
      needs: breakdown.needs.remaining,
      wants: breakdown.wants.remaining,
      savings: breakdown.savings.remaining,
      total: breakdown.needs.remaining + breakdown.wants.remaining + breakdown.savings.remaining
    };
  }

  // Generate product recommendations based on remaining budget
  async generateProductRecommendations(
    storeId: number,
    customerId: string,
    remainingBudget: { needs: number; wants: number; savings: number },
    excludeProductIds: string[] = []
  ): Promise<ProductRecommendationData[]> {
    const recommendations: ProductRecommendationData[] = [];

    // Recommend based on remaining budget in each category
    if (remainingBudget.needs > 20) {
      recommendations.push({
        productId: "needs_product_1",
        title: "Essential Daily Supplements",
        price: Math.min(remainingBudget.needs * 0.8, 35),
        budgetCategory: "needs",
        reason: "Essential health product that fits your needs budget",
        remainingBudgetAfter: remainingBudget.needs - Math.min(remainingBudget.needs * 0.8, 35),
        url: "/products/essential-supplements"
      });
    }

    if (remainingBudget.wants > 15) {
      recommendations.push({
        productId: "wants_product_1",
        title: "Premium Coffee Blend",
        price: Math.min(remainingBudget.wants * 0.6, 28),
        budgetCategory: "wants",
        reason: "Perfect treat that fits your wants budget",
        remainingBudgetAfter: remainingBudget.wants - Math.min(remainingBudget.wants * 0.6, 28),
        url: "/products/premium-coffee"
      });
    }

    if (remainingBudget.savings > 50) {
      recommendations.push({
        productId: "savings_product_1",
        title: "Investment in Quality Tools",
        price: Math.min(remainingBudget.savings * 0.7, 75),
        budgetCategory: "savings",
        reason: "Long-term investment that builds value",
        remainingBudgetAfter: remainingBudget.savings - Math.min(remainingBudget.savings * 0.7, 75),
        url: "/products/quality-tools"
      });
    }

    // Store recommendations in database
    for (const rec of recommendations) {
      await db.insert(productRecommendations).values({
        storeId,
        customerId,
        productId: rec.productId,
        productTitle: rec.title,
        productPrice: rec.price.toString(),
        budgetCategory: rec.budgetCategory,
        recommendationReason: rec.reason,
        remainingBudgetAfter: rec.remainingBudgetAfter.toString(),
        priority: recommendations.indexOf(rec) + 1
      });
    }

    return recommendations;
  }

  // Check and apply automatic discounts
  async checkAndApplyDiscounts(
    storeId: number,
    customerId: string,
    cartSessionId: number,
    totalCartValue: number,
    minimumThreshold: number
  ): Promise<AutoDiscountData[]> {
    const appliedDiscounts: AutoDiscountData[] = [];

    // Apply percentage discount if cart meets minimum
    if (totalCartValue >= minimumThreshold) {
      const discountPercentage = this.calculateDiscountPercentage(totalCartValue, minimumThreshold);
      const discountAmount = totalCartValue * (discountPercentage / 100);
      
      const discountCode = `BUDGET${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const discount: AutoDiscountData = {
        code: discountCode,
        type: "percentage",
        value: discountPercentage,
        minimumAmount: minimumThreshold,
        appliedAmount: discountAmount,
        reason: `Budget-conscious shopping reward: ${discountPercentage}% off for spending over $${minimumThreshold}`
      };

      // Store in database
      await db.insert(autoDiscounts).values({
        storeId,
        customerId,
        cartSessionId,
        discountCode,
        discountType: "percentage",
        discountValue: discountPercentage.toString(),
        minimumAmount: minimumThreshold.toString(),
        appliedAmount: discountAmount.toString(),
        isApplied: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      appliedDiscounts.push(discount);
    }

    // Add free shipping for larger orders
    if (totalCartValue >= minimumThreshold * 1.5) {
      const freeShipping: AutoDiscountData = {
        code: `FREESHIP${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        type: "free_shipping",
        value: 0,
        appliedAmount: 10, // Assume $10 shipping saved
        reason: "Free shipping for budget-conscious bulk orders"
      };

      appliedDiscounts.push(freeShipping);
    }

    return appliedDiscounts;
  }

  // Calculate discount percentage based on cart value
  private calculateDiscountPercentage(cartValue: number, minimumThreshold: number): number {
    const ratio = cartValue / minimumThreshold;
    
    if (ratio >= 3) return 15; // 15% for 3x minimum
    if (ratio >= 2) return 10; // 10% for 2x minimum
    if (ratio >= 1.5) return 7; // 7% for 1.5x minimum
    return 5; // 5% for meeting minimum
  }

  // Get active cart session
  async getActiveCartSession(storeId: number, customerId: string, sessionId: string): Promise<CartSession | null> {
    const [session] = await db
      .select()
      .from(cartSessions)
      .where(and(
        eq(cartSessions.storeId, storeId),
        eq(cartSessions.customerId, customerId),
        eq(cartSessions.sessionId, sessionId),
        eq(cartSessions.isActive, true)
      ))
      .limit(1);

    return session || null;
  }

  // Get product recommendations for customer
  async getProductRecommendations(storeId: number, customerId: string): Promise<ProductRecommendation[]> {
    return await db
      .select()
      .from(productRecommendations)
      .where(and(
        eq(productRecommendations.storeId, storeId),
        eq(productRecommendations.customerId, customerId)
      ))
      .orderBy(desc(productRecommendations.priority), desc(productRecommendations.createdAt))
      .limit(5);
  }

  // Mark recommendation as clicked
  async trackRecommendationClick(recommendationId: number): Promise<void> {
    await db
      .update(productRecommendations)
      .set({ isClicked: true })
      .where(eq(productRecommendations.id, recommendationId));
  }

  // Mark recommendation as purchased
  async trackRecommendationPurchase(recommendationId: number): Promise<void> {
    await db
      .update(productRecommendations)
      .set({ isPurchased: true })
      .where(eq(productRecommendations.id, recommendationId));
  }
}

export const cartTrackingService = new PremiumCartTrackingService();