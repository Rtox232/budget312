import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Calculator, 
  Shield, 
  Accessibility, 
  Layers, 
  BarChart3,
  Clock,
  Palette,
  Globe,
  Code
} from "lucide-react";

export default function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: "One-Click Install",
      description: "Single JavaScript file integration. No databases, no complex setup. Just paste and go live.",
      highlights: [
        "Auto-detects Shopify discounts",
        "Works with all themes",
        "Zero configuration required"
      ],
      color: "bg-shopify-green",
      tier: "free"
    },
    {
      icon: Calculator,
      title: "Smart Budget Engine",
      description: "Uses proven 50/30/20 budgeting rule with merchant customization options.",
      highlights: [
        "Real-time price calculations",
        "Custom budget categories",
        "Discount stacking logic"
      ],
      color: "bg-blue-600",
      tier: "free"
    },
    {
      icon: Shield,
      title: "GDPR Compliant",
      description: "Zero data storage by default. All budget data stays in customer's browser.",
      highlights: [
        "No cookies or tracking",
        "Session-only storage",
        "Optional data persistence"
      ],
      color: "bg-purple-600",
      tier: "free"
    },
    {
      icon: Accessibility,
      title: "Accessibility First",
      description: "WCAG 2.1 AA compliant with keyboard navigation and screen reader support.",
      highlights: [
        "High contrast UI",
        "ARIA labels included",
        "Keyboard accessible"
      ],
      color: "bg-green-600",
      tier: "free"
    },
    {
      icon: Layers,
      title: "Discount Stacking",
      description: "Automatically combines budget discounts with existing Shopify promotions.",
      highlights: [
        "Best price guarantee",
        "Automatic optimization",
        "Transparent pricing"
      ],
      color: "bg-yellow-600",
      tier: "starter"
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track conversion improvements and budget-based purchasing patterns.",
      highlights: [
        "Conversion tracking",
        "Revenue impact",
        "Customer insights"
      ],
      color: "bg-red-600",
      tier: "starter"
    },
    {
      icon: Palette,
      title: "Theme Adaptation",
      description: "Automatically extracts and matches your store's theme colors and fonts.",
      highlights: [
        "Auto color extraction",
        "Font matching",
        "Seamless integration"
      ],
      color: "bg-indigo-600",
      tier: "starter"
    },
    {
      icon: Clock,
      title: "Real-Time Pricing",
      description: "Dynamic price adjustments based on current inventory and demand.",
      highlights: [
        "AI-powered optimization",
        "Inventory integration",
        "Demand-based pricing"
      ],
      color: "bg-pink-600",
      tier: "pro"
    },
    {
      icon: Globe,
      title: "Multi-Currency Support",
      description: "Works seamlessly with Shopify's native multi-currency functionality.",
      highlights: [
        "Automatic conversion",
        "Regional pricing",
        "Currency-aware budgets"
      ],
      color: "bg-teal-600",
      tier: "pro"
    },
    {
      icon: Code,
      title: "API Integration",
      description: "RESTful API for custom integrations and third-party connections.",
      highlights: [
        "Webhook support",
        "Custom endpoints",
        "Developer-friendly"
      ],
      color: "bg-orange-600",
      tier: "enterprise"
    }
  ];

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "bg-gray-100 text-gray-800";
      case "starter":
        return "bg-blue-100 text-blue-800";
      case "pro":
        return "bg-purple-100 text-purple-800";
      case "enterprise":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to boost conversions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From zero-setup installation to advanced AI pricing, we've got every merchant covered.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200"
              >
                <CardContent className="p-6">
                  {/* Icon and Tier Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getTierBadgeColor(feature.tier)} border-0`}
                    >
                      {feature.tier.charAt(0).toUpperCase() + feature.tier.slice(1)}
                    </Badge>
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-shopify-green transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Feature Highlights */}
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, hIndex) => (
                      <li key={hIndex} className="flex items-center text-sm text-gray-500">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0"></div>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Feature Availability by Tier
            </h3>
            <p className="text-gray-600">
              Choose the plan that fits your store's needs
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-900">Feature</th>
                    <th className="text-center p-4 font-semibold text-gray-600">Free</th>
                    <th className="text-center p-4 font-semibold text-blue-600">Starter</th>
                    <th className="text-center p-4 font-semibold text-purple-600">Pro</th>
                    <th className="text-center p-4 font-semibold text-yellow-600">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="p-4 font-medium">Budget-aware pricing</td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-4 font-medium">Discount stacking</td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-gray-300 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Custom budget categories</td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-gray-300 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-4 font-medium">AI dynamic pricing</td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-gray-300 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-gray-300 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">White-label app</td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-gray-300 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-gray-300 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-4 font-medium">API access</td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-gray-300 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-gray-300 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-gray-300 rounded-full mx-auto"></div>
                    </td>
                    <td className="text-center p-4">
                      <div className="w-5 h-5 bg-green-500 rounded-full mx-auto"></div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Integration Preview */}
        <div className="mt-20 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">
                See BudgetPrice in Action
              </h3>
              <p className="text-gray-300">
                Watch how seamlessly it integrates with your existing Shopify theme
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6 font-mono text-sm overflow-x-auto">
              <div className="text-green-400 mb-2">// Add to your product template</div>
              <div className="text-gray-300">
                <span className="text-blue-300">&lt;div</span>{" "}
                <span className="text-yellow-300">id=</span>
                <span className="text-green-300">"budget-price-widget"</span>{" "}
                <span className="text-yellow-300">data-product-id=</span>
                <span className="text-green-300">{'"{{ product.id }}"'}</span>
                <span className="text-blue-300">&gt;</span>
              </div>
              <div className="text-gray-300">
                <span className="text-blue-300">&lt;/div&gt;</span>
              </div>
              <div className="mt-4 text-gray-300">
                <span className="text-blue-300">&lt;script</span>{" "}
                <span className="text-yellow-300">src=</span>
                <span className="text-green-300">"budgetprice.min.js"</span>
                <span className="text-blue-300">&gt;&lt;/script&gt;</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
