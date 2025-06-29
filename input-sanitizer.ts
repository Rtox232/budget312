/**
 * Input Sanitization Utilities
 * Provides comprehensive protection against XSS, injection attacks, and malicious input
 */

import { z } from 'zod';

// HTML entities for escaping
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
} as const;

// SQL injection patterns to detect
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /(--|#|\/\*|\*\/)/g,
  /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
  /('|\"|;|%|_)/g
];

// XSS patterns to detect
const XSS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
  /<object[^>]*>[\s\S]*?<\/object>/gi,
  /<embed[^>]*>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /on\w+\s*=/gi, // event handlers like onclick, onload, etc.
  /<svg[^>]*>[\s\S]*?<\/svg>/gi
];

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\./g,
  /\.\//g,
  /\\\.\./g,
  /\\\.\\/g,
  /%2e%2e/gi,
  /%2f/gi,
  /%5c/gi
];

export interface SanitizationOptions {
  allowHtml?: boolean;
  maxLength?: number;
  allowNumeric?: boolean;
  allowSpecialChars?: boolean;
  customPattern?: RegExp;
  strict?: boolean;
}

export class InputSanitizer {
  
  /**
   * Escape HTML entities to prevent XSS
   */
  static escapeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input.replace(/[&<>"'`=\/]/g, (match) => {
      return HTML_ENTITIES[match as keyof typeof HTML_ENTITIES] || match;
    });
  }

  /**
   * Remove all HTML tags from input
   */
  static stripHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[a-zA-Z0-9#]+;/g, '') // Remove HTML entities
      .trim();
  }

  /**
   * Detect potential SQL injection attempts
   */
  static detectSqlInjection(input: string): boolean {
    if (typeof input !== 'string') return false;
    
    return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Detect potential XSS attempts
   */
  static detectXss(input: string): boolean {
    if (typeof input !== 'string') return false;
    
    return XSS_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Detect path traversal attempts
   */
  static detectPathTraversal(input: string): boolean {
    if (typeof input !== 'string') return false;
    
    return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize general text input
   */
  static sanitizeText(
    input: string, 
    options: SanitizationOptions = {}
  ): string {
    if (typeof input !== 'string') return '';

    const {
      allowHtml = false,
      maxLength = 1000,
      allowNumeric = true,
      allowSpecialChars = false,
      customPattern,
      strict = false
    } = options;

    let sanitized = input.trim();

    // Apply length limit
    if (maxLength > 0) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // Handle HTML
    if (!allowHtml) {
      if (this.detectXss(sanitized)) {
        throw new Error('Potential XSS attack detected');
      }
      sanitized = this.stripHtml(sanitized);
    } else {
      sanitized = this.escapeHtml(sanitized);
    }

    // Check for SQL injection
    if (this.detectSqlInjection(sanitized)) {
      throw new Error('Potential SQL injection detected');
    }

    // Check for path traversal
    if (this.detectPathTraversal(sanitized)) {
      throw new Error('Potential path traversal detected');
    }

    // Apply character restrictions
    if (strict) {
      // Only allow alphanumeric and basic punctuation
      const allowedPattern = allowNumeric 
        ? /[^a-zA-Z0-9\s\-_.,!?]/g
        : /[^a-zA-Z\s\-_.,!?]/g;
      sanitized = sanitized.replace(allowedPattern, '');
    } else if (!allowSpecialChars) {
      // Remove potentially dangerous special characters
      sanitized = sanitized.replace(/[<>{}[\]\\|`~]/g, '');
    }

    // Apply custom pattern if provided
    if (customPattern) {
      sanitized = sanitized.replace(customPattern, '');
    }

    return sanitized;
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumeric(input: string | number): number | null {
    if (typeof input === 'number') {
      return isFinite(input) ? input : null;
    }

    if (typeof input !== 'string') return null;

    // Remove non-numeric characters except decimal point and negative sign
    const cleaned = input.replace(/[^0-9.-]/g, '');
    
    if (cleaned === '' || cleaned === '.' || cleaned === '-') return null;

    const parsed = parseFloat(cleaned);
    return isFinite(parsed) ? parsed : null;
  }

  /**
   * Sanitize email input
   */
  static sanitizeEmail(input: string): string {
    if (typeof input !== 'string') return '';

    const sanitized = this.sanitizeText(input, {
      allowHtml: false,
      maxLength: 254,
      strict: false
    });

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }

    return sanitized.toLowerCase();
  }

  /**
   * Sanitize URL input
   */
  static sanitizeUrl(input: string): string {
    if (typeof input !== 'string') return '';

    let sanitized = input.trim();

    // Check for dangerous protocols
    const dangerousProtocols = /^(javascript|vbscript|data|file|ftp):/i;
    if (dangerousProtocols.test(sanitized)) {
      throw new Error('Dangerous URL protocol detected');
    }

    // Ensure HTTPS for external URLs
    if (sanitized.startsWith('http://')) {
      sanitized = sanitized.replace('http://', 'https://');
    } else if (!sanitized.startsWith('https://') && !sanitized.startsWith('/')) {
      sanitized = 'https://' + sanitized;
    }

    return sanitized;
  }

  /**
   * Sanitize product data
   */
  static sanitizeProductData(data: any): any {
    if (!data || typeof data !== 'object') return {};

    const sanitized: any = {};

    // Sanitize string fields
    ['id', 'name', 'description', 'category', 'vendor'].forEach(field => {
      if (data[field] !== undefined) {
        sanitized[field] = this.sanitizeText(data[field], {
          allowHtml: false,
          maxLength: field === 'description' ? 2000 : 255
        });
      }
    });

    // Sanitize numeric fields
    ['price', 'comparePrice', 'weight', 'quantity'].forEach(field => {
      if (data[field] !== undefined) {
        const num = this.sanitizeNumeric(data[field]);
        if (num !== null && num >= 0) {
          sanitized[field] = num;
        }
      }
    });

    // Sanitize URL fields
    ['url', 'image', 'thumbnail'].forEach(field => {
      if (data[field] !== undefined) {
        try {
          sanitized[field] = this.sanitizeUrl(data[field]);
        } catch (error) {
          // Skip invalid URLs
        }
      }
    });

    return sanitized;
  }

  /**
   * Sanitize budget data
   */
  static sanitizeBudgetData(data: any): any {
    if (!data || typeof data !== 'object') return {};

    const sanitized: any = {};

    // Sanitize numeric fields with budget-specific validation
    const numericFields = ['monthlyIncome', 'needsAmount', 'wantsAmount', 'savingsAmount'];
    numericFields.forEach(field => {
      if (data[field] !== undefined) {
        const num = this.sanitizeNumeric(data[field]);
        if (num !== null && num >= 0 && num <= 1000000) { // Max $1M monthly income
          sanitized[field] = num;
        }
      }
    });

    // Sanitize category
    if (data.category !== undefined) {
      const validCategories = ['needs', 'wants', 'savings'];
      if (validCategories.includes(data.category)) {
        sanitized.category = data.category;
      }
    }

    // Sanitize customer ID
    if (data.customerId !== undefined) {
      sanitized.customerId = this.sanitizeText(data.customerId, {
        allowHtml: false,
        maxLength: 100,
        strict: true
      });
    }

    return sanitized;
  }

  /**
   * Create a Zod schema with sanitization
   */
  static createSanitizedSchema<T>(schema: z.ZodSchema<T>, sanitizer: (data: any) => any): z.ZodSchema<T> {
    return schema.transform((data) => {
      try {
        return sanitizer(data);
      } catch (error) {
        throw new z.ZodError([{
          code: z.ZodIssueCode.custom,
          message: error instanceof Error ? error.message : 'Sanitization failed',
          path: []
        }]);
      }
    });
  }
}

// Pre-configured sanitized schemas
export const sanitizedBudgetDataSchema = InputSanitizer.createSanitizedSchema(
  z.object({
    monthlyIncome: z.number().min(0).max(1000000),
    category: z.enum(['needs', 'wants', 'savings']).optional(),
    customerId: z.string().optional(),
    storeId: z.number().optional()
  }),
  InputSanitizer.sanitizeBudgetData
);

export const sanitizedProductSchema = InputSanitizer.createSanitizedSchema(
  z.object({
    id: z.string(),
    name: z.string(),
    price: z.number().min(0),
    description: z.string().optional(),
    category: z.string().optional(),
    url: z.string().optional(),
    image: z.string().optional()
  }),
  InputSanitizer.sanitizeProductData
);

export const sanitizedTextSchema = (maxLength = 1000) => 
  z.string().transform((val) => 
    InputSanitizer.sanitizeText(val, { maxLength, allowHtml: false })
  );

export const sanitizedEmailSchema = z.string().transform(InputSanitizer.sanitizeEmail);
export const sanitizedUrlSchema = z.string().transform(InputSanitizer.sanitizeUrl);