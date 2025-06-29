export interface BudgetData {
  monthlyIncome: number;
  needsAmount: number;
  wantsAmount: number;
  savingsAmount: number;
  category: "needs" | "wants" | "savings";
}

export interface ProductPricing {
  productId: string;
  basePrice: number;
  shopifyDiscounts: number;
  budgetDiscount: number;
  finalPrice: number;
  discountPercentage: number;
  availableBudget?: number;
  withinBudget?: boolean;
}

export interface PricingRule {
  id: number;
  storeId: number;
  name: string;
  needsPercentage: string;
  wantsPercentage: string;
  savingsPercentage: string;
  maxDiscountPercentage: string;
  isActive: boolean;
}

export interface Store {
  id: number;
  userId: number;
  shopifyDomain: string;
  isActive: boolean;
  settings?: {
    theme?: {
      primaryColor?: string;
      fontFamily?: string;
    };
    features?: {
      budgetEducation?: boolean;
      analytics?: boolean;
    };
  };
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}

export interface AppTier {
  name: string;
  price: number;
  features: string[];
  limits?: {
    maxDiscountPercentage?: number;
    customRules?: boolean;
    analytics?: boolean;
    whiteLabel?: boolean;
  };
}

export const APP_TIERS: Record<string, AppTier> = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "Basic 50/30/20 discounts",
      "Session-only storage",
      "Shopify discount detection",
      "GDPR compliant",
      "Community support"
    ],
    limits: {
      maxDiscountPercentage: 15,
      customRules: false,
      analytics: false,
      whiteLabel: false,
    }
  },
  starter: {
    name: "Starter",
    price: 15,
    features: [
      "Everything in Free",
      "Custom budget categories",
      "Discount stacking",
      "Opt-in analytics",
      "Email support"
    ],
    limits: {
      maxDiscountPercentage: 25,
      customRules: true,
      analytics: true,
      whiteLabel: false,
    }
  },
  pro: {
    name: "Pro",
    price: 49,
    features: [
      "Everything in Starter",
      "AI-driven dynamic pricing",
      "A/B testing",
      "White-label Shopify app",
      "Priority support"
    ],
    limits: {
      maxDiscountPercentage: 35,
      customRules: true,
      analytics: true,
      whiteLabel: true,
    }
  },
  enterprise: {
    name: "Enterprise",
    price: -1, // Custom pricing
    features: [
      "Everything in Pro",
      "CRM integrations",
      "Automated GDPR tools",
      "Dedicated support",
      "Custom integrations"
    ],
    limits: {
      maxDiscountPercentage: 50,
      customRules: true,
      analytics: true,
      whiteLabel: true,
    }
  }
};
