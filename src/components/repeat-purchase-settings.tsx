import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  RefreshCw, 
  Users, 
  ShoppingCart, 
  FileText, 
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Calendar,
  Hash,
  Tag
} from "lucide-react";

interface RepeatPurchaseSettings {
  isAppEnabled: boolean;
  budgetRefreshType: string;
  maxBudgetApplications: number;
  budgetRefreshDays: number;
  repeatCustomerDiscount: number;
  discountTerms: string;
  termsPageUrl: string;
  enabledForProducts: string[];
  productSelectionType: "all" | "specific" | "exclude";
}

interface RepeatPurchaseSettingsProps {
  settings: RepeatPurchaseSettings;
  onSettingsChange: (settings: RepeatPurchaseSettings) => void;
  tier: string;
  className?: string;
}

export default function RepeatPurchaseSettingsComponent({ 
  settings, 
  onSettingsChange,
  tier = "free",
  className 
}: RepeatPurchaseSettingsProps) {
  const [localSettings, setLocalSettings] = useState<RepeatPurchaseSettings>(settings);
  const [activeTab, setActiveTab] = useState("general");
  const [productInput, setProductInput] = useState("");

  const updateSetting = (key: keyof RepeatPurchaseSettings, value: any) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onSettingsChange(updated);
  };

  const addProduct = () => {
    if (productInput.trim() && !localSettings.enabledForProducts.includes(productInput.trim())) {
      const updated = [...localSettings.enabledForProducts, productInput.trim()];
      updateSetting("enabledForProducts", updated);
      setProductInput("");
    }
  };

  const removeProduct = (productId: string) => {
    const updated = localSettings.enabledForProducts.filter(id => id !== productId);
    updateSetting("enabledForProducts", updated);
  };

  const isFeatureAvailable = (feature: string) => {
    switch (feature) {
      case "repeatPurchases":
        return ["starter", "pro", "enterprise"].includes(tier);
      case "customTerms":
        return ["pro", "enterprise"].includes(tier);
      case "productSelection":
        return ["pro", "enterprise"].includes(tier);
      case "unlimitedApplications":
        return ["pro", "enterprise"].includes(tier);
      default:
        return true;
    }
  };

  const getRefreshTypeDescription = (type: string) => {
    switch (type) {
      case "per_purchase":
        return "Reset discount eligibility after each purchase";
      case "daily":
        return "Reset discount eligibility every day";
      case "weekly":
        return "Reset discount eligibility every week";
      case "monthly":
        return "Reset discount eligibility every month";
      case "never":
        return "Never reset - one-time use only";
      default:
        return "Custom refresh period";
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-shopify-green" />
            <span>Repeat Purchase Settings</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={localSettings.isAppEnabled ? "default" : "secondary"}>
              {localSettings.isAppEnabled ? "Enabled" : "Disabled"}
            </Badge>
            <Switch
              checked={localSettings.isAppEnabled}
              onCheckedChange={(checked) => updateSetting("isAppEnabled", checked)}
            />
          </div>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure how budget discounts work with repeat purchases and customer tracking
        </p>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="terms">Terms</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 mt-6">
            {/* App Enable/Disable */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {localSettings.isAppEnabled ? (
                    <Unlock className="w-5 h-5 text-green-600" />
                  ) : (
                    <Lock className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <h3 className="font-medium">Budget Price App Status</h3>
                    <p className="text-sm text-gray-600">
                      {localSettings.isAppEnabled 
                        ? "App is active and calculating budget discounts" 
                        : "App is disabled - no budget calculations will be shown"
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={localSettings.isAppEnabled}
                  onCheckedChange={(checked) => updateSetting("isAppEnabled", checked)}
                />
              </div>
            </div>

            {localSettings.isAppEnabled && (
              <>
                {/* Budget Refresh Settings */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                    <h3 className="font-medium">Budget Refresh Settings</h3>
                    {!isFeatureAvailable("repeatPurchases") && (
                      <Badge variant="outline" className="text-xs">
                        Starter+ Required
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="refreshType">Refresh Type</Label>
                      <Select 
                        value={localSettings.budgetRefreshType} 
                        onValueChange={(value) => updateSetting("budgetRefreshType", value)}
                        disabled={!isFeatureAvailable("repeatPurchases")}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select refresh type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per_purchase">Per Purchase</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="never">Never Reset</SelectItem>
                          <SelectItem value="custom">Custom Period</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        {getRefreshTypeDescription(localSettings.budgetRefreshType)}
                      </p>
                    </div>

                    {localSettings.budgetRefreshType === "custom" && (
                      <div>
                        <Label htmlFor="refreshDays">Custom Refresh Period (Days)</Label>
                        <Input
                          id="refreshDays"
                          type="number"
                          min="1"
                          max="365"
                          value={localSettings.budgetRefreshDays}
                          onChange={(e) => updateSetting("budgetRefreshDays", parseInt(e.target.value) || 30)}
                          className="mt-1"
                          disabled={!isFeatureAvailable("repeatPurchases")}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Application Limits */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-purple-600" />
                    <h3 className="font-medium">Usage Limits</h3>
                    {!isFeatureAvailable("unlimitedApplications") && (
                      <Badge variant="outline" className="text-xs">
                        Pro+ Required for Unlimited
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxApplications">Max Applications Per Period</Label>
                      <Input
                        id="maxApplications"
                        type="number"
                        min="-1"
                        value={localSettings.maxBudgetApplications}
                        onChange={(e) => updateSetting("maxBudgetApplications", parseInt(e.target.value) || -1)}
                        className="mt-1"
                        disabled={!isFeatureAvailable("repeatPurchases")}
                        placeholder="-1 for unlimited"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {localSettings.maxBudgetApplications === -1 
                          ? "Unlimited budget discount applications" 
                          : `Customers can use budget discounts ${localSettings.maxBudgetApplications} times per ${localSettings.budgetRefreshType === "custom" ? `${localSettings.budgetRefreshDays} days` : localSettings.budgetRefreshType}`
                        }
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="repeatDiscount">Repeat Customer Bonus (%)</Label>
                      <Input
                        id="repeatDiscount"
                        type="number"
                        min="0"
                        max="50"
                        step="0.5"
                        value={localSettings.repeatCustomerDiscount}
                        onChange={(e) => updateSetting("repeatCustomerDiscount", parseFloat(e.target.value) || 0)}
                        className="mt-1"
                        disabled={!isFeatureAvailable("repeatPurchases")}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Additional discount for returning customers who've made previous purchases
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="products" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-green-600" />
                <h3 className="font-medium">Product Selection</h3>
                {!isFeatureAvailable("productSelection") && (
                  <Badge variant="outline" className="text-xs">
                    Pro+ Required
                  </Badge>
                )}
              </div>

              {/* Product Selection Type */}
              <div className="space-y-3">
                <Label>Application Scope</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      localSettings.productSelectionType === "all" 
                        ? "border-shopify-green bg-green-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => updateSetting("productSelectionType", "all")}
                    disabled={!isFeatureAvailable("productSelection")}
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-600 mb-2" />
                    <div className="font-medium text-sm">All Products</div>
                    <div className="text-xs text-gray-600">Apply to entire store</div>
                  </button>

                  <button
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      localSettings.productSelectionType === "specific" 
                        ? "border-shopify-green bg-green-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => updateSetting("productSelectionType", "specific")}
                    disabled={!isFeatureAvailable("productSelection")}
                  >
                    <Tag className="w-4 h-4 text-blue-600 mb-2" />
                    <div className="font-medium text-sm">Specific Products</div>
                    <div className="text-xs text-gray-600">Include only selected</div>
                  </button>

                  <button
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      localSettings.productSelectionType === "exclude" 
                        ? "border-shopify-green bg-green-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => updateSetting("productSelectionType", "exclude")}
                    disabled={!isFeatureAvailable("productSelection")}
                  >
                    <AlertCircle className="w-4 h-4 text-orange-600 mb-2" />
                    <div className="font-medium text-sm">Exclude Products</div>
                    <div className="text-xs text-gray-600">Exclude selected only</div>
                  </button>
                </div>
              </div>

              {/* Product Management */}
              {(localSettings.productSelectionType === "specific" || localSettings.productSelectionType === "exclude") && (
                <div className="space-y-3">
                  <Label>
                    {localSettings.productSelectionType === "specific" ? "Included" : "Excluded"} Products
                  </Label>
                  
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter Product ID or Handle"
                      value={productInput}
                      onChange={(e) => setProductInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addProduct()}
                      disabled={!isFeatureAvailable("productSelection")}
                    />
                    <Button
                      onClick={addProduct}
                      disabled={!productInput.trim() || !isFeatureAvailable("productSelection")}
                    >
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {localSettings.enabledForProducts.map((productId, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-mono">{productId}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProduct(productId)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>

                  {localSettings.enabledForProducts.length === 0 && (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      No products {localSettings.productSelectionType === "specific" ? "included" : "excluded"} yet
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="terms" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="font-medium">Discount Terms & Conditions</h3>
                {!isFeatureAvailable("customTerms") && (
                  <Badge variant="outline" className="text-xs">
                    Pro+ Required
                  </Badge>
                )}
              </div>

              {/* Custom Terms Text */}
              <div className="space-y-3">
                <Label htmlFor="discountTerms">Custom Terms Text</Label>
                <Textarea
                  id="discountTerms"
                  placeholder="Enter your custom terms and conditions for budget discounts..."
                  value={localSettings.discountTerms}
                  onChange={(e) => updateSetting("discountTerms", e.target.value)}
                  rows={6}
                  disabled={!isFeatureAvailable("customTerms")}
                />
                <p className="text-xs text-gray-500">
                  This text will be displayed to customers when they see budget discount options
                </p>
              </div>

              {/* Terms Page URL */}
              <div className="space-y-3">
                <Label htmlFor="termsUrl">Terms Page URL (Optional)</Label>
                <div className="flex space-x-2">
                  <Input
                    id="termsUrl"
                    placeholder="https://yourstore.com/budget-discount-terms"
                    value={localSettings.termsPageUrl}
                    onChange={(e) => updateSetting("termsPageUrl", e.target.value)}
                    disabled={!isFeatureAvailable("customTerms")}
                  />
                  {localSettings.termsPageUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(localSettings.termsPageUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Link to a dedicated page with detailed terms and conditions
                </p>
              </div>

              {/* Terms Preview */}
              <div className="space-y-3">
                <Label>Customer Preview</Label>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-sm mb-2">Budget Discount Terms</h4>
                  {localSettings.discountTerms ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {localSettings.discountTerms}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Budget discounts apply to help you stay within your financial goals. 
                      Discount eligibility may be limited based on store settings.
                    </p>
                  )}
                  {localSettings.termsPageUrl && (
                    <div className="mt-2">
                      <a
                        href={localSettings.termsPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View complete terms and conditions →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium">Advanced Settings</h3>
              </div>

              {/* Current Configuration Summary */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">Current Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">App Status:</span>
                    <span className="float-right font-medium">
                      {localSettings.isAppEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Refresh Type:</span>
                    <span className="float-right font-medium capitalize">
                      {localSettings.budgetRefreshType.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Max Applications:</span>
                    <span className="float-right font-medium">
                      {localSettings.maxBudgetApplications === -1 ? "Unlimited" : localSettings.maxBudgetApplications}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Repeat Bonus:</span>
                    <span className="float-right font-medium">
                      {localSettings.repeatCustomerDiscount}%
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Product Scope:</span>
                    <span className="float-right font-medium capitalize">
                      {localSettings.productSelectionType}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">Products Count:</span>
                    <span className="float-right font-medium">
                      {localSettings.productSelectionType === "all" 
                        ? "All" 
                        : localSettings.enabledForProducts.length
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Feature Availability */}
              <div className="space-y-3">
                <h4 className="font-medium">Feature Availability</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {[
                    { key: "Basic Budget Calculator", available: true },
                    { key: "Repeat Purchase Tracking", available: isFeatureAvailable("repeatPurchases") },
                    { key: "Custom Terms & Conditions", available: isFeatureAvailable("customTerms") },
                    { key: "Product Selection", available: isFeatureAvailable("productSelection") },
                    { key: "Unlimited Applications", available: isFeatureAvailable("unlimitedApplications") },
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded border">
                      <span>{feature.key}</span>
                      {feature.available ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Upgrade Notice */}
              {tier === "free" && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Upgrade to unlock advanced features:</p>
                      <ul className="text-xs space-y-1 list-disc list-inside">
                        <li>Repeat purchase tracking and limits</li>
                        <li>Custom terms and conditions</li>
                        <li>Product-specific settings</li>
                        <li>Enhanced analytics and reporting</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}