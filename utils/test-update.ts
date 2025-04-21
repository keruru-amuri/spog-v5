import { supabase } from '@/lib/supabase';

/**
 * Test function to update inventory balance directly
 * @param itemId The ID of the inventory item to update
 * @param newBalance The new balance to set
 * @returns Promise resolving to success status and error message if any
 */
export async function testUpdateInventoryBalance(
  itemId: string,
  newBalance: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`Attempting to update item ${itemId} with new balance ${newBalance}`);

    // First, get the current item to verify it exists
    const { data: item, error: getError } = await supabase
      .from('inventory_items')
      .select('id, name, current_balance')
      .eq('id', itemId)
      .single();

    if (getError) {
      console.error('Error fetching item:', getError);
      return { success: false, error: getError.message };
    }

    console.log('Current item data:', item);

    // Ensure new balance is non-negative
    if (newBalance < 0) {
      return { success: false, error: 'New balance cannot be negative' };
    }

    // Try different approaches to update the balance

    // Approach 1: Using a string value
    console.log('Approach 1: Using a string value');
    const { error: updateError1 } = await supabase
      .from('inventory_items')
      .update({ current_balance: newBalance.toString() })
      .eq('id', itemId);

    if (updateError1) {
      console.error('Error with approach 1:', updateError1);

      // Approach 2: Using a number value
      console.log('Approach 2: Using a number value');
      const { error: updateError2 } = await supabase
        .from('inventory_items')
        .update({ current_balance: newBalance })
        .eq('id', itemId);

      if (updateError2) {
        console.error('Error with approach 2:', updateError2);

        // Approach 3: Using a raw SQL query
        console.log('Approach 3: Using a raw SQL query');
        const { error: updateError3 } = await supabase.rpc(
          'execute_sql_query',
          {
            query: `UPDATE inventory_items SET current_balance = ${newBalance} WHERE id = '${itemId}'`
          }
        );

        if (updateError3) {
          console.error('Error with approach 3:', updateError3);
          return { success: false, error: updateError3.message };
        }

        return { success: true };
      }

      return { success: true };
    }

    // If approach 1 succeeded
    const updateError = null;

    if (updateError) {
      console.error('Error updating item:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
