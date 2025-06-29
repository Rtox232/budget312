import { useMemo } from "react";

interface PricingScaleProps {
  currentPrice: number;
  budgetAmount: number;
  maxPrice: number;
  className?: string;
}

export default function PricingScale({ 
  currentPrice, 
  budgetAmount, 
  maxPrice, 
  className = "" 
}: PricingScaleProps) {
  const { position, status } = useMemo(() => {
    // Calculate position as percentage
    const range = maxPrice - 0;
    const pricePosition = Math.min(100, Math.max(0, (currentPrice / range) * 100));
    const budgetPosition = Math.min(100, Math.max(0, (budgetAmount / range) * 100));
    
    // Determine status
    let status: "within" | "stretch" | "over";
    if (currentPrice <= budgetAmount) {
      status = "within";
    } else if (currentPrice <= budgetAmount * 1.2) {
      status = "stretch";
    } else {
      status = "over";
    }

    return {
      position: pricePosition,
      budgetPosition,
      status
    };
  }, [currentPrice, budgetAmount, maxPrice]);

  const getStatusColor = () => {
    switch (status) {
      case "within":
        return "border-green-500 bg-green-500";
      case "stretch":
        return "border-yellow-500 bg-yellow-500";
      case "over":
        return "border-red-500 bg-red-500";
      default:
        return "border-gray-400 bg-gray-400";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "within":
        return "Within Budget";
      case "stretch":
        return "Stretching Budget";
      case "over":
        return "Over Budget";
      default:
        return "";
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h6 className="text-sm font-medium text-gray-700">Pricing Scale</h6>
      
      {/* Scale Bar */}
      <div className="relative">
        {/* Background gradient */}
        <div className="pricing-scale h-3 rounded-full shadow-inner"></div>
        
        {/* Budget marker */}
        <div 
          className="absolute top-0 h-3 flex items-center transform -translate-x-1/2"
          style={{ left: `${Math.min(95, Math.max(5, (budgetAmount / maxPrice) * 100))}%` }}
        >
          <div className="w-0.5 h-6 bg-gray-700 -mt-1.5"></div>
          <div className="absolute -top-8 transform -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs bg-gray-900 text-white px-2 py-1 rounded">
              Budget: ${budgetAmount.toFixed(0)}
            </span>
          </div>
        </div>
        
        {/* Current price marker */}
        <div 
          className="absolute top-0 h-3 flex items-center transform -translate-x-1/2 pricing-indicator"
          style={{ left: `${Math.min(95, Math.max(5, position))}%` }}
        >
          <div 
            className={`w-4 h-4 rounded-full border-2 shadow-lg transform -translate-y-0.5 ${getStatusColor()}`}
            role="img"
            aria-label={`Current price marker: ${getStatusText()}`}
          ></div>
        </div>
      </div>

      {/* Scale Labels */}
      <div className="flex justify-between text-xs text-gray-600">
        <span className="flex items-center">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
          Over Budget
        </span>
        <span className="flex items-center">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
          Stretching
        </span>
        <span className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
          Within Budget
        </span>
      </div>

      {/* Status Text */}
      <div className="text-center">
        <span 
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            status === "within"
              ? "bg-green-100 text-green-800"
              : status === "stretch"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {getStatusText()}
        </span>
      </div>

      {/* Price Information */}
      <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
        <span>Current Price: <strong>${currentPrice.toLocaleString()}</strong></span>
        <span>Your Budget: <strong>${budgetAmount.toFixed(0)}</strong></span>
      </div>
    </div>
  );
}
