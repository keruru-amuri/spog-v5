-- Create stored procedure for getting consumption summary by item
CREATE OR REPLACE FUNCTION get_consumption_summary_by_item(start_date TIMESTAMP WITH TIME ZONE, end_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
    inventory_item_id UUID,
    inventory_item_name VARCHAR(255),
    total_quantity NUMERIC(10, 2),
    unit VARCHAR(50),
    consumption_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cr.inventory_item_id,
        ii.name AS inventory_item_name,
        SUM(cr.quantity) AS total_quantity,
        cr.unit,
        COUNT(cr.id) AS consumption_count
    FROM
        consumption_records cr
    JOIN
        inventory_items ii ON cr.inventory_item_id = ii.id
    WHERE
        cr.recorded_at >= start_date AND cr.recorded_at <= end_date
    GROUP BY
        cr.inventory_item_id, ii.name, cr.unit
    ORDER BY
        total_quantity DESC;
END;
$$ LANGUAGE plpgsql;

-- Create stored procedure for getting consumption summary by user
CREATE OR REPLACE FUNCTION get_consumption_summary_by_user(start_date TIMESTAMP WITH TIME ZONE, end_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    total_quantity NUMERIC(10, 2),
    consumption_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cr.user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS user_name,
        SUM(cr.quantity) AS total_quantity,
        COUNT(cr.id) AS consumption_count
    FROM
        consumption_records cr
    JOIN
        users u ON cr.user_id = u.id
    WHERE
        cr.recorded_at >= start_date AND cr.recorded_at <= end_date
    GROUP BY
        cr.user_id, u.first_name, u.last_name
    ORDER BY
        total_quantity DESC;
END;
$$ LANGUAGE plpgsql;

-- Create stored procedure for executing SQL (used by the migration system)
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
