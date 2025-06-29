import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CartTrackingWidget from "@/components/cart-tracking-widget";
import PremiumFeaturesDashboard from "@/components/premium-features-dashboard";
import { 
  ShoppingCart, 
  Crown, 
  Plus, 
  Minus,
  Settings,
  BarChart3
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

export default function PremiumCartDemo() {
  const [activeView, setActiveView] = useState<"demo" | "dashboard">("demo");
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      productId: "1",
      title: "Organic Quinoa (2 lbs)",
      price: 12.99,
      quantity: 1,
      budgetCategory: "needs",
      budgetImpact: 12.99,
      discountApplied: 0,
      fitsInBudget: true
    },
    {
      productId: "2", 
      title: "Premium Coffee Beans",
      price: 24.99,
      quantity: 1,
      budgetCategory: "wants",
      budgetImpact: 24.99,
      discountApplied: 0,
      fitsInBudget: true
    }
  ]);

  const sampleProducts = [
    { id: "3", title: "Multi-Vitamin Pack", price: 18.99, category: "needs" as const },
    { id: "4", title: "Artisan Chocolate", price: 15.99, category: "wants" as const },
    { id: "5", title: "Quality Kitchen Knife", price: 89.99, category: "savings" as const },
    { id: "6", title: "Protein Powder", price: 32.99, category: "needs" as const },
    { id: "7", title: "Board Game", price: 29.99, category: "wants" as const }
  ];

  const mockBudget = {
    monthlyIncome: 4000,
    needsPercentage: 50,
    wantsPercentage: 30,
    savingsPercentage: 20,
    needsAmount: 2000,
    wantsAmount: 1200,
    savingsAmount: 800
  };

  const calculateBudgetBreakdown = () => {
    const needsItems = cartItems.filter(item => item.budgetCategory === "needs");
    const wantsItems = cartItems.filter(item => item.budgetCategory === "wants");
    const savingsItems = cartItems.filter(item => item.budgetCategory === "savings");

    const needsSpent = needsItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const wantsSpent = wantsItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const savingsSpent = savingsItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
      needs: {
        allocated: mockBudget.needsAmount,
        spent: needsSpent,
        remaining: mockBudget.needsAmount - needsSpent,
        items: needsItems
      },
      wants: {
        allocated: mockBudget.wantsAmount,
        spent: wantsSpent,
        remaining: mockBudget.wantsAmount - wantsSpent,
        items: wantsItems
      },
      savings: {
        allocated: mockBudget.savingsAmount,
        spent: savingsSpent,
        remaining: mockBudget.savingsAmount - savingsSpent,
        items: savingsItems
      }
    };
  };

  const totalCartValue = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const budgetBreakdown = calculateBudgetBreakdown();

  const mockDiscounts = totalCartValue >= 50 ? [{
    code: "BUDGET25SAVE",
    type: "percentage" as const,
    value: 10,
    appliedAmount: totalCartValue * 0.1,
    reason: "Budget-conscious shopping reward: 10% off for spending over $50"
  }] : [];

  const mockRecommendations = [
    {
      productId: "rec1",
      title: "Essential Olive Oil",
      price: 16.99,
      budgetCategory: "needs" as const,
      reason: "Essential cooking ingredient within your needs budget",
      remainingBudgetAfter: budgetBreakdown.needs.remaining - 16.99,
      url: "/products/olive-oil"
    },
    {
      productId: "rec2",
      title: "Gourmet Tea Set",
      price: 22.99,
      budgetCategory: "wants" as const,
      reason: "Perfect complement to your coffee, fits wants budget",
      remainingBudgetAfter: budgetBreakdown.wants.remaining - 22.99,
      url: "/products/tea-set"
    }
  ];

  const addToCart = (productId: string) => {
    const product = sampleProducts.find(p => p.id === productId);
    if (!product) return;

    const newItem: CartItem = {
      productId: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
      budgetCategory: product.category,
      budgetImpact: product.price,
      discountApplied: 0,
      fitsInBudget: true
    };

    setCartItems(prev => [...prev, newItem]);
  };

  const updateQuantity = (productId: string, change: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(0, item.quantity + change);
        if (newQuantity === 0) {
          return null;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const handleRecommendationClick = (productId: string) => {
    const recommendation = mockRecommendations.find(r => r.productId === productId);
    if (recommendation) {
      const newItem: CartItem = {
        productId: recommendation.productId,
        title: recommendation.title,
        price: recommendation.price,
        quantity: 1,
        budgetCategory: recommendation.budgetCategory,
        budgetImpact: recommendation.price,
        discountApplied: 0,
        fitsInBudget: true
      };
      setCartItems(prev => [...prev, newItem]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Crown className="w-10 h-10 text-yellow-500" />
              Premium Cart Tracking
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
              Advanced budget-aware shopping experience for Shopify merchants
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={activeView === "demo" ? "default" : "outline"}
              onClick={() => setActiveView("demo")}
              className="gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Customer Demo
            </Button>
            <Button 
              variant={activeView === "dashboard" ? "default" : "outline"}
              onClick={() => setActiveView("dashboard")}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Merchant Dashboard
            </Button>
          </div>
        </div>

        {activeView === "demo" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Product Selection */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Current Budget
                  </CardTitle>
                  <CardDescription>
                    Monthly budget based on $4,000 income
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Needs (50%)</span>
                    <span className="font-medium">${mockBudget.needsAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Wants (30%)</span>
                    <span className="font-medium">${mockBudget.wantsAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Savings (20%)</span>
                    <span className="font-medium">${mockBudget.savingsAmount.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Available Products</CardTitle>
                  <CardDescription>
                    Add items to your cart to see budget tracking in action
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sampleProducts.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{product.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                          <span className="text-sm font-medium">
                            ${product.price}
                          </span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => addToCart(product.id)}
                        className="ml-2"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Middle Column - Cart Items */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Shopping Cart
                    <Badge variant="outline" className="ml-auto">
                      {cartItems.length} items
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cartItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Your cart is empty</p>
                      <p className="text-xs">Add products to see premium tracking</p>
                    </div>
                  ) : (
                    cartItems.map(item => (
                      <div key={item.productId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {item.budgetCategory}
                            </Badge>
                            <span className="text-sm">${item.price}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateQuantity(item.productId, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="mx-2 text-sm font-medium min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateQuantity(item.productId, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}

                  {cartItems.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>${totalCartValue.toFixed(2)}</span>
                        </div>
                        {mockDiscounts.map((discount, index) => (
                          <div key={index} className="flex justify-between text-sm text-green-600">
                            <span>{discount.code}:</span>
                            <span>-${discount.appliedAmount.toFixed(2)}</span>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span>${(totalCartValue - mockDiscounts.reduce((sum, d) => sum + d.appliedAmount, 0)).toFixed(2)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Premium Widget */}
            <div>
              <CartTrackingWidget 
                cartItems={cartItems}
                budgetBreakdown={budgetBreakdown}
                appliedDiscounts={mockDiscounts}
                recommendations={mockRecommendations}
                totalCartValue={totalCartValue}
                onRecommendationClick={handleRecommendationClick}
                onApplyDiscount={() => {}}
              />
            </div>
          </div>
        )}

        {activeView === "dashboard" && (
          <PremiumFeaturesDashboard />
        )}
      </div>
    </div>
  );
}