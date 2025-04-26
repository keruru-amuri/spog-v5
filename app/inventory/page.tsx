'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToastContext } from '@/contexts/ToastContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { ServiceFactory } from '@/services/service-factory';
import { InventoryItem } from '@/types/inventory';
import { RecordConsumptionModal } from '@/components/inventory/RecordConsumptionModal';
import { AddInventoryItemModal } from '@/components/inventory/AddInventoryItemModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/user';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function InventoryPage() {
  const { showSuccessToast, showErrorToast } = useToastContext();
  const { hasPermission } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Predefined categories and locations
  const categories = ['Paint', 'Oil', 'Grease', 'Sealant'];
  const locations = ['Hangar 5', 'Hangar 6', 'LMK'];

  // Filter inventory items based on search term, category, and location
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      // Search term filter (case insensitive)
      const matchesSearch = searchTerm === '' ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      // Category filter
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

      // Location filter
      const matchesLocation = locationFilter === 'all' || item.location_name === locationFilter;

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [inventoryItems, searchTerm, categoryFilter, locationFilter]);

  // Function to handle opening the consumption modal
  const handleOpenConsumptionModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsConsumptionModalOpen(true);
  };

  // Function to handle opening the delete confirmation dialog
  const handleOpenDeleteDialog = (item: InventoryItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  // Function to handle deleting an inventory item
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      setIsLoading(true);

      const inventoryService = ServiceFactory.getInventoryService();
      const response = await inventoryService.deleteInventoryItem(itemToDelete.id);

      if (response.success) {
        showSuccessToast({
          title: 'Item Deleted',
          description: `${itemToDelete.name} has been deleted from inventory`
        });

        // Refresh inventory data
        await refreshInventoryData();
      } else {
        showErrorToast({
          title: 'Error',
          description: response.error || 'Failed to delete inventory item'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      showErrorToast({
        title: 'Error',
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Function to refresh inventory data after recording consumption
  const refreshInventoryData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const inventoryService = ServiceFactory.getInventoryService();
      const response = await inventoryService.getInventoryItems();

      if (response.success && response.data) {
        setInventoryItems(response.data);
      } else {
        setError(response.error || 'Failed to refresh inventory items');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const inventoryService = ServiceFactory.getInventoryService();
        const response = await inventoryService.getInventoryItems();

        if (response.success && response.data) {
          setInventoryItems(response.data);

          // Only show toast on manual refresh, not on initial load
          if (initialLoadComplete) {
            showSuccessToast({
              title: 'Inventory Loaded',
              description: `Successfully loaded ${response.data.length} inventory items.`
            });
          }
        } else {
          setError(response.error || 'Failed to fetch inventory items');
          showErrorToast({
            title: 'Error',
            description: response.error || 'Failed to fetch inventory items'
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        showErrorToast({
          title: 'Error',
          description: errorMessage
        });
      } finally {
        setIsLoading(false);
        setInitialLoadComplete(true);
      }
    };

    fetchInventoryItems();
  }, [showSuccessToast, showErrorToast]);

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mt-0 mt-2 pl-0">
          <h1 className="text-3xl font-bold mb-4 md:mb-0">Inventory</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshInventoryData}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Refreshing...
                </>
              ) : (
                <>
                  <span className="mr-2">⟳</span>
                  Refresh
                </>
              )}
            </Button>
            {hasPermission(PERMISSIONS.INVENTORY_CREATE) && (
              <Button
                onClick={() => setIsAddItemModalOpen(true)}
                className="gap-2"
                size="sm"
              >
                <span className="text-lg">+</span>
                <span>Add Item</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="search" className="block text-sm font-medium mb-1">Search</label>
            <Input
              id="search"
              placeholder="Search by name or description"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1">Location</label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger id="location" className="w-full">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter results count */}
        {!isLoading && inventoryItems.length > 0 && (
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredItems.length} of {inventoryItems.length} items
              {(searchTerm || categoryFilter !== 'all' || locationFilter !== 'all') && (
                <Button
                  variant="link"
                  className="p-0 h-auto ml-2"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('all');
                    setLocationFilter('all');
                  }}
                >
                  Clear filters
                </Button>
              )}
            </p>
          </div>
        )}

        {error && (
          <Card className="bg-red-50 border-red-200 mb-4">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin text-4xl text-primary mb-2">⟳</div>
              <p className="text-muted-foreground">Loading inventory items...</p>
            </div>
          </div>
        ) : filteredItems.length === 0 && inventoryItems.length > 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                {inventoryItems.length === 0
                  ? 'No inventory items found. Add some items to get started.'
                  : 'No items match the current filters. Try adjusting your search criteria.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:bg-muted/50 flex flex-col h-full">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span className="truncate mr-2">{item.name}</span>
                    <span className={`text-sm px-3 py-1 rounded-full min-w-[80px] text-center whitespace-nowrap ${
                      item.status === 'normal'
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'low'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p>Current Balance: {Number(item.current_balance).toFixed(2)} {item.unit}</p>
                  <div className="h-2 w-full bg-gray-200 rounded-full mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.status === 'normal'
                          ? 'bg-green-500'
                          : item.status === 'low'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.max(2, Math.min(100, (Number(item.current_balance) / Number(item.original_amount)) * 100))}%`
                      }}
                    ></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Location: {item.location_name || 'Not assigned'}</p>
                  {item.description && (
                    <p className="mt-2 text-sm text-gray-500 border-t pt-2 line-clamp-2">{item.description}</p>
                  )}
                </CardContent>
                <CardFooter className="mt-auto pt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenConsumptionModal(item)}
                    disabled={item.current_balance <= 0}
                  >
                    Record Usage
                  </Button>

                  {hasPermission(PERMISSIONS.INVENTORY_DELETE) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent hover:bg-red-50 text-red-500 hover:text-red-600 border-red-200"
                      onClick={() => handleOpenDeleteDialog(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}



        {/* Consumption Modal */}
        <RecordConsumptionModal
          isOpen={isConsumptionModalOpen}
          onClose={() => setIsConsumptionModalOpen(false)}
          inventoryItem={selectedItem}
          onSuccess={refreshInventoryData}
        />

        {/* Add Item Modal */}
        <AddInventoryItemModal
          isOpen={isAddItemModalOpen}
          onClose={() => setIsAddItemModalOpen(false)}
          onSuccess={refreshInventoryData}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the inventory item
                <strong className="font-semibold"> {itemToDelete?.name}</strong> and remove it from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteItem();
                }}
                className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </div>
      </div>
    </AppLayout>
  );
}
