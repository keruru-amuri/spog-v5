-- Create inventory_items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    location_id UUID REFERENCES public.locations(id) NOT NULL,
    current_quantity NUMERIC(10, 2) NOT NULL,
    original_quantity NUMERIC(10, 2) NOT NULL,
    minimum_quantity NUMERIC(10, 2) DEFAULT 0 NOT NULL,
    unit VARCHAR(50) NOT NULL,
    consumption_unit VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    last_consumed_at TIMESTAMP WITH TIME ZONE,
    expiry_date DATE,
    created_by UUID,
    updated_by UUID,
    CONSTRAINT inventory_items_status_check CHECK (status IN ('normal', 'low', 'critical')),
    CONSTRAINT inventory_items_current_quantity_check CHECK (current_quantity >= 0),
    CONSTRAINT inventory_items_original_quantity_check CHECK (original_quantity >= 0),
    CONSTRAINT inventory_items_minimum_quantity_check CHECK (minimum_quantity >= 0)
);

-- Add comment to table
COMMENT ON TABLE public.inventory_items IS 'Stores inventory item information';

-- Create indexes
CREATE INDEX IF NOT EXISTS inventory_items_name_idx ON public.inventory_items(name);
CREATE INDEX IF NOT EXISTS inventory_items_category_idx ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS inventory_items_location_id_idx ON public.inventory_items(location_id);
CREATE INDEX IF NOT EXISTS inventory_items_status_idx ON public.inventory_items(status);
CREATE INDEX IF NOT EXISTS inventory_items_expiry_date_idx ON public.inventory_items(expiry_date);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_inventory_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION update_inventory_items_updated_at();

-- Create trigger to update status based on quantity
CREATE OR REPLACE FUNCTION update_inventory_items_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_quantity <= 0 THEN
        NEW.status = 'critical';
    ELSIF NEW.current_quantity <= NEW.minimum_quantity THEN
        NEW.status = 'low';
    ELSE
        NEW.status = 'normal';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_items_status
BEFORE INSERT OR UPDATE OF current_quantity, minimum_quantity ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION update_inventory_items_status();

-- Enable Row Level Security
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY inventory_items_select_policy ON public.inventory_items
    FOR SELECT USING (true);  -- Everyone can read inventory items

CREATE POLICY inventory_items_insert_policy ON public.inventory_items
    FOR INSERT WITH CHECK (auth.role() IN ('admin', 'manager'));  -- Only admins and managers can create inventory items

CREATE POLICY inventory_items_update_policy ON public.inventory_items
    FOR UPDATE USING (auth.role() IN ('admin', 'manager'));  -- Only admins and managers can update inventory items

CREATE POLICY inventory_items_delete_policy ON public.inventory_items
    FOR DELETE USING (auth.role() = 'admin');  -- Only admins can delete inventory items
