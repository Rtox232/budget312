import { pgTable, text, serial, integer, boolean, decimal, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  shopifyDomain: text("shopify_domain"),
  tier: text("tier").notNull().default("free"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  shopifyDomain: text("shopify_domain").notNull().unique(),
  accessToken: text("access_token"),
  isActive: boolean("is_active").default(true),
  settings: json("settings"),
  createdAt: timestamp("created_at").defaultNow(),
  // Integration fields
  domain: text("domain"),
  platform: text("platform").default("shopify"),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  webhookSecret: text("webhook_secret"),
  // Premium cart tracking features
  premiumCartTracking: boolean("premium_cart_tracking").default(false),
  autoDiscountEnabled: boolean("auto_discount_enabled").default(false),
  productRecommendationsEnabled: boolean("product_recommendations_enabled").default(false),
  budgetRemainingDisplayEnabled: boolean("budget_remaining_display_enabled").default(false),
  minimumDiscountThreshold: decimal("minimum_discount_threshold", { precision: 10, scale: 2 }).default("50.00")
});

export const budgetSessions = pgTable("budget_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  storeId: integer("store_id").references(() => stores.id),
  customerData: json("customer_data"),
  budgetData: json("budget_data"),
  isOptedIn: boolean("is_opted_in").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pricingRules = pgTable("pricing_rules", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  name: text("name").notNull(),
  needsPercentage: decimal("needs_percentage", { precision: 5, scale: 2 }).default("50.00"),
  wantsPercentage: decimal("wants_percentage", { precision: 5, scale: 2 }).default("30.00"),
  savingsPercentage: decimal("savings_percentage", { precision: 5, scale: 2 }).default("20.00"),
  maxDiscountPercentage: decimal("max_discount_percentage", { precision: 5, scale: 2 }).default("25.00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  // Repeat purchase settings
  budgetRefreshType: text("budget_refresh_type").default("monthly"), // "per_purchase", "daily", "weekly", "monthly", "never"
  maxBudgetApplications: integer("max_budget_applications").default(-1), // -1 = unlimited
  budgetRefreshDays: integer("budget_refresh_days").default(30),
  repeatCustomerDiscount: decimal("repeat_customer_discount", { precision: 5, scale: 2 }).default("0.00"),
  discountTerms: text("discount_terms"),
  termsPageUrl: text("terms_page_url"),
  isAppEnabled: boolean("is_app_enabled").default(true),
  enabledForProducts: json("enabled_for_products"), // Array of product IDs or "all"
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  eventType: text("event_type").notNull(),
  eventData: json("event_data"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const customerPurchases = pgTable("customer_purchases", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  customerId: text("customer_id").notNull(), // Shopify customer ID
  customerEmail: text("customer_email"),
  productId: text("product_id").notNull(),
  productHandle: text("product_handle"),
  variantId: text("variant_id"),
  orderId: text("order_id"),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(),
  budgetDiscount: decimal("budget_discount", { precision: 10, scale: 2 }).default("0.00"),
  budgetCategory: text("budget_category"), // "needs", "wants", "savings"
  purchaseDate: timestamp("purchase_date").defaultNow(),
  budgetApplicationCount: integer("budget_application_count").default(1),
  sessionId: text("session_id"),
});

export const customerBudgetHistory = pgTable("customer_budget_history", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  customerId: text("customer_id").notNull(),
  customerEmail: text("customer_email"),
  monthlyIncome: decimal("monthly_income", { precision: 12, scale: 2 }),
  budgetPeriod: text("budget_period").default("monthly"), // "weekly", "biweekly", "monthly", "yearly"
  budgetStartDate: timestamp("budget_start_date").notNull(),
  budgetEndDate: timestamp("budget_end_date").notNull(),
  totalBudgetApplications: integer("total_budget_applications").default(0),
  remainingApplications: integer("remaining_applications").default(-1), // -1 = unlimited
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartSessions = pgTable("cart_sessions", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  customerId: text("customer_id").notNull(),
  sessionId: text("session_id").notNull(),
  cartData: json("cart_data").notNull(), // Contains itemized cart with budget analysis
  budgetBreakdown: json("budget_breakdown").notNull(), // Budget allocation per item/category
  appliedDiscounts: json("applied_discounts"), // Auto-applied discounts
  recommendedProducts: json("recommended_products"), // Products that fit remaining budget
  totalCartValue: decimal("total_cart_value", { precision: 10, scale: 2 }).notNull(),
  remainingBudget: json("remaining_budget"), // Remaining budget per category
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const productRecommendations = pgTable("product_recommendations", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  customerId: text("customer_id").notNull(),
  productId: text("product_id").notNull(),
  productTitle: text("product_title").notNull(),
  productPrice: decimal("product_price", { precision: 10, scale: 2 }).notNull(),
  budgetCategory: text("budget_category").notNull(), // needs, wants, savings
  recommendationReason: text("recommendation_reason"), // Why this product was recommended
  remainingBudgetAfter: decimal("remaining_budget_after", { precision: 10, scale: 2 }),
  priority: integer("priority").default(0), // Higher priority = better recommendation
  isClicked: boolean("is_clicked").default(false),
  isPurchased: boolean("is_purchased").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const autoDiscounts = pgTable("auto_discounts", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  customerId: text("customer_id").notNull(),
  cartSessionId: integer("cart_session_id").references(() => cartSessions.id),
  discountCode: text("discount_code").notNull(),
  discountType: text("discount_type").notNull(), // percentage, fixed_amount, free_shipping
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minimumAmount: decimal("minimum_amount", { precision: 10, scale: 2 }),
  appliedAmount: decimal("applied_amount", { precision: 10, scale: 2 }),
  isApplied: boolean("is_applied").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetSessionSchema = createInsertSchema(budgetSessions).omit({
  id: true,
  createdAt: true,
});

export const insertPricingRuleSchema = createInsertSchema(pricingRules).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  timestamp: true,
});

export const insertCustomerPurchaseSchema = createInsertSchema(customerPurchases).omit({
  id: true,
  purchaseDate: true,
});

export const insertCustomerBudgetHistorySchema = createInsertSchema(customerBudgetHistory).omit({
  id: true,
  createdAt: true,
});

export const insertCartSessionSchema = createInsertSchema(cartSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductRecommendationSchema = createInsertSchema(productRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertAutoDiscountSchema = createInsertSchema(autoDiscounts).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;

export type BudgetSession = typeof budgetSessions.$inferSelect;
export type InsertBudgetSession = z.infer<typeof insertBudgetSessionSchema>;

export type PricingRule = typeof pricingRules.$inferSelect;
export type InsertPricingRule = z.infer<typeof insertPricingRuleSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;

export type CustomerPurchase = typeof customerPurchases.$inferSelect;
export type InsertCustomerPurchase = z.infer<typeof insertCustomerPurchaseSchema>;

export type CustomerBudgetHistory = typeof customerBudgetHistory.$inferSelect;
export type InsertCustomerBudgetHistory = z.infer<typeof insertCustomerBudgetHistorySchema>;

export type CartSession = typeof cartSessions.$inferSelect;
export type InsertCartSession = z.infer<typeof insertCartSessionSchema>;

export type ProductRecommendation = typeof productRecommendations.$inferSelect;
export type InsertProductRecommendation = z.infer<typeof insertProductRecommendationSchema>;

export type AutoDiscount = typeof autoDiscounts.$inferSelect;
export type InsertAutoDiscount = z.infer<typeof insertAutoDiscountSchema>;

// Budget calculation types
export const budgetDataSchema = z.object({
  monthlyIncome: z.number().min(0),
  needsAmount: z.number().min(0),
  wantsAmount: z.number().min(0),
  savingsAmount: z.number().min(0),
  category: z.enum(["needs", "wants", "savings"]).default("wants"),
});

export type BudgetData = z.infer<typeof budgetDataSchema>;

// Product pricing types
export const productPricingSchema = z.object({
  productId: z.string(),
  basePrice: z.number().min(0),
  shopifyDiscounts: z.number().min(0).default(0),
  budgetDiscount: z.number().min(0).default(0),
  finalPrice: z.number().min(0),
  discountPercentage: z.number().min(0).max(100),
});

export type ProductPricing = z.infer<typeof productPricingSchema>;

// Cart tracking types
export const cartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  title: z.string(),
  price: z.number().min(0),
  quantity: z.number().min(1),
  budgetCategory: z.enum(["needs", "wants", "savings"]),
  budgetImpact: z.number(), // How much this affects the budget
  discountApplied: z.number().default(0),
  fitsInBudget: z.boolean()
});

export const cartBudgetBreakdownSchema = z.object({
  needs: z.object({
    allocated: z.number(),
    spent: z.number(),
    remaining: z.number(),
    items: z.array(cartItemSchema)
  }),
  wants: z.object({
    allocated: z.number(),
    spent: z.number(),
    remaining: z.number(),
    items: z.array(cartItemSchema)
  }),
  savings: z.object({
    allocated: z.number(),
    spent: z.number(),
    remaining: z.number(),
    items: z.array(cartItemSchema)
  })
});

export const productRecommendationDataSchema = z.object({
  productId: z.string(),
  title: z.string(),
  price: z.number(),
  budgetCategory: z.enum(["needs", "wants", "savings"]),
  reason: z.string(),
  remainingBudgetAfter: z.number(),
  imageUrl: z.string().optional(),
  url: z.string()
});

export const autoDiscountDataSchema = z.object({
  code: z.string(),
  type: z.enum(["percentage", "fixed_amount", "free_shipping"]),
  value: z.number(),
  minimumAmount: z.number().optional(),
  appliedAmount: z.number(),
  reason: z.string()
});

export type CartItem = z.infer<typeof cartItemSchema>;
export type CartBudgetBreakdown = z.infer<typeof cartBudgetBreakdownSchema>;
export type ProductRecommendationData = z.infer<typeof productRecommendationDataSchema>;
export type AutoDiscountData = z.infer<typeof autoDiscountDataSchema>;
