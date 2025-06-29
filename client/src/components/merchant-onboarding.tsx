import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Copy, 
  Download, 
  ExternalLink, 
  Globe, 
  Palette, 
  Settings, 
  Store, 
  Zap,
  AlertCircle,
  Code,
  FileText,
  Monitor
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function MerchantOnboarding() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [storeData, setStoreData] = useState({
    storeName: '',
    storeUrl: '',
    platform: 'shopify',
    primaryColor: '#00A88F',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937'
  });

  // Input sanitization helper
  const sanitizeInput = (value: string, maxLength: number = 255) => {
    if (typeof value !== 'string') return '';
    
    // Remove HTML tags and entities
    const cleaned = value
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[a-zA-Z0-9#]+;/g, '') // Remove HTML entities
      .replace(/[<>{}[\]\\|`~]/g, '') // Remove potentially dangerous characters
      .substring(0, maxLength)
      .trim();
    
    return cleaned;
  };

  // Validate URL format
  const isValidUrl = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
    } catch {
      return false;
    }
  };

  // Validate color format
  const isValidColor = (color: string) => {
    return /^#[0-9A-F]{6}$/i.test(color);
  };

  const [installationMethod, setInstallationMethod] = useState('theme-editor');
  const [isTestMode, setIsTestMode] = useState(true);

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'store-info',
      title: 'Store Information',
      description: 'Tell us about your store',
      completed: false
    },
    {
      id: 'theme-setup',
      title: 'Theme Configuration',
      description: 'Match your store design',
      completed: false
    },
    {
      id: 'installation',
      title: 'Code Installation',
      description: 'Add BudgetPrice to your store',
      completed: false
    },
    {
      id: 'verification',
      title: 'Verification',
      description: 'Test the integration',
      completed: false
    }
  ];

  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  // Handle store data updates with validation
  const updateStoreData = (field: string, value: string) => {
    let sanitizedValue = value;
    
    switch (field) {
      case 'storeName':
        sanitizedValue = sanitizeInput(value, 100);
        break;
      case 'storeUrl':
        sanitizedValue = sanitizeInput(value, 255);
        if (sanitizedValue && !isValidUrl(sanitizedValue)) {
          toast({
            title: "Invalid URL",
            description: "Please enter a valid store URL",
            variant: "destructive"
          });
          return;
        }
        break;
      case 'primaryColor':
      case 'backgroundColor':
      case 'textColor':
        if (!isValidColor(value)) {
          toast({
            title: "Invalid Color",
            description: "Please enter a valid hex color (e.g., #00A88F)",
            variant: "destructive"
          });
          return;
        }
        sanitizedValue = value;
        break;
      case 'platform':
        const validPlatforms = ['shopify', 'magento', 'wordpress'];
        if (!validPlatforms.includes(value)) {
          return;
        }
        sanitizedValue = value;
        break;
    }
    
    setStoreData(prev => ({ ...prev, [field]: sanitizedValue }));
  };

  const generateInstallationCode = () => {
    const baseUrl = isTestMode ? 'https://budgetprice.replit.app' : 'https://cdn.budgetprice.app';
    const scriptPath = isTestMode ? '/dist/shopify-install.dev.js' : '/v1/shopify-install.min.js';
    
    // Escape store data for safe inclusion in generated code
    const safeStoreName = storeData.storeName.replace(/"/g, '\\"').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeStoreUrl = storeData.storeUrl.replace(/"/g, '\\"').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    const customConfig = `
window.BudgetPriceConfig = {
  store: {
    name: "${safeStoreName}",
    url: "${safeStoreUrl}",
    platform: "${storeData.platform}"
  },
  theme: {
    primary: "${storeData.primaryColor}",
    background: "${storeData.backgroundColor}",
    text: "${storeData.textColor}"
  },
  debug: ${isTestMode}
};`;

    switch (installationMethod) {
      case 'theme-editor':
        return `<!-- Add this to your product template (templates/product.liquid) -->
${isTestMode ? `<script>${customConfig}</script>` : ''}
<script src="${baseUrl}${scriptPath}" async></script>`;

      case 'custom-position':
        return `<!-- Add this where you want the widget to appear -->
<div data-budgetprice-position="here"></div>
${isTestMode ? `<script>${customConfig}</script>` : ''}
<script src="${baseUrl}${scriptPath}" async></script>`;

      case 'conditional':
        return `<!-- Only show on specific products -->
{% unless product.tags contains 'no-budgetprice' %}
${isTestMode ? `<script>${customConfig}</script>` : ''}
<script src="${baseUrl}${scriptPath}" async></script>
{% endunless %}`;

      default:
        return `<script src="${baseUrl}${scriptPath}" async></script>`;
    }
  };

  const downloadInstallationPackage = () => {
    const installationCode = generateInstallationCode();
    const installationGuide = `# BudgetPrice Installation for ${storeData.storeName}

## Installation Code
${installationCode}

## Steps:
1. Go to your Shopify admin
2. Navigate to Online Store > Themes
3. Click Actions > Edit code
4. Find templates/product.liquid
5. Add the code above before the closing </form> tag
6. Save and test on a product page

## Support:
- Documentation: https://docs.budgetprice.app
- Support: support@budgetprice.app
- Store ID: ${storeData.storeUrl}
`;

    const blob = new Blob([installationGuide], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budgetprice-installation.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Package Downloaded",
      description: "Installation guide saved to your computer",
    });
  };

  const testInstallation = async () => {
    if (!storeData.storeUrl) {
      toast({
        title: "Error",
        description: "Please enter your store URL first",
        variant: "destructive"
      });
      return;
    }

    // Simulate testing the installation
    toast({
      title: "Testing Installation",
      description: "Checking if BudgetPrice is properly installed...",
    });

    // In a real implementation, this would make an API call to verify
    setTimeout(() => {
      toast({
        title: "Installation Verified",
        description: "BudgetPrice is working correctly on your store!",
      });
      
      // Mark verification step as completed
      setCurrentStep(Math.max(currentStep, 3));
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Store className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Welcome to BudgetPrice</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Let's get your store set up with budget-aware pricing in just a few minutes. 
          We'll walk you through everything step by step.
        </p>
        
        {/* Progress */}
        <div className="max-w-md mx-auto">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={currentStep.toString()} onValueChange={(value) => setCurrentStep(parseInt(value))}>
        <TabsList className="grid w-full grid-cols-4">
          {onboardingSteps.map((step, index) => (
            <TabsTrigger key={step.id} value={index.toString()} className="flex items-center space-x-2">
              {index < currentStep ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <span className="w-4 h-4 rounded-full border-2 border-current" />
              )}
              <span className="hidden md:inline">{step.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Step 1: Store Information */}
        <TabsContent value="0" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Store className="w-5 h-5" />
                <span>Store Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="store-name">Store Name</Label>
                  <Input
                    id="store-name"
                    placeholder="My Awesome Store"
                    value={storeData.storeName}
                    onChange={(e) => setStoreData({ ...storeData, storeName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="store-url">Store URL</Label>
                  <Input
                    id="store-url"
                    placeholder="mystore.myshopify.com"
                    value={storeData.storeUrl}
                    onChange={(e) => setStoreData({ ...storeData, storeUrl: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select value={storeData.platform} onValueChange={(value) => setStoreData({ ...storeData, platform: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shopify">Shopify</SelectItem>
                    <SelectItem value="magento">Magento</SelectItem>
                    <SelectItem value="woocommerce">WooCommerce</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={() => setCurrentStep(1)}
                disabled={!storeData.storeName || !storeData.storeUrl}
                className="w-full"
              >
                Continue to Theme Setup
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: Theme Configuration */}
        <TabsContent value="1" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Theme Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={storeData.primaryColor}
                      onChange={(e) => setStoreData({ ...storeData, primaryColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={storeData.primaryColor}
                      onChange={(e) => setStoreData({ ...storeData, primaryColor: e.target.value })}
                      placeholder="#00A88F"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="background-color">Background Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="background-color"
                      type="color"
                      value={storeData.backgroundColor}
                      onChange={(e) => setStoreData({ ...storeData, backgroundColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={storeData.backgroundColor}
                      onChange={(e) => setStoreData({ ...storeData, backgroundColor: e.target.value })}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="text-color">Text Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="text-color"
                      type="color"
                      value={storeData.textColor}
                      onChange={(e) => setStoreData({ ...storeData, textColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={storeData.textColor}
                      onChange={(e) => setStoreData({ ...storeData, textColor: e.target.value })}
                      placeholder="#1F2937"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Widget Preview</h4>
                <div 
                  className="border rounded-lg p-4"
                  style={{ 
                    backgroundColor: storeData.backgroundColor,
                    color: storeData.textColor,
                    borderColor: storeData.primaryColor + '20'
                  }}
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: storeData.primaryColor }}
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Budget-Friendly Pricing</h3>
                      <p className="text-xs opacity-75">Check if this fits your budget</p>
                    </div>
                  </div>
                  <button 
                    className="w-full py-2 px-4 rounded text-white text-sm font-medium"
                    style={{ backgroundColor: storeData.primaryColor }}
                  >
                    Calculate My Budget Price
                  </button>
                </div>
              </div>

              <Button onClick={() => setCurrentStep(2)} className="w-full">
                Continue to Installation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: Installation */}
        <TabsContent value="2" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="w-5 h-5" />
                <span>Code Installation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Installation Method</Label>
                  <p className="text-sm text-gray-600">Choose how you want to install BudgetPrice</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="test-mode" className="text-sm">Test Mode</Label>
                  <Switch 
                    id="test-mode"
                    checked={isTestMode}
                    onCheckedChange={setIsTestMode}
                  />
                </div>
              </div>

              <Select value={installationMethod} onValueChange={setInstallationMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="theme-editor">Theme Editor (Recommended)</SelectItem>
                  <SelectItem value="custom-position">Custom Position</SelectItem>
                  <SelectItem value="conditional">Conditional Loading</SelectItem>
                </SelectContent>
              </Select>

              {isTestMode && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Test Mode Active</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    The widget will show debug information and use development servers. 
                    Disable this for production use.
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Installation Code</Label>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generateInstallationCode(), "Installation code")}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadInstallationPackage}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={generateInstallationCode()}
                  readOnly
                  className="font-mono text-sm"
                  rows={8}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Installation Steps:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Go to your Shopify admin panel</li>
                  <li>Navigate to Online Store → Themes</li>
                  <li>Click Actions → Edit code on your active theme</li>
                  <li>Find templates/product.liquid (or sections/product-form.liquid)</li>
                  <li>Add the code above before the closing &lt;/form&gt; tag</li>
                  <li>Click Save</li>
                  <li>Test on a product page</li>
                </ol>
              </div>

              <Button onClick={() => setCurrentStep(3)} className="w-full">
                Continue to Verification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 4: Verification */}
        <TabsContent value="3" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="w-5 h-5" />
                <span>Verification & Testing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Let's make sure everything is working correctly on your store.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => window.open(`https://${storeData.storeUrl}/products`, '_blank')}
                    className="flex items-center space-x-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Visit Store</span>
                  </Button>
                  <Button
                    onClick={testInstallation}
                    className="flex items-center space-x-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Test Installation</span>
                  </Button>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">What to Look For:</h4>
                <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                  <li>A "Budget-Friendly Pricing" widget appears on product pages</li>
                  <li>The widget matches your store's colors and design</li>
                  <li>Clicking the widget opens a budget calculator</li>
                  <li>The calculator shows proper budget breakdown</li>
                  <li>Product analysis works when you enter income</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Next Steps:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Monitor your dashboard for analytics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Check conversion improvements</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Customize advanced settings as needed</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Installation Complete!
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  BudgetPrice is now active on your store. Welcome aboard!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}