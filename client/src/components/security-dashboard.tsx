import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Activity, Users, Clock, Ban } from "lucide-react";

interface SecurityStats {
  protection: {
    activeTrackers: number;
    blockedIPs: number;
    blockedCustomers: number;
    config: {
      maxMonthlyIncome: number;
      minMonthlyIncome: number;
      maxRequestsPerMinute: number;
      maxRequestsPerHour: number;
    };
  };
  errors: {
    totalErrors: number;
    errorsLastHour: number;
    errorsLastDay: number;
    totalIncidents: number;
    incidentsLastHour: number;
    unresolvedIncidents: number;
    topErrorEndpoints: Array<{ endpoint: string; count: number }>;
    topErrorIPs: Array<{ ip: string; count: number }>;
  };
  timestamp: string;
}

export default function SecurityDashboard() {
  const { data: stats, isLoading, error } = useQuery<SecurityStats>({
    queryKey: ["/api/admin/security/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">Failed to load security statistics</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSecurityStatus = () => {
    const totalBlocked = stats.protection.blockedIPs + stats.protection.blockedCustomers;
    const recentIncidents = stats.errors.incidentsLastHour;
    
    if (totalBlocked > 10 || recentIncidents > 5) {
      return { status: "High Activity", color: "red", icon: AlertTriangle };
    } else if (totalBlocked > 0 || recentIncidents > 0) {
      return { status: "Normal Activity", color: "yellow", icon: Shield };
    } else {
      return { status: "All Clear", color: "green", icon: Shield };
    }
  };

  const securityStatus = getSecurityStatus();
  const StatusIcon = securityStatus.icon;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-600">Real-time protection and monitoring</p>
        </div>
        <Badge 
          className={`px-3 py-1 ${
            securityStatus.color === "green" 
              ? "bg-green-100 text-green-800" 
              : securityStatus.color === "yellow"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <StatusIcon className="w-4 h-4 mr-1" />
          {securityStatus.status}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Active Trackers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.protection.activeTrackers}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Currently monitored sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Ban className="w-4 h-4 mr-2" />
              Blocked Entities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.protection.blockedIPs + stats.protection.blockedCustomers}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {stats.protection.blockedIPs} IPs, {stats.protection.blockedCustomers} customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Security Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.errors.incidentsLastHour}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              In the last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.errors.errorsLastHour}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Errors in last hour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Protection Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Protection Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Rate Limit (per minute)</span>
                <Badge variant="outline">{stats.protection.config.maxRequestsPerMinute}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Rate Limit (per hour)</span>
                <Badge variant="outline">{stats.protection.config.maxRequestsPerHour}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Min Income</span>
                <Badge variant="outline">${stats.protection.config.minMonthlyIncome}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Max Income</span>
                <Badge variant="outline">${stats.protection.config.maxMonthlyIncome.toLocaleString()}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Top Error Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.errors.topErrorIPs.length > 0 ? (
                stats.errors.topErrorIPs.slice(0, 5).map((ipError, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm font-mono text-gray-600">{ipError.ip}</span>
                    <Badge variant="destructive" className="text-xs">
                      {ipError.count} errors
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent errors</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Error Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Error Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.errors.topErrorEndpoints.length > 0 ? (
              stats.errors.topErrorEndpoints.map((endpointError, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-mono text-gray-600">{endpointError.endpoint}</span>
                  <Badge variant="outline" className="text-xs">
                    {endpointError.count}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 col-span-full">No endpoint errors recorded</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(stats.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}