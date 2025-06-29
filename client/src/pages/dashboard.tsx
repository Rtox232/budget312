import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import RepeatPurchaseSettingsComponent from "@/components/repeat-purchase-settings";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Settings, 
  Save,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ShoppingCart,
  Calculator,
  Eye
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  conversionRate: number;
  revenueImpact: number;
  budgetUsers: number;
  avgDiscount: number;
}

interface PricingRule {
  id: number;
  storeId: number;
  name: string;
  needsPercentage: string;
  wantsPercentage: string;
  savingsPercentage: string;
  maxDiscountPercentage: string;
  isActive: boolean;
}

interface ActivityItem {
  id: string;
  type: 'purchase' | 'calculation' | 'view';
  description: string;
  details: string;
  timestamp: string;
  amount?: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [pricingRules, setPricingRules] = useState<PricingRule | null>(null);

  // Repeat purchase settings state
  const [repeatPurchaseSettings, setRepeatPurchaseSettings] = useState({
    isAppEnabled: true,
    budgetRefreshType: "monthly",
    maxBudgetApplications: 5,
    budgetRefreshDays: 30,
    repeatCustomerDiscount: 10,
    discountTerms: "Discount applies to repeat customers who stay within their budget. Limited to 5 applications per month.",
    termsPageUrl: "https://yourstore.com/discount-terms",
    enabledForProducts: [] as string[],
    productSelectionType: "all" as "all" | "specific" | "exclude"
  });

  // Mock data - in production this would come from APIs
  const mockStats: DashboardStats = {
    conversionRate: 23.5,
    revenueImpact: 12847,
    budgetUsers: 1234,
    avgDiscount: 8.3
  };

  const mockActivities: ActivityItem[] = [
    {
      id: "1",
      type: "purchase",
      description: "Customer purchased MacBook Pro",
      details: "Budget: $2000, Final Price: $1899 (5% budget discount)",
      timestamp: "2 min ago",
      amount: 1899
    },
    {
      id: "2",
      type: "calculation",
      description: "Budget calculation for iPhone 15",
      details: "Customer budget: $800, Product: $999 (needs 20% discount)",
      timestamp: "5 min ago"
    },
    {
      id: "3",
      type: "view",
      description: "Budget tool viewed on Nike Shoes",
      details: "Customer exploring budget options, no purchase yet",
      timestamp: "12 min ago"
    }
  ];

  // Fetch store configuration
  const { data: storeConfig, isLoading: configLoading } = useQuery({
    queryKey: ['/api/store/demo-store.myshopify.com'],
  });

  // Fetch pricing rules
  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/store/1/pricing-rules'],
  });

  // Update pricing rules mutation
  const updateRulesMutation = useMutation({
    mutationFn: async (rules: any) => {
      return await apiRequest('POST', '/api/store/1/pricing-rules', rules);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store/1/pricing-rules'] });
      toast({
        title: "Settings Updated",
        description: "Your pricing rules have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update pricing rules. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize pricing rules from API data
  useEffect(() => {
    if (rulesData && rulesData.length > 0) {
      const activeRule = rulesData.find((rule: PricingRule) => rule.isActive) || rulesData[0];
      setPricingRules(activeRule);
    }
  }, [rulesData]);

  const handleSaveRules = () => {
    if (!pricingRules) return;
    
    updateRulesMutation.mutate({
      name: pricingRules.name,
      needsPercentage: parseFloat(pricingRules.needsPercentage),
      wantsPercentage: parseFloat(pricingRules.wantsPercentage),
      savingsPercentage: parseFloat(pricingRules.savingsPercentage),
      maxDiscountPercentage: parseFloat(pricingRules.maxDiscountPercentage),
    });
  };

  const updatePricingRule = (field: keyof PricingRule, value: string) => {
    if (!pricingRules) return;
    setPricingRules({ ...pricingRules, [field]: value });
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'purchase':
        return <ShoppingCart className="w-4 h-4 text-green-600" />;
      case 'calculation':
        return <Calculator className="w-4 h-4 text-blue-600" />;
      case 'view':
        return <Eye className="w-4 h-4 text-yellow-600" />;
      default:
        return <Eye className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityBgColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-100';
      case 'calculation':
        return 'bg-blue-100';
      case 'view':
        return 'bg-yellow-100';
      default:
        return 'bg-gray-100';
    }
  };

  if (configLoading || rulesLoading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-shopify-green" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gray-900 text-white rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl font-bold">BudgetPrice Dashboard</h1>
              <p className="text-gray-300">
                {storeConfig?.shopifyDomain || 'Demo Store'} - Starter Plan
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-shopify-green hover:bg-shopify-green/90">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Conversion Rate</span>
                </div>
                <ArrowUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-900 mb-1">
                +{mockStats.conversionRate}%
              </div>
              <div className="text-xs text-green-600">vs. previous period</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Revenue Impact</span>
                </div>
                <ArrowUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-1">
                ${mockStats.revenueImpact.toLocaleString()}
              </div>
              <div className="text-xs text-blue-600">additional revenue</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-600">Budget Users</span>
                </div>
                <ArrowUp className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-900 mb-1">
                {mockStats.budgetUsers.toLocaleString()}
              </div>
              <div className="text-xs text-purple-600">customers used budget tool</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-600">Avg. Discount</span>
                </div>
                <ArrowDown className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-yellow-900 mb-1">
                {mockStats.avgDiscount}%
              </div>
              <div className="text-xs text-yellow-600">healthy margin maintained</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="repeat-purchase">Repeat Purchase</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-shopify-green" />
                    <span>Conversion Rate Trend</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">Chart visualization</p>
                      <p className="text-sm">Showing 23.5% improvement in conversions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Budget Rule Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Budget Rule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pricingRules && (
                    <>
                      <div className="text-center mb-4">
                        <h3 className="font-semibold text-lg">{pricingRules.name}</h3>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <span className="font-medium text-green-800">Needs</span>
                          <span className="font-bold text-green-900">{pricingRules.needsPercentage}%</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <span className="font-medium text-blue-800">Wants</span>
                          <span className="font-bold text-blue-900">{pricingRules.wantsPercentage}%</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                          <span className="font-medium text-yellow-800">Savings</span>
                          <span className="font-bold text-yellow-900">{pricingRules.savingsPercentage}%</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Max Discount</span>
                        <Badge variant="outline">{pricingRules.maxDiscountPercentage}%</Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget Rule Configuration</CardTitle>
                <p className="text-sm text-gray-600">
                  Customize how customer budgets are allocated across different categories.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {pricingRules && (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="rule-name">Rule Name</Label>
                        <Input
                          id="rule-name"
                          value={pricingRules.name}
                          onChange={(e) => updatePricingRule('name', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="max-discount">Maximum Discount Percentage</Label>
                        <Input
                          id="max-discount"
                          type="number"
                          min="0"
                          max="100"
                          value={pricingRules.maxDiscountPercentage}
                          onChange={(e) => updatePricingRule('maxDiscountPercentage', e.target.value)}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Prevent excessive discounting</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4">Budget Category Allocation</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="needs-percentage">Needs (%)</Label>
                          <Input
                            id="needs-percentage"
                            type="number"
                            min="0"
                            max="100"
                            value={pricingRules.needsPercentage}
                            onChange={(e) => updatePricingRule('needsPercentage', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="wants-percentage">Wants (%)</Label>
                          <Input
                            id="wants-percentage"
                            type="number"
                            min="0"
                            max="100"
                            value={pricingRules.wantsPercentage}
                            onChange={(e) => updatePricingRule('wantsPercentage', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="savings-percentage">Savings (%)</Label>
                          <Input
                            id="savings-percentage"
                            type="number"
                            min="0"
                            max="100"
                            value={pricingRules.savingsPercentage}
                            onChange={(e) => updatePricingRule('savingsPercentage', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Total: </strong>
                          {(
                            parseFloat(pricingRules.needsPercentage || '0') +
                            parseFloat(pricingRules.wantsPercentage || '0') +
                            parseFloat(pricingRules.savingsPercentage || '0')
                          ).toFixed(1)}%
                          {(
                            parseFloat(pricingRules.needsPercentage || '0') +
                            parseFloat(pricingRules.wantsPercentage || '0') +
                            parseFloat(pricingRules.savingsPercentage || '0')
                          ) !== 100 && (
                            <span className="text-red-600 ml-2">
                              (Should equal 100%)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-4">Feature Settings</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Budget Education</div>
                            <div className="text-sm text-gray-600">Show educational content to customers</div>
                          </div>
                          <Switch defaultChecked={true} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Analytics Tracking</div>
                            <div className="text-sm text-gray-600">Collect anonymized usage data</div>
                          </div>
                          <Switch defaultChecked={true} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Theme Adaptation</div>
                            <div className="text-sm text-gray-600">Automatically match your store's theme</div>
                          </div>
                          <Switch defaultChecked={true} />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSaveRules}
                        disabled={updateRulesMutation.isPending}
                        className="bg-shopify-green hover:bg-shopify-green/90"
                      >
                        {updateRulesMutation.isPending ? (
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Repeat Purchase Tab */}
          <TabsContent value="repeat-purchase" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Repeat Purchase Settings</CardTitle>
                <p className="text-sm text-gray-600">
                  Configure how repeat customers interact with budget-based discounts and period tracking.
                </p>
              </CardHeader>
              <CardContent>
                <RepeatPurchaseSettingsComponent 
                  settings={repeatPurchaseSettings}
                  onSettingsChange={setRepeatPurchaseSettings}
                  tier="professional"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Budget Interactions</CardTitle>
                <p className="text-sm text-gray-600">
                  Live feed of customer budget-related activities in your store.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityBgColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-gray-900 truncate">
                            {activity.description}
                          </h4>
                          <span className="text-sm text-gray-500 whitespace-nowrap ml-2">
                            {activity.timestamp}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600">{activity.details}</p>
                        
                        {activity.amount && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-green-700 border-green-200">
                              ${activity.amount.toLocaleString()}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <Button variant="outline">
                    Load More Activities
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">47</div>
                  <div className="text-sm text-gray-600">Purchases Today</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Calculator className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">156</div>
                  <div className="text-sm text-gray-600">Budget Calculations</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">312</div>
                  <div className="text-sm text-gray-600">Widget Views</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
