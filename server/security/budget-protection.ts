import { Request, Response, NextFunction } from "express";

export interface BudgetProtectionConfig {
  maxMonthlyIncome: number;
  minMonthlyIncome: number;
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  suspiciousPatternThreshold: number;
  enableGeolocation: boolean;
}

export interface RequestTracker {
  ip: string;
  customerId: string;
  requestCount: number;
  lastRequest: number;
  hourlyCount: number;
  hourlyReset: number;
  suspiciousScore: number;
  blockedUntil?: number;
}

export class BudgetAbuseProtection {
  private config: BudgetProtectionConfig;
  private requestTracker: Map<string, RequestTracker> = new Map();
  private ipBlacklist: Set<string> = new Set();
  private customerBlacklist: Set<string> = new Set();

  constructor(config?: Partial<BudgetProtectionConfig>) {
    this.config = {
      maxMonthlyIncome: 1000000, // $1M max to prevent absurd budgets
      minMonthlyIncome: 100, // $100 minimum realistic income
      maxRequestsPerMinute: 30,
      maxRequestsPerHour: 1000,
      suspiciousPatternThreshold: 50,
      enableGeolocation: false,
      ...config
    };
  }

  // Rate limiting middleware
  rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const ip = this.getClientIP(req);
    const customerId = req.body?.customerId || "anonymous";
    const key = `${ip}:${customerId}`;
    
    const now = Date.now();
    const tracker = this.getOrCreateTracker(key, ip, customerId);

    // Check if currently blocked
    if (tracker.blockedUntil && now < tracker.blockedUntil) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((tracker.blockedUntil - now) / 1000)
      });
    }

    // Reset hourly counter if needed
    if (now > tracker.hourlyReset) {
      tracker.hourlyCount = 0;
      tracker.hourlyReset = now + 3600000; // 1 hour
    }

    // Check minute rate limit
    if (now - tracker.lastRequest < 60000) {
      tracker.requestCount++;
      if (tracker.requestCount > this.config.maxRequestsPerMinute) {
        tracker.blockedUntil = now + 300000; // 5 minute block
        this.logSuspiciousActivity(ip, customerId, "Rate limit exceeded");
        return res.status(429).json({
          error: "Too many requests per minute",
          retryAfter: 300
        });
      }
    } else {
      tracker.requestCount = 1;
    }

    // Check hourly rate limit
    tracker.hourlyCount++;
    if (tracker.hourlyCount > this.config.maxRequestsPerHour) {
      tracker.blockedUntil = now + 3600000; // 1 hour block
      this.logSuspiciousActivity(ip, customerId, "Hourly limit exceeded");
      return res.status(429).json({
        error: "Too many requests per hour",
        retryAfter: 3600
      });
    }

    tracker.lastRequest = now;
    next();
  };

  // Budget validation middleware
  budgetValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const { monthlyIncome, customerId } = req.body;

    if (monthlyIncome !== undefined) {
      // Check income bounds
      if (monthlyIncome < this.config.minMonthlyIncome || monthlyIncome > this.config.maxMonthlyIncome) {
        this.logSuspiciousActivity(this.getClientIP(req), customerId, 
          `Invalid income: ${monthlyIncome}`);
        return res.status(400).json({
          error: "Invalid income amount",
          min: this.config.minMonthlyIncome,
          max: this.config.maxMonthlyIncome
        });
      }

      // Check for suspicious patterns
      if (this.detectSuspiciousIncome(monthlyIncome, customerId)) {
        return res.status(400).json({
          error: "Suspicious activity detected"
        });
      }
    }

    next();
  };

  // Pricing validation middleware
  pricingValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const { basePrice, customerBudget, customerId } = req.body;

    // Check for unrealistic values
    if (basePrice && (basePrice < 0 || basePrice > 1000000)) {
      this.logSuspiciousActivity(this.getClientIP(req), customerId, 
        `Invalid price: ${basePrice}`);
      return res.status(400).json({
        error: "Invalid product price"
      });
    }

    if (customerBudget && (customerBudget < 0 || customerBudget > this.config.maxMonthlyIncome)) {
      this.logSuspiciousActivity(this.getClientIP(req), customerId, 
        `Invalid budget: ${customerBudget}`);
      return res.status(400).json({
        error: "Invalid customer budget"
      });
    }

    next();
  };

  // IP blocking middleware
  ipBlockingMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const ip = this.getClientIP(req);
    
    if (this.ipBlacklist.has(ip)) {
      return res.status(403).json({
        error: "Access denied"
      });
    }

    const customerId = req.body?.customerId;
    if (customerId && this.customerBlacklist.has(customerId)) {
      return res.status(403).json({
        error: "Account suspended"
      });
    }

    next();
  };

  private getOrCreateTracker(key: string, ip: string, customerId: string): RequestTracker {
    if (!this.requestTracker.has(key)) {
      this.requestTracker.set(key, {
        ip,
        customerId,
        requestCount: 0,
        lastRequest: 0,
        hourlyCount: 0,
        hourlyReset: Date.now() + 3600000,
        suspiciousScore: 0
      });
    }
    return this.requestTracker.get(key)!;
  }

  private detectSuspiciousIncome(income: number, customerId: string): boolean {
    const key = `income:${customerId}`;
    const tracker = this.requestTracker.get(key);
    
    // Check for rapidly changing income values
    if (tracker && Math.abs(income - (tracker as any).lastIncome) > income * 0.5) {
      tracker.suspiciousScore += 10;
    }

    // Store current income for future comparison
    if (tracker) {
      (tracker as any).lastIncome = income;
    }

    return tracker ? tracker.suspiciousScore > this.config.suspiciousPatternThreshold : false;
  }

  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           req.headers['x-real-ip'] as string ||
           req.connection.remoteAddress ||
           '127.0.0.1';
  }

  private logSuspiciousActivity(ip: string, customerId: string, reason: string): void {
    console.warn(`[SECURITY] Suspicious activity detected:`, {
      ip,
      customerId,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  // Admin methods for managing blocks
  blockIP(ip: string): void {
    this.ipBlacklist.add(ip);
  }

  unblockIP(ip: string): void {
    this.ipBlacklist.delete(ip);
  }

  blockCustomer(customerId: string): void {
    this.customerBlacklist.add(customerId);
  }

  unblockCustomer(customerId: string): void {
    this.customerBlacklist.delete(customerId);
  }

  getStats(): any {
    return {
      activeTrackers: this.requestTracker.size,
      blockedIPs: this.ipBlacklist.size,
      blockedCustomers: this.customerBlacklist.size,
      config: this.config
    };
  }
}

export const budgetProtection = new BudgetAbuseProtection();