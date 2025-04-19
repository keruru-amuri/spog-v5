import { createMigration } from '../../lib/migrations/migration-factory';

/**
 * Migration: Add inventory item tags
 */
export default createMigration(
  '20250419000000_add_inventory_item_tags',
  async (client) => {
    // Apply migration
    const { error } = await client.rpc('exec_sql', {
      sql: `
        -- Create inventory_item_tags table
        CREATE TABLE IF NOT EXISTS public.inventory_item_tags (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            inventory_item_id UUID REFERENCES public.inventory_items(id) NOT NULL,
            tag VARCHAR(100) NOT NULL,
            CONSTRAINT inventory_item_tags_unique UNIQUE (inventory_item_id, tag)
        );

        -- Add comment to table
        COMMENT ON TABLE public.inventory_item_tags IS 'Stores tags for inventory items';

        -- Create indexes
        CREATE INDEX IF NOT EXISTS inventory_item_tags_inventory_item_id_idx ON public.inventory_item_tags(inventory_item_id);
        CREATE INDEX IF NOT EXISTS inventory_item_tags_tag_idx ON public.inventory_item_tags(tag);

        -- Create trigger to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_inventory_item_tags_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_inventory_item_tags_updated_at
        BEFORE UPDATE ON public.inventory_item_tags
        FOR EACH ROW
        EXECUTE FUNCTION update_inventory_item_tags_updated_at();

        -- Enable Row Level Security
        ALTER TABLE public.inventory_item_tags ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY inventory_item_tags_select_policy ON public.inventory_item_tags
            FOR SELECT USING (true);  -- Everyone can read inventory item tags

        CREATE POLICY inventory_item_tags_insert_policy ON public.inventory_item_tags
            FOR INSERT WITH CHECK (auth.role() IN ('admin', 'manager'));  -- Only admins and managers can create inventory item tags

        CREATE POLICY inventory_item_tags_update_policy ON public.inventory_item_tags
            FOR UPDATE USING (auth.role() IN ('admin', 'manager'));  -- Only admins and managers can update inventory item tags

        CREATE POLICY inventory_item_tags_delete_policy ON public.inventory_item_tags
            FOR DELETE USING (auth.role() IN ('admin', 'manager'));  -- Only admins and managers can delete inventory item tags
      `,
    });
    
    if (error) {
      throw error;
    }
  },
  async (client) => {
    // Rollback migration
    const { error } = await client.rpc('exec_sql', {
      sql: `
        -- Drop inventory_item_tags table
        DROP TABLE IF EXISTS public.inventory_item_tags;
        
        -- Drop trigger function
        DROP FUNCTION IF EXISTS update_inventory_item_tags_updated_at();
      `,
    });
    
    if (error) {
      throw error;
    }
  }
);
