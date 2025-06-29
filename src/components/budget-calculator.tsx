import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calculator, PieChart, DollarSign, TrendingUp } from "lucide-react";
import { BudgetEngine } from "@/lib/budget-engine";
import { BudgetData } from "@/types";

interface BudgetCalculatorProps {
  onBudgetChange?: (budget: BudgetData) => void;
  initialIncome?: number;
}

export default function BudgetCalculator({ 
  onBudgetChange, 
  initialIncome = 0 
}: BudgetCalculatorProps) {
  const [monthlyIncome, setMonthlyIncome] = useState<string>(initialIncome.toString());
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [productPrice, setProductPrice] = useState<string>("");
  const [purchaseImpact, setPurchaseImpact] = useState<any>(null);
  const [saveToStorage, setSaveToStorage] = useState(false);

  // Calculate budget breakdown when income changes
  useEffect(() => {
    const income = parseFloat(monthlyIncome);
    if (income > 0) {
      const breakdown = BudgetEngine.calculateBudgetBreakdown(income);
      setBudgetData(breakdown);
      onBudgetChange?.(breakdown);
    } else {
      setBudgetData(null);
      onBudgetChange?.(null as any);
    }
  }, [monthlyIncome, onBudgetChange]);

  // Calculate purchase impact when product price changes
  useEffect(() => {
    const price = parseFloat(productPrice);
    if (price > 0 && budgetData) {
      const impact = BudgetEngine.calculatePurchaseImpact(price, budgetData, "wants");
      setPurchaseImpact(impact);
    } else {
      setPurchaseImpact(null);
    }
  }, [productPrice, budgetData]);

  const handleIncomeChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setMonthlyIncome(value);
    }
  };

  const handleProductPriceChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setProductPrice(value);
    }
  };

  const handleSaveBudget = () => {
    if (budgetData) {
      BudgetEngine.saveBudgetToStorage(budgetData, saveToStorage);
    }
  };

  const handleClearBudget = () => {
    BudgetEngine.clearBudgetFromStorage();
    setMonthlyIncome("");
    setBudgetData(null);
    setPurchaseImpact(null);
  };

  // Load saved budget on component mount
  useEffect(() => {
    const savedBudget = BudgetEngine.loadBudgetFromStorage();
    if (savedBudget) {
      setMonthlyIncome(savedBudget.monthlyIncome.toString());
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Income Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-shopify-green" />
            <span>Budget Calculator</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="monthly-income" className="text-sm font-medium mb-2 block">
              Monthly After-Tax Income
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                id="monthly-income"
                type="text"
                placeholder="5000"
                value={monthlyIncome}
                onChange={(e) => handleIncomeChange(e.target.value)}
                className="pl-8 text-lg accessibility-focus"
                aria-describedby="income-help"
              />
            </div>
            <p id="income-help" className="text-xs text-gray-500 mt-1">
              Your total monthly take-home pay
            </p>
          </div>

          {/* Budget Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveBudget}
              disabled={!budgetData}
            >
              Save Budget
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearBudget}
            >
              Clear Budget
            </Button>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={saveToStorage}
                onChange={(e) => setSaveToStorage(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Remember my budget</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Budget Breakdown */}
      {budgetData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              <span>Your Budget Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Visual Budget Wheel */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-48 h-48 rounded-full budget-wheel shadow-lg"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center shadow-md">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">Monthly</div>
                      <div className="text-sm text-gray-600">Budget</div>
                    </div>
                  </div>
                </div>
                
                {/* Labels */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="bg-green-100 px-3 py-1 rounded-full text-green-800 text-sm font-medium">
                    50% Needs
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2">
                  <div className="bg-blue-100 px-3 py-1 rounded-full text-blue-800 text-sm font-medium">
                    30% Wants
                  </div>
                </div>
                <div className="absolute -bottom-2 -left-2">
                  <div className="bg-yellow-100 px-3 py-1 rounded-full text-yellow-800 text-sm font-medium">
                    20% Savings
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Amounts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="font-medium text-green-800 mb-1">Needs (50%)</div>
                <div className="text-2xl font-bold text-green-900">
                  ${budgetData.needsAmount.toFixed(0)}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Rent, groceries, utilities
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <div className="font-medium text-blue-800 mb-1">Wants (30%)</div>
                <div className="text-2xl font-bold text-blue-900">
                  ${budgetData.wantsAmount.toFixed(0)}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Entertainment, dining, shopping
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <div className="font-medium text-yellow-800 mb-1">Savings (20%)</div>
                <div className="text-2xl font-bold text-yellow-900">
                  ${budgetData.savingsAmount.toFixed(0)}
                </div>
                <div className="text-xs text-yellow-600 mt-1">
                  Emergency fund, retirement
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Impact Analysis */}
      {budgetData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span>Purchase Impact Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="product-price" className="text-sm font-medium mb-2 block">
                  Product Price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <Input
                    id="product-price"
                    type="text"
                    placeholder="299"
                    value={productPrice}
                    onChange={(e) => handleProductPriceChange(e.target.value)}
                    className="pl-8 accessibility-focus"
                  />
                </div>
              </div>

              {purchaseImpact && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>% of Wants Budget:</span>
                    <span className="font-semibold">
                      {purchaseImpact.categoryPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>% of Total Budget:</span>
                    <span className="font-semibold">
                      {purchaseImpact.totalPercentage.toFixed(1)}%
                    </span>
                  </div>
                  
                  {/* Progress bars */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Wants Budget Usage</span>
                        <span>{purchaseImpact.categoryPercentage.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={Math.min(100, purchaseImpact.categoryPercentage)} 
                        className="h-2"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Total Budget Usage</span>
                        <span>{purchaseImpact.totalPercentage.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={Math.min(100, purchaseImpact.totalPercentage)} 
                        className="h-2"
                      />
                    </div>
                  </div>

                  {/* Affordability indicator */}
                  <div className={`p-3 rounded-lg text-sm ${
                    purchaseImpact.affordableWithinCategory
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}>
                    {purchaseImpact.affordableWithinCategory ? (
                      <span className="font-medium">✓ Fits within your wants budget</span>
                    ) : (
                      <span className="font-medium">⚠ Exceeds your wants budget</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
