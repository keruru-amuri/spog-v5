"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, BarChart3, Download, TrendingUp, AlertTriangle, MapPin, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

// Mock data for inventory items
const inventoryItems = [
  {
    id: "SP001",
    name: "Silicone Sealant",
    category: "Sealant",
    location: "Storage A",
    currentBalance: 3200,
    originalAmount: 5000,
    unit: "g",
    consumptionUnit: "g",
    status: "normal",
    lastRefilled: "2023-05-10",
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
    lastRefilled: "2023-04-15",
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
    lastRefilled: "2023-06-01",
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
    lastRefilled: "2023-03-20",
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
    lastRefilled: "2023-05-25",
  },
  {
    id: "PT006",
    name: "Acrylic Paint - Blue",
    category: "Paint",
    location: "Storage A",
    currentBalance: 1200,
    originalAmount: 5000,
    unit: "ml",
    consumptionUnit: "ml",
    status: "normal",
    lastRefilled: "2023-04-10",
  },
  {
    id: "OL007",
    name: "Engine Oil",
    category: "Oil",
    location: "Storage C",
    currentBalance: 4500,
    originalAmount: 10000,
    unit: "ml",
    consumptionUnit: "ml",
    status: "low",
    lastRefilled: "2023-02-15",
  },
]

// Mock usage data for the past 6 months
const monthlyUsageData = [
  { month: "Jan", Sealant: 1200, Paint: 800, Oil: 2500, Grease: 350 },
  { month: "Feb", Sealant: 1500, Paint: 1200, Oil: 1800, Grease: 450 },
  { month: "Mar", Sealant: 1000, Paint: 1500, Oil: 2200, Grease: 300 },
  { month: "Apr", Sealant: 1800, Paint: 1000, Oil: 2000, Grease: 500 },
  { month: "May", Sealant: 1600, Paint: 1300, Oil: 2400, Grease: 400 },
  { month: "Jun", Sealant: 2000, Paint: 1100, Oil: 1900, Grease: 350 },
]

// Mock data for stock level distribution
const stockLevelData = [
  { name: "Normal", value: inventoryItems.filter((item) => item.status === "normal").length, color: "#22c55e" },
  { name: "Low", value: inventoryItems.filter((item) => item.status === "low").length, color: "#f59e0b" },
  { name: "Critical", value: inventoryItems.filter((item) => item.status === "critical").length, color: "#ef4444" },
]

// Mock data for location distribution
const locationData = [
  {
    name: "Storage A",
    value: inventoryItems.filter((item) => item.location === "Storage A").length,
    color: "#3b82f6",
  },
  {
    name: "Storage B",
    value: inventoryItems.filter((item) => item.location === "Storage B").length,
    color: "#8b5cf6",
  },
  {
    name: "Storage C",
    value: inventoryItems.filter((item) => item.location === "Storage C").length,
    color: "#ec4899",
  },
]

// Mock data for consumption trends
const consumptionTrendData = [
  { day: "1", amount: 120 },
  { day: "5", amount: 180 },
  { day: "10", amount: 150 },
  { day: "15", amount: 200 },
  { day: "20", amount: 90 },
  { day: "25", amount: 220 },
  { day: "30", amount: 170 },
]

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("6months")

  // Calculate summary statistics
  const totalItems = inventoryItems.length
  const lowStockItems = inventoryItems.filter((item) => item.status === "low").length
  const criticalStockItems = inventoryItems.filter((item) => item.status === "critical").length

  // Calculate average stock level percentage
  const averageStockLevel = Math.round(
    inventoryItems.reduce((acc, item) => acc + (item.currentBalance / item.originalAmount) * 100, 0) / totalItems,
  )

  // Calculate most used category
  const categoryUsage = monthlyUsageData.reduce((acc, month) => {
    Object.keys(month).forEach((key) => {
      if (key !== "month") {
        if (!acc[key]) acc[key] = 0
        acc[key] += month[key]
      }
    })
    return acc
  }, {})

  const mostUsedCategory = Object.keys(categoryUsage).reduce((a, b) => (categoryUsage[a] > categoryUsage[b] ? a : b))

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-16 items-center px-4 md:px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventory Reports</h1>
            <p className="text-muted-foreground">Analyze your inventory data and identify trends</p>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalItems}</div>
                <p className="text-xs text-muted-foreground">Across {Object.keys(categoryUsage).length} categories</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Average Stock Level</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageStockLevel}%</div>
                <p className="text-xs text-muted-foreground">
                  {averageStockLevel > 50 ? "Healthy inventory levels" : "Consider restocking soon"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Items Needing Attention</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStockItems + criticalStockItems}</div>
                <p className="text-xs text-muted-foreground">
                  {criticalStockItems} critical, {lowStockItems} low stock
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Most Used Category</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mostUsedCategory}</div>
                <p className="text-xs text-muted-foreground">
                  {categoryUsage[mostUsedCategory]} units used in last 6 months
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="usage">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="usage">Usage Trends</TabsTrigger>
              <TabsTrigger value="stock">Stock Levels</TabsTrigger>
              <TabsTrigger value="location">Location Analysis</TabsTrigger>
              <TabsTrigger value="alerts">Alerts & Insights</TabsTrigger>
            </TabsList>

            {/* Usage Trends Tab */}
            <TabsContent value="usage" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Usage by Category</CardTitle>
                  <CardDescription>Consumption trends over the past 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyUsageData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Sealant" fill="#3b82f6" />
                        <Bar dataKey="Paint" fill="#8b5cf6" />
                        <Bar dataKey="Oil" fill="#ec4899" />
                        <Bar dataKey="Grease" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Consumption Trend</CardTitle>
                    <CardDescription>Total consumption across all categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={consumptionTrendData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="#3b82f6"
                            activeDot={{ r: 8 }}
                            name="Consumption"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Consumed Items</CardTitle>
                    <CardDescription>Items with highest usage rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {inventoryItems
                        .sort((a, b) => a.originalAmount - a.currentBalance - (b.originalAmount - b.currentBalance))
                        .reverse()
                        .slice(0, 5)
                        .map((item, index) => {
                          const consumedAmount = item.originalAmount - item.currentBalance
                          const consumedPercentage = Math.round((consumedAmount / item.originalAmount) * 100)

                          return (
                            <div key={item.id} className="flex items-center">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{index + 1}.</span>
                                  <div>
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-xs text-muted-foreground">{item.category}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  {consumedAmount} {item.unit}
                                </div>
                                <div className="text-xs text-muted-foreground">{consumedPercentage}% used</div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Stock Levels Tab */}
            <TabsContent value="stock" className="space-y-4 pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Stock Level Distribution</CardTitle>
                    <CardDescription>Current inventory status breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={stockLevelData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {stockLevelData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Stock Level by Category</CardTitle>
                    <CardDescription>Average stock level percentage by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            {
                              category: "Sealant",
                              level: Math.round(
                                inventoryItems
                                  .filter((item) => item.category === "Sealant")
                                  .reduce((acc, item) => acc + (item.currentBalance / item.originalAmount) * 100, 0) /
                                  inventoryItems.filter((item) => item.category === "Sealant").length,
                              ),
                            },
                            {
                              category: "Paint",
                              level: Math.round(
                                inventoryItems
                                  .filter((item) => item.category === "Paint")
                                  .reduce((acc, item) => acc + (item.currentBalance / item.originalAmount) * 100, 0) /
                                  inventoryItems.filter((item) => item.category === "Paint").length,
                              ),
                            },
                            {
                              category: "Oil",
                              level: Math.round(
                                inventoryItems
                                  .filter((item) => item.category === "Oil")
                                  .reduce((acc, item) => acc + (item.currentBalance / item.originalAmount) * 100, 0) /
                                  inventoryItems.filter((item) => item.category === "Oil").length,
                              ),
                            },
                            {
                              category: "Grease",
                              level: Math.round(
                                inventoryItems
                                  .filter((item) => item.category === "Grease")
                                  .reduce((acc, item) => acc + (item.currentBalance / item.originalAmount) * 100, 0) /
                                  inventoryItems.filter((item) => item.category === "Grease").length,
                              ),
                            },
                          ]}
                          layout="vertical"
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis dataKey="category" type="category" />
                          <Tooltip formatter={(value) => [`${value}%`, "Stock Level"]} />
                          <Legend />
                          <Bar dataKey="level" fill="#3b82f6" name="Stock Level %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Items Needing Restock</CardTitle>
                  <CardDescription>Items with low or critical stock levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inventoryItems
                      .filter((item) => item.status === "low" || item.status === "critical")
                      .sort((a, b) => {
                        // Sort by status (critical first) then by stock percentage
                        if (a.status === "critical" && b.status !== "critical") return -1
                        if (a.status !== "critical" && b.status === "critical") return 1
                        return a.currentBalance / a.originalAmount - b.currentBalance / b.originalAmount
                      })
                      .map((item) => {
                        const stockPercentage = Math.round((item.currentBalance / item.originalAmount) * 100)

                        return (
                          <div key={item.id} className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.id} | {item.category} | {item.location}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {item.currentBalance} / {item.originalAmount} {item.unit}
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <Badge
                                  variant="outline"
                                  className={`
                                    ${
                                      item.status === "critical"
                                        ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
                                        : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                                    }
                                  `}
                                >
                                  {stockPercentage}%
                                </Badge>
                                <span className="text-muted-foreground">
                                  Last refilled: {new Date(item.lastRefilled).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Generate Restock Order
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Location Analysis Tab */}
            <TabsContent value="location" className="space-y-4 pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Items by Location</CardTitle>
                    <CardDescription>Distribution of inventory across storage locations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={locationData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {locationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Stock Status by Location</CardTitle>
                    <CardDescription>Number of items by status in each location</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            {
                              location: "Storage A",
                              normal: inventoryItems.filter(
                                (item) => item.location === "Storage A" && item.status === "normal",
                              ).length,
                              low: inventoryItems.filter(
                                (item) => item.location === "Storage A" && item.status === "low",
                              ).length,
                              critical: inventoryItems.filter(
                                (item) => item.location === "Storage A" && item.status === "critical",
                              ).length,
                            },
                            {
                              location: "Storage B",
                              normal: inventoryItems.filter(
                                (item) => item.location === "Storage B" && item.status === "normal",
                              ).length,
                              low: inventoryItems.filter(
                                (item) => item.location === "Storage B" && item.status === "low",
                              ).length,
                              critical: inventoryItems.filter(
                                (item) => item.location === "Storage B" && item.status === "critical",
                              ).length,
                            },
                            {
                              location: "Storage C",
                              normal: inventoryItems.filter(
                                (item) => item.location === "Storage C" && item.status === "normal",
                              ).length,
                              low: inventoryItems.filter(
                                (item) => item.location === "Storage C" && item.status === "low",
                              ).length,
                              critical: inventoryItems.filter(
                                (item) => item.location === "Storage C" && item.status === "critical",
                              ).length,
                            },
                          ]}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="location" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="normal" stackId="a" fill="#22c55e" name="Normal" />
                          <Bar dataKey="low" stackId="a" fill="#f59e0b" name="Low" />
                          <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Location Capacity Analysis</CardTitle>
                  <CardDescription>Storage utilization by location</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {["Storage A", "Storage B", "Storage C"].map((location) => {
                      const locationItems = inventoryItems.filter((item) => item.location === location)
                      const totalCapacity = locationItems.reduce((acc, item) => acc + item.originalAmount, 0)
                      const currentUsage = locationItems.reduce((acc, item) => acc + item.currentBalance, 0)
                      const usagePercentage = Math.round((currentUsage / totalCapacity) * 100)

                      return (
                        <div key={location} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{location}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {currentUsage} / {totalCapacity} units ({usagePercentage}% capacity)
                            </div>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className={`h-2 rounded-full ${
                                usagePercentage > 70
                                  ? "bg-green-500"
                                  : usagePercentage > 30
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${usagePercentage}%` }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Items:</span>{" "}
                              <span className="font-medium">{locationItems.length}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Categories:</span>{" "}
                              <span className="font-medium">
                                {new Set(locationItems.map((item) => item.category)).size}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Alerts & Insights Tab */}
            <TabsContent value="alerts" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Insights</CardTitle>
                  <CardDescription>Key observations and recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-amber-50 p-4 dark:bg-amber-950">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        <h3 className="font-semibold text-amber-600 dark:text-amber-400">Low Stock Alert</h3>
                      </div>
                      <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                        {lowStockItems} items are running low and should be restocked soon. Most notable is
                        <span className="font-medium"> Acrylic Paint - White</span> which is at 17% capacity.
                      </p>
                    </div>

                    <div className="rounded-lg border bg-red-50 p-4 dark:bg-red-950">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <h3 className="font-semibold text-red-600 dark:text-red-400">Critical Stock Alert</h3>
                      </div>
                      <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                        <span className="font-medium">Lithium Grease</span> is at critically low levels (25% remaining).
                        This item should be restocked immediately to avoid disruptions.
                      </p>
                    </div>

                    <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-semibold text-blue-600 dark:text-blue-400">Usage Trend Insight</h3>
                      </div>
                      <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                        Sealant usage has increased by 25% in the last month compared to the previous period. Consider
                        increasing the stock levels for this category.
                      </p>
                    </div>

                    <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <h3 className="font-semibold text-green-600 dark:text-green-400">Inventory Optimization</h3>
                      </div>
                      <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                        Storage A is currently at 85% capacity while Storage C is only at 45%. Consider redistributing
                        some items to balance storage utilization.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommended Actions</CardTitle>
                  <CardDescription>Suggested steps to optimize inventory management</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-bold text-primary">1</span>
                      </div>
                      <div>
                        <h3 className="font-medium">Restock Critical Items</h3>
                        <p className="text-sm text-muted-foreground">
                          Place orders for Lithium Grease and other critical items immediately to prevent stockouts.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-bold text-primary">2</span>
                      </div>
                      <div>
                        <h3 className="font-medium">Review Sealant Usage</h3>
                        <p className="text-sm text-muted-foreground">
                          Investigate the increased usage of sealants and adjust inventory levels accordingly.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-bold text-primary">3</span>
                      </div>
                      <div>
                        <h3 className="font-medium">Optimize Storage Distribution</h3>
                        <p className="text-sm text-muted-foreground">
                          Move some items from Storage A to Storage C to balance utilization and improve accessibility.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-bold text-primary">4</span>
                      </div>
                      <div>
                        <h3 className="font-medium">Schedule Regular Inventory Audits</h3>
                        <p className="text-sm text-muted-foreground">
                          Implement monthly physical counts to ensure inventory accuracy and identify discrepancies.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Generate Action Plan</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
