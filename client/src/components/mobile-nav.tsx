import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Menu, X, Home, Calculator, BookOpen, BarChart3, Shield } from "lucide-react";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Calculator", href: "/education", icon: Calculator },
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Documentation", href: "/docs", icon: BookOpen },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="p-2 h-10 w-10 relative touch-target"
            aria-label="Open navigation menu"
            aria-expanded={open}
            aria-controls="mobile-navigation"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
        </SheetTrigger>
        
        <SheetContent side="right" className="w-80 p-0" id="mobile-navigation">
          <SheetHeader className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-bold text-gray-900">
                BudgetPrice
              </SheetTitle>
              <Badge className="bg-shopify-green text-white text-xs">
                Mobile
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Budget-aware pricing for Shopify
            </p>
          </SheetHeader>
          
          <nav className="p-6">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className={`w-full justify-start h-12 px-4 text-left ${
                        active 
                          ? "bg-shopify-green/10 text-shopify-green border-shopify-green/20" 
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className={`w-5 h-5 mr-3 ${
                        active ? "text-shopify-green" : "text-gray-500"
                      }`} />
                      <span className="font-medium">{item.name}</span>
                      {active && (
                        <Badge className="ml-auto bg-shopify-green text-white text-xs">
                          Active
                        </Badge>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>

            {/* Mobile-specific features */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Security Status</p>
                      <p className="text-xs text-blue-700">All systems protected</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    Active
                  </Badge>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Quick Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-8"
                      onClick={() => setOpen(false)}
                    >
                      <Link href="/education">
                        Calculate Budget
                      </Link>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs h-8"
                      onClick={() => setOpen(false)}
                    >
                      <Link href="/dashboard">
                        View Analytics
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* App info for mobile */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center space-y-2">
                <p className="text-xs text-gray-500">
                  BudgetPrice v1.0
                </p>
                <p className="text-xs text-gray-400">
                  Made for Shopify merchants
                </p>
              </div>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}