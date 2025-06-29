import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart, 
  TrendingUp, 
  Gift, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  Heart,
  PiggyBank,
  Home,
  Sparkles
} from "lucide-react";

interface CartItem {
  productId: string;
  variantId?: string;
  title: string;
  price: number;
  quantity: number;
  budgetCategory: "needs" | "wants" | "savings";
  budgetImpact: number;
  discountApplied: number;
  fitsInBudget: boolean;
}

interface BudgetBreakdown {
  needs: {
    allocated: number;
    spent: number;
    remaining: number;
    items: CartItem[];
  };
  wants: {
    allocated: number;
    spent: number;
    remaining: number;
    items: CartItem[];
  };
  savings: {
    allocated: number;
    spent: number;
    remaining: number;
    items: CartItem[];
  };
}

interface AutoDiscount {
  code: string;
  type: "percentage" | "fixed_amount" | "free_shipping";
  value: number;
  appliedAmount: number;
  reason: string;
}

interface ProductRecommendation {
  productId: string;
  title: string;
  price: number;
  budgetCategory: "needs" | "wants" | "savings";
  reason: string;
  remainingBudgetAfter: number;
  imageUrl?: string;
  url: string;
}

interface CartTrackingWidgetProps {
  cartItems: CartItem[];
  budgetBreakdown: BudgetBreakdown;
  appliedDiscounts: AutoDiscount[];
  recommendations: ProductRecommendation[];
  totalCartValue: number;
  onRecommendationClick: (productId: string) => void;
  onApplyDiscount: (discountCode: string) => void;
}

export default function CartTrackingWidget({
  cartItems,
  budgetBreakdown,
  appliedDiscounts,
  recommendations,
  totalCartValue,
  onRecommendationClick,
  onApplyDiscount
}: CartTrackingWidgetProps) {
  const [activeTab, setActiveTab] = useState<"breakdown" | "discounts" | "recommendations">("breakdown");

  const categoryIcons = {
    needs: Home,
    wants: Heart,
    savings: PiggyBank
  };

  const categoryColors = {
    needs: "text-green-600 bg-green-100 dark:bg-green-900/20",
    wants: "text-blue-600 bg-blue-100 dark:bg-blue-900/20", 
    savings: "text-purple-600 bg-purple-100 dark:bg-purple-900/20"
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const getBudgetStatus = (category: keyof BudgetBreakdown) => {
    const { spent, allocated } = budgetBreakdown[category];
    const percentage = (spent / allocated) * 100;
    
    if (percentage <= 70) return { status: "good", color: "bg-green-500" };
    if (percentage <= 90) return { status: "warning", color: "bg-yellow-500" };
    return { status: "over", color: "bg-red-500" };
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="w-5 h-5" />
          Budget Tracker
          <Badge variant="outline" className="ml-auto">
            {cartItems.length} items
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex rounded-lg bg-muted p-1">
          {[
            { id: "breakdown", label: "Budget", icon: TrendingUp },
            { id: "discounts", label: "Discounts", icon: DollarSign },
            { id: "recommendations", label: "Suggestions", icon: Gift }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Budget Breakdown Tab */}
        {activeTab === "breakdown" && (
          <div className="space-y-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Cart Total</p>
              <p className="text-2xl font-bold">{formatCurrency(totalCartValue)}</p>
            </div>

            {Object.entries(budgetBreakdown).map(([category, data]) => {
              const { status, color } = getBudgetStatus(category as keyof BudgetBreakdown);
              const Icon = categoryIcons[category as keyof typeof categoryIcons];
              const percentage = (data.spent / data.allocated) * 100;

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${categoryColors[category as keyof typeof categoryColors]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium capitalize">{category}</span>
                      {status === "over" && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                      {status === "good" && data.items.length > 0 && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{formatCurrency(data.spent)} / {formatCurrency(data.allocated)}</p>
                      <p className={`text-xs ${data.remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {data.remaining >= 0 ? `${formatCurrency(data.remaining)} left` : `${formatCurrency(Math.abs(data.remaining))} over`}
                      </p>
                    </div>
                  </div>
                  
                  <Progress value={Math.min(percentage, 100)} className="h-2" />
                  
                  {data.items.length > 0 && (
                    <div className="text-xs text-muted-foreground ml-6">
                      {data.items.map(item => (
                        <div key={item.productId} className="flex justify-between">
                          <span>{item.title} (×{item.quantity})</span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Discounts Tab */}
        {activeTab === "discounts" && (
          <div className="space-y-3">
            {appliedDiscounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No discounts available yet</p>
                <p className="text-xs">Add more items to unlock discounts!</p>
              </div>
            ) : (
              appliedDiscounts.map((discount, index) => (
                <div key={index} className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-sm">Discount Applied!</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{discount.reason}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {discount.code}
                        </Badge>
                        <span className="text-sm font-medium text-green-600">
                          -{formatCurrency(discount.appliedAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {totalCartValue >= 50 && appliedDiscounts.length === 0 && (
              <div className="p-3 border-2 border-dashed border-yellow-300 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  🎉 Discount Available!
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Your cart qualifies for a discount. Complete your purchase to apply it automatically.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === "recommendations" && (
          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recommendations yet</p>
                <p className="text-xs">Add items to get personalized suggestions!</p>
              </div>
            ) : (
              recommendations.map((rec, index) => {
                const Icon = categoryIcons[rec.budgetCategory];
                return (
                  <div key={index} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`p-1 rounded ${categoryColors[rec.budgetCategory]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{rec.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-medium text-sm">{formatCurrency(rec.price)}</span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onRecommendationClick(rec.productId)}
                            className="h-7 text-xs"
                          >
                            Add to Cart
                          </Button>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          {formatCurrency(rec.remainingBudgetAfter)} left in {rec.budgetCategory}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Summary Footer */}
        <Separator />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(totalCartValue)}</span>
          </div>
          {appliedDiscounts.map((discount, index) => (
            <div key={index} className="flex justify-between text-green-600">
              <span>{discount.code}:</span>
              <span>-{formatCurrency(discount.appliedAmount)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Total:</span>
            <span>
              {formatCurrency(
                totalCartValue - appliedDiscounts.reduce((sum, d) => sum + d.appliedAmount, 0)
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}