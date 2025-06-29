import { 
  users, stores, budgetSessions, pricingRules, analytics, customerPurchases, customerBudgetHistory,
  type User, type InsertUser,
  type Store, type InsertStore,
  type BudgetSession, type InsertBudgetSession,
  type PricingRule, type InsertPricingRule,
  type Analytics, type InsertAnalytics,
  type CustomerPurchase, type InsertCustomerPurchase,
  type CustomerBudgetHistory, type InsertCustomerBudgetHistory
} from "../shared/schema.js";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Store operations
  getStore(id: number): Promise<Store | undefined>;
  getStoreByDomain(domain: string): Promise<Store | undefined>;
  getStoresByUserId(userId: number): Promise<Store[]>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, store: Partial<InsertStore>): Promise<Store | undefined>;

  // Budget session operations
  getBudgetSession(sessionId: string): Promise<BudgetSession | undefined>;
  createBudgetSession(session: InsertBudgetSession): Promise<BudgetSession>;
  updateBudgetSession(sessionId: string, session: Partial<InsertBudgetSession>): Promise<BudgetSession | undefined>;

  // Pricing rule operations
  getPricingRulesByStoreId(storeId: number): Promise<PricingRule[]>;
  getActivePricingRule(storeId: number): Promise<PricingRule | undefined>;
  createPricingRule(rule: InsertPricingRule): Promise<PricingRule>;
  updatePricingRule(id: number, rule: Partial<InsertPricingRule>): Promise<PricingRule | undefined>;

  // Analytics operations
  createAnalyticsEvent(event: InsertAnalytics): Promise<Analytics>;
  getAnalyticsByStoreId(storeId: number, limit?: number): Promise<Analytics[]>;

  // Customer purchase operations
  createCustomerPurchase(purchase: InsertCustomerPurchase): Promise<CustomerPurchase>;
  getCustomerPurchases(storeId: number, customerId: string): Promise<CustomerPurchase[]>;
  getCustomerPurchasesByProduct(storeId: number, customerId: string, productId: string): Promise<CustomerPurchase[]>;

  // Customer budget history operations
  createCustomerBudgetHistory(history: InsertCustomerBudgetHistory): Promise<CustomerBudgetHistory>;
  getActiveCustomerBudget(storeId: number, customerId: string): Promise<CustomerBudgetHistory | undefined>;
  getCustomerBudgetHistory(storeId: number, customerId: string): Promise<CustomerBudgetHistory[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stores: Map<number, Store>;
  private budgetSessions: Map<string, BudgetSession>;
  private pricingRules: Map<number, PricingRule>;
  private analytics: Map<number, Analytics>;
  private customerPurchases: Map<number, CustomerPurchase>;
  private customerBudgetHistory: Map<number, CustomerBudgetHistory>;
  private currentUserId: number;
  private currentStoreId: number;
  private currentRuleId: number;
  private currentAnalyticsId: number;
  private currentPurchaseId: number;
  private currentBudgetHistoryId: number;

  constructor() {
    this.users = new Map();
    this.stores = new Map();
    this.budgetSessions = new Map();
    this.pricingRules = new Map();
    this.analytics = new Map();
    this.customerPurchases = new Map();
    this.customerBudgetHistory = new Map();
    this.currentUserId = 1;
    this.currentStoreId = 1;
    this.currentRuleId = 1;
    this.currentAnalyticsId = 1;
    this.currentPurchaseId = 1;
    this.currentBudgetHistoryId = 1;

    // Initialize with demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Demo user
    const demoUser: User = {
      id: this.currentUserId++,
      username: "demo_merchant",
      email: "demo@example.com",
      password: "hashed_password",
      shopifyDomain: "demo-store.myshopify.com",
      tier: "starter",
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // Demo store
    const demoStore: Store = {
      id: this.currentStoreId++,
      userId: demoUser.id,
      shopifyDomain: "demo-store.myshopify.com",
      accessToken: "demo_access_token",
      isActive: true,
      settings: {
        theme: { primaryColor: "#00A651", fontFamily: "Inter" },
        features: { budgetEducation: true, analytics: true }
      },
      createdAt: new Date(),
      domain: "demo-store.myshopify.com",
      platform: "shopify",
      apiKey: null,
      apiSecret: null,
      webhookSecret: null,
      premiumCartTracking: true,
      autoDiscountEnabled: true,
      productRecommendationsEnabled: true,
      budgetRemainingDisplayEnabled: true,
      minimumDiscountThreshold: "50",
      tier: "premium"
    };
    this.stores.set(demoStore.id, demoStore);

    // Demo pricing rule
    const demoPricingRule: PricingRule = {
      id: this.currentRuleId++,
      storeId: demoStore.id,
      name: "Default 50/30/20 Rule",
      needsPercentage: "50.00",
      wantsPercentage: "30.00",
      savingsPercentage: "20.00",
      maxDiscountPercentage: "25.00",
      isActive: true,
      createdAt: new Date(),
      budgetRefreshType: "monthly",
      maxBudgetApplications: -1,
      budgetRefreshDays: 30,
      repeatCustomerDiscount: "5.00",
      discountTerms: "Budget discounts apply to help you stay within your financial goals. Maximum 25% off per purchase.",
      termsPageUrl: null,
      isAppEnabled: true,
      enabledForProducts: "all",
    };
    this.pricingRules.set(demoPricingRule.id, demoPricingRule);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      createdAt: new Date(),
      shopifyDomain: insertUser.shopifyDomain ?? null,
      tier: insertUser.tier ?? "free",
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateUser };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Store operations
  async getStore(id: number): Promise<Store | undefined> {
    return this.stores.get(id);
  }

  async getStoreByDomain(domain: string): Promise<Store | undefined> {
    return Array.from(this.stores.values()).find(store => store.shopifyDomain === domain);
  }

  async getStoresByUserId(userId: number): Promise<Store[]> {
    return Array.from(this.stores.values()).filter(store => store.userId === userId);
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const store: Store = {
      ...insertStore,
      id: this.currentStoreId++,
      createdAt: new Date(),
      accessToken: insertStore.accessToken ?? null,
      isActive: insertStore.isActive ?? true,
      settings: insertStore.settings ?? {},
      domain: insertStore.domain ?? insertStore.shopifyDomain,
      platform: insertStore.platform ?? "shopify",
      apiKey: insertStore.apiKey ?? null,
      apiSecret: insertStore.apiSecret ?? null,
      webhookSecret: insertStore.webhookSecret ?? null
    };
    this.stores.set(store.id, store);
    return store;
  }

  async updateStore(id: number, updateStore: Partial<InsertStore>): Promise<Store | undefined> {
    const store = this.stores.get(id);
    if (!store) return undefined;
    
    const updatedStore = { ...store, ...updateStore };
    this.stores.set(id, updatedStore);
    return updatedStore;
  }

  // Budget session operations
  async getBudgetSession(sessionId: string): Promise<BudgetSession | undefined> {
    return this.budgetSessions.get(sessionId);
  }

  async createBudgetSession(insertSession: InsertBudgetSession): Promise<BudgetSession> {
    const session: BudgetSession = {
      ...insertSession,
      id: Date.now(), // Simple ID for demo
      createdAt: new Date(),
      storeId: insertSession.storeId ?? null,
      customerData: insertSession.customerData ?? {},
      budgetData: insertSession.budgetData ?? {},
      isOptedIn: insertSession.isOptedIn ?? false,
    };
    this.budgetSessions.set(session.sessionId, session);
    return session;
  }

  async updateBudgetSession(sessionId: string, updateSession: Partial<InsertBudgetSession>): Promise<BudgetSession | undefined> {
    const session = this.budgetSessions.get(sessionId);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updateSession };
    this.budgetSessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  // Pricing rule operations
  async getPricingRulesByStoreId(storeId: number): Promise<PricingRule[]> {
    return Array.from(this.pricingRules.values()).filter(rule => rule.storeId === storeId);
  }

  async getActivePricingRule(storeId: number): Promise<PricingRule | undefined> {
    return Array.from(this.pricingRules.values()).find(
      rule => rule.storeId === storeId && rule.isActive
    );
  }

  async createPricingRule(insertRule: InsertPricingRule): Promise<PricingRule> {
    const rule: PricingRule = {
      ...insertRule,
      id: this.currentRuleId++,
      createdAt: new Date(),
      isActive: insertRule.isActive ?? true,
      needsPercentage: insertRule.needsPercentage ?? "50",
      wantsPercentage: insertRule.wantsPercentage ?? "30",
      savingsPercentage: insertRule.savingsPercentage ?? "20",
      maxDiscountPercentage: insertRule.maxDiscountPercentage ?? "25",
      budgetRefreshType: insertRule.budgetRefreshType ?? "monthly",
      maxBudgetApplications: insertRule.maxBudgetApplications ?? -1,
      budgetRefreshDays: insertRule.budgetRefreshDays ?? 30,
      repeatCustomerDiscount: insertRule.repeatCustomerDiscount ?? "0.00",
      discountTerms: insertRule.discountTerms ?? null,
      termsPageUrl: insertRule.termsPageUrl ?? null,
      isAppEnabled: insertRule.isAppEnabled ?? true,
      enabledForProducts: insertRule.enabledForProducts ?? "all",
    };
    this.pricingRules.set(rule.id, rule);
    return rule;
  }

  async updatePricingRule(id: number, updateRule: Partial<InsertPricingRule>): Promise<PricingRule | undefined> {
    const rule = this.pricingRules.get(id);
    if (!rule) return undefined;
    
    const updatedRule = { ...rule, ...updateRule };
    this.pricingRules.set(id, updatedRule);
    return updatedRule;
  }

  // Analytics operations
  async createAnalyticsEvent(insertEvent: InsertAnalytics): Promise<Analytics> {
    const event: Analytics = {
      ...insertEvent,
      id: this.currentAnalyticsId++,
      timestamp: new Date(),
      eventData: insertEvent.eventData ?? {},
    };
    this.analytics.set(event.id, event);
    return event;
  }

  async getAnalyticsByStoreId(storeId: number, limit: number = 100): Promise<Analytics[]> {
    return Array.from(this.analytics.values())
      .filter(event => event.storeId === storeId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, limit);
  }

  // Customer purchase operations
  async createCustomerPurchase(insertPurchase: InsertCustomerPurchase): Promise<CustomerPurchase> {
    const purchase: CustomerPurchase = {
      ...insertPurchase,
      id: this.currentPurchaseId++,
      purchaseDate: new Date(),
      sessionId: insertPurchase.sessionId ?? null,
      customerEmail: insertPurchase.customerEmail ?? null,
      productHandle: insertPurchase.productHandle ?? null,
      variantId: insertPurchase.variantId ?? null,
      orderId: insertPurchase.orderId ?? null,
      budgetCategory: insertPurchase.budgetCategory ?? null,
      budgetDiscount: insertPurchase.budgetDiscount ?? "0.00",
      budgetApplicationCount: insertPurchase.budgetApplicationCount ?? 1,
    };
    this.customerPurchases.set(purchase.id, purchase);
    return purchase;
  }

  async getCustomerPurchases(storeId: number, customerId: string): Promise<CustomerPurchase[]> {
    return Array.from(this.customerPurchases.values())
      .filter(purchase => purchase.storeId === storeId && purchase.customerId === customerId)
      .sort((a, b) => b.purchaseDate!.getTime() - a.purchaseDate!.getTime());
  }

  async getCustomerPurchasesByProduct(storeId: number, customerId: string, productId: string): Promise<CustomerPurchase[]> {
    return Array.from(this.customerPurchases.values())
      .filter(purchase => 
        purchase.storeId === storeId && 
        purchase.customerId === customerId && 
        purchase.productId === productId
      )
      .sort((a, b) => b.purchaseDate!.getTime() - a.purchaseDate!.getTime());
  }

  // Customer budget history operations
  async createCustomerBudgetHistory(insertHistory: InsertCustomerBudgetHistory): Promise<CustomerBudgetHistory> {
    const history: CustomerBudgetHistory = {
      ...insertHistory,
      id: this.currentBudgetHistoryId++,
      createdAt: new Date(),
      isActive: insertHistory.isActive ?? true,
      customerEmail: insertHistory.customerEmail ?? null,
      monthlyIncome: insertHistory.monthlyIncome ?? null,
      budgetPeriod: insertHistory.budgetPeriod ?? "monthly",
      totalBudgetApplications: insertHistory.totalBudgetApplications ?? 0,
      remainingApplications: insertHistory.remainingApplications ?? -1,
    };
    this.customerBudgetHistory.set(history.id, history);
    return history;
  }

  async getActiveCustomerBudget(storeId: number, customerId: string): Promise<CustomerBudgetHistory | undefined> {
    const now = new Date();
    return Array.from(this.customerBudgetHistory.values())
      .find(history => 
        history.storeId === storeId && 
        history.customerId === customerId &&
        history.isActive &&
        history.budgetStartDate <= now &&
        history.budgetEndDate >= now
      );
  }

  async getCustomerBudgetHistory(storeId: number, customerId: string): Promise<CustomerBudgetHistory[]> {
    return Array.from(this.customerBudgetHistory.values())
      .filter(history => history.storeId === storeId && history.customerId === customerId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }
}

export const storage = new MemStorage();
