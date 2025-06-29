# BudgetPrice Monorepo

A comprehensive budget-aware pricing platform for e-commerce stores, restructured as a monorepo for better code organization and maintainability.

## 📁 Project Structure

```
├── packages/
│   ├── shared/          # Shared types, schemas, and utilities
│   ├── api/             # Backend API server
│   ├── web/             # Frontend React application
│   ├── widgets/         # E-commerce platform widgets (Shopify, etc.)
│   └── scripts/         # Build and deployment scripts
├── dev-server.js        # Development server for full-stack development
├── pnpm-workspace.yaml  # Workspace configuration
└── lerna.json          # Monorepo management
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- PostgreSQL database (for production)

### Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```
   This starts both the API server and frontend with hot reload.

3. **Access the application**
   - Web App: http://localhost:5000
   - API: http://localhost:5000/api
   - Onboarding: http://localhost:5000/onboarding

## 📦 Package Overview

### @budgetprice/shared
Core types, database schemas, and shared utilities used across all packages.

**Key exports:**
- Database schemas (Drizzle ORM)
- TypeScript types
- Validation schemas (Zod)
- Common constants

### @budgetprice/api
Express.js backend server providing REST APIs for budget calculations, store management, and e-commerce integrations.

**Features:**
- Multi-platform integrations (Shopify, Magento, WooCommerce)
- Budget caching with TTL management
- Security protection (rate limiting, input validation)
- Real-time WebSocket support
- Database operations with Drizzle ORM

### @budgetprice/web
React frontend application with modern UI components and responsive design.

**Tech Stack:**
- React 18 + TypeScript
- Vite for development and building
- TanStack Query for server state
- Radix UI + Tailwind CSS for components
- Wouter for routing

### @budgetprice/widgets
Installable widgets for e-commerce platforms with automatic theme detection and adaptation.

**Distributions:**
- `shopify-install.js` - Production-ready widget (13.86KB minified)
- `shopify-install.dev.js` - Development version with debug logging
- `shopify-install.self-hosted.js` - Self-hosted version with custom endpoints

### @budgetprice/scripts
Build tools and deployment scripts for generating distribution files and managing the build process.

## 🛠 Development Commands

```bash
# Start full development environment
npm run dev

# Build all packages
npm run build

# Run database migrations
npm run db:push

# Open database studio
npm run db:studio

# Build widget distributions
npm run build:widgets

# Clean all build artifacts
npm run clean
```

## 🔧 Package Commands

Each package has its own scripts that can be run individually:

```bash
# Run commands in specific packages
npm run dev --workspace=packages/web
npm run build --workspace=packages/api
npm run test --workspace=packages/shared
```

## 🎯 Architecture Benefits

### Code Organization
- **Separation of Concerns**: Clear boundaries between frontend, backend, shared code, and platform-specific widgets
- **Reusability**: Shared package eliminates code duplication across packages
- **Maintainability**: Independent versioning and deployment of different components

### Development Experience
- **Hot Reload**: Full-stack development with instant feedback
- **Type Safety**: Shared types ensure consistency across packages
- **Build Optimization**: Package-specific builds optimize for different deployment targets

### Deployment Flexibility
- **Independent Scaling**: Deploy API and frontend separately as needed
- **Platform Distribution**: Widget package can be distributed via CDN independently
- **Environment Isolation**: Different packages can have different deployment configurations

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Individual Package Deployment
Each package can be built and deployed independently:

```bash
# Deploy API only
cd packages/api && npm run build && npm start

# Deploy frontend to static hosting
cd packages/web && npm run build
# Upload dist/ to your static hosting service

# Build and distribute widgets
cd packages/widgets && npm run build
# Upload distribution files to CDN
```

## 📊 Performance

- **API Response Time**: < 100ms for cached budget calculations
- **Frontend Bundle**: Optimized with code splitting and tree shaking
- **Widget Size**: 13.86KB minified for Shopify installation
- **Cache Hit Rate**: 95%+ for budget calculations with intelligent TTL

## 🔒 Security

- **Rate Limiting**: 30 requests/minute per IP/customer
- **Input Validation**: Comprehensive validation with Zod schemas
- **Error Handling**: Centralized error fortress with security monitoring
- **IP Blocking**: Automatic protection against abuse patterns

## 📈 Monitoring

- **Error Tracking**: Centralized logging with severity levels
- **Performance Metrics**: Request timing and cache hit rates
- **Security Events**: Real-time alerting for suspicious activity
- **Analytics**: Conversion tracking and usage statistics

## 🤝 Contributing

1. Make changes in the appropriate package
2. Ensure tests pass: `npm test`
3. Update documentation as needed
4. Follow conventional commit format

## 📄 License

MIT License - see LICENSE file for details