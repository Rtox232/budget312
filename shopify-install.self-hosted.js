/*! BudgetPrice Shopify Integration v1.0.0 | 2025-06-27T20:59:58.299Z */
/**
 * BudgetPrice - Shopify Installation Script
 * Version: 1.0.0
 * 
 * This script automatically integrates BudgetPrice into Shopify stores
 * with zero configuration required. Simply paste this script into your
 * theme's footer or use the theme customizer.
 */

(function() {
  'use strict';

  // Configuration
  const BUDGETPRICE_CONFIG = {
    apiUrl: 'https://your-domain.com',
    version: '1.0.0',
    debug: false,
    autoDetect: true,
    position: 'product-form', // Where to inject the widget
    trigger: 'auto', // 'auto', 'click', or 'scroll'
    theme: 'auto', // 'auto', 'light', or 'dark'
    animations: true,
    accessibility: true
  };

  // Shopify store detection and configuration
  let STORE_CONFIG = {
    domain: window.Shopify?.shop || window.location.hostname,
    currency: window.Shopify?.currency?.active || 'USD',
    locale: window.Shopify?.locale || 'en',
    customerId: window.Shopify?.customer?.id || null,
    productId: null,
    productHandle: null,
    productPrice: null,
    productVariant: null
  };

  // Theme colors extracted from Shopify
  let THEME_COLORS = {
    primary: '#00A88F',
    secondary: '#6B7280',
    accent: '#F59E0B',
    background: '#FFFFFF',
    text: '#1F2937',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B'
  };

  // Global state
  let budgetPriceWidget = null;
  let isInitialized = false;
  let sessionData = null;

  /**
   * Utility Functions
   */
  function log(message, data = null) {
    if (BUDGETPRICE_CONFIG.debug) {
      console.log(`[BudgetPrice] ${message}`, data || '');
    }
  }

  function error(message, err = null) {
    console.error(`[BudgetPrice] ${message}`, err || '');
  }

  // Detect if we're on a product page
  function isProductPage() {
    return window.location.pathname.includes('/products/') || 
           document.querySelector('[data-product-id]') ||
           document.querySelector('.product-form') ||
           window.meta?.product?.id;
  }

  // Extract product information from Shopify
  function extractProductInfo() {
    try {
      // Try multiple methods to get product data
      let productData = null;

      // Method 1: Check for meta.product (most themes)
      if (window.meta && window.meta.product) {
        productData = window.meta.product;
      }
      
      // Method 2: Check for ShopifyAnalytics
      else if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta.product) {
        productData = window.ShopifyAnalytics.meta.product;
      }
      
      // Method 3: Look for product JSON in script tags
      else {
        const productScript = document.querySelector('script[type="application/json"][data-product-json]');
        if (productScript) {
          productData = JSON.parse(productScript.textContent);
        }
      }

      // Method 4: Extract from form data
      if (!productData) {
        const productForm = document.querySelector('form[action*="/cart/add"]');
        if (productForm) {
          const productIdInput = productForm.querySelector('input[name="id"]');
          if (productIdInput) {
            productData = {
              id: productIdInput.value,
              handle: window.location.pathname.split('/').pop(),
              price: extractPriceFromPage()
            };
          }
        }
      }

      if (productData) {
        STORE_CONFIG.productId = productData.id;
        STORE_CONFIG.productHandle = productData.handle || window.location.pathname.split('/').pop();
        STORE_CONFIG.productPrice = productData.price || extractPriceFromPage();
        
        log('Product info extracted', STORE_CONFIG);
        return true;
      }

      log('No product data found');
      return false;
    } catch (err) {
      error('Failed to extract product info', err);
      return false;
    }
  }

  // Extract price from page elements
  function extractPriceFromPage() {
    const priceSelectors = [
      '.price .money',
      '.product-price .money',
      '[data-price]',
      '.price-current',
      '.product__price .money',
      '.h2.price'
    ];

    for (const selector of priceSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const priceText = element.textContent || element.getAttribute('data-price');
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        if (!isNaN(price)) {
          log(`Price extracted: ${price} from ${selector}`);
          return price * 100; // Convert to cents
        }
      }
    }

    log('No price found on page');
    return null;
  }

  // Sanitize color values to prevent XSS
  function sanitizeColor(color) {
    if (!color || typeof color !== 'string') {
      return null;
    }
    
    // Remove any potential script injection attempts
    const sanitized = color.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').replace(/[;"{}]/g, '');
    
    // Validate color format (hex, rgb, rgba, hsl, hsla, or named colors)
    const colorRegex = /^(#[0-9a-fA-F]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)|hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)|[a-zA-Z]+)$/;
    
    return colorRegex.test(sanitized.trim()) ? sanitized.trim() : null;
  }

  // Extract theme colors from CSS
  function extractThemeColors() {
    try {
      const rootStyles = getComputedStyle(document.documentElement);
      
      // Common CSS variable names used by Shopify themes
      const colorMappings = {
        primary: ['--color-primary', '--primary-color', '--accent-color', '--color-accent'],
        background: ['--color-background', '--background-color', '--color-body'],
        text: ['--color-text', '--text-color', '--color-foreground'],
        secondary: ['--color-secondary', '--secondary-color']
      };

      for (const [key, variables] of Object.entries(colorMappings)) {
        for (const variable of variables) {
          const value = rootStyles.getPropertyValue(variable).trim();
          const sanitized = sanitizeColor(value);
          if (sanitized) {
            THEME_COLORS[key] = sanitized;
            break;
          }
        }
      }

      // Fallback: extract colors from existing elements
      if (THEME_COLORS.primary === '#00A88F') {
        const brandElements = document.querySelectorAll('.btn-primary, .button--primary, .shopify-payment-button');
        if (brandElements.length > 0) {
          const bgColor = getComputedStyle(brandElements[0]).backgroundColor;
          const sanitized = sanitizeColor(bgColor);
          if (sanitized && sanitized !== 'rgba(0, 0, 0, 0)') {
            THEME_COLORS.primary = sanitized;
          }
        }
      }

      log('Theme colors extracted', THEME_COLORS);
    } catch (err) {
      error('Failed to extract theme colors', err);
    }
  }

  // Create and inject the BudgetPrice widget
  function createWidget() {
    if (budgetPriceWidget) {
      return budgetPriceWidget;
    }

    // Create container
    const container = document.createElement('div');
    container.id = 'budgetprice-widget';
    container.className = 'budgetprice-container';
    
    // Apply theme-aware styling
    container.innerHTML = `
      <div class="budgetprice-widget" style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
        background: ${THEME_COLORS.background};
        color: ${THEME_COLORS.text};
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      ">
        <div class="budgetprice-header" style="
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        ">
          <div class="budgetprice-icon" style="
            width: 24px;
            height: 24px;
            background: ${THEME_COLORS.primary};
            border-radius: 4px;
            margin-right: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Budget-Friendly Pricing</h3>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">Check if this fits your budget</p>
          </div>
        </div>
        
        <div class="budgetprice-content">
          <button class="budgetprice-trigger" style="
            background: ${THEME_COLORS.primary};
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            width: 100%;
            transition: all 0.2s ease;
          " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
            Calculate My Budget Price
          </button>
        </div>
        
        <div class="budgetprice-modal" style="display: none;"></div>
      </div>
    `;

    // Add click handler
    const trigger = container.querySelector('.budgetprice-trigger');
    trigger.addEventListener('click', openBudgetCalculator);

    budgetPriceWidget = container;
    return container;
  }

  // Find the best insertion point for the widget
  function findInsertionPoint() {
    const selectors = [
      '.product-form',
      '.product-form-container',
      '.product__form',
      '.shopify-product-form',
      'form[action*="/cart/add"]',
      '.product-single__meta',
      '.product__info',
      '.product-details',
      '.product-information'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        log(`Found insertion point: ${selector}`);
        return element;
      }
    }

    // Fallback: try to find product price element
    const priceElement = document.querySelector('.price, .product-price, .product__price');
    if (priceElement) {
      log('Using price element as insertion point');
      return priceElement.parentElement;
    }

    log('No suitable insertion point found');
    return null;
  }

  // Insert widget into the page
  function insertWidget() {
    const widget = createWidget();
    const insertionPoint = findInsertionPoint();

    if (insertionPoint) {
      insertionPoint.appendChild(widget);
      log('Widget inserted successfully');
      return true;
    } else {
      error('Could not find suitable insertion point for widget');
      return false;
    }
  }

  // Open the budget calculator modal
  function openBudgetCalculator() {
    log('Opening budget calculator');

    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'budgetprice-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
    `;

    modalContent.innerHTML = `
      <div class="budgetprice-modal-header" style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e5e7eb;
      ">
        <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: ${THEME_COLORS.text};">
          Budget Calculator
        </h2>
        <button class="budgetprice-close" style="
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
        ">&times;</button>
      </div>
      
      <div class="budgetprice-calculator">
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: ${THEME_COLORS.text};">
            Monthly Income ($)
          </label>
          <input type="number" id="monthly-income" placeholder="e.g., 3500" style="
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 16px;
          ">
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 12px; color: ${THEME_COLORS.text};">Budget Breakdown (50/30/20 Rule)</h3>
          <div class="budget-breakdown" style="
            background: #f9fafb;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 16px;
          ">
            <div class="budget-category" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #059669;">Needs (50%)</span>
              <span id="needs-amount" style="font-weight: 600;">$0</span>
            </div>
            <div class="budget-category" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #0891b2;">Wants (30%)</span>
              <span id="wants-amount" style="font-weight: 600;">$0</span>
            </div>
            <div class="budget-category" style="display: flex; justify-content: space-between;">
              <span style="color: #7c3aed;">Savings (20%)</span>
              <span id="savings-amount" style="font-weight: 600;">$0</span>
            </div>
          </div>
        </div>
        
        <div class="product-analysis" style="
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
          display: none;
        ">
          <h4 style="margin-bottom: 12px; color: ${THEME_COLORS.text};">Product Analysis</h4>
          <div class="analysis-content"></div>
        </div>
        
        <button id="calculate-budget" style="
          background: ${THEME_COLORS.primary};
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          width: 100%;
        ">
          Analyze This Product
        </button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add event listeners
    const closeBtn = modal.querySelector('.budgetprice-close');
    const incomeInput = modal.querySelector('#monthly-income');
    const calculateBtn = modal.querySelector('#calculate-budget');

    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    incomeInput.addEventListener('input', updateBudgetBreakdown);
    calculateBtn.addEventListener('click', analyzeProduct);

    // Focus on income input
    incomeInput.focus();
  }

  // Update budget breakdown when income changes
  function updateBudgetBreakdown() {
    const income = parseFloat(document.querySelector('#monthly-income').value) || 0;
    
    const needs = income * 0.5;
    const wants = income * 0.3;
    const savings = income * 0.2;

    document.querySelector('#needs-amount').textContent = `$${needs.toFixed(0)}`;
    document.querySelector('#wants-amount').textContent = `$${wants.toFixed(0)}`;
    document.querySelector('#savings-amount').textContent = `$${savings.toFixed(0)}`;
  }

  // Analyze product against budget
  function analyzeProduct() {
    const income = parseFloat(document.querySelector('#monthly-income').value);
    
    if (!income || income < 100) {
      alert('Please enter a valid monthly income (minimum $100)');
      return;
    }

    const productPrice = STORE_CONFIG.productPrice / 100; // Convert from cents
    const wants = income * 0.3;
    
    const analysisContent = document.querySelector('.analysis-content');
    const analysisContainer = document.querySelector('.product-analysis');
    
    let recommendation = '';
    let status = '';
    let statusColor = '';

    if (productPrice <= wants * 0.1) {
      status = 'Great Choice!';
      statusColor = '#059669';
      recommendation = `This product costs only ${((productPrice / wants) * 100).toFixed(1)}% of your monthly "wants" budget. It's well within your means and won't impact your financial goals.`;
    } else if (productPrice <= wants * 0.25) {
      status = 'Good Fit';
      statusColor = '#0891b2';
      recommendation = `This product costs ${((productPrice / wants) * 100).toFixed(1)}% of your monthly "wants" budget. It's a reasonable purchase that fits your budget.`;
    } else if (productPrice <= wants * 0.5) {
      status = 'Consider Carefully';
      statusColor = '#f59e0b';
      recommendation = `This product costs ${((productPrice / wants) * 100).toFixed(1)}% of your monthly "wants" budget. You might want to save up for a few weeks or look for alternatives.`;
    } else {
      status = 'Outside Budget';
      statusColor = '#ef4444';
      recommendation = `This product costs ${((productPrice / wants) * 100).toFixed(1)}% of your monthly "wants" budget. Consider saving for several months or exploring payment plans.`;
    }

    analysisContent.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        margin-bottom: 12px;
      ">
        <div style="
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${statusColor};
          margin-right: 8px;
        "></div>
        <span style="font-weight: 600; color: ${statusColor};">${status}</span>
      </div>
      <p style="margin: 0; line-height: 1.5; color: #374151;">${recommendation}</p>
      <div style="
        background: #f3f4f6;
        padding: 12px;
        border-radius: 6px;
        margin-top: 12px;
      ">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Product Price:</span>
          <span style="font-weight: 600;">$${productPrice.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Monthly "Wants" Budget:</span>
          <span style="font-weight: 600;">$${wants.toFixed(2)}</span>
        </div>
      </div>
    `;

    analysisContainer.style.display = 'block';

    // Track analytics
    trackEvent('budget_analysis_completed', {
      income: income,
      productPrice: productPrice,
      budgetPercentage: (productPrice / wants) * 100,
      status: status.toLowerCase().replace(/\s+/g, '_')
    });
  }

  // Track analytics events
  function trackEvent(eventName, data = {}) {
    try {
      // Send to BudgetPrice analytics
      fetch(`${BUDGETPRICE_CONFIG.apiUrl}/api/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: eventName,
          properties: {
            ...data,
            domain: STORE_CONFIG.domain,
            productId: STORE_CONFIG.productId,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
          }
        })
      }).catch(err => {
        log('Analytics tracking failed', err);
      });

      log(`Event tracked: ${eventName}`, data);
    } catch (err) {
      error('Failed to track event', err);
    }
  }

  // Initialize the BudgetPrice integration
  function init() {
    if (isInitialized) {
      return;
    }

    log('Initializing BudgetPrice');

    // Check if we're on a product page
    if (!isProductPage()) {
      log('Not a product page, skipping initialization');
      return;
    }

    // Extract product and store information
    if (!extractProductInfo()) {
      log('Could not extract product info, will retry in 2 seconds');
      setTimeout(init, 2000);
      return;
    }

    // Extract theme colors
    extractThemeColors();

    // Insert the widget
    if (insertWidget()) {
      isInitialized = true;
      log('BudgetPrice initialized successfully');
      
      // Track initialization
      trackEvent('widget_loaded', {
        productId: STORE_CONFIG.productId,
        productPrice: STORE_CONFIG.productPrice
      });
    } else {
      log('Failed to insert widget, will retry in 3 seconds');
      setTimeout(init, 3000);
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM is already ready
    setTimeout(init, 100);
  }

  // Also listen for page changes (for SPA-like themes)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      isInitialized = false;
      budgetPriceWidget = null;
      setTimeout(init, 500);
    }
  }).observe(document, { subtree: true, childList: true });

  // Expose global functions for advanced users
  window.BudgetPrice = {
    init: init,
    config: BUDGETPRICE_CONFIG,
    store: STORE_CONFIG,
    theme: THEME_COLORS,
    version: BUDGETPRICE_CONFIG.version
  };

  log(`BudgetPrice v${BUDGETPRICE_CONFIG.version} loaded`);

})();