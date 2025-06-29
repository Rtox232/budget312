# BudgetPrice - Budget-Aware Pricing for Shopify

## Overview

BudgetPrice is a Shopify app that implements budget-aware pricing to help customers make purchasing decisions within their financial means while maximizing merchant revenue. The application uses the 50/30/20 budgeting rule as its foundation and provides dynamic pricing adjustments based on customer budget data.

The system is built as a full-stack TypeScript application using React for the frontend, Express.js for the backend, and is designed to integrate seamlessly with Shopify stores through a single JavaScript file installation.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state and local React state
- **UI Framework**: Radix UI components with Tailwind CSS styling
- **Design System**: shadcn/ui component library with custom BudgetPrice branding

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES Modules
- **API Design**: RESTful endpoints following conventional patterns
- **Data Validation**: Zod schemas for runtime type checking
- **Session Management**: In-memory storage with optional database persistence

### Database & Storage
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Connection**: Configured for Neon Database serverless PostgreSQL
- **Schema Management**: Drizzle migrations with type-safe queries
- **Storage Strategy**: Dual-mode storage (in-memory for development, PostgreSQL for production)

## Key Components

### Budget Engine (`client/src/lib/budget-engine.ts`)
Core business logic implementing:
- 50/30/20 budget rule calculations (customizable percentages)
- Product pricing calculations based on customer budget
- Purchase impact analysis
- Budget category classification (needs/wants/savings)

### Shopify Integration (`client/src/lib/shopify-api.ts`)
- Storefront API integration for product data
- Discount detection and stacking logic
- Theme color extraction and adaptation
- Real-time price synchronization

### Theme Adaptation (`client/src/lib/theme-adapter.ts`)
- Automatic detection of Shopify store theme colors
- CSS variable extraction and color matching
- Dynamic styling to match store branding
- Accessibility-compliant color adjustments

### Storage Layer (`server/storage.ts`)
- Abstract storage interface supporting multiple backends
- In-memory implementation for development
- Database implementation using Drizzle ORM
- User, store, budget session, and analytics management

## Data Flow

1. **Customer Budget Input**: Customer enters monthly income through the budget calculator
2. **Budget Calculation**: System applies 50/30/20 rule to calculate available budget by category
3. **Product Pricing**: When viewing products, the system calculates dynamic pricing based on:
   - Base product price
   - Existing Shopify discounts
   - Customer's available budget in relevant category
   - Store's maximum discount percentage limits
4. **Purchase Decision Support**: Visual indicators show whether purchase is within budget, requires stretching, or exceeds available funds
5. **Analytics Collection**: Optional anonymized analytics track conversion improvements

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **zod**: Runtime type validation

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tsx**: TypeScript execution for development

### Shopify Integration
- Designed to work with Shopify's Storefront API
- Compatible with all Shopify themes
- No App Store approval required (script injection method)

## Deployment Strategy

### Development
- Vite development server with HMR
- In-memory storage for rapid iteration
- Replit-optimized configuration with runtime error overlay

### Production Build
- Vite builds frontend to `dist/public`
- esbuild compiles server to `dist/index.js`
- Single deployment artifact with embedded assets

### Database Setup
- Drizzle migrations manage schema changes
- Environment variable configuration for DATABASE_URL
- Automatic migration execution on deployment

### Shopify Installation
- Single JavaScript file distribution
- CDN-hosted for global availability
- One-click installation through merchant dashboard

## Integration Architecture

### Platform Integrations
BudgetPrice now supports three major e-commerce platforms with a unified integration interface:

1. **Shopify Integration**
   - OAuth 2.0 authentication flow
   - REST Admin API for products, customers, and orders
   - Webhook validation using HMAC-SHA256
   - Rate limiting: 40 requests/minute
   - Automatic price rule and discount code creation

2. **Magento Integration**  
   - OAuth 2.0 with refresh token support
   - REST API v2.4+ compatibility
   - Cart price rules for budget discounts
   - Rate limiting: 100 requests/minute
   - Support for configurable and simple products

3. **WordPress/WooCommerce Integration**
   - Basic authentication with API keys
   - REST API v3 for full compatibility
   - Coupon-based discount implementation
   - Rate limiting: 60 requests/minute
   - Webhook registration via API

### Key Features
- **Lazy Loading**: Integrations are instantiated only when needed
- **Intelligent Caching**: Product and customer data cached with configurable TTL
- **Rate Limiting**: Platform-specific limits prevent API throttling
- **Webhook Processing**: Real-time updates with signature validation
- **Unified Interface**: Common API across all platforms for consistency

### API Endpoints
- `GET /api/stores/:storeId/:platform/products` - List products with filters
- `GET /api/stores/:storeId/:platform/products/:productId` - Get single product
- `GET /api/stores/:storeId/:platform/customers/:customerId` - Get customer data
- `POST /api/stores/:storeId/:platform/discounts` - Create budget-based discount
- `POST /api/webhooks/:storeId/:platform` - Process platform webhooks

## Budget Caching Architecture

### Overview
BudgetPrice now features a comprehensive caching system that significantly reduces API calls and improves performance:

1. **Multi-tier Caching**
   - Browser: SessionStorage for anonymous users, LocalStorage for authenticated
   - Server: In-memory cache with TTL management
   - Edge: Cloudflare KV storage for global distribution

2. **Smart Cache Invalidation**
   - Customer-level: Invalidate when budget changes
   - Store-level: Clear all customer caches for store updates
   - Product-level: 5-minute TTL for pricing calculations

3. **Batch Operations**
   - Process multiple products in single request
   - Shared budget retrieval across products
   - Cache hit tracking for performance monitoring

### Cloudflare Workers Integration

The application is now edge-ready with Cloudflare Workers support:

1. **Edge Endpoints**
   - `/api/budget/calculate` - Calculate and cache budget
   - `/api/budget/get` - Retrieve cached budget
   - `/api/pricing/calculate` - Single product pricing
   - `/api/pricing/batch` - Bulk product pricing
   - `/api/cache/invalidate` - Cache management

2. **Benefits**
   - Global distribution near users
   - Sub-millisecond cache reads
   - Reduced origin server load
   - Built-in DDoS protection

3. **Configuration**
   - `wrangler.toml` for deployment settings
   - KV namespace for persistent caching
   - Environment variables for secrets

## Security Architecture

### Budget Abuse Protection
BudgetPrice includes comprehensive protection against malicious usage and abuse:

1. **Rate Limiting**
   - 30 requests per minute per IP/customer combination
   - 1,000 requests per hour with automatic blocking
   - Configurable limits with escalating timeouts

2. **Input Validation Fortress**
   - Monthly income bounds: $100 - $1,000,000
   - Product price limits: $0 - $1,000,000
   - Category validation (needs/wants/savings only)
   - Suspicious pattern detection

3. **IP and Customer Blocking**
   - Automatic IP blacklisting for repeated violations
   - Customer ID blocking for account abuse
   - Manual admin controls for emergency blocking

4. **Request Tracking**
   - Per-IP and per-customer request monitoring
   - Suspicious behavior scoring system
   - Geolocation tracking (configurable)

### Error Fortress System
Comprehensive error handling and security monitoring:

1. **Global Error Handler**
   - Centralized error logging with sanitized data
   - Production-safe error messages
   - Request context preservation

2. **Security Incident Tracking**
   - Categorized incident types (rate_limit, validation_failure, etc.)
   - Severity levels (low, medium, high, critical)
   - Real-time alerting when thresholds exceeded

3. **Monitoring Dashboard**
   - Live security statistics
   - Error rate tracking
   - Top error sources and endpoints
   - Active threat monitoring

4. **Admin Security Controls**
   - IP blocking/unblocking endpoints
   - Customer suspension capabilities
   - Security statistics API
   - Incident resolution tracking

### Security Configuration
Default protection settings:
- Max monthly income: $1,000,000
- Min monthly income: $100
- Rate limits: 30/minute, 1000/hour
- Suspicious pattern threshold: 50 points
- Error rate alerts: 10 errors/minute

## Shopify Installation System

### Installation Script (`dist/shopify-install.js`)
Complete JavaScript file that automatically integrates BudgetPrice into Shopify stores:

1. **Auto-Detection**: Automatically detects Shopify stores, product pages, and theme colors
2. **Theme Integration**: Extracts CSS variables and matches store branding
3. **Multiple Installation Methods**: Theme editor, custom positioning, conditional loading
4. **Mobile Optimized**: Responsive design with touch-friendly interfaces
5. **Analytics Tracking**: Automatic event tracking for conversion analysis

### Build System (`scripts/build-shopify.js`)
Generates multiple versions of the installation script:
- Production version (minified, 13.86KB)
- Development version (with debug logging, 20.52KB)
- Self-hosted version (customizable API endpoints)
- Installation snippets for different use cases

### Merchant Onboarding (`/onboarding`)
Step-by-step guided setup process:
1. Store information collection
2. Theme color configuration with live preview
3. Installation code generation with multiple methods
4. Verification and testing tools

### Installation Options
- **Theme Editor**: Direct integration into product templates
- **Custom Position**: Flexible widget placement
- **Conditional Loading**: Product-specific rules
- **Test Mode**: Debug-enabled development environment

## Monorepo Architecture

### New Structure (June 29, 2025)
BudgetPrice has been restructured into a comprehensive monorepo for better code organization and maintainability:

```
packages/
├── shared/          # @budgetprice/shared - Core types, schemas, utilities
├── api/             # @budgetprice/api - Express.js backend server
├── web/             # @budgetprice/web - React frontend application
├── widgets/         # @budgetprice/widgets - E-commerce platform widgets
└── scripts/         # @budgetprice/scripts - Build and deployment tools
```

### Benefits
- **Code Separation**: Clear boundaries between frontend, backend, shared code, and platform widgets
- **Type Safety**: Shared package ensures consistency across all components
- **Independent Deployment**: Each package can be built and deployed separately
- **Reusability**: Eliminates code duplication with shared utilities
- **Scalability**: Better organization for future platform expansions

### Development Workflow
- Single command `npm run dev` starts full-stack development environment
- Hot reload for both frontend and backend changes
- Workspace-based dependency management
- Package-specific scripts for targeted development

## Security Enhancements (June 29, 2025)

### Comprehensive Input Sanitization System
BudgetPrice now features a robust input sanitization and validation system that provides multi-layered protection against injection attacks:

#### InputSanitizer Class (`packages/shared/input-sanitizer.ts`)
- **XSS Prevention**: Comprehensive detection and prevention of cross-site scripting attacks
- **SQL Injection Protection**: Pattern-based detection of SQL injection attempts
- **Path Traversal Prevention**: Protection against directory traversal attacks
- **HTML Sanitization**: Safe HTML entity escaping and tag stripping
- **Data Type Validation**: Numeric, email, and URL format validation
- **Custom Sanitization**: Pre-configured schemas for budget data, product data, and user input

#### Content Security Policy (CSP) Implementation
- **Dynamic CSP Generation**: Environment-aware CSP headers with nonce support
- **XSS Protection**: Strict script and style source controls
- **Clickjacking Prevention**: Frame-ancestors and X-Frame-Options headers
- **Mixed Content Protection**: HTTPS enforcement and upgrade-insecure-requests
- **Violation Reporting**: CSP violation monitoring and logging system

#### API Endpoint Protection
All API endpoints now implement:
- **Input Sanitization**: Automatic sanitization before schema validation
- **Parameter Validation**: Strict validation for path parameters and query strings
- **Admin Security Controls**: Enhanced validation for security management endpoints
- **Error Handling**: Sanitized error messages without data leakage

#### Frontend Input Validation
- **Real-time Validation**: Client-side input validation with security checks
- **Budget Calculator**: Numeric input validation with reasonable limits
- **Merchant Onboarding**: Store data validation with URL and color format checking
- **Form Security**: Prevention of malicious input in all user-facing forms

### Security Configuration
- **Development Mode**: Permissive CSP for development with HMR support
- **Production Mode**: Strict CSP with reporting and HTTPS enforcement
- **Rate Limiting**: IP and customer-based rate limiting with security monitoring
- **Error Fortress**: Comprehensive error logging and security incident tracking

## Changelog

Changelog:
- June 27, 2025. Initial setup
- January 9, 2025. Added multi-platform integrations (Shopify, Magento, WordPress)
- January 9, 2025. Implemented lazy loading and intelligent caching system
- January 9, 2025. Built automated integration test suite
- January 9, 2025. Added rate limiting and webhook validation
- January 9, 2025. Implemented comprehensive budget caching system
- January 9, 2025. Added Cloudflare Workers support for edge deployment
- January 9, 2025. Created batch pricing endpoints for performance
- June 27, 2025. Built comprehensive budget abuse protection system
- June 27, 2025. Added error fortress with global error handling and security monitoring
- June 27, 2025. Implemented rate limiting, input validation, and IP blocking
- June 27, 2025. Built complete Shopify installation script with auto-detection and theme matching
- June 27, 2025. Created build system generating multiple script versions (prod/dev/self-hosted)
- June 27, 2025. Added merchant onboarding flow with guided setup and verification
- June 29, 2025. Restructured application into monorepo architecture with workspace management
- June 29, 2025. Created separate packages for shared utilities, API, web frontend, widgets, and scripts
- June 29, 2025. Implemented unified development server with hot reload for full-stack development
- June 29, 2025. Added comprehensive input sanitization system with XSS and injection protection
- June 29, 2025. Implemented Content Security Policy (CSP) middleware with dynamic nonce generation
- June 29, 2025. Enhanced all API endpoints with input validation and parameter sanitization
- June 29, 2025. Added frontend input validation with real-time security checks
- June 29, 2025. Created security monitoring system with CSP violation reporting

## User Preferences

Preferred communication style: Simple, everyday language.