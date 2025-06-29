// Re-export everything from schema for convenience
export * from './schema.js';

// Re-export input sanitization utilities
export * from './input-sanitizer.js';

// Additional shared utilities can be added here in the future
export const BUDGET_CATEGORIES = ['needs', 'wants', 'savings'] as const;

export const DEFAULT_BUDGET_PERCENTAGES = {
  needs: 50,
  wants: 30,
  savings: 20
} as const;

export const SUPPORTED_PLATFORMS = ['shopify', 'magento', 'woocommerce'] as const;

export type BudgetCategory = typeof BUDGET_CATEGORIES[number];
export type SupportedPlatform = typeof SUPPORTED_PLATFORMS[number];