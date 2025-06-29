import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PiggyBank, Info } from "lucide-react";
import PricingScale from "./pricing-scale";
import { BudgetEngine } from "@/lib/budget-engine";
import { BudgetData, ProductPricing } from "@/types";

export default function ProductDemo() {
  const [monthlyBudget, setMonthlyBudget] = useState<string>("");
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [productPricing, setProductPricing] = useState<ProductPricing | null>(null);

  // Demo product data
  const demoProduct = {
    id: "demo-macbook",
    title: "MacBook Pro 14\" M3",
    basePrice: 2199,
    shopifyDiscounts: 200,
    imageUrl: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    imageAlt: "MacBook Pro on modern desk setup"
  };

  // Calculate budget breakdown when monthly budget changes
  useEffect(() => {
    const budget = parseFloat(monthlyBudget);
    if (budget > 0) {
      const breakdown = BudgetEngine.calculateBudgetBreakdown(budget);
      setBudgetData(breakdown);

      // Calculate product pricing
      const pricing = BudgetEngine.calculateProductPricing(
        demoProduct.id,
        demoProduct.basePrice,
        breakdown,
        "wants",
        demoProduct.shopifyDiscounts
      );
      setProductPricing(pricing);
    } else {
      setBudgetData(null);
      setProductPricing(null);
    }
  }, [monthlyBudget]);

  const handleBudgetChange = (value: string) => {
    // Only allow numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setMonthlyBudget(value);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Product Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {/* Product Image */}
        <div className="relative">
          <img
            src={demoProduct.imageUrl}
            alt={demoProduct.imageAlt}
            className="w-full h-64 object-cover rounded-lg shadow-lg"
          />
          <div className="absolute top-4 right-4">
            <Badge variant="destructive" className="bg-red-500">
              9% OFF
            </Badge>
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-4">
          <h4 className="text-xl font-bold text-gray-900">
            {demoProduct.title}
          </h4>
          
          <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-bold text-gray-900">
              ${productPricing?.finalPrice.toLocaleString() || demoProduct.basePrice.toLocaleString()}
            </span>
            <span className="text-lg text-gray-500 line-through">
              ${demoProduct.basePrice.toLocaleString()}
            </span>
            {productPricing && productPricing.discountPercentage > 0 && (
              <Badge variant="destructive">
                {productPricing.discountPercentage.toFixed(0)}% OFF
              </Badge>
            )}
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Base Price:</span>
              <span>${demoProduct.basePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Shopify Discount:</span>
              <span>-${demoProduct.shopifyDiscounts}</span>
            </div>
            {productPricing && productPricing.budgetDiscount > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>Budget Discount:</span>
                <span>-${productPricing.budgetDiscount.toFixed(0)}</span>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Your Price:</span>
              <span>${productPricing?.finalPrice.toLocaleString() || (demoProduct.basePrice - demoProduct.shopifyDiscounts).toLocaleString()}</span>
            </div>
          </div>

          {/* Within Budget Indicator */}
          {productPricing && budgetData && (
            <div className={`p-3 rounded-lg ${
              productPricing.withinBudget 
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-yellow-50 border border-yellow-200 text-yellow-800"
            }`}>
              {productPricing.withinBudget ? (
                <span className="font-medium">✓ Within your "wants" budget!</span>
              ) : (
                <span className="font-medium">⚠ Slightly over your "wants" budget</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Budget Input Section */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <PiggyBank className="w-5 h-5 text-shopify-green" />
            <h5 className="font-semibold text-gray-900">
              What's your budget for this purchase?
            </h5>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="monthly-budget" className="text-sm font-medium mb-2 block">
                Monthly Budget
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="monthly-budget"
                  type="text"
                  placeholder="e.g., 5000"
                  value={monthlyBudget}
                  onChange={(e) => handleBudgetChange(e.target.value)}
                  className="pl-8 accessibility-focus"
                  aria-describedby="budget-help"
                />
              </div>
              <p id="budget-help" className="text-xs text-gray-500 mt-1">
                Your total monthly income/budget
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Available for this category
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Auto-calculated"
                  value={budgetData ? `$${budgetData.wantsAmount.toFixed(0)}` : ""}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Info 
                    className="w-4 h-4 text-gray-400 cursor-help" 
                    title="Based on 50/30/20 rule - 30% for wants"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                30% of budget (wants category)
              </p>
            </div>
          </div>

          {/* Pricing Scale */}
          {budgetData && (
            <div className="mt-6">
              <PricingScale
                currentPrice={productPricing?.finalPrice || (demoProduct.basePrice - demoProduct.shopifyDiscounts)}
                budgetAmount={budgetData.wantsAmount}
                maxPrice={demoProduct.basePrice}
              />
            </div>
          )}

          {/* Budget Breakdown */}
          {budgetData && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="font-medium text-green-800">Needs (50%)</div>
                <div className="text-lg font-bold text-green-900">
                  ${budgetData.needsAmount.toFixed(0)}
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <div className="font-medium text-blue-800">Wants (30%)</div>
                <div className="text-lg font-bold text-blue-900">
                  ${budgetData.wantsAmount.toFixed(0)}
                </div>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <div className="font-medium text-yellow-800">Savings (20%)</div>
                <div className="text-lg font-bold text-yellow-900">
                  ${budgetData.savingsAmount.toFixed(0)}
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          {productPricing && (
            <div className="mt-6 text-center">
              <Button 
                size="lg" 
                className="bg-shopify-green hover:bg-shopify-green/90 text-white"
              >
                Add to Cart - ${productPricing.finalPrice.toLocaleString()}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
