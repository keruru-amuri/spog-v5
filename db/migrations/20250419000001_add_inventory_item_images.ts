import { createMigration } from '../../lib/migrations/migration-factory';

/**
 * Migration: Add inventory item images
 */
export default createMigration(
  '20250419000001_add_inventory_item_images',
  async (client) => {
    // Apply migration
    const { error } = await client.rpc('exec_sql', {
      sql: `
        -- Create inventory_item_images table
        CREATE TABLE IF NOT EXISTS public.inventory_item_images (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            inventory_item_id UUID REFERENCES public.inventory_items(id) NOT NULL,
            url TEXT NOT NULL,
            description TEXT,
            is_primary BOOLEAN DEFAULT false NOT NULL,
            sort_order INTEGER DEFAULT 0 NOT NULL
        );

        -- Add comment to table
        COMMENT ON TABLE public.inventory_item_images IS 'Stores images for inventory items';

        -- Create indexes
        CREATE INDEX IF NOT EXISTS inventory_item_images_inventory_item_id_idx ON public.inventory_item_images(inventory_item_id);
        CREATE INDEX IF NOT EXISTS inventory_item_images_is_primary_idx ON public.inventory_item_images(is_primary);

        -- Create trigger to update updated_at timestamp
        CREATE OR REPLACE FUNCTION update_inventory_item_images_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_inventory_item_images_updated_at
        BEFORE UPDATE ON public.inventory_item_images
        FOR EACH ROW
        EXECUTE FUNCTION update_inventory_item_images_updated_at();

        -- Create trigger to ensure only one primary image per inventory item
        CREATE OR REPLACE FUNCTION ensure_one_primary_image()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.is_primary THEN
                UPDATE public.inventory_item_images
                SET is_primary = false
                WHERE inventory_item_id = NEW.inventory_item_id
                AND id != NEW.id;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER ensure_one_primary_image
        BEFORE INSERT OR UPDATE OF is_primary ON public.inventory_item_images
        FOR EACH ROW
        WHEN (NEW.is_primary = true)
        EXECUTE FUNCTION ensure_one_primary_image();

        -- Enable Row Level Security
        ALTER TABLE public.inventory_item_images ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY inventory_item_images_select_policy ON public.inventory_item_images
            FOR SELECT USING (true);  -- Everyone can read inventory item images

        CREATE POLICY inventory_item_images_insert_policy ON public.inventory_item_images
            FOR INSERT WITH CHECK (auth.role() IN ('admin', 'manager'));  -- Only admins and managers can create inventory item images

        CREATE POLICY inventory_item_images_update_policy ON public.inventory_item_images
            FOR UPDATE USING (auth.role() IN ('admin', 'manager'));  -- Only admins and managers can update inventory item images

        CREATE POLICY inventory_item_images_delete_policy ON public.inventory_item_images
            FOR DELETE USING (auth.role() IN ('admin', 'manager'));  -- Only admins and managers can delete inventory item images
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
        -- Drop inventory_item_images table
        DROP TABLE IF EXISTS public.inventory_item_images;
        
        -- Drop trigger functions
        DROP FUNCTION IF EXISTS update_inventory_item_images_updated_at();
        DROP FUNCTION IF EXISTS ensure_one_primary_image();
      `,
    });
    
    if (error) {
      throw error;
    }
  }
);
