import { Request, Response, NextFunction } from "express";

export interface ErrorLog {
  id: string;
  timestamp: number;
  level: "error" | "warn" | "info";
  message: string;
  stack?: string;
  ip: string;
  userAgent?: string;
  customerId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  context?: any;
}

export interface SecurityIncident {
  id: string;
  type: "rate_limit" | "validation_failure" | "suspicious_behavior" | "unauthorized_access";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: number;
  ip: string;
  customerId?: string;
  details: any;
  resolved: boolean;
}

export class ErrorFortress {
  private errorLogs: Map<string, ErrorLog> = new Map();
  private securityIncidents: Map<string, SecurityIncident> = new Map();
  private alertThresholds = {
    errorRate: 10, // errors per minute
    securityIncidents: 5, // incidents per hour
    suspiciousIPs: 3 // unique IPs with issues per hour
  };

  // Global error handler middleware
  globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const errorId = this.generateId();
    const ip = this.getClientIP(req);
    
    const errorLog: ErrorLog = {
      id: errorId,
      timestamp: Date.now(),
      level: "error",
      message: err.message || "Unknown error",
      stack: err.stack,
      ip,
      userAgent: req.headers['user-agent'],
      customerId: req.body?.customerId,
      endpoint: req.path,
      method: req.method,
      statusCode: err.statusCode || 500,
      context: {
        body: this.sanitizeBody(req.body),
        query: req.query,
        params: req.params
      }
    };

    this.logError(errorLog);
    this.checkAlertThresholds();

    // Don't expose sensitive error details in production
    const isDev = process.env.NODE_ENV === "development";
    
    if (err.statusCode && err.statusCode < 500) {
      // Client errors (4xx)
      res.status(err.statusCode).json({
        error: err.message,
        errorId: isDev ? errorId : undefined,
        timestamp: Date.now()
      });
    } else {
      // Server errors (5xx)
      console.error(`[ERROR FORTRESS] ${errorId}:`, err);
      res.status(500).json({
        error: "Internal server error",
        errorId: isDev ? errorId : undefined,
        timestamp: Date.now()
      });
    }
  };

  // Input validation error handler
  validationErrorHandler = (req: Request, res: Response, validationErrors: any[]) => {
    const errorId = this.generateId();
    const ip = this.getClientIP(req);

    const errorLog: ErrorLog = {
      id: errorId,
      timestamp: Date.now(),
      level: "warn",
      message: "Validation failed",
      ip,
      userAgent: req.headers['user-agent'],
      customerId: req.body?.customerId,
      endpoint: req.path,
      method: req.method,
      statusCode: 400,
      context: {
        validationErrors,
        body: this.sanitizeBody(req.body)
      }
    };

    this.logError(errorLog);
    
    // Track suspicious validation patterns
    this.trackSuspiciousBehavior(ip, req.body?.customerId, "repeated_validation_failures");

    res.status(400).json({
      error: "Validation failed",
      errors: validationErrors.map(err => ({
        field: err.path?.join('.'),
        message: err.message,
        code: err.code
      })),
      errorId,
      timestamp: Date.now()
    });
  };

  // Budget calculation error fortress
  budgetCalculationProtection = (req: Request, res: Response, next: NextFunction) => {
    try {
      const { monthlyIncome, category } = req.body;
      
      // Validation fortress
      const validationErrors = [];
      
      if (!monthlyIncome || typeof monthlyIncome !== 'number') {
        validationErrors.push({
          path: ['monthlyIncome'],
          message: 'Monthly income is required and must be a number',
          code: 'INVALID_INCOME'
        });
      }

      if (monthlyIncome && (monthlyIncome < 0 || monthlyIncome > 10000000)) {
        validationErrors.push({
          path: ['monthlyIncome'],
          message: 'Monthly income must be between $0 and $10,000,000',
          code: 'INCOME_OUT_OF_RANGE'
        });
      }

      if (category && !['needs', 'wants', 'savings'].includes(category)) {
        validationErrors.push({
          path: ['category'],
          message: 'Category must be needs, wants, or savings',
          code: 'INVALID_CATEGORY'
        });
      }

      if (validationErrors.length > 0) {
        return this.validationErrorHandler(req, res, validationErrors);
      }

      next();
    } catch (error) {
      next(error);
    }
  };

  // Pricing calculation error fortress
  pricingCalculationProtection = (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId, basePrice, customerBudget, category, shopifyDiscounts } = req.body;
      
      const validationErrors = [];
      
      if (!productId || typeof productId !== 'string') {
        validationErrors.push({
          path: ['productId'],
          message: 'Product ID is required and must be a string',
          code: 'INVALID_PRODUCT_ID'
        });
      }

      if (!basePrice || typeof basePrice !== 'number' || basePrice < 0) {
        validationErrors.push({
          path: ['basePrice'],
          message: 'Base price is required and must be a positive number',
          code: 'INVALID_BASE_PRICE'
        });
      }

      if (basePrice && basePrice > 1000000) {
        validationErrors.push({
          path: ['basePrice'],
          message: 'Base price cannot exceed $1,000,000',
          code: 'PRICE_TOO_HIGH'
        });
      }

      if (!customerBudget || typeof customerBudget !== 'number' || customerBudget < 0) {
        validationErrors.push({
          path: ['customerBudget'],
          message: 'Customer budget is required and must be a positive number',
          code: 'INVALID_CUSTOMER_BUDGET'
        });
      }

      if (shopifyDiscounts && (typeof shopifyDiscounts !== 'number' || shopifyDiscounts < 0)) {
        validationErrors.push({
          path: ['shopifyDiscounts'],
          message: 'Shopify discounts must be a positive number',
          code: 'INVALID_DISCOUNTS'
        });
      }

      if (category && !['needs', 'wants', 'savings'].includes(category)) {
        validationErrors.push({
          path: ['category'],
          message: 'Category must be needs, wants, or savings',
          code: 'INVALID_CATEGORY'
        });
      }

      if (validationErrors.length > 0) {
        return this.validationErrorHandler(req, res, validationErrors);
      }

      next();
    } catch (error) {
      next(error);
    }
  };

  // Security incident tracking
  trackSuspiciousBehavior(ip: string, customerId: string | undefined, type: string): void {
    const incidentId = this.generateId();
    const incident: SecurityIncident = {
      id: incidentId,
      type: "suspicious_behavior",
      severity: "medium",
      timestamp: Date.now(),
      ip,
      customerId,
      details: { type },
      resolved: false
    };

    this.securityIncidents.set(incidentId, incident);
    console.warn(`[SECURITY INCIDENT] ${incidentId}: ${type} from ${ip}`);
  }

  // Request logging middleware
  requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logLevel = res.statusCode >= 400 ? "warn" : "info";
      
      if (logLevel === "warn" || duration > 5000) { // Log slow requests
        const logId = this.generateId();
        const errorLog: ErrorLog = {
          id: logId,
          timestamp: Date.now(),
          level: logLevel,
          message: `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
          ip: this.getClientIP(req),
          userAgent: req.headers['user-agent'],
          customerId: req.body?.customerId,
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          context: { duration }
        };

        this.logError(errorLog);
      }
    });

    next();
  };

  // Sanitize sensitive data from request bodies
  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  private logError(errorLog: ErrorLog): void {
    this.errorLogs.set(errorLog.id, errorLog);
    
    // Keep only last 1000 error logs
    if (this.errorLogs.size > 1000) {
      const oldestKey = this.errorLogs.keys().next().value;
      if (oldestKey) this.errorLogs.delete(oldestKey);
    }
  }

  private checkAlertThresholds(): void {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const oneMinuteAgo = now - 60000;

    // Check error rate
    const recentErrors = Array.from(this.errorLogs.values())
      .filter(log => log.timestamp > oneMinuteAgo && log.level === "error");
    
    if (recentErrors.length > this.alertThresholds.errorRate) {
      console.error(`[ALERT] High error rate detected: ${recentErrors.length} errors in last minute`);
    }

    // Check security incidents
    const recentIncidents = Array.from(this.securityIncidents.values())
      .filter(incident => incident.timestamp > oneHourAgo);
    
    if (recentIncidents.length > this.alertThresholds.securityIncidents) {
      console.error(`[ALERT] High security incident rate: ${recentIncidents.length} incidents in last hour`);
    }
  }

  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           req.headers['x-real-ip'] as string ||
           req.connection.remoteAddress ||
           '127.0.0.1';
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Admin endpoints for monitoring
  getErrorStats(): any {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const oneDayAgo = now - 86400000;

    const errors = Array.from(this.errorLogs.values());
    const incidents = Array.from(this.securityIncidents.values());

    return {
      totalErrors: errors.length,
      errorsLastHour: errors.filter(e => e.timestamp > oneHourAgo).length,
      errorsLastDay: errors.filter(e => e.timestamp > oneDayAgo).length,
      totalIncidents: incidents.length,
      incidentsLastHour: incidents.filter(i => i.timestamp > oneHourAgo).length,
      unresolvedIncidents: incidents.filter(i => !i.resolved).length,
      topErrorEndpoints: this.getTopErrorEndpoints(),
      topErrorIPs: this.getTopErrorIPs()
    };
  }

  private getTopErrorEndpoints(): any[] {
    const endpointCounts = new Map<string, number>();
    
    Array.from(this.errorLogs.values()).forEach(error => {
      const count = endpointCounts.get(error.endpoint) || 0;
      endpointCounts.set(error.endpoint, count + 1);
    });

    return Array.from(endpointCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  private getTopErrorIPs(): any[] {
    const ipCounts = new Map<string, number>();
    
    Array.from(this.errorLogs.values()).forEach(error => {
      const count = ipCounts.get(error.ip) || 0;
      ipCounts.set(error.ip, count + 1);
    });

    return Array.from(ipCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
  }
}

export const errorFortress = new ErrorFortress();