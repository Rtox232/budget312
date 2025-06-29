import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ShoppingCart, 
  TrendingUp, 
  Gift, 
  DollarSign, 
  Crown, 
  Settings, 
  BarChart3,
  Target,
  Zap
} from "lucide-react";

interface PremiumFeatures {
  premiumCartTracking: boolean;
  autoDiscountEnabled: boolean;
  productRecommendationsEnabled: boolean;
  budgetRemainingDisplayEnabled: boolean;
  minimumDiscountThreshold: number;
}

interface Store {
  id: number;
  tier: string;
  premiumCartTracking: boolean;
  autoDiscountEnabled: boolean;
  productRecommendationsEnabled: boolean;
  budgetRemainingDisplayEnabled: boolean;
  minimumDiscountThreshold: number;
}

export default function PremiumFeaturesDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Partial<PremiumFeatures>>({});

  // Mock store data - replace with actual API call
  const { data: store, isLoading } = useQuery<Store>({
    queryKey: ['/api/stores/current'],
    enabled: false, // Enable when API is ready
    initialData: {
      id: 1,
      tier: "premium",
      premiumCartTracking: false,
      autoDiscountEnabled: false,
      productRecommendationsEnabled: false,
      budgetRemainingDisplayEnabled: false,
      minimumDiscountThreshold: 50
    }
  });

  const updateFeaturesMutation = useMutation({
    mutationFn: async (features: Partial<PremiumFeatures>) => {
      // Replace with actual API call
      const response = await fetch('/api/stores/premium-features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features)
      });
      if (!response.ok) throw new Error('Failed to update features');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stores/current'] });
      setPendingChanges({});
      toast({
        title: "Features Updated",
        description: "Premium cart tracking features have been updated successfully."
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update premium features. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleToggleChange = (feature: keyof PremiumFeatures, value: boolean) => {
    if (store?.tier !== "premium") {
      toast({
        title: "Premium Feature",
        description: "This feature requires a premium subscription. Upgrade to unlock advanced cart tracking.",
        variant: "destructive"
      });
      return;
    }

    setPendingChanges(prev => ({
      ...prev,
      [feature]: value
    }));
  };

  const handleThresholdChange = (value: string) => {
    const threshold = parseFloat(value) || 0;
    setPendingChanges(prev => ({
      ...prev,
      minimumDiscountThreshold: threshold
    }));
  };

  const saveChanges = () => {
    if (Object.keys(pendingChanges).length > 0) {
      updateFeaturesMutation.mutate(pendingChanges);
    }
  };

  const resetChanges = () => {
    setPendingChanges({});
  };

  const currentFeatures = {
    premiumCartTracking: pendingChanges.premiumCartTracking ?? store?.premiumCartTracking ?? false,
    autoDiscountEnabled: pendingChanges.autoDiscountEnabled ?? store?.autoDiscountEnabled ?? false,
    productRecommendationsEnabled: pendingChanges.productRecommendationsEnabled ?? store?.productRecommendationsEnabled ?? false,
    budgetRemainingDisplayEnabled: pendingChanges.budgetRemainingDisplayEnabled ?? store?.budgetRemainingDisplayEnabled ?? false,
    minimumDiscountThreshold: pendingChanges.minimumDiscountThreshold ?? store?.minimumDiscountThreshold ?? 50
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;
  const isPremium = store?.tier === "premium";

  if (isLoading) {
    return <div className="p-6">Loading premium features...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Premium Cart Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Advanced features to maximize conversions and provide better customer experience
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPremium ? (
            <Badge variant="default" className="gap-1">
              <Crown className="w-3 h-3" />
              Premium Active
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <Target className="w-3 h-3" />
              Free Plan
            </Badge>
          )}
        </div>
      </div>

      {!isPremium && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Crown className="w-5 h-5" />
              Upgrade to Premium
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              Unlock advanced cart tracking, automatic discounts, and intelligent product recommendations to increase your revenue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-yellow-600 hover:bg-yellow-700">
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Cart Tracking Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Premium Cart Tracking
          </CardTitle>
          <CardDescription>
            Master toggle for all premium cart features. Enable comprehensive cart analysis and budget tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="cart-tracking"
              checked={currentFeatures.premiumCartTracking}
              onCheckedChange={(checked) => handleToggleChange('premiumCartTracking', checked)}
              disabled={!isPremium}
            />
            <Label htmlFor="cart-tracking" className="text-sm font-medium">
              Enable Premium Cart Tracking
            </Label>
          </div>
          
          {currentFeatures.premiumCartTracking && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✓ Cart tracking is enabled. Customers will see detailed budget breakdowns and itemized cart analysis.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sub-features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Automatic Discounts */}
        <Card className={!currentFeatures.premiumCartTracking ? "opacity-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Automatic Discounts
            </CardTitle>
            <CardDescription>
              Apply discounts automatically when customers meet minimum purchase thresholds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-discounts"
                checked={currentFeatures.autoDiscountEnabled}
                onCheckedChange={(checked) => handleToggleChange('autoDiscountEnabled', checked)}
                disabled={!isPremium || !currentFeatures.premiumCartTracking}
              />
              <Label htmlFor="auto-discounts" className="text-sm font-medium">
                Enable Auto Discounts
              </Label>
            </div>

            {currentFeatures.autoDiscountEnabled && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="threshold" className="text-sm">Minimum Threshold ($)</Label>
                </div>
                <Input
                  id="threshold"
                  type="number"
                  value={currentFeatures.minimumDiscountThreshold}
                  onChange={(e) => handleThresholdChange(e.target.value)}
                  placeholder="50.00"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">
                  Customers spending above this amount will receive automatic discounts
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Recommendations */}
        <Card className={!currentFeatures.premiumCartTracking ? "opacity-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Smart Recommendations
            </CardTitle>
            <CardDescription>
              Suggest products that fit within customer's remaining budget
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="recommendations"
                checked={currentFeatures.productRecommendationsEnabled}
                onCheckedChange={(checked) => handleToggleChange('productRecommendationsEnabled', checked)}
                disabled={!isPremium || !currentFeatures.premiumCartTracking}
              />
              <Label htmlFor="recommendations" className="text-sm font-medium">
                Enable Smart Recommendations
              </Label>
            </div>
            
            {currentFeatures.productRecommendationsEnabled && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ✓ AI-powered recommendations will suggest products based on remaining budget in each category
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Display */}
        <Card className={!currentFeatures.premiumCartTracking ? "opacity-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Budget Remaining Display
            </CardTitle>
            <CardDescription>
              Show customers their remaining budget in each category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="budget-display"
                checked={currentFeatures.budgetRemainingDisplayEnabled}
                onCheckedChange={(checked) => handleToggleChange('budgetRemainingDisplayEnabled', checked)}
                disabled={!isPremium || !currentFeatures.premiumCartTracking}
              />
              <Label htmlFor="budget-display" className="text-sm font-medium">
                Show Budget Remaining
              </Label>
            </div>
            
            {currentFeatures.budgetRemainingDisplayEnabled && (
              <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  ✓ Customers will see remaining budget for Needs, Wants, and Savings categories
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Expected Impact
            </CardTitle>
            <CardDescription>
              Estimated improvements with premium features enabled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Conversion Rate</span>
                <span className="text-sm font-medium text-green-600">+15-25%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Average Order Value</span>
                <span className="text-sm font-medium text-green-600">+12-18%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Customer Satisfaction</span>
                <span className="text-sm font-medium text-green-600">+20-30%</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center font-medium">
                <span className="text-sm">Total Revenue Impact</span>
                <span className="text-sm text-green-600">+25-40%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save/Reset Actions */}
      {hasChanges && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  You have unsaved changes
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Save your changes to apply the new premium feature settings
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={resetChanges}
                  disabled={updateFeaturesMutation.isPending}
                >
                  Reset
                </Button>
                <Button 
                  onClick={saveChanges}
                  disabled={updateFeaturesMutation.isPending}
                >
                  {updateFeaturesMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}