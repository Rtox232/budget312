/**
 * Content Security Policy (CSP) Middleware
 * Provides comprehensive protection against XSS and injection attacks
 */

import type { Request, Response, NextFunction } from 'express';

export interface CSPOptions {
  enableReporting?: boolean;
  reportUri?: string;
  enforceHttps?: boolean;
  allowInlineStyles?: boolean;
  allowInlineScripts?: boolean;
  allowEval?: boolean;
  nonce?: string;
}

export class CSPMiddleware {
  private options: CSPOptions;

  constructor(options: CSPOptions = {}) {
    this.options = {
      enableReporting: true,
      reportUri: '/api/security/csp-report',
      enforceHttps: true,
      allowInlineStyles: false,
      allowInlineScripts: false,
      allowEval: false,
      ...options
    };
  }

  /**
   * Generate a random nonce for inline scripts/styles
   */
  private generateNonce(): string {
    return Buffer.from(
      Array.from({ length: 16 }, () => Math.floor(Math.random() * 256))
    ).toString('base64');
  }

  /**
   * Build CSP directive string
   */
  private buildCSP(nonce?: string): string {
    const directives: string[] = [];

    // Default source - only allow same origin
    directives.push("default-src 'self'");

    // Script sources
    const scriptSources = ["'self'"];
    if (this.options.allowInlineScripts) {
      scriptSources.push("'unsafe-inline'");
    }
    if (this.options.allowEval) {
      scriptSources.push("'unsafe-eval'");
    }
    if (nonce) {
      scriptSources.push(`'nonce-${nonce}'`);
    }
    
    // Allow CDN and external script sources for BudgetPrice
    scriptSources.push(
      'https://cdn.budgetprice.app',
      'https://budgetprice.replit.app',
      'https://*.shopify.com',
      'https://js.stripe.com',
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com'
    );

    // Add development-specific sources
    if (process.env.NODE_ENV === 'development') {
      scriptSources.push(
        'http://localhost:*',
        'https://localhost:*',
        'ws://localhost:*',
        'wss://localhost:*',
        'https://*.replit.dev',
        'wss://*.replit.dev'
      );
    }
    
    directives.push(`script-src ${scriptSources.join(' ')}`);

    // Style sources
    const styleSources = ["'self'"];
    if (this.options.allowInlineStyles) {
      styleSources.push("'unsafe-inline'");
    }
    if (nonce) {
      styleSources.push(`'nonce-${nonce}'`);
    }
    
    // Allow style sources for BudgetPrice integration
    styleSources.push(
      'https://cdn.budgetprice.app',
      'https://fonts.googleapis.com',
      'https://cdnjs.cloudflare.com'
    );
    
    directives.push(`style-src ${styleSources.join(' ')}`);

    // Image sources
    directives.push(`img-src 'self' data: https: blob:`);

    // Font sources
    directives.push(`font-src 'self' https://fonts.gstatic.com https://cdn.budgetprice.app`);

    // Connect sources for API calls
    const connectSources = ["'self'", "https://api.budgetprice.app", "https://*.shopify.com", "https://api.stripe.com"];
    
    // Add development-specific connect sources
    if (process.env.NODE_ENV === 'development') {
      connectSources.push(
        'ws://localhost:*',
        'wss://localhost:*',
        'http://localhost:*',
        'https://localhost:*',
        'https://*.replit.dev',
        'wss://*.replit.dev'
      );
    }
    
    directives.push(`connect-src ${connectSources.join(' ')}`);

    // Frame sources - only allow trusted sources
    directives.push(`frame-src 'self' https://js.stripe.com https://hooks.stripe.com`);

    // Media sources
    directives.push(`media-src 'self'`);

    // Object sources - block all for security
    directives.push(`object-src 'none'`);

    // Base URI restriction
    directives.push(`base-uri 'self'`);

    // Form action restriction
    directives.push(`form-action 'self'`);

    // Frame ancestors - prevent clickjacking
    directives.push(`frame-ancestors 'none'`);

    // Block mixed content in HTTPS
    if (this.options.enforceHttps) {
      directives.push('upgrade-insecure-requests');
    }

    // Add reporting if enabled
    if (this.options.enableReporting && this.options.reportUri) {
      directives.push(`report-uri ${this.options.reportUri}`);
    }

    return directives.join('; ');
  }

  /**
   * Main CSP middleware function
   */
  middleware = (req: Request, res: Response, next: NextFunction): void => {
    // Generate nonce for this request
    const nonce = this.generateNonce();
    
    // Store nonce in response locals for template use
    res.locals.nonce = nonce;

    // Build and set CSP header
    const cspValue = this.buildCSP(nonce);
    res.setHeader('Content-Security-Policy', cspValue);

    // Set additional security headers
    this.setSecurityHeaders(res);

    next();
  };

  /**
   * Set additional security headers
   */
  private setSecurityHeaders(res: Response): void {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS filter in browsers
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Enforce HTTPS
    if (this.options.enforceHttps) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Control referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  }

  /**
   * CSP violation reporting endpoint
   */
  reportingEndpoint = (req: Request, res: Response): void => {
    try {
      const report = req.body;
      
      if (report && report['csp-report']) {
        const violation = report['csp-report'];
        
        console.warn('CSP Violation Report:', {
          documentUri: violation['document-uri'],
          violatedDirective: violation['violated-directive'],
          blockedUri: violation['blocked-uri'],
          sourceFile: violation['source-file'],
          lineNumber: violation['line-number'],
          timestamp: new Date().toISOString()
        });

        // In production, you might want to send this to a logging service
        // or security monitoring system
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error processing CSP report:', error);
      res.status(400).json({ error: 'Invalid CSP report' });
    }
  };
}

// Default CSP configuration for BudgetPrice
export const defaultCSPMiddleware = new CSPMiddleware({
  enableReporting: process.env.NODE_ENV === 'production',
  reportUri: '/api/security/csp-report',
  enforceHttps: process.env.NODE_ENV === 'production',
  allowInlineStyles: false,
  allowInlineScripts: false,
  allowEval: false
});

// Development CSP configuration (more permissive)
export const developmentCSPMiddleware = new CSPMiddleware({
  enableReporting: false,
  enforceHttps: false,
  allowInlineStyles: true,
  allowInlineScripts: true, // Allow inline scripts for Vite development
  allowEval: true // Needed for Vite HMR
});

// Get appropriate CSP middleware based on environment
export const getCSPMiddleware = () => {
  return process.env.NODE_ENV === 'development' 
    ? developmentCSPMiddleware 
    : defaultCSPMiddleware;
};