-- Create consumption_records table
CREATE TABLE IF NOT EXISTS public.consumption_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    inventory_item_id UUID REFERENCES public.inventory_items(id) NOT NULL,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT consumption_records_quantity_check CHECK (quantity > 0)
);

-- Add comment to table
COMMENT ON TABLE public.consumption_records IS 'Stores consumption records for inventory items';

-- Create indexes
CREATE INDEX IF NOT EXISTS consumption_records_inventory_item_id_idx ON public.consumption_records(inventory_item_id);
CREATE INDEX IF NOT EXISTS consumption_records_user_id_idx ON public.consumption_records(user_id);
CREATE INDEX IF NOT EXISTS consumption_records_recorded_at_idx ON public.consumption_records(recorded_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_consumption_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_consumption_records_updated_at
BEFORE UPDATE ON public.consumption_records
FOR EACH ROW
EXECUTE FUNCTION update_consumption_records_updated_at();

-- Create trigger to update inventory_items current_quantity and last_consumed_at
CREATE OR REPLACE FUNCTION update_inventory_item_after_consumption()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the inventory item's current quantity and last_consumed_at
    UPDATE public.inventory_items
    SET 
        current_quantity = current_quantity - NEW.quantity,
        last_consumed_at = NEW.recorded_at,
        updated_at = now()
    WHERE id = NEW.inventory_item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_item_after_consumption
AFTER INSERT ON public.consumption_records
FOR EACH ROW
EXECUTE FUNCTION update_inventory_item_after_consumption();

-- Enable Row Level Security
ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY consumption_records_select_policy ON public.consumption_records
    FOR SELECT USING (true);  -- Everyone can read consumption records

CREATE POLICY consumption_records_insert_policy ON public.consumption_records
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);  -- Users can only create their own consumption records

CREATE POLICY consumption_records_update_policy ON public.consumption_records
    FOR UPDATE USING (auth.role() = 'admin' OR (auth.uid()::text = user_id::text AND created_at > now() - interval '24 hours'));  -- Admins can update any record, users can update their own records within 24 hours

CREATE POLICY consumption_records_delete_policy ON public.consumption_records
    FOR DELETE USING (auth.role() = 'admin');  -- Only admins can delete consumption records
