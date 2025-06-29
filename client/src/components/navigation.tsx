import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Calculator, Menu, ShoppingBag } from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/education", label: "Budget Education" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/docs", label: "Documentation" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-shopify-green" />
              <span className="ml-2 text-xl font-bold text-gray-900">BudgetPrice</span>
              <span className="ml-2 px-2 py-1 text-xs bg-shopify-green text-white rounded-full">
                for Shopify
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-medium transition-colors hover:text-shopify-green accessibility-focus ${
                  isActive(item.href)
                    ? "text-shopify-green border-b-2 border-shopify-green"
                    : "text-gray-700"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="text-gray-700 hover:text-shopify-green">
              Sign In
            </Button>
            <Button className="bg-shopify-green text-white hover:bg-shopify-green/90">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Install App
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-6 mt-6">
                <Link
                  href="/"
                  className="flex items-center space-x-3"
                  onClick={() => setIsOpen(false)}
                >
                  <Calculator className="h-6 w-6 text-shopify-green" />
                  <span className="text-lg font-bold">BudgetPrice</span>
                </Link>
                
                <nav className="flex flex-col space-y-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`text-lg font-medium transition-colors accessibility-focus ${
                        isActive(item.href)
                          ? "text-shopify-green"
                          : "text-gray-700 hover:text-shopify-green"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                
                <div className="flex flex-col space-y-3 pt-6 border-t">
                  <Button variant="ghost" className="justify-start">
                    Sign In
                  </Button>
                  <Button className="justify-start bg-shopify-green text-white hover:bg-shopify-green/90">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Install App
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
