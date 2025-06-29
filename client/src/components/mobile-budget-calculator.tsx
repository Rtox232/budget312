import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  Home, 
  ShoppingBag, 
  PiggyBank, 
  Calculator,
  TrendingUp,
  AlertCircle 
} from "lucide-react";
import { BudgetEngine } from "@/lib/budget-engine";

export default function MobileBudgetCalculator() {
  const [monthlyIncome, setMonthlyIncome] = useState<string>("");
  const [budgetData, setBudgetData] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    if (!monthlyIncome || parseFloat(monthlyIncome) <= 0) return;
    
    setIsCalculating(true);
    
    try {
      const income = parseFloat(monthlyIncome);
      const result = BudgetEngine.calculateBudgetBreakdown(income);
      setBudgetData(result);
      
      // Save to storage with mobile flag
      await BudgetEngine.saveBudgetToStorage(result, true, "mobile-user", 1);
    } catch (error) {
      console.error("Budget calculation failed:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBudgetIcon = (category: string) => {
    switch (category) {
      case 'needs': return Home;
      case 'wants': return ShoppingBag;
      case 'savings': return PiggyBank;
      default: return Calculator;
    }
  };

  const getBudgetColor = (category: string) => {
    switch (category) {
      case 'needs': return 'bg-green-500';
      case 'wants': return 'bg-blue-500';
      case 'savings': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getBudgetProgress = (category: string) => {
    switch (category) {
      case 'needs': return 50;
      case 'wants': return 30;
      case 'savings': return 20;
      default: return 0;
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-shopify-green rounded-full flex items-center justify-center mx-auto mb-4">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Budget Calculator
        </h1>
        <p className="text-sm text-gray-600">
          Calculate your 50/30/20 budget breakdown
        </p>
      </div>

      {/* Input Card */}
      <Card className="border-2 border-dashed border-gray-200 bg-gray-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-shopify-green" />
            Monthly Income
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income" className="text-sm font-medium">
              Enter your monthly take-home pay
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="income"
                type="number"
                placeholder="5000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="pl-10 h-12 text-lg font-medium"
                inputMode="numeric"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleCalculate}
            disabled={!monthlyIncome || parseFloat(monthlyIncome) <= 0 || isCalculating}
            className="w-full h-12 bg-shopify-green hover:bg-shopify-green/90 text-white font-medium"
          >
            {isCalculating ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Calculating...
              </div>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Calculate Budget
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {budgetData && (
        <div className="space-y-4">
          {/* Overview Card */}
          <Card className="bg-gradient-to-r from-shopify-green to-shopify-green/80 text-white">
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <p className="text-sm opacity-90">Your Monthly Budget</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(budgetData.monthlyIncome)}
                </p>
                <div className="flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">50/30/20 Rule Applied</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <div className="space-y-3">
            {[
              { 
                key: 'needs', 
                label: 'Needs', 
                amount: budgetData.needsAmount,
                description: 'Rent, utilities, food, transportation'
              },
              { 
                key: 'wants', 
                label: 'Wants', 
                amount: budgetData.wantsAmount,
                description: 'Entertainment, dining out, hobbies'
              },
              { 
                key: 'savings', 
                label: 'Savings', 
                amount: budgetData.savingsAmount,
                description: 'Emergency fund, retirement, investments'
              }
            ].map((category) => {
              const Icon = getBudgetIcon(category.key);
              const progress = getBudgetProgress(category.key);
              
              return (
                <Card key={category.key} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-lg ${getBudgetColor(category.key)} flex items-center justify-center mr-3`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {category.label}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {progress}% of income
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(category.amount)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {progress}%
                        </Badge>
                      </div>
                    </div>
                    
                    <Progress 
                      value={progress} 
                      className="h-2 mb-2"
                    />
                    
                    <p className="text-xs text-gray-600">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Mobile Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">
                    Mobile Tip
                  </h4>
                  <p className="text-sm text-blue-800">
                    Save this page to your home screen for quick budget calculations on the go.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-12"
              onClick={() => {
                setBudgetData(null);
                setMonthlyIncome("");
              }}
            >
              Reset
            </Button>
            <Button 
              className="h-12 bg-shopify-green hover:bg-shopify-green/90"
              onClick={() => {
                // Share functionality could be added here
                if (navigator.share) {
                  navigator.share({
                    title: 'My Budget Breakdown',
                    text: `I calculated my monthly budget: ${formatCurrency(budgetData.monthlyIncome)}`,
                    url: window.location.href
                  });
                }
              }}
            >
              Share Results
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}