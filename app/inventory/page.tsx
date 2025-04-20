'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Filter, Search, Plus } from 'lucide-react';
import { LocationSelector } from '@/components/location-selector';
import { InventoryItem } from '@/types/inventory';

// Mock data for inventory items
const inventoryItems: InventoryItem[] = [
  {
    id: "SP001",
    name: "Silicone Sealant",
    category: "Sealant",
    location: "Storage A",
    currentBalance: 3200,
    originalAmount: 5000,
    unit: "g",
    consumptionUnit: "g",
    status: "normal", // normal, low, critical
  },
  {
    id: "PT002",
    name: "Acrylic Paint - White",
    category: "Paint",
    location: "Storage A",
    currentBalance: 850,
    originalAmount: 5000,
    unit: "ml",
    consumptionUnit: "ml",
    status: "low",
  },
  {
    id: "OL003",
    name: "Hydraulic Oil",
    category: "Oil",
    location: "Storage B",
    currentBalance: 12500,
    originalAmount: 20000,
    unit: "ml",
    consumptionUnit: "ml",
    status: "normal",
  },
  {
    id: "GR004",
    name: "Lithium Grease",
    category: "Grease",
    location: "Storage B",
    currentBalance: 250,
    originalAmount: 1000,
    unit: "g",
    consumptionUnit: "g",
    status: "critical",
  },
  {
    id: "SP005",
    name: "Epoxy Sealant",
    category: "Sealant",
    location: "Storage C",
    currentBalance: 1800,
    originalAmount: 2000,
    unit: "g",
    consumptionUnit: "g",
    status: "normal",
  },
];

function StatusBadge({ status }: { status: 'normal' | 'low' | 'critical' }) {
  if (status === "normal") {
    return (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 hover:bg-green-50 dark:bg-green-950 dark:text-green-400"
      >
        Normal
      </Badge>
    );
  } else if (status === "low") {
    return (
      <Badge
        variant="outline"
        className="bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-400"
      >
        Low
      </Badge>
    );
  } else if (status === "critical") {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 dark:bg-red-950 dark:text-red-400">
        Critical
      </Badge>
    );
  }
  return null;
}

function getProgressColorClass(status: 'normal' | 'low' | 'critical'): string {
  if (status === "normal") {
    return "bg-green-500";
  } else if (status === "low") {
    return "bg-amber-500";
  } else if (status === "critical") {
    return "bg-red-500";
  }
  return "";
}

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentLocation, setCurrentLocation] = useState<string>("All Locations");

  // Filter items based on search query and location
  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = currentLocation === "All Locations" || item.location === currentLocation;
    return matchesSearch && matchesLocation;
  });

  return (
    <DashboardLayout>
      <PermissionGuard permission="inventory:read">
        <div className="container mx-auto p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">Inventory</h1>
              <p className="text-muted-foreground">
                Manage your inventory items
              </p>
            </div>
            <div className="flex items-center gap-2">
              <LocationSelector 
                currentLocation={currentLocation} 
                setCurrentLocation={setCurrentLocation} 
              />
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search inventory..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-1">
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
            </Button>
          </div>

          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="low">Low Stock</TabsTrigger>
              <TabsTrigger value="critical">Critical</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{item.name}</CardTitle>
                          <CardDescription>{item.id}</CardDescription>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Current Balance:</span>
                          <span className="font-medium">
                            {item.currentBalance} {item.unit}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${getProgressColorClass(item.status)}`}
                            style={{ width: `${(item.currentBalance / item.originalAmount) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0 {item.unit}</span>
                          <span>
                            {item.originalAmount} {item.unit}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Location:</span>
                          <span>{item.location}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredItems.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No items found matching your search criteria.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="low" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems
                  .filter((item) => item.status === "low")
                  .map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{item.name}</CardTitle>
                            <CardDescription>{item.id}</CardDescription>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current Balance:</span>
                            <span className="font-medium">
                              {item.currentBalance} {item.unit}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className={`h-2 rounded-full ${getProgressColorClass(item.status)}`}
                              style={{ width: `${(item.currentBalance / item.originalAmount) * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0 {item.unit}</span>
                            <span>
                              {item.originalAmount} {item.unit}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Location:</span>
                            <span>{item.location}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
              
              {filteredItems.filter((item) => item.status === "low").length === 0 && (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No low stock items found matching your search criteria.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="critical" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems
                  .filter((item) => item.status === "critical")
                  .map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{item.name}</CardTitle>
                            <CardDescription>{item.id}</CardDescription>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current Balance:</span>
                            <span className="font-medium">
                              {item.currentBalance} {item.unit}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className={`h-2 rounded-full ${getProgressColorClass(item.status)}`}
                              style={{ width: `${(item.currentBalance / item.originalAmount) * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>0 {item.unit}</span>
                            <span>
                              {item.originalAmount} {item.unit}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Location:</span>
                            <span>{item.location}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
              
              {filteredItems.filter((item) => item.status === "critical").length === 0 && (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No critical stock items found matching your search criteria.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </PermissionGuard>
    </DashboardLayout>
  );
}
