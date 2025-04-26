'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from './DateRangePicker';
import { subDays } from 'date-fns';

interface ReportFiltersProps {
  onFilterChange: (filters: { category?: string; locationId?: string; dateRange?: DateRange }) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  activeTab?: string;
}

export function ReportFilters({
  onFilterChange,
  onRefresh,
  isLoading = false,
  activeTab = 'inventory',
}: ReportFiltersProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  // Fetch filter options from Supabase
  const fetchFilterOptions = async () => {
    try {
      setIsLoadingFilters(true);

      console.log('Fetching filter options...');

      // Fetch categories
      console.log('Fetching categories...');
      const { data: categoryData, error: categoryError } = await supabase
        .from('inventory_items')
        .select('category')
        .order('category');

      if (categoryError) {
        console.error('Error fetching categories:', categoryError);
        throw categoryError;
      }

      // Extract unique categories
      const uniqueCategories = [...new Set(categoryData?.map(item => item.category) || [])];
      console.log('Unique categories:', uniqueCategories);
      setCategories(uniqueCategories);

      // Fetch locations
      console.log('Fetching locations...');
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');

      if (locationError) {
        console.error('Error fetching locations:', locationError);
        throw locationError;
      }

      console.log('Locations:', locationData?.length || 0);
      setLocations(locationData || []);
    } catch (err) {
      console.error('Error fetching filter options:', err);
      // We don't set an error state here as it's not critical for the UI
      // Just use empty arrays for the filters
      setCategories([]);
      setLocations([]);
    } finally {
      setIsLoadingFilters(false);
    }
  };

  // Fetch filter options on component mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Handle filter changes
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    onFilterChange({
      category: value === 'all' ? undefined : value,
      locationId: selectedLocation === 'all' ? undefined : selectedLocation,
      dateRange,
    });
  };

  const handleLocationChange = (value: string) => {
    console.log('Location filter changed to:', value);
    setSelectedLocation(value);
    const locationId = value === 'all' ? undefined : value;
    console.log('Setting locationId filter to:', locationId);
    onFilterChange({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      locationId,
      dateRange,
    });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    onFilterChange({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      locationId: selectedLocation === 'all' ? undefined : selectedLocation,
      dateRange: range,
    });
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Category Filter - Show for inventory tab */}
          {(activeTab === 'inventory') && (
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={handleCategoryChange}
                disabled={isLoadingFilters}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Location Filter - Show for all tabs */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={selectedLocation}
                onValueChange={handleLocationChange}
                disabled={isLoadingFilters}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          {/* Date Range Picker - Show for consumption and analysis tabs */}
          {(activeTab === 'consumption' || activeTab === 'analysis') && (
            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
              />
            </div>
          )}

          {/* Refresh Button */}
          <div>
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Data
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
