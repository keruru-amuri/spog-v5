'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Plus, Calendar, User } from 'lucide-react';
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

// Mock data for consumption history
const consumptionHistory = [
  {
    id: "C001",
    itemId: "GR004",
    itemName: "Lithium Grease",
    amount: 50,
    unit: "g",
    user: "John Doe",
    timestamp: "2023-06-15T10:30:00",
    notes: "Used for maintenance of conveyor belt bearings"
  },
  {
    id: "C002",
    itemId: "PT002",
    itemName: "Acrylic Paint - White",
    amount: 250,
    unit: "ml",
    user: "Jane Smith",
    timestamp: "2023-06-14T14:15:00",
    notes: "Touch-up painting for equipment housing"
  },
  {
    id: "C003",
    itemId: "OL003",
    itemName: "Hydraulic Oil",
    amount: 1500,
    unit: "ml",
    user: "Mike Johnson",
    timestamp: "2023-06-13T09:45:00",
    notes: "Refill for hydraulic press system"
  },
  {
    id: "C004",
    itemId: "SP001",
    itemName: "Silicone Sealant",
    amount: 75,
    unit: "g",
    user: "Sarah Williams",
    timestamp: "2023-06-12T16:20:00",
    notes: "Sealing electrical junction boxes"
  },
  {
    id: "C005",
    itemId: "GR004",
    itemName: "Lithium Grease",
    amount: 25,
    unit: "g",
    user: "John Doe",
    timestamp: "2023-06-11T11:10:00",
    notes: "Lubrication for door hinges"
  }
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

export default function ConsumptionPage() {
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

  // Filter consumption history based on search query
  const filteredHistory = consumptionHistory.filter((record) => {
    return (
      record.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.itemId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.user.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <DashboardLayout>
      <PermissionGuard permission="consumption:read">
        <div className="container mx-auto p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">Consumption</h1>
              <p className="text-muted-foreground">
                Record and track inventory usage
              </p>
            </div>
            <div className="flex items-center gap-2">
              <LocationSelector 
                currentLocation={currentLocation} 
                setCurrentLocation={setCurrentLocation} 
              />
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Consumption
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search items or history..."
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

          <Tabs defaultValue="items">
            <TabsList className="mb-4">
              <TabsTrigger value="items">Available Items</TabsTrigger>
              <TabsTrigger value="history">Consumption History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="items" className="space-y-4">
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
                          <span className="text-muted-foreground">Available:</span>
                          <span className="font-medium">
                            {item.currentBalance} {item.unit}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Location:</span>
                          <span>{item.location}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Consumption Unit:</span>
                          <span>{item.consumptionUnit}</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          Record Usage
                        </Button>
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
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Consumption Records</CardTitle>
                  <CardDescription>History of inventory usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(record.timestamp).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{record.itemName}</div>
                              <div className="text-xs text-muted-foreground">{record.itemId}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {record.amount} {record.unit}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {record.user}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {record.notes}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredHistory.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">No consumption records found matching your search criteria.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PermissionGuard>
    </DashboardLayout>
  );
}
