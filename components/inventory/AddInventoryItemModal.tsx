'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToastContext } from '@/contexts/ToastContext';
import { ServiceFactory } from '@/services/service-factory';
import { Location } from '@/types/location';

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  location_id: z.string().min(1, 'Location is required'),
  current_balance: z.coerce.number().min(0, 'Balance must be a positive number').optional(),
  original_amount: z.coerce.number().min(0, 'Original amount must be a positive number'),
  unit: z.string().min(1, 'Unit is required'),
  consumption_unit: z.string().optional(),
  reorder_percentage: z.coerce.number().min(0, 'Reorder percentage must be between 0 and 100').max(100, 'Reorder percentage must be between 0 and 100').default(20),
  batch_number: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddInventoryItemModal({ isOpen, onClose, onSuccess }: AddInventoryItemModalProps) {
  const { showSuccessToast, showErrorToast } = useToastContext();
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);

  // Predefined categories
  const categories = ['Paint', 'Oil', 'Grease', 'Sealant'];

  // Common units
  const units = ['L', 'mL', 'kg', 'g', 'units', 'pcs'];

  // Map of valid consumption units for each unit
  const validConsumptionUnits: Record<string, string[]> = {
    'L': ['L', 'mL'],
    'mL': ['mL', 'L'],
    'kg': ['kg', 'g'],
    'g': ['g', 'kg'],
    'units': ['units'],
    'pcs': ['pcs']
  };

  // Check if a unit needs conversion options
  const hasConversionOptions = (unit: string): boolean => {
    return validConsumptionUnits[unit]?.length > 1 || false;
  };

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      location_id: '',
      current_balance: 0,
      original_amount: 0,
      unit: '',
      consumption_unit: 'same',
      reorder_percentage: 20,
      batch_number: '',
    },
    mode: 'onChange',
  });

  // Watch form values for debugging
  const formValues = form.watch();

  // Fetch locations when the modal opens
  useEffect(() => {
    const fetchLocations = async () => {
      if (isOpen) {
        const locationService = ServiceFactory.getLocationService();
        const response = await locationService.getLocations();

        if (response.success && response.data) {
          setLocations(response.data);
        } else {
          showErrorToast({
            title: 'Error',
            description: response.error || 'Failed to fetch locations'
          });
        }
      }
    };

    fetchLocations();
  }, [isOpen, showErrorToast]);

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);

    try {
      // Set current balance to original amount for new items
      const currentBalance = values.original_amount;

      // Determine status based on current balance as a percentage of original amount
      const reorderPercentage = values.reorder_percentage || 20;
      let status: 'normal' | 'low' | 'critical' = 'normal';

      // Calculate the current percentage of original amount
      const currentPercentage = (currentBalance / values.original_amount) * 100;

      // Low status when below reorder threshold, critical when below half of reorder threshold
      if (currentPercentage <= reorderPercentage / 2) {
        status = 'critical';
      } else if (currentPercentage <= reorderPercentage) {
        status = 'low';
      }

      // Set consumption unit to unit if "same" is selected or if the unit doesn't have conversion options
      let consumptionUnit = values.unit;

      if (values.consumption_unit !== 'same' && hasConversionOptions(values.unit)) {
        // Verify the consumption unit is valid for the selected unit
        if (validConsumptionUnits[values.unit]?.includes(values.consumption_unit)) {
          consumptionUnit = values.consumption_unit;
        }
      }

      // Create the inventory item
      const inventoryService = ServiceFactory.getInventoryService();
      const response = await inventoryService.createInventoryItem({
        name: values.name,
        description: values.description,
        category: values.category,
        location_id: values.location_id,
        current_balance: currentBalance,
        original_amount: values.original_amount,
        unit: values.unit,
        consumption_unit: consumptionUnit,
        status,
        minimum_quantity: (values.reorder_percentage / 100) * values.original_amount, // Convert percentage to absolute value
        batch_number: values.batch_number,
      });

      if (response.success && response.data) {
        showSuccessToast({
          title: 'Success',
          description: `${values.name} has been added to inventory`
        });

        // Reset the form
        form.reset();

        // Close the modal
        onClose();

        // Refresh the inventory list
        onSuccess();
      } else {
        showErrorToast({
          title: 'Error',
          description: response.error || 'Failed to add inventory item'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      showErrorToast({
        title: 'Error',
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>

                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Current Balance field removed - will be set to Original Amount */}

              {/* Original Amount */}
              <FormField
                control={form.control}
                name="original_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Amount*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? '0' : e.target.value;
                          field.onChange(value);
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unit */}
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Consumption Unit */}
              <FormField
                control={form.control}
                name="consumption_unit"
                render={({ field }) => {
                  const selectedUnit = formValues.unit;
                  const showConversionOptions = hasConversionOptions(selectedUnit);

                  // If unit changes and current consumption unit is not valid, reset to 'same'
                  React.useEffect(() => {
                    if (field.value !== 'same' &&
                        selectedUnit &&
                        !validConsumptionUnits[selectedUnit]?.includes(field.value)) {
                      field.onChange('same');
                    }
                  }, [selectedUnit, field]);

                  return (
                    <FormItem>
                      <FormLabel>Consumption Unit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!showConversionOptions || !selectedUnit}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Same as unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="same">Same as unit</SelectItem>
                          {selectedUnit && validConsumptionUnits[selectedUnit]?.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      {showConversionOptions && selectedUnit && (
                        <p className="text-xs text-muted-foreground mt-1">
                          You can use {validConsumptionUnits[selectedUnit]?.join(' or ')} for consumption tracking
                        </p>
                      )}
                      {!showConversionOptions && selectedUnit && (
                        <p className="text-xs text-muted-foreground mt-1">
                          This unit type doesn't support conversion
                        </p>
                      )}
                    </FormItem>
                  );
                }}
              />

              {/* Reorder Percentage */}
              <FormField
                control={form.control}
                name="reorder_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Threshold (%)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value === '' ? '0' : e.target.value;
                            field.onChange(parseFloat(value));
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                          className="pr-8"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-500">%</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      Status will be 'Low' at {formValues.reorder_percentage}% and 'Critical' at {Math.round(formValues.reorder_percentage / 2)}% of original amount
                    </p>
                  </FormItem>
                )}
              />

              {/* Batch Number */}
              <FormField
                control={form.control}
                name="batch_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter batch number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
