import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, Star, Zap, Crown, Building } from "lucide-react";
import { APP_TIERS } from "@/types";

export default function PricingSection() {
  const tiers = [
    {
      id: "free",
      name: "Free",
      price: 0,
      period: "per month",
      description: "Perfect for getting started",
      icon: Zap,
      buttonText: "Get Started Free",
      buttonVariant: "outline" as const,
      popular: false,
      features: [
        "Basic 50/30/20 discounts",
        "Session-only storage",
        "Shopify discount detection",
        "GDPR compliant",
        "Community support",
        "Up to 100 calculations/month"
      ],
      limitations: [
        "No custom budget rules",
        "No analytics tracking",
        "No theme adaptation",
        "Basic support only"
      ]
    },
    {
      id: "starter",
      name: "Starter",
      price: 15,
      period: "per month",
      description: "Most popular for growing stores",
      icon: Star,
      buttonText: "Start 14-Day Trial",
      buttonVariant: "default" as const,
      popular: true,
      features: [
        "Everything in Free",
        "Custom budget categories",
        "Discount stacking",
        "Opt-in analytics",
        "Email support",
        "Theme color adaptation",
        "Up to 1,000 calculations/month",
        "Conversion tracking"
      ],
      limitations: [
        "No AI pricing",
        "No A/B testing",
        "No white-label options"
      ]
    },
    {
      id: "pro",
      name: "Pro",
      price: 49,
      period: "per month",
      description: "Advanced features for scaling businesses",
      icon: Crown,
      buttonText: "Start Pro Trial",
      buttonVariant: "outline" as const,
      popular: false,
      features: [
        "Everything in Starter",
        "AI-driven dynamic pricing",
        "A/B testing framework",
        "White-label Shopify app",
        "Priority support",
        "Advanced analytics dashboard",
        "Unlimited calculations",
        "Custom integration support"
      ],
      limitations: [
        "No dedicated support",
        "No custom CRM integrations"
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: null,
      period: "custom pricing",
      description: "Tailored solutions for large enterprises",
      icon: Building,
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
      popular: false,
      features: [
        "Everything in Pro",
        "CRM integrations (Salesforce, HubSpot)",
        "Automated GDPR compliance tools",
        "Dedicated customer success manager",
        "Custom integrations & API access",
        "SLA guarantees",
        "Multi-store management",
        "Advanced security features"
      ],
      limitations: []
    }
  ];

  const comparisonFeatures = [
    {
      category: "Core Features",
      features: [
        {
          name: "Budget-aware pricing",
          free: true,
          starter: true,
          pro: true,
          enterprise: true
        },
        {
          name: "50/30/20 budgeting rule",
          free: true,
          starter: true,
          pro: true,
          enterprise: true
        },
        {
          name: "Shopify discount detection",
          free: true,
          starter: true,
          pro: true,
          enterprise: true
        },
        {
          name: "GDPR compliance",
          free: true,
          starter: true,
          pro: true,
          enterprise: true
        }
      ]
    },
    {
      category: "Advanced Features",
      features: [
        {
          name: "Custom budget categories",
          free: false,
          starter: true,
          pro: true,
          enterprise: true
        },
        {
          name: "Discount stacking",
          free: false,
          starter: true,
          pro: true,
          enterprise: true
        },
        {
          name: "Analytics & tracking",
          free: false,
          starter: true,
          pro: true,
          enterprise: true
        },
        {
          name: "Theme adaptation",
          free: false,
          starter: true,
          pro: true,
          enterprise: true
        }
      ]
    },
    {
      category: "Pro Features",
      features: [
        {
          name: "AI dynamic pricing",
          free: false,
          starter: false,
          pro: true,
          enterprise: true
        },
        {
          name: "A/B testing",
          free: false,
          starter: false,
          pro: true,
          enterprise: true
        },
        {
          name: "White-label app",
          free: false,
          starter: false,
          pro: true,
          enterprise: true
        },
        {
          name: "API access",
          free: false,
          starter: false,
          pro: true,
          enterprise: true
        }
      ]
    },
    {
      category: "Enterprise Features",
      features: [
        {
          name: "CRM integrations",
          free: false,
          starter: false,
          pro: false,
          enterprise: true
        },
        {
          name: "Dedicated support",
          free: false,
          starter: false,
          pro: false,
          enterprise: true
        },
        {
          name: "Custom integrations",
          free: false,
          starter: false,
          pro: false,
          enterprise: true
        },
        {
          name: "SLA guarantees",
          free: false,
          starter: false,
          pro: false,
          enterprise: true
        }
      ]
    }
  ];

  const handlePlanSelect = (planId: string) => {
    // In production, this would handle plan selection and payment
    console.log(`Selected plan: ${planId}`);
  };

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start free and upgrade as your store grows. All plans include our core budget-aware pricing engine.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {tiers.map((tier) => {
            const IconComponent = tier.icon;
            return (
              <Card 
                key={tier.id}
                className={`relative transition-all duration-300 hover:shadow-xl ${
                  tier.popular 
                    ? 'border-2 border-shopify-green shadow-lg scale-105' 
                    : 'border border-gray-200 hover:border-gray-300'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-shopify-green text-white px-4 py-1 text-sm font-medium">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center ${
                    tier.popular ? 'bg-shopify-green' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      tier.popular ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  
                  <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                    {tier.name}
                  </CardTitle>
                  
                  <div className="mb-2">
                    {tier.price !== null ? (
                      <div className="text-3xl font-bold text-gray-900">
                        ${tier.price}
                        <span className="text-base font-normal text-gray-500 ml-1">
                          /{tier.period.split(' ')[1]}
                        </span>
                      </div>
                    ) : (
                      <div className="text-3xl font-bold text-gray-900">
                        Custom
                        <span className="text-base font-normal text-gray-500 ml-1">
                          pricing
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600">{tier.description}</p>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Features List */}
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Limitations (if any) */}
                  {tier.limitations.length > 0 && (
                    <ul className="space-y-2 mb-6 pb-6 border-b border-gray-100">
                      {tier.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-500">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* CTA Button */}
                  <Button 
                    className={`w-full ${
                      tier.popular 
                        ? 'bg-shopify-green hover:bg-shopify-green/90 text-white' 
                        : tier.buttonVariant === 'default'
                        ? 'bg-gray-900 hover:bg-gray-800 text-white'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    variant={tier.popular ? 'default' : tier.buttonVariant}
                    onClick={() => handlePlanSelect(tier.id)}
                    aria-label={`Select ${tier.name} plan`}
                  >
                    {tier.buttonText}
                  </Button>

                  {/* Additional Info */}
                  {tier.id === 'starter' && (
                    <p className="text-xs text-center text-gray-500 mt-2">
                      No credit card required
                    </p>
                  )}
                  {tier.id === 'enterprise' && (
                    <p className="text-xs text-center text-gray-500 mt-2">
                      Custom quote within 24 hours
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Feature Comparison
            </h3>
            <p className="text-gray-600">
              See exactly what's included in each plan
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-6 font-semibold text-gray-900 min-w-[200px]">
                      Features
                    </th>
                    <th className="text-center p-6 font-semibold text-gray-600 min-w-[120px]">
                      Free
                    </th>
                    <th className="text-center p-6 font-semibold text-shopify-green min-w-[120px]">
                      Starter
                    </th>
                    <th className="text-center p-6 font-semibold text-purple-600 min-w-[120px]">
                      Pro
                    </th>
                    <th className="text-center p-6 font-semibold text-yellow-600 min-w-[120px]">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((category, categoryIndex) => (
                    <React.Fragment key={category.category}>
                      <tr className="bg-gray-25">
                        <td colSpan={5} className="p-4 font-semibold text-gray-800 bg-gray-50">
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature, featureIndex) => (
                        <tr 
                          key={`${categoryIndex}-${featureIndex}`}
                          className={featureIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="p-4 text-gray-900">{feature.name}</td>
                          <td className="text-center p-4">
                            {feature.free ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="text-center p-4">
                            {feature.starter ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="text-center p-4">
                            {feature.pro ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className="text-center p-4">
                            {feature.enterprise ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Can I upgrade or downgrade my plan anytime?
              </h4>
              <p className="text-gray-600 mb-6">
                Yes, you can change your plan at any time. Upgrades take effect immediately, 
                and downgrades take effect at the end of your current billing period.
              </p>

              <h4 className="font-semibold text-gray-900 mb-3">
                What happens to my data if I cancel?
              </h4>
              <p className="text-gray-600 mb-6">
                Your configuration data is retained for 30 days after cancellation. 
                Customer budget data is never stored on our servers by default.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Do you offer refunds?
              </h4>
              <p className="text-gray-600 mb-6">
                We offer a 30-day money-back guarantee for all paid plans. 
                If you're not satisfied, we'll provide a full refund.
              </p>

              <h4 className="font-semibold text-gray-900 mb-3">
                Is there a setup fee?
              </h4>
              <p className="text-gray-600 mb-6">
                No setup fees for any plan. Installation takes under 5 minutes 
                with our single JavaScript file integration.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-shopify-green to-green-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Ready to boost your conversions?
            </h3>
            <p className="text-xl mb-6 opacity-90">
              Join thousands of Shopify merchants using budget-aware pricing
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg"
                className="bg-white text-shopify-green hover:bg-gray-100"
                onClick={() => handlePlanSelect('starter')}
              >
                Start Free Trial
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white hover:text-shopify-green"
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
