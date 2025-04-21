"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { InventoryItem } from "@/types/inventory"
import { ServiceFactory } from "@/services/service-factory"
import { useAuth } from "@/contexts/AuthContext"

// Form schema for consumption
const consumptionFormSchema = z.object({
  quantity: z
    .number({ required_error: "Quantity is required" })
    .positive({ message: "Quantity must be greater than 0" }),
  notes: z
    .string()
    .max(1000, { message: "Notes must be less than 1000 characters" })
    .optional()
});

// Form schema for adjustment
const adjustmentFormSchema = z.object({
  new_balance: z
    .number({ required_error: "New balance is required" })
    .nonnegative({ message: "New balance must be 0 or greater" }),
  reason: z
    .string({ required_error: "Reason is required" })
    .min(3, { message: "Reason must be at least 3 characters" })
    .max(1000, { message: "Reason must be less than 1000 characters" })
});

// Types for the form values
type ConsumptionFormValues = z.infer<typeof consumptionFormSchema>;
type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

interface ConsumptionModalProps {
  item: InventoryItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Callback for when consumption is successfully recorded
}

export function ConsumptionModal({ item, isOpen, onClose, onSuccess }: ConsumptionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Initialize the consumption form
  const consumptionForm = useForm<ConsumptionFormValues>({
    resolver: zodResolver(consumptionFormSchema),
    defaultValues: {
      quantity: undefined,
      notes: "",
    },
  });

  // Initialize the adjustment form
  const adjustmentForm = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: {
      new_balance: item.current_balance,
      reason: "",
    },
  });

  // Check if the user has admin permissions
  useEffect(() => {
    if (user) {
      // Check if user has inventory:update permission
      const hasAdminPermission = user.app_metadata?.permissions?.includes("inventory:update");
      setIsAdmin(!!hasAdminPermission);
    }
  }, [user]);

  // Reset forms when modal is opened
  useEffect(() => {
    if (isOpen) {
      consumptionForm.reset();
      adjustmentForm.reset({
        new_balance: item.current_balance,
        reason: "",
      });
    }
  }, [isOpen, item, consumptionForm, adjustmentForm]);

  // Handle consumption form submission
  const handleConsumptionSubmit = async (data: ConsumptionFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to record consumption",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const consumptionService = ServiceFactory.getConsumptionService();

      const response = await consumptionService.createConsumptionRecord({
        inventory_item_id: item.id,
        quantity: data.quantity,
        unit: item.consumption_unit || item.unit,
        notes: data.notes,
        recorded_at: new Date().toISOString(),
      });

      if (response.success && response.data) {
        toast({
          title: "Success",
          description: `Successfully recorded consumption of ${data.quantity} ${item.consumption_unit || item.unit} of ${item.name}`,
        });

        // Reset form and close modal
        consumptionForm.reset();
        onClose();

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to record consumption",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error recording consumption:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adjustment form submission
  const handleAdjustmentSubmit = async (data: AdjustmentFormValues) => {
    if (!user || !isAdmin) {
      toast({
        title: "Error",
        description: "You don't have permission to adjust inventory",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const inventoryService = ServiceFactory.getInventoryService();

      const response = await inventoryService.updateInventoryItem(item.id, {
        current_balance: data.new_balance,
      });

      if (response.success && response.data) {
        toast({
          title: "Success",
          description: `Successfully adjusted ${item.name} to ${data.new_balance} ${item.unit}`,
        });

        // Reset form and close modal
        adjustmentForm.reset();
        onClose();

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to adjust inventory",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adjusting inventory:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>
            ID: {item.id} | Location: {item.location_name || 'Not assigned'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="consume" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="consume">Record Consumption</TabsTrigger>
            <TabsTrigger value="adjust" disabled={!isAdmin}>
              Adjust Balance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consume" className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-medium">
                  {item.current_balance} {item.unit}
                </span>
              </div>
              <Progress
                value={(item.current_balance / item.original_amount) * 100}
                className={`h-2 ${getProgressColorClass(item.status)}`}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 {item.unit}</span>
                <span>
                  {item.original_amount} {item.unit}
                </span>
              </div>
            </div>

            <form onSubmit={consumptionForm.handleSubmit(handleConsumptionSubmit)} className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="col-span-4">
                  Amount Used ({item.consumption_unit || item.unit})
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder={`Enter amount in ${item.consumption_unit || item.unit}`}
                  className="col-span-3"
                  {...consumptionForm.register('quantity', { valueAsNumber: true })}
                />
                <div className="flex h-10 items-center justify-center rounded-md border bg-muted px-4">
                  {item.consumption_unit || item.unit}
                </div>
              </div>

              {consumptionForm.formState.errors.quantity && (
                <p className="text-sm text-red-500">{consumptionForm.formState.errors.quantity.message}</p>
              )}

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes about this consumption"
                  className="min-h-[80px]"
                  {...consumptionForm.register('notes')}
                />

                {consumptionForm.formState.errors.notes && (
                  <p className="text-sm text-red-500">{consumptionForm.formState.errors.notes.message}</p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !consumptionForm.formState.isValid}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    'Record Usage'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="adjust" className="space-y-4 pt-4">
            <form onSubmit={adjustmentForm.handleSubmit(handleAdjustmentSubmit)} className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new_balance" className="col-span-4">
                  New Balance ({item.unit})
                </Label>
                <Input
                  id="new_balance"
                  type="number"
                  placeholder={`Enter new amount in ${item.unit}`}
                  className="col-span-3"
                  {...adjustmentForm.register('new_balance', { valueAsNumber: true })}
                />
                <div className="flex h-10 items-center justify-center rounded-md border bg-muted px-4">
                  {item.unit}
                </div>
              </div>

              {adjustmentForm.formState.errors.new_balance && (
                <p className="text-sm text-red-500">{adjustmentForm.formState.errors.new_balance.message}</p>
              )}

              <div className="grid gap-2">
                <Label htmlFor="reason">Reason for Adjustment</Label>
                <Textarea
                  id="reason"
                  placeholder="e.g., Physical count, New container"
                  className="min-h-[80px]"
                  {...adjustmentForm.register('reason')}
                />

                {adjustmentForm.formState.errors.reason && (
                  <p className="text-sm text-red-500">{adjustmentForm.formState.errors.reason.message}</p>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !adjustmentForm.formState.isValid}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Balance'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function getProgressColorClass(status: 'normal' | 'low' | 'critical'): string {
  if (status === "normal") {
    return "bg-green-100 dark:bg-green-950"
  } else if (status === "low") {
    return "bg-amber-100 dark:bg-amber-950"
  } else if (status === "critical") {
    return "bg-red-100 dark:bg-red-950"
  }
  return ""
}
