import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, ShoppingBag, Shield } from "lucide-react";
import { Link } from "wouter";
import ProductDemo from "./product-demo";

export default function HeroSection() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <section className="gradient-bg text-white py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Content */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 md:mb-6 leading-tight">
            Turn Budget Into{" "}
            <span className="text-yellow-300">Better Sales</span>
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-3xl mx-auto opacity-90 px-4">
            Help customers buy within their budget while maximizing your revenue. 
            GDPR-compliant, accessible, and installs in one click.
          </p>
          
          <div className="flex flex-col gap-3 md:flex-row md:justify-center md:gap-4 mb-8 md:mb-12 px-4">
            <Link href="/onboarding">
              <Button 
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100 text-base md:text-lg px-6 md:px-8 py-3 md:py-4 h-12 md:h-auto w-full"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Install on Shopify
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-gray-900 text-base md:text-lg px-6 md:px-8 py-3 md:py-4 h-12 md:h-auto"
              onClick={() => setShowDemo(!showDemo)}
            >
              <Play className="w-5 h-5 mr-2" />
              {showDemo ? "Hide Demo" : "Watch Demo"}
            </Button>
          </div>
        </div>

        {/* Demo Interface */}
        <Card className="max-w-4xl mx-auto shadow-2xl">
          <CardContent className="p-4 md:p-8">
            <div className="text-center mb-6 md:mb-8">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Try it yourself!
              </h3>
              <p className="text-gray-600">
                See how budget-aware pricing works in real-time
              </p>
            </div>

            <ProductDemo />

            {/* Privacy Notice */}
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Privacy Guaranteed
                  </h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Your budget data stays in your browser and is never stored on our servers.
                  </p>
                  <label className="flex items-start space-x-2 text-sm cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mt-1 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      aria-describedby="privacy-description"
                    />
                    <span id="privacy-description">
                      Save my budget for faster checkout?{" "}
                      <a 
                        href="#privacy" 
                        className="underline hover:no-underline accessibility-focus"
                      >
                        Learn more
                      </a>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center items-center gap-8 mt-12 opacity-80">
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            GDPR Compliant
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            WCAG 2.1 AA
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            Zero Database
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            One-Click Install
          </Badge>
        </div>
      </div>
    </section>
  );
}
