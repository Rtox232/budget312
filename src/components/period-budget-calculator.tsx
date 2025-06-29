import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Calculator, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info
} from "lucide-react";

interface PeriodBudgetData {
  periodIncome: number;
  period: "weekly" | "biweekly" | "monthly" | "yearly";
  needsAmount: number;
  wantsAmount: number;
  savingsAmount: number;
  remainingApplications: number;
  totalApplications: number;
  nextRefreshDate: Date;
}

interface PeriodBudgetCalculatorProps {
  onBudgetChange?: (budget: PeriodBudgetData) => void;
  initialIncome?: number;
  maxApplications?: number;
  refreshType?: string;
  refreshDays?: number;
  className?: string;
}

export default function PeriodBudgetCalculator({ 
  onBudgetChange,
  initialIncome = 0,
  maxApplications = -1,
  refreshType = "monthly",
  refreshDays = 30,
  className 
}: PeriodBudgetCalculatorProps) {
  const [income, setIncome] = useState(initialIncome);
  const [period, setPeriod] = useState<"weekly" | "biweekly" | "monthly" | "yearly">("monthly");
  const [needsPercentage, setNeedsPercentage] = useState(50);
  const [wantsPercentage, setWantsPercentage] = useState(30);
  const [savingsPercentage, setSavingsPercentage] = useState(20);
  const [applications, setApplications] = useState(0);
  const [activeTab, setActiveTab] = useState("calculator");

  // Calculate period multipliers
  const getPeriodMultiplier = (selectedPeriod: string) => {
    switch (selectedPeriod) {
      case "weekly": return 52;
      case "biweekly": return 26;
      case "monthly": return 12;
      case "yearly": return 1;
      default: return 12;
    }
  };

  // Calculate annual income for consistency
  const annualIncome = income * getPeriodMultiplier(period);
  
  // Calculate period budget amounts
  const periodIncome = annualIncome / getPeriodMultiplier(period);
  const needsAmount = periodIncome * (needsPercentage / 100);
  const wantsAmount = periodIncome * (wantsPercentage / 100);
  const savingsAmount = periodIncome * (savingsPercentage / 100);

  // Calculate next refresh date
  const getNextRefreshDate = () => {
    const now = new Date();
    switch (refreshType) {
      case "daily":
        return new Date(now.setDate(now.getDate() + 1));
      case "weekly":
        return new Date(now.setDate(now.getDate() + 7));
      case "monthly":
        return new Date(now.setMonth(now.getMonth() + 1));
      default:
        return new Date(now.setDate(now.getDate() + refreshDays));
    }
  };

  const remainingApplications = maxApplications === -1 ? -1 : Math.max(0, maxApplications - applications);
  const nextRefreshDate = getNextRefreshDate();

  // Update parent when budget changes
  useEffect(() => {
    if (onBudgetChange) {
      onBudgetChange({
        periodIncome,
        period,
        needsAmount,
        wantsAmount,
        savingsAmount,
        remainingApplications,
        totalApplications: maxApplications,
        nextRefreshDate,
      });
    }
  }, [periodIncome, period, needsAmount, wantsAmount, savingsAmount, remainingApplications, maxApplications, nextRefreshDate, onBudgetChange]);

  const handlePercentageChange = (category: string, value: number) => {
    const remaining = 100 - value;
    
    switch (category) {
      case "needs":
        setNeedsPercentage(value);
        // Distribute remaining between wants and savings proportionally
        const wantsRatio = wantsPercentage / (wantsPercentage + savingsPercentage) || 0.6;
        setWantsPercentage(Math.round(remaining * wantsRatio));
        setSavingsPercentage(remaining - Math.round(remaining * wantsRatio));
        break;
      case "wants":
        setWantsPercentage(value);
        const needsRatio = needsPercentage / (needsPercentage + savingsPercentage) || 0.7;
        setNeedsPercentage(Math.round(remaining * needsRatio));
        setSavingsPercentage(remaining - Math.round(remaining * needsRatio));
        break;
      case "savings":
        setSavingsPercentage(value);
        const needsRatio2 = needsPercentage / (needsPercentage + wantsPercentage) || 0.6;
        setNeedsPercentage(Math.round(remaining * needsRatio2));
        setWantsPercentage(remaining - Math.round(remaining * needsRatio2));
        break;
    }
  };

  const resetToDefaults = () => {
    setNeedsPercentage(50);
    setWantsPercentage(30);
    setSavingsPercentage(20);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getApplicationStatus = () => {
    if (maxApplications === -1) return "unlimited";
    if (remainingApplications === 0) return "exhausted";
    if (remainingApplications <= 2) return "low";
    return "good";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "exhausted": return "bg-red-100 text-red-800 border-red-200";
      case "low": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "good": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-shopify-green" />
          <span>Period Budget Calculator</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Calculate your budget across different time periods and track discount usage
        </p>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="tracking">Usage Tracking</TabsTrigger>
            <TabsTrigger value="projection">Projection</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6 mt-6">
            {/* Income and Period Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="income">Income Amount</Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="Enter your income"
                  value={income || ""}
                  onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="period">Income Period</Label>
                <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Budget Category Sliders */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Budget Allocation</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefaults}
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reset 50/30/20
                </Button>
              </div>

              {/* Needs */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium text-green-700">Needs ({needsPercentage}%)</Label>
                  <span className="text-sm font-semibold text-green-700">{formatCurrency(needsAmount)}</span>
                </div>
                <Input
                  type="range"
                  min="20"
                  max="80"
                  value={needsPercentage}
                  onChange={(e) => handlePercentageChange("needs", parseInt(e.target.value))}
                  className="w-full accent-green-600"
                />
                <p className="text-xs text-gray-500">Essential expenses like housing, food, utilities</p>
              </div>

              {/* Wants */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium text-blue-700">Wants ({wantsPercentage}%)</Label>
                  <span className="text-sm font-semibold text-blue-700">{formatCurrency(wantsAmount)}</span>
                </div>
                <Input
                  type="range"
                  min="10"
                  max="60"
                  value={wantsPercentage}
                  onChange={(e) => handlePercentageChange("wants", parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <p className="text-xs text-gray-500">Entertainment, dining out, hobbies, shopping</p>
              </div>

              {/* Savings */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium text-purple-700">Savings ({savingsPercentage}%)</Label>
                  <span className="text-sm font-semibold text-purple-700">{formatCurrency(savingsAmount)}</span>
                </div>
                <Input
                  type="range"
                  min="5"
                  max="50"
                  value={savingsPercentage}
                  onChange={(e) => handlePercentageChange("savings", parseInt(e.target.value))}
                  className="w-full accent-purple-600"
                />
                <p className="text-xs text-gray-500">Emergency fund, investments, future goals</p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Budget Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Annual Income:</span>
                  <span className="float-right font-semibold">{formatCurrency(annualIncome)}</span>
                </div>
                <div>
                  <span className="text-gray-600">{period.charAt(0).toUpperCase() + period.slice(1)} Income:</span>
                  <span className="float-right font-semibold">{formatCurrency(periodIncome)}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Discount Usage Tracking</h3>
                <Badge className={getStatusColor(getApplicationStatus())}>
                  {getApplicationStatus() === "unlimited" ? "Unlimited Use" : `${remainingApplications} remaining`}
                </Badge>
              </div>

              {/* Application Progress */}
              {maxApplications > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Discount Applications Used</span>
                    <span>{applications} / {maxApplications}</span>
                  </div>
                  <Progress 
                    value={(applications / maxApplications) * 100} 
                    className="h-2"
                  />
                </div>
              )}

              {/* Next Refresh */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Next Budget Refresh</span>
                </div>
                <p className="text-sm text-blue-700">
                  {nextRefreshDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Your discount applications will reset based on store settings
                </p>
              </div>

              {/* Current Period Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <div className="text-sm font-medium text-green-900">Available for Needs</div>
                  <div className="text-lg font-bold text-green-700">{formatCurrency(needsAmount)}</div>
                </div>

                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-sm font-medium text-blue-900">Available for Wants</div>
                  <div className="text-lg font-bold text-blue-700">{formatCurrency(wantsAmount)}</div>
                </div>

                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <div className="text-sm font-medium text-purple-900">Savings Target</div>
                  <div className="text-lg font-bold text-purple-700">{formatCurrency(savingsAmount)}</div>
                </div>
              </div>

              {/* Usage Controls */}
              <div className="space-y-3">
                <Label>Simulate Discount Usage</Label>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setApplications(Math.max(0, applications - 1))}
                    disabled={applications === 0}
                  >
                    -1 Use
                  </Button>
                  <span className="flex items-center px-3 py-1 bg-gray-100 rounded text-sm">
                    {applications} used
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setApplications(applications + 1)}
                    disabled={maxApplications > 0 && applications >= maxApplications}
                  >
                    +1 Use
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="projection" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Budget Projections</h3>
              
              {/* Annual Projection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Annual Totals</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Needs:</span>
                      <span className="font-semibold">{formatCurrency(needsAmount * getPeriodMultiplier(period))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Wants:</span>
                      <span className="font-semibold">{formatCurrency(wantsAmount * getPeriodMultiplier(period))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Savings:</span>
                      <span className="font-semibold">{formatCurrency(savingsAmount * getPeriodMultiplier(period))}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Discount Impact</h4>
                  <div className="space-y-2 text-sm">
                    {maxApplications > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span>Max Applications per {refreshType}:</span>
                          <span className="font-semibold">{maxApplications}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Refresh cycles per year:</span>
                          <span className="font-semibold">
                            {refreshType === "monthly" ? 12 : refreshType === "weekly" ? 52 : Math.floor(365 / refreshDays)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span>Max annual applications:</span>
                      <span className="font-semibold">
                        {maxApplications === -1 ? "Unlimited" : 
                         maxApplications * (refreshType === "monthly" ? 12 : refreshType === "weekly" ? 52 : Math.floor(365 / refreshDays))
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Budget Tips:</p>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      <li>Use budget discounts strategically for larger purchases</li>
                      <li>Plan recurring purchases around refresh cycles</li>
                      <li>Track your spending to optimize future budgets</li>
                      <li>Consider increasing your savings percentage when possible</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}