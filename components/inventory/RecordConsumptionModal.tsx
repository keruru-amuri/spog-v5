'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { convertUoM, getMaxConsumptionAmount, isValidConsumption } from '@/utils/uom-conversion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToastContext } from '@/contexts/ToastContext';
import { InventoryItem } from '@/types/inventory';
import { ServiceFactory } from '@/services/service-factory';
import { CreateConsumptionRecord } from '@/services/consumption-service';

interface RecordConsumptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem: InventoryItem | null;
  onSuccess: () => void;
}

export function RecordConsumptionModal({
  isOpen,
  onClose,
  inventoryItem,
  onSuccess,
}: RecordConsumptionModalProps) {
  const { showSuccessToast, showErrorToast } = useToastContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate max consumption amount with unit conversion
  const maxConsumptionAmount = useMemo(() => {
    if (!inventoryItem) return 0;

    const stockUnit = inventoryItem.unit;
    const consumptionUnit = inventoryItem.consumption_unit || stockUnit;

    console.log('Unit conversion info:', {
      itemName: inventoryItem.name,
      currentBalance: inventoryItem.current_balance,
      stockUnit,
      consumptionUnit
    });

    const maxAmount = getMaxConsumptionAmount(
      inventoryItem.current_balance,
      stockUnit,
      consumptionUnit
    );

    console.log('Max consumption amount:', maxAmount);

    return maxAmount;
  }, [inventoryItem]);

  // Create form schema based on the current inventory item
  const formSchema = z.object({
    quantity: z.coerce
      .number()
      .positive('Quantity must be a positive number')
      .min(0.01, 'Quantity must be greater than 0')
      .max(
        maxConsumptionAmount,
        `Quantity cannot exceed available balance of ${maxConsumptionAmount.toFixed(2)} ${inventoryItem?.consumption_unit || inventoryItem?.unit || 'units'}`
      ),
    notes: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 0,
      notes: '',
    },
  });

  // Reset form when inventory item changes
  useEffect(() => {
    if (inventoryItem) {
      form.reset({
        quantity: 0,
        notes: '',
      });
    }
  }, [form, inventoryItem]);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!inventoryItem) return;

    const stockUnit = inventoryItem.unit;
    const consumptionUnit = inventoryItem.consumption_unit || stockUnit;

    console.log('Form submission data:', {
      quantity: data.quantity,
      consumptionUnit,
      currentBalance: inventoryItem.current_balance,
      stockUnit
    });

    // Convert consumption to stock unit for logging
    const consumptionInStockUnit = convertUoM(
      data.quantity,
      consumptionUnit,
      stockUnit
    );

    console.log('Consumption in stock unit:', consumptionInStockUnit);
    console.log('New balance would be:', inventoryItem.current_balance - consumptionInStockUnit);

    // Double-check that quantity doesn't exceed available balance with unit conversion
    if (!isValidConsumption(
      data.quantity,
      consumptionUnit,
      inventoryItem.current_balance,
      stockUnit
    )) {
      console.log('Validation failed: Quantity exceeds available balance');
      form.setError('quantity', {
        type: 'manual',
        message: `Quantity exceeds available balance of ${maxConsumptionAmount.toFixed(2)} ${consumptionUnit}`
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare consumption record data
      const consumptionRecord: CreateConsumptionRecord = {
        inventory_item_id: inventoryItem.id,
        quantity: data.quantity,
        unit: inventoryItem.consumption_unit || inventoryItem.unit,
        notes: data.notes,
        recorded_at: new Date().toISOString(),
      };

      // Submit consumption record
      const consumptionService = ServiceFactory.getConsumptionService();
      const response = await consumptionService.createConsumptionRecord(consumptionRecord);

      if (response.success && response.data) {
        showSuccessToast({
          title: 'Consumption Recorded',
          description: `Successfully recorded consumption of ${data.quantity} ${
            inventoryItem.consumption_unit || inventoryItem.unit
          } of ${inventoryItem.name}`
        });

        // Reset form
        form.reset();

        // Close modal and refresh inventory data
        onClose();
        onSuccess();
      } else {
        showErrorToast({
          title: 'Error',
          description: response.error || 'Failed to record consumption'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      showErrorToast({
        title: 'Error',
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Consumption</DialogTitle>
          <DialogDescription>
            {inventoryItem
              ? (
                <>
                  Record consumption for {inventoryItem.name}.
                  {inventoryItem.consumption_unit !== inventoryItem.unit && inventoryItem.consumption_unit ? (
                    <>
                      Available: {maxConsumptionAmount.toFixed(2)} {inventoryItem.consumption_unit}
                      (Stock: {Number(inventoryItem.current_balance).toFixed(2)} {inventoryItem.unit})
                    </>
                  ) : (
                    <>Current balance: {Number(inventoryItem.current_balance).toFixed(2)} {inventoryItem.unit}</>
                  )}
                </>
              )
              : 'Loading item details...'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        disabled={isSubmitting}
                      />
                      <span className="ml-2">
                        {inventoryItem?.consumption_unit || inventoryItem?.unit || 'units'}
                      </span>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter the amount consumed (max: {maxConsumptionAmount.toFixed(2)}{' '}
                    {inventoryItem?.consumption_unit || inventoryItem?.unit}).
                    {inventoryItem?.consumption_unit !== inventoryItem?.unit && inventoryItem?.consumption_unit && inventoryItem?.unit && (
                      <span className="block text-xs mt-1">
                        Current stock: {Number(inventoryItem.current_balance).toFixed(2)} {inventoryItem.unit}
                      </span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this consumption"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !inventoryItem}>
                {isSubmitting ? 'Recording...' : 'Record Consumption'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
