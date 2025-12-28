CREATE TABLE IF NOT EXISTS line_item (
    id SERIAL PRIMARY KEY,
    bill_id INT,
    name VARCHAR,
    price NUMERIC,
    FOREIGN KEY (bill_id) REFERENCES bill(id) ON DELETE CASCADE
);

COMMENT ON COLUMN line_item.bill_id IS 'The bill associated with the line item';
COMMENT ON COLUMN line_item.name IS 'Name of the line item';
COMMENT ON COLUMN line_item.price IS 'Cost of the line item';
