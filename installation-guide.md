# BudgetPrice - Shopify Installation Guide

## Quick Installation (2 minutes)

### Method 1: Theme Code Editor (Recommended)
1. **Access your Shopify admin**
   - Go to `Online Store` → `Themes`
   - Click `Actions` → `Edit code` on your active theme

2. **Add the script**
   - Find `templates/product.liquid` or `sections/product-form.liquid`
   - Add this code before the closing `</form>` tag:
   
   ```html
   <script src="https://cdn.budgetprice.app/v1/shopify-install.js" async></script>
   ```

3. **Save and test**
   - Click `Save`
   - Visit any product page on your store
   - Look for the "Budget-Friendly Pricing" widget

### Method 2: Theme Customizer
1. **Go to theme customizer**
   - `Online Store` → `Themes` → `Customize`

2. **Add custom code**
   - Look for "Custom CSS" or "Additional scripts" section
   - Add the installation script

3. **Publish changes**

## Advanced Configuration

### Custom Positioning
You can control where the widget appears by adding a data attribute:

```html
<div data-budgetprice-position="here"></div>
<script src="https://cdn.budgetprice.app/v1/shopify-install.js" async></script>
```

### Theme Color Matching
The widget automatically detects your theme colors. To override:

```javascript
window.BudgetPriceConfig = {
  theme: {
    primary: '#your-primary-color',
    background: '#your-background-color',
    text: '#your-text-color'
  }
};
```

### Disable on Specific Products
Add this to products where you don't want the widget:

```html
<meta name="budgetprice-disable" content="true">
```

## Verification

After installation, you should see:
- ✅ A "Budget-Friendly Pricing" widget on product pages
- ✅ The widget matches your store's design
- ✅ Clicking opens a budget calculator modal
- ✅ Analytics are automatically tracked

## Troubleshooting

### Widget Not Appearing?
1. **Check product page detection**
   - Ensure you're on a product page (not collection/home)
   - Some themes need 2-3 seconds to load

2. **Check console for errors**
   - Press F12 → Console tab
   - Look for BudgetPrice messages

3. **Try manual initialization**
   ```javascript
   // Add this after the script tag
   window.BudgetPrice.init();
   ```

### Widget Appears in Wrong Location?
1. **Check insertion point**
   - The script auto-detects form elements
   - Use custom positioning (see above)

2. **CSS conflicts**
   - Some themes may need CSS adjustments
   - Contact support for theme-specific help

### Colors Don't Match?
- Use custom theme configuration (see above)
- The script extracts colors from CSS variables

## Support

- **Documentation**: https://docs.budgetprice.app
- **Live Chat**: Available in your BudgetPrice dashboard
- **Email**: support@budgetprice.app
- **Emergency**: For urgent issues, add `?debug=true` to any product URL

## What's Next?

1. **Monitor Performance**
   - Check your BudgetPrice dashboard for analytics
   - Track conversion improvements

2. **Customize Further**
   - Set up discount rules
   - Configure budget categories
   - Enable advanced features

3. **Upgrade for More Features**
   - AI dynamic pricing
   - A/B testing
   - Advanced analytics
   - Multi-currency support

---

**Need help?** Our installation success rate is 99.7%. If you encounter any issues, we're here to help!