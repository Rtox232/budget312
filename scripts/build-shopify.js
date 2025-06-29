#!/usr/bin/env node

/**
 * Build script for Shopify installation files
 * Generates minified and optimized versions for CDN distribution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple minification function (basic JS minifier)
function minifyJS(code) {
  return code
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove spaces around operators and punctuation
    .replace(/\s*([{}();,=+\-*/<>!&|])\s*/g, '$1')
    // Remove trailing semicolons before }
    .replace(/;\s*}/g, '}')
    // Trim
    .trim();
}

// Generate different versions of the script
function buildShopifyScript() {
  console.log('🏗️  Building Shopify installation scripts...\n');

  const sourceFile = path.join(__dirname, '../dist/shopify-install.js');
  const distDir = path.join(__dirname, '../dist');

  // Read source file
  const sourceCode = fs.readFileSync(sourceFile, 'utf8');

  // Build configurations
  const builds = [
    {
      name: 'Development Version',
      filename: 'shopify-install.dev.js',
      config: {
        debug: true,
        minify: false
      }
    },
    {
      name: 'Production Version',
      filename: 'shopify-install.min.js',
      config: {
        debug: false,
        minify: true
      }
    },
    {
      name: 'Self-Hosted Version',
      filename: 'shopify-install.self-hosted.js',
      config: {
        debug: false,
        minify: false,
        apiUrl: 'https://your-domain.com'
      }
    }
  ];

  builds.forEach(build => {
    console.log(`📦 Building ${build.name}...`);

    let code = sourceCode;

    // Apply configuration changes
    if (build.config.debug !== undefined) {
      code = code.replace(/debug: false/, `debug: ${build.config.debug}`);
    }

    if (build.config.apiUrl) {
      code = code.replace(
        /apiUrl: 'https:\/\/budgetprice\.replit\.app'/,
        `apiUrl: '${build.config.apiUrl}'`
      );
    }

    // Minify if requested
    if (build.config.minify) {
      code = minifyJS(code);
    }

    // Add build header
    const header = `/*! BudgetPrice Shopify Integration v1.0.0 | ${new Date().toISOString()} */\n`;
    code = header + code;

    // Write file
    const outputPath = path.join(distDir, build.filename);
    fs.writeFileSync(outputPath, code);

    const stats = fs.statSync(outputPath);
    const sizeKB = Math.round(stats.size / 1024 * 100) / 100;
    
    console.log(`   ✅ ${build.filename} (${sizeKB}KB)`);
  });

  console.log('\n🎉 Build complete!\n');

  // Generate installation snippets
  generateInstallationSnippets();
}

function generateInstallationSnippets() {
  console.log('📋 Generating installation snippets...\n');

  const snippets = {
    'basic-installation.html': `<!-- BudgetPrice: Add before closing </form> tag in product template -->
<script src="https://cdn.budgetprice.app/v1/shopify-install.min.js" async></script>`,

    'custom-position.html': `<!-- BudgetPrice: Custom positioning -->
<div data-budgetprice-position="here"></div>
<script src="https://cdn.budgetprice.app/v1/shopify-install.min.js" async></script>`,

    'with-config.html': `<!-- BudgetPrice: With custom configuration -->
<script>
window.BudgetPriceConfig = {
  theme: {
    primary: '#your-brand-color',
    background: '#ffffff',
    text: '#333333'
  },
  position: 'after-price'
};
</script>
<script src="https://cdn.budgetprice.app/v1/shopify-install.min.js" async></script>`,

    'conditional-loading.html': `<!-- BudgetPrice: Only on specific products -->
{% unless product.tags contains 'no-budgetprice' %}
<script src="https://cdn.budgetprice.app/v1/shopify-install.min.js" async></script>
{% endunless %}`,

    'theme-integration.liquid': `{%- comment -%}
  BudgetPrice Integration for Shopify Themes
  Add this to your product template or product form section
{%- endcomment -%}

{% if product.available and product.price > 0 %}
  <div class="budgetprice-integration" data-product-id="{{ product.id }}" data-product-price="{{ product.price }}">
    <script>
      window.BudgetPriceProduct = {
        id: {{ product.id | json }},
        handle: {{ product.handle | json }},
        price: {{ product.price | json }},
        title: {{ product.title | json }},
        vendor: {{ product.vendor | json }}
      };
    </script>
    <script src="https://cdn.budgetprice.app/v1/shopify-install.min.js" async></script>
  </div>
{% endif %}`
  };

  const snippetsDir = path.join(__dirname, '../dist/snippets');
  if (!fs.existsSync(snippetsDir)) {
    fs.mkdirSync(snippetsDir);
  }

  Object.entries(snippets).forEach(([filename, content]) => {
    const filepath = path.join(snippetsDir, filename);
    fs.writeFileSync(filepath, content);
    console.log(`   ✅ ${filename}`);
  });
}

// Run the build
if (import.meta.url === `file://${process.argv[1]}`) {
  buildShopifyScript();
  
  console.log('📁 Distribution files ready:');
  console.log('   • Installation guide');
  console.log('   • Minified script (CDN ready)');
  console.log('   • Development script');
  console.log('   • Code snippets');
  console.log('   • Documentation\n');
  console.log('🚀 Ready for deployment!');
}

export { buildShopifyScript, minifyJS };