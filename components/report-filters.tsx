"use client"

import * as React from "react"
import { DateRange } from "react-day-picker"
import { DateRangePicker } from "@/components/date-range-picker"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Download, RefreshCw } from "lucide-react"
import { LocationService } from "@/services/location-service"
import { InventoryService } from "@/services/inventory-service"
import { ServiceFactory } from "@/services/service-factory"

export interface ReportFiltersProps {
  onFilterChange: (filters: ReportFilters) => void
  onRefresh: () => void
  onExport: () => void
  isLoading?: boolean
  reportType: 'inventory-status' | 'consumption-trends' | 'expiry' | 'location-utilization'
}

export interface ReportFilters {
  dateRange?: DateRange
  category?: string
  locationId?: string
  status?: 'all' | 'normal' | 'low' | 'critical'
  groupBy?: 'day' | 'week' | 'month' | 'category' | 'user'
  daysUntilExpiry?: number
  includeEmpty?: boolean
}

export function ReportFilters({
  onFilterChange,
  onRefresh,
  onExport,
  isLoading = false,
  reportType,
}: ReportFiltersProps) {
  const [filters, setFilters] = React.useState<ReportFilters>({
    status: 'all',
    groupBy: 'day',
    daysUntilExpiry: 30,
    includeEmpty: false,
  })
  const [categories, setCategories] = React.useState<string[]>([])
  const [locations, setLocations] = React.useState<Array<{ id: string, name: string }>>([])

  // Fetch categories and locations
  React.useEffect(() => {
    const fetchFilters = async () => {
      try {
        // Fetch locations
        const locationService = ServiceFactory.getLocationService()
        const locationResponse = await locationService.getLocations()
        
        if (locationResponse.success && locationResponse.data) {
          setLocations(locationResponse.data.map(location => ({
            id: location.id,
            name: location.name,
          })))
        }
        
        // Fetch inventory items to get categories
        const inventoryService = ServiceFactory.getInventoryService()
        const inventoryResponse = await inventoryService.getInventoryItems()
        
        if (inventoryResponse.success && inventoryResponse.data) {
          // Extract unique categories
          const uniqueCategories = [...new Set(inventoryResponse.data.map(item => item.category))]
          setCategories(uniqueCategories)
        }
      } catch (error) {
        console.error('Error fetching filter data:', error)
      }
    }
    
    fetchFilters()
  }, [])

  // Handle filter changes
  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Date Range Picker - Common to all reports */}
          <div className="space-y-2">
            <Label htmlFor="date-range">Date Range</Label>
            <DateRangePicker
              dateRange={filters.dateRange}
              onDateRangeChange={(range) => handleFilterChange('dateRange', range)}
            />
          </div>

          {/* Report-specific filters */}
          {reportType === 'inventory-status' && (
            <>
              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => handleFilterChange('category', value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  value={filters.locationId}
                  onValueChange={(value) => handleFilterChange('locationId', value)}
                >
                  <SelectTrigger id="location">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value as 'all' | 'normal' | 'low' | 'critical')}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {reportType === 'consumption-trends' && (
            <>
              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => handleFilterChange('category', value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Group By Filter */}
              <div className="space-y-2">
                <Label htmlFor="group-by">Group By</Label>
                <Select
                  value={filters.groupBy}
                  onValueChange={(value) => handleFilterChange('groupBy', value as 'day' | 'week' | 'month' | 'category' | 'user')}
                >
                  <SelectTrigger id="group-by">
                    <SelectValue placeholder="Group By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {reportType === 'expiry' && (
            <>
              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => handleFilterChange('category', value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Days Until Expiry Filter */}
              <div className="space-y-2">
                <Label htmlFor="days-until-expiry">Days Until Expiry</Label>
                <Select
                  value={filters.daysUntilExpiry?.toString()}
                  onValueChange={(value) => handleFilterChange('daysUntilExpiry', parseInt(value))}
                >
                  <SelectTrigger id="days-until-expiry">
                    <SelectValue placeholder="Days Until Expiry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {reportType === 'location-utilization' && (
            <>
              {/* Location Filter */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  value={filters.locationId}
                  onValueChange={(value) => handleFilterChange('locationId', value)}
                >
                  <SelectTrigger id="location">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Include Empty Filter */}
              <div className="space-y-2">
                <Label htmlFor="include-empty">Include Empty Locations</Label>
                <Select
                  value={filters.includeEmpty ? 'true' : 'false'}
                  onValueChange={(value) => handleFilterChange('includeEmpty', value === 'true')}
                >
                  <SelectTrigger id="include-empty">
                    <SelectValue placeholder="Include Empty Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={onExport}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
