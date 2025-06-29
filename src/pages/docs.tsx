import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  BookOpen, 
  Code, 
  Download, 
  ExternalLink, 
  Shield, 
  Accessibility, 
  CheckCircle,
  Copy,
  Github
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Docs() {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(label);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const installationSteps = [
    {
      step: 1,
      title: "Download the Script",
      description: "Get the single JavaScript file from your dashboard or our CDN.",
      code: "curl -O https://cdn.budgetprice.com/v1/budgetprice.min.js",
      color: "bg-shopify-green",
    },
    {
      step: 2,
      title: "Add to Your Theme",
      description: "Paste the script tag into your Shopify theme's product template.",
      code: '<script src="{{ \'budgetprice.min.js\' | asset_url }}"></script>',
      color: "bg-blue-600",
    },
    {
      step: 3,
      title: "Configure (Optional)",
      description: "Set your tier and customize budget rules if needed.",
      code: `window.APP_TIER = "starter";
window.BUDGET_CONFIG = {
  needsPercentage: 50,
  wantsPercentage: 30,
  savingsPercentage: 20
};`,
      color: "bg-purple-600",
    },
    {
      step: 4,
      title: "Test & Go Live",
      description: "Verify everything works correctly and start seeing improved conversions!",
      code: "",
      color: "bg-green-600",
    },
  ];

  const codeExamples = {
    basic: `<!-- Basic Integration -->
<div id="budget-price-widget"
     data-product-id="{{ product.id }}"
     data-product-price="{{ product.price }}">
</div>

<script src="{{ 'budgetprice.min.js' | asset_url }}"></script>
<script>
  // Initialize BudgetPrice
  BudgetPrice.init({
    tier: 'starter',
    shopifyDomain: '{{ shop.domain }}',
    apiKey: 'your_api_key_here'
  });
</script>`,

    advanced: `<!-- Advanced Configuration -->
<div id="budget-price-widget"
     data-product-id="{{ product.id }}"
     data-product-price="{{ product.price }}"
     data-category="wants"
     data-variants="{{ product.variants | json | escape }}">
</div>

<script src="{{ 'budgetprice.min.js' | asset_url }}"></script>
<script>
  BudgetPrice.init({
    tier: 'pro',
    shopifyDomain: '{{ shop.domain }}',
    customRules: {
      needs: 50,
      wants: 30,
      savings: 20,
      maxDiscount: 25
    },
    theme: {
      primaryColor: '{{ settings.color_primary }}',
      fontFamily: '{{ settings.type_base_font.family }}'
    },
    features: {
      analytics: true,
      education: true,
      themeAdaptation: true
    },
    callbacks: {
      onBudgetSet: function(budget) {
        console.log('Budget set:', budget);
      },
      onPriceCalculated: function(pricing) {
        console.log('Price calculated:', pricing);
      },
      onPurchase: function(data) {
        console.log('Purchase completed:', data);
      }
    }
  });
</script>`,

    api: `// Budget Calculation API
fetch('/api/budget/calculate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    monthlyIncome: 5000,
    category: 'wants'
  })
})
.then(response => response.json())
.then(budget => {
  console.log('Budget breakdown:', budget);
});

// Product Pricing API
fetch('/api/pricing/calculate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    productId: 'gid://shopify/Product/123',
    basePrice: 1999,
    customerBudget: 1500,
    category: 'wants',
    shopifyDiscounts: 200
  })
})
.then(response => response.json())
.then(pricing => {
  console.log('Calculated pricing:', pricing);
});`,

    webhook: `// Webhook Configuration
{
  "webhook": {
    "topic": "budgetprice/purchase_completed",
    "address": "https://yourstore.com/webhooks/budgetprice",
    "format": "json"
  }
}

// Webhook Payload Example
{
  "customer_id": "123456789",
  "product_id": "gid://shopify/Product/123",
  "original_price": 1999,
  "final_price": 1799,
  "budget_discount": 200,
  "shopify_discounts": 0,
  "budget_data": {
    "monthly_income": 5000,
    "category": "wants",
    "available_budget": 1500
  },
  "timestamp": "2024-01-15T10:30:00Z"
}`
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-shopify-green rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Documentation & Setup Guide
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to integrate BudgetPrice into your Shopify store. 
            From basic setup to advanced customization.
          </p>
        </div>

        <Tabs defaultValue="installation" className="space-y-8">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-5">
            <TabsTrigger value="installation">Installation</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="api">API Reference</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          {/* Installation Tab */}
          <TabsContent value="installation" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="w-5 h-5 text-shopify-green" />
                  <span>Quick Start Installation</span>
                </CardTitle>
                <p className="text-gray-600">
                  Get BudgetPrice running on your Shopify store in under 5 minutes.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {installationSteps.map((step) => (
                    <div key={step.step} className="flex items-start space-x-4">
                      <div className={`w-10 h-10 ${step.color} text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold`}>
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                        <p className="text-gray-600 mb-4">{step.description}</p>
                        {step.code && (
                          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 text-gray-400 hover:text-white"
                              onClick={() => copyToClipboard(step.code, `Step ${step.step} code`)}
                            >
                              {copiedCode === `Step ${step.step} code` ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            <pre className="text-sm overflow-x-auto pr-12">
                              <code>{step.code}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Deployment Options */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Github className="w-5 h-5" />
                    <span>GitHub Deployment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Deploy directly from our GitHub repository for automatic updates and version control.
                  </p>
                  <Button className="w-full" variant="outline">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on GitHub
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="w-5 h-5" />
                    <span>Replit Template</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Use our Replit template for easy hosting and development with zero setup.
                  </p>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Fork on Replit
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="configuration" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Integration Examples</CardTitle>
                <p className="text-gray-600">
                  Copy and paste these examples to get started quickly.
                </p>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="basic">Basic Setup</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced Config</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-4 right-4 z-10"
                        onClick={() => copyToClipboard(codeExamples.basic, "Basic integration")}
                      >
                        {copiedCode === "Basic integration" ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm">
                        <code>{codeExamples.basic}</code>
                      </pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-4 right-4 z-10"
                        onClick={() => copyToClipboard(codeExamples.advanced, "Advanced configuration")}
                      >
                        {copiedCode === "Advanced configuration" ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto text-sm">
                        <code>{codeExamples.advanced}</code>
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Configuration Options */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">Option</th>
                        <th className="text-left p-3 font-semibold">Type</th>
                        <th className="text-left p-3 font-semibold">Default</th>
                        <th className="text-left p-3 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-3 font-mono text-sm">tier</td>
                        <td className="p-3">string</td>
                        <td className="p-3">"free"</td>
                        <td className="p-3">Your BudgetPrice subscription tier</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-sm">shopifyDomain</td>
                        <td className="p-3">string</td>
                        <td className="p-3">auto-detected</td>
                        <td className="p-3">Your Shopify store domain</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-sm">customRules</td>
                        <td className="p-3">object</td>
                        <td className="p-3">50/30/20</td>
                        <td className="p-3">Custom budget allocation rules</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-sm">theme</td>
                        <td className="p-3">object</td>
                        <td className="p-3">auto-extracted</td>
                        <td className="p-3">Theme colors and fonts</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-sm">features</td>
                        <td className="p-3">object</td>
                        <td className="p-3">tier-based</td>
                        <td className="p-3">Enable/disable specific features</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Reference Tab */}
          <TabsContent value="api" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
                <p className="text-gray-600">
                  RESTful API for budget calculations and pricing logic.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        POST
                      </Badge>
                      <code className="text-sm font-mono">/api/budget/calculate</code>
                    </div>
                    <p className="text-gray-600 mb-4">Calculate budget breakdown using the 50/30/20 rule.</p>
                    
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-4 right-4 z-10"
                        onClick={() => copyToClipboard(codeExamples.api.split('// Product Pricing API')[0], "Budget API example")}
                      >
                        {copiedCode === "Budget API example" ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{codeExamples.api.split('// Product Pricing API')[0]}</code>
                      </pre>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        POST
                      </Badge>
                      <code className="text-sm font-mono">/api/pricing/calculate</code>
                    </div>
                    <p className="text-gray-600 mb-4">Calculate dynamic pricing based on customer budget.</p>
                    
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-4 right-4 z-10"
                        onClick={() => copyToClipboard(codeExamples.api.split('// Product Pricing API')[1].split('// Webhook Configuration')[0], "Pricing API example")}
                      >
                        {copiedCode === "Pricing API example" ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{codeExamples.api.split('// Product Pricing API')[1].split('// Webhook Configuration')[0]}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Webhooks */}
            <Card>
              <CardHeader>
                <CardTitle>Webhooks</CardTitle>
                <p className="text-gray-600">
                  Receive real-time notifications about budget-related events.
                </p>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 z-10"
                    onClick={() => copyToClipboard(codeExamples.webhook, "Webhook example")}
                  >
                    {copiedCode === "Webhook example" ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{codeExamples.webhook}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-700">
                    <Shield className="w-5 h-5" />
                    <span>GDPR Compliance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">No cookies or tracking by default</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Budget data stored locally only</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Clear consent mechanisms</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">One-click data deletion</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Privacy policy templates included</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Data Processing</h4>
                    <p className="text-sm text-green-700">
                      All budget calculations happen in the browser. No personal data 
                      is transmitted to our servers unless explicitly consented to by the user.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-700">
                    <Accessibility className="w-5 h-5" />
                    <span>Accessibility (WCAG 2.1 AA)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">High contrast color schemes</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Full keyboard navigation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Screen reader compatibility</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">ARIA labels and roles</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Automated accessibility testing</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Testing Tools</h4>
                    <p className="text-sm text-blue-700">
                      We use axe-core and manual testing to ensure our components 
                      meet WCAG 2.1 AA standards.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Checklist */}
            <Card>
              <CardHeader>
                <CardTitle>Implementation Checklist</CardTitle>
                <p className="text-gray-600">
                  Ensure your BudgetPrice integration meets all compliance requirements.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">GDPR Requirements</h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm">Privacy notice displayed</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm">Consent mechanism implemented</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm">Data deletion option available</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm">Session-only storage by default</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Accessibility Requirements</h4>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm">Keyboard navigation tested</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm">Screen reader compatibility verified</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm">Color contrast meets AA standards</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm">ARIA labels properly implemented</span>
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Community</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-600">
                    Free support through our community forum and documentation.
                  </p>
                  <Button variant="outline" className="w-full">
                    Visit Forum
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Email Support</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <ExternalLink className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-gray-600">
                    Direct email support for Starter tier and above subscribers.
                  </p>
                  <Button className="w-full bg-shopify-green hover:bg-shopify-green/90">
                    Contact Support
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Priority Support</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                    <Shield className="w-8 h-8 text-yellow-600" />
                  </div>
                  <p className="text-gray-600">
                    Dedicated support with guaranteed response times for Pro and Enterprise.
                  </p>
                  <Button variant="outline" className="w-full">
                    Upgrade Plan
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* FAQ */}
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">How does budget-aware pricing work?</h4>
                  <p className="text-gray-600">
                    BudgetPrice calculates personalized discounts based on customer budgets using 
                    the proven 50/30/20 budgeting rule. When a customer enters their budget, 
                    the system determines how much they can afford for different categories.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Is customer data stored on your servers?</h4>
                  <p className="text-gray-600">
                    No. By default, all budget data is stored only in the customer's browser 
                    using sessionStorage. Data is automatically deleted when they close their 
                    browser, ensuring complete privacy.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Can I customize the budgeting rules?</h4>
                  <p className="text-gray-600">
                    Yes. Starting with the Starter tier, you can customize budget allocation 
                    percentages and set maximum discount limits to match your business needs.
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Does it work with existing Shopify discounts?</h4>
                  <p className="text-gray-600">
                    Absolutely. BudgetPrice automatically detects and stacks with existing 
                    Shopify discounts to provide the best possible price for your customers.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
